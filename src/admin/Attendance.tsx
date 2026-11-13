import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api'
import { useAdmin } from './context'
import {
  GROUPS, GROUP_LABEL, defaultVisit, fmtDate, money, nextTrainingDay, passInfo, today, weekday,
  type Group, type Member, type PayKind, type Visit,
} from './model'
import { CheckBox, Icon, PassChip } from './ui'

type Status = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

const PAY_SHORT: Record<PayKind, string> = { pass: 'Абонемент', cash: 'Разово', free: 'Безкошт.' }
const PAY_FULL: Record<PayKind, string> = { pass: 'З абонемента', cash: 'Разова оплата', free: 'Безкоштовно (пробне)' }

/** Найближчий день занять: сьогодні, якщо за розкладом, інакше — попередній */
function initialDate(days: number[]) {
  const t = today()
  return days.includes(weekday(t)) || !days.length ? t : nextTrainingDay(t, -1, days)
}

/**
 * Відмітки на занятті: дата (за замовчуванням — сьогодні), група, список учасників.
 * Тап по рядку — присутній. Оплата підставляється сама (абонемент або разовий тариф), суму можна змінити.
 * Новий учасник — у пошуку або в рядку «+ Додати» в кінці списку. Зберігається автоматично.
 */
export function Attendance() {
  const { members, settings, mergeMembers, notify } = useAdmin()
  const [date, setDate] = useState(() => initialDate(settings.days))
  const [group, setGroup] = useState<Group>(() => (storageGet('adm-group') as Group) || 'adult')
  const [visits, setVisits] = useState<Record<string, Visit>>({})
  const [status, setStatus] = useState<Status>('loading')
  const [query, setQuery] = useState('')
  const [newName, setNewName] = useState('')
  const [justMarked, setJustMarked] = useState<string | null>(null)
  const pending = useRef<{ date: string; group: Group; visits: Record<string, Visit> } | null>(null)
  const timer = useRef(0)
  const searchRef = useRef<HTMLInputElement>(null)

  /* Збереження з невеликою затримкою: кілька швидких відміток = один запит */
  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    const p = pending.current
    if (!p) return
    pending.current = null
    setStatus('saving')
    try {
      const r = await api.saveSession(p.date, p.group, p.visits)
      mergeMembers(r.members)
      setStatus(pending.current ? 'saving' : 'saved')
    } catch (e) {
      pending.current ??= p
      setStatus('error')
      notify(`Не збережено: ${e instanceof Error ? e.message : ''}`, true)
    }
  }, [mergeMembers, notify])

  /* Завантаження заняття (перед цим — дозберегти попереднє) */
  useEffect(() => {
    let alive = true
    setStatus('loading')
    api.sessions(date, date)
      .then(({ sessions }) => {
        if (!alive) return
        setVisits(sessions.find((s) => s.group === group)?.visits ?? {})
        setStatus('idle')
      })
      .catch((e) => {
        if (!alive) return
        setStatus('error')
        notify(e.message, true)
      })
    return () => {
      alive = false
      flush()
    }
  }, [date, group, flush, notify])

  /* Не дати закрити вкладку з незбереженими відмітками */
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (pending.current) e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const change = (next: Record<string, Visit>) => {
    setVisits(next)
    pending.current = { date, group, visits: next }
    setStatus('saving')
    clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 700)
  }

  const mark = (m: Member, base: Record<string, Visit> = visits) => {
    setJustMarked(m.id)
    try { navigator.vibrate?.(12) } catch { /* не всі пристрої */ }
    return { ...base, [m.id]: defaultVisit(m, date, settings) }
  }

  const toggle = (m: Member) => {
    if (visits[m.id]) {
      const next = { ...visits }
      delete next[m.id]
      change(next)
    } else change(mark(m))
  }

  const setPay = (m: Member | undefined, id: string, pay: PayKind) => {
    const v = visits[id]
    if (!v || v.pay === pay) return
    const amount = pay === 'cash' ? settings.price[m?.group ?? group] : 0
    change({ ...visits, [id]: { ...v, pay, amount, passId: pay === 'pass' ? m?.pass?.id : undefined } })
  }

  const setAmount = (id: string, amount: number) => {
    const v = visits[id]
    if (v) change({ ...visits, [id]: { ...v, amount: Math.max(0, Math.round(amount) || 0) } })
  }

  /* Список: учасники групи + ті, хто відмічений, але з іншої групи чи вже видалений */
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const rows = useMemo(() => {
    const list = members.filter((m) => m.group === group).map((m) => ({ id: m.id, m: m as Member | undefined, name: m.name }))
    for (const [id, v] of Object.entries(visits)) {
      if (!list.some((r) => r.id === id)) list.push({ id, m: byId.get(id), name: byId.get(id)?.name ?? v.name })
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, 'uk'))
  }, [members, group, visits, byId])

  const q = query.trim().toLowerCase()
  const shown = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.m?.phone?.includes(q)) : rows
  const otherMatch = q ? members.filter((m) => m.group !== group && m.name.toLowerCase().includes(q)).slice(0, 3) : []
  const exact = rows.some((r) => r.name.toLowerCase() === q)

  /** Створити учасника в поточній групі й одразу відмітити */
  const addPerson = async (raw: string, from: 'search' | 'row') => {
    const name = raw.trim().replace(/\s+/g, ' ')
    if (!name) return
    const dup = members.find((m) => m.name.toLowerCase() === name.toLowerCase())
    if (dup) {
      if (!visits[dup.id]) change(mark(dup))
      notify(`${dup.name} вже є — відмічено ✓`)
    } else {
      try {
        const { member } = await api.saveMember({ name, group })
        mergeMembers([member])
        change(mark(member))
        notify(`Додано й відмічено: ${member.name}`)
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Помилка', true)
        return
      }
    }
    if (from === 'search') { setQuery(''); searchRef.current?.focus() } else setNewName('')
  }

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (shown.length === 1 && shown[0].m) {
      toggle(shown[0].m)
      setQuery('')
    } else if (!shown.length && q) addPerson(query, 'search')
  }

  const present = Object.values(visits)
  const cash = present.reduce((s, v) => s + (v.pay === 'cash' ? v.amount : 0), 0)
  const fromPass = present.filter((v) => v.pay === 'pass').length
  const isTrainingDay = settings.days.includes(weekday(date))
  const isToday = date === today()

  const pickGroup = (g: Group) => {
    setGroup(g)
    storageSet('adm-group', g)
  }

  return (
    <section className="att" aria-labelledby="att-title">
      <h1 id="att-title" className="sr-only">Відмітки на занятті</h1>

      {/* Дата + група */}
      <div className="att-head">
        <div className="att-date">
          <button type="button" className="adm-icon" onClick={() => setDate(nextTrainingDay(date, -1, settings.days))} aria-label="Попереднє заняття">
            <Icon name="left" />
          </button>
          <label className="att-date__pick">
            <span className="att-date__wd">{fmtDate(date, { weekday: 'long' })}</span>
            <span className="att-date__d">
              {fmtDate(date, { day: 'numeric', month: 'long' })}
              {isToday && <em>сьогодні</em>}
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker?.() } catch { /* Safari відкриє сам */ } }}
              aria-label="Обрати дату заняття"
            />
          </label>
          <button type="button" className="adm-icon" onClick={() => setDate(nextTrainingDay(date, 1, settings.days))} aria-label="Наступне заняття">
            <Icon name="right" />
          </button>
        </div>
        {!isToday && <button type="button" className="adm-pill" onClick={() => setDate(today())}>До сьогодні</button>}

        <div className="adm-seg adm-seg--wide" role="group" aria-label="Група">
          {GROUPS.map((g) => (
            <button key={g} type="button" aria-pressed={group === g} onClick={() => pickGroup(g)}>
              <span>{GROUP_LABEL[g]}</span> <small>{settings.time[g]}</small>
            </button>
          ))}
        </div>
      </div>

      {!isTrainingDay && <p className="adm-note adm-note--warn">Цей день не за розкладом — відмітки збережуться як додаткове заняття.</p>}

      {/* Пошук / швидке додавання */}
      <div className={`att-search${q && !exact ? ' has-add' : ''}`}>
        <Icon name="search" className="att-search__icon" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKey}
          placeholder="Пошук або ім'я нового"
          aria-label="Пошук або новий відвідувач"
          enterKeyHint="done"
          autoComplete="off"
        />
        {q && !exact && (
          <button type="button" className="att-search__add" onClick={() => addPerson(query, 'search')}>
            <Icon name="plus" size={18} /> <span>Додати</span>
          </button>
        )}
      </div>
      {otherMatch.length > 0 && (
        <div className="adm-note att-other">
          <span>Є в групі «{GROUP_LABEL[group === 'adult' ? 'kids' : 'adult']}»:</span>
          {otherMatch.map((m) => (
            <button key={m.id} type="button" className="adm-pill" onClick={() => { if (!visits[m.id]) change(mark(m)); setQuery('') }}>
              {visits[m.id] ? '✓ ' : '+ '}{m.name}
            </button>
          ))}
        </div>
      )}

      {status === 'loading' ? (
        <div className="adm-center adm-center--inline"><span className="adm-spinner" /></div>
      ) : (
        <ul className="att-list" role="list">
          {shown.map(({ id, m, name }) => {
            const v = visits[id]
            const info = m ? passInfo(m, date) : null
            return (
              <li
                key={id}
                className={`att-row${v ? ' is-present' : ''}${info ? ` pass-${info.state}` : ''}${justMarked === id && v ? ' is-pop' : ''}`}
                onAnimationEnd={() => justMarked === id && setJustMarked(null)}
              >
                <button type="button" className="att-check" aria-pressed={!!v} onClick={() => m && toggle(m)} disabled={!m}>
                  <CheckBox on={!!v} />
                  <span className="att-check__text">
                    <span className="att-check__name">{name}</span>
                    <span className="att-check__meta">
                      {m ? <PassChip m={m} date={date} /> : <span className="chip chip--none">видалений</span>}
                      {m && m.group !== group && <span className="chip chip--none">{GROUP_LABEL[m.group]}</span>}
                    </span>
                  </span>
                </button>

                <div className="att-pay" aria-hidden={!v}>
                  <div className="att-pay__inner">
                    {v && (
                      <>
                        <div className="att-paykind" role="group" aria-label={`Оплата: ${name}`}>
                          {(['pass', 'cash', 'free'] as PayKind[]).map((k) => (
                            <button key={k} type="button" title={PAY_FULL[k]} aria-pressed={v.pay === k} disabled={k === 'pass' && !m?.pass} onClick={() => setPay(m, id, k)}>
                              {PAY_SHORT[k]}
                            </button>
                          ))}
                        </div>
                        {v.pay === 'cash' && (
                          <label className="att-amount">
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={10}
                              value={v.amount}
                              onChange={(e) => setAmount(id, Number(e.target.value))}
                              onFocus={(e) => e.target.select()}
                              aria-label={`Сума: ${name}`}
                            />
                            <span>₴</span>
                          </label>
                        )}
                        {!m && (
                          <button type="button" className="adm-pill" onClick={() => { const n = { ...visits }; delete n[id]; change(n) }}>Зняти</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}

          {/* Новий учасник прямо в кінці списку */}
          {!q && (
            <li className="att-row att-row--add">
              <form className="att-add" onSubmit={(e) => { e.preventDefault(); addPerson(newName, 'row') }}>
                <span className="adm-cb adm-cb--add" aria-hidden="true"><Icon name="plus" size={16} /></span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`Новий учасник · ${GROUP_LABEL[group].toLowerCase()}`}
                  aria-label="Ім'я нового учасника"
                  enterKeyHint="done"
                  autoComplete="off"
                  maxLength={80}
                />
                {newName.trim() && <button className="btn btn--primary btn--sm">Додати</button>}
              </form>
            </li>
          )}
        </ul>
      )}
      {status !== 'loading' && !shown.length && q && (
        <p className="adm-note">Нікого не знайдено — натисніть <b>Enter</b> або «Додати», щоб записати нового відвідувача.</p>
      )}

      <div className="att-sum" aria-live="polite">
        <div className="att-sum__stats">
          <span><b key={present.length} className="att-bump">{present.length}</b> присутні</span>
          <span><b>{fromPass}</b> абон.</span>
          <span><b>{money(cash)}</b></span>
        </div>
        <span className={`att-status is-${status}`}>
          {status === 'saving' ? 'Зберігаю…' : status === 'saved' ? <><Icon name="check" size={16} /> Збережено</> : status === 'error' ? (
            <button type="button" className="adm-link" onClick={flush}>Повторити</button>
          ) : ''}
        </span>
      </div>
    </section>
  )
}

function storageGet(k: string) {
  try { return sessionStorage.getItem(k) } catch { return null }
}
function storageSet(k: string, v: string) {
  try { sessionStorage.setItem(k, v) } catch { /* приватний режим */ }
}
