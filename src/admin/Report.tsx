import { Fragment, useEffect, useMemo, useState } from 'react'
import { api } from './api'
import { useAdmin } from './context'
import { GROUPS, GROUP_LABEL, addDays, defaultVisit, fmtDate, fromISO, money, toISO, today, type Group, type Session, type Visit } from './model'
import { Icon, Select } from './ui'

type Filter = 'all' | Group

const monthStart = (d = new Date()) => toISO(new Date(d.getFullYear(), d.getMonth(), 1))
const monthEnd = (d = new Date()) => toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))

const PRESETS = [
  { id: 'month', label: 'Цей місяць', range: () => [monthStart(), today()] },
  { id: 'prev', label: 'Минулий місяць', range: () => { const d = new Date(); d.setMonth(d.getMonth() - 1, 1); return [monthStart(d), monthEnd(d)] } },
  { id: 'week', label: '7 днів', range: () => [addDays(today(), -6), today()] },
  { id: 'q', label: '3 місяці', range: () => [addDays(today(), -90), today()] },
] as const

const MARK: Record<Visit['pay'], string> = { pass: 'А', cash: '₴', free: 'Б' }

/** Звіт присутності за період: таблиця «учасник × заняття», підсумки та вивантаження в Excel (CSV). */
export function Report() {
  const { members, settings, mergeMembers, notify } = useAdmin()
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(today())
  const [filter, setFilter] = useState<Filter>('all')
  const [showAbsent, setShowAbsent] = useState(true)
  const [sessions, setSessions] = useState<Session[] | null>(null)
  // Режим редагування: тап по клітинці ставить/знімає відмітку, можна додати дату й нову людину
  const [edit, setEdit] = useState(false)
  const [extraDates, setExtraDates] = useState<string[]>([])
  const [added, setAdded] = useState<string[]>([])
  const [busyCell, setBusyCell] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [newDate, setNewDate] = useState(today())
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<Group>('adult')

  useEffect(() => {
    if (!from || !to || to < from) return
    let alive = true
    setSessions(null)
    api.sessions(from, to)
      .then((r) => alive && setSessions(r.sessions))
      .catch((e) => { if (alive) { setSessions([]); notify(e.message, true) } })
    return () => { alive = false }
  }, [from, to, notify])

  const data = useMemo(() => {
    const ss = (sessions ?? []).filter((s) => (filter === 'all' || s.group === filter) && Object.keys(s.visits).length)
    const dates = [...new Set([...ss.map((s) => s.date), ...extraDates.filter((d) => d >= from && d <= to)])].sort()
    const byId = new Map(members.map((m) => [m.id, m]))

    type Row = { id: string; name: string; group: Group | null; cells: Record<string, Visit>; visits: number; pass: number; paid: number }
    const rows = new Map<string, Row>()
    const ensure = (id: string, name: string, group: Group | null) => {
      if (!rows.has(id)) rows.set(id, { id, name, group, cells: {}, visits: 0, pass: 0, paid: 0 })
      return rows.get(id)!
    }
    members
      .filter((m) => (filter === 'all' || m.group === filter) && (showAbsent || edit || added.includes(m.id)))
      .forEach((m) => ensure(m.id, m.name, m.group))
    for (const s of ss) {
      for (const [id, v] of Object.entries(s.visits)) {
        const m = byId.get(id)
        const r = ensure(id, m?.name ?? `${v.name} (видалений)`, m?.group ?? s.group)
        r.cells[s.date] = v
        r.visits++
        if (v.pay === 'pass') r.pass++
        if (v.pay === 'cash') r.paid += v.amount
      }
    }
    const list = [...rows.values()].sort((a, b) =>
      filter === 'all' && a.group !== b.group ? (a.group === 'kids' ? 1 : -1) : a.name.localeCompare(b.name, 'uk'),
    )
    const perDate = Object.fromEntries(dates.map((d) => [d, list.filter((r) => r.cells[d]).length]))

    // Продані абонементи за період
    const passSales = members
      .filter((m) => filter === 'all' || m.group === filter)
      .flatMap((m) => m.payments.filter((p) => p.date >= from && p.date <= to).map((p) => ({ ...p, name: m.name, group: m.group })))
      .sort((a, b) => a.date.localeCompare(b.date))

    const visits = list.reduce((s, r) => s + r.visits, 0)
    const cash = list.reduce((s, r) => s + r.paid, 0)
    const passSum = passSales.reduce((s, p) => s + p.amount, 0)
    return {
      dates, list, perDate, passSales,
      totals: { sessions: ss.length, visits, unique: list.filter((r) => r.visits).length, cash, passSum, all: cash + passSum, avg: ss.length ? Math.round((visits / ss.length) * 10) / 10 : 0 },
    }
  }, [sessions, members, filter, showAbsent, from, to, extraDates, added, edit])

  /** Поставити / зняти відмітку прямо у звіті */
  const toggleCell = async (memberId: string, rowGroup: Group | null, date: string) => {
    const m = members.find((x) => x.id === memberId)
    const g: Group = m?.group ?? rowGroup ?? 'adult'
    const prevSessions = sessions ?? []
    const cur = prevSessions.find((x) => x.date === date && x.group === g)
    const visits = { ...(cur?.visits ?? {}) }
    if (visits[memberId]) delete visits[memberId]
    else if (m) visits[memberId] = defaultVisit(m, date, settings)
    else return
    const key = `${memberId}|${date}`
    const next: Session = { date, group: g, visits }
    setSessions([...prevSessions.filter((x) => !(x.date === date && x.group === g)), next])
    setExtraDates((d) => (d.includes(date) ? d : [...d, date]))
    setBusyCell(key)
    if (visits[memberId]) setFlash(key)
    try {
      const r = await api.saveSession(date, g, visits)
      mergeMembers(r.members)
    } catch (e) {
      setSessions(prevSessions)
      notify(`Не збережено: ${e instanceof Error ? e.message : ''}`, true)
    } finally {
      setBusyCell(null)
    }
  }

  const addDate = () => {
    if (!newDate) return
    if (newDate < from) setFrom(newDate)
    if (newDate > to) setTo(newDate)
    setExtraDates((d) => (d.includes(newDate) ? d : [...d, newDate]))
  }

  const addPerson = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim().replace(/\s+/g, ' ')
    if (!name) return
    const g: Group = filter === 'all' ? newGroup : filter
    const dup = members.find((m) => m.name.toLowerCase() === name.toLowerCase())
    if (dup) {
      setAdded((a) => [...a, dup.id])
      notify(`${dup.name} вже є у списку`)
    } else {
      try {
        const { member } = await api.saveMember({ name, group: g })
        mergeMembers([member])
        setAdded((a) => [...a, member.id])
        notify(`Додано: ${member.name}. Відмітьте заняття в його рядку`)
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Помилка', true)
        return
      }
    }
    setNewName('')
  }

  const exportCsv = () => {
    const { dates, list, perDate, passSales, totals } = data
    const esc = (v: string | number) => {
      const s = String(v)
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines: (string | number)[][] = [
      [`Звіт присутності: ${fmtDate(from)} — ${fmtDate(to)}`, filter === 'all' ? 'Усі групи' : GROUP_LABEL[filter]],
      [],
      ["Ім'я", 'Група', ...dates.map((d) => fmtDate(d, { day: '2-digit', month: '2-digit' })), 'Відвідувань', 'З абонемента', 'Оплачено разово, ₴'],
      ...list.map((r) => [
        r.name,
        r.group ? GROUP_LABEL[r.group] : '',
        ...dates.map((d) => { const v = r.cells[d]; return !v ? '' : v.pay === 'cash' ? v.amount : MARK[v.pay] }),
        r.visits, r.pass, r.paid,
      ]),
      ['Присутніх', '', ...dates.map((d) => perDate[d]), totals.visits, '', totals.cash],
      [],
      ['Позначки: А — з абонемента, число — разова оплата в ₴, Б — безкоштовно'],
      [],
      ['Продані абонементи'],
      ['Дата', "Ім'я", 'Група', 'Сума, ₴', 'Примітка'],
      ...passSales.map((p) => [fmtDate(p.date), p.name, GROUP_LABEL[p.group], p.amount, p.note ?? '']),
      ['Разом', '', '', totals.passSum],
      [],
      ['Усього надходжень, ₴', totals.all],
    ]
    const csv = '﻿' + lines.map((l) => l.map(esc).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `prysutnist_${from}_${to}${filter === 'all' ? '' : '_' + filter}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const { dates, list, perDate, passSales, totals } = data
  const monthLabel = (d: string) => fromISO(d).toLocaleDateString('uk-UA', { weekday: 'short' })

  return (
    <section aria-labelledby="rep-title" className="rep">
      <div className="adm-head">
        <h1 id="rep-title" className="h3">Звіт присутності</h1>
        <div className="rep-actions">
          <button type="button" className={`btn btn--ghost btn--sm${edit ? ' is-on' : ''}`} onClick={() => setEdit(!edit)} aria-pressed={edit}>
            <Icon name="edit" size={18} /> {edit ? 'Готово' : 'Редагувати'}
          </button>
          <button type="button" className="btn btn--ghost btn--sm rep-print-btn" onClick={() => window.print()} disabled={!sessions}>
            <Icon name="print" size={18} /> Друк
          </button>
          <button type="button" className="btn btn--primary btn--sm" onClick={exportCsv} disabled={!sessions}>
            <Icon name="download" size={18} /> Excel
          </button>
        </div>
      </div>

      <div className="adm-toolbar rep-toolbar">
        <div className="rep-range">
          <label>З <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>по <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        <div className="rep-presets">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="adm-chipbtn" onClick={() => { const [a, b] = p.range(); setFrom(a); setTo(b) }}>{p.label}</button>
          ))}
        </div>
        <div className="adm-seg" role="group" aria-label="Група">
          {(['all', ...GROUPS] as Filter[]).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? 'Усі' : GROUP_LABEL[f]}</button>
          ))}
        </div>
        <label className="adm-check"><input type="checkbox" checked={showAbsent} onChange={(e) => setShowAbsent(e.target.checked)} /> Показувати тих, хто не приходив</label>
      </div>

      {edit && (
        <div className="rep-editbar">
          <p><b>Режим редагування.</b> Торкніться клітинки, щоб поставити або зняти відмітку. Оплата підставляється як на занятті.</p>
          <div className="rep-editbar__row">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} aria-label="Дата заняття" />
            <button type="button" className="btn btn--ghost btn--sm" onClick={addDate}><Icon name="calendar" size={18} /> Додати дату</button>
          </div>
        </div>
      )}

      <p className="rep-print-title">{fmtDate(from)} — {fmtDate(to)} · {filter === 'all' ? 'усі групи' : GROUP_LABEL[filter]}</p>

      <div className="rep-cards">
        <div className="rep-card"><b>{totals.sessions}</b><span>занять</span></div>
        <div className="rep-card"><b>{totals.visits}</b><span>відвідувань</span></div>
        <div className="rep-card"><b>{totals.avg}</b><span>у середньому на занятті</span></div>
        <div className="rep-card"><b>{totals.unique}</b><span>різних людей</span></div>
        <div className="rep-card"><b>{money(totals.cash)}</b><span>разові оплати</span></div>
        <div className="rep-card"><b>{money(totals.passSum)}</b><span>абонементи ({passSales.length})</span></div>
        <div className="rep-card rep-card--accent"><b>{money(totals.all)}</b><span>усього надходжень</span></div>
      </div>

      {!sessions ? (
        <div className="adm-center adm-center--inline"><span className="adm-spinner" /></div>
      ) : !dates.length && !edit ? (
        <div className="adm-empty card">
          <p>За цей період відміток немає.</p>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEdit(true)}><Icon name="edit" size={18} /> Внести відмітки вручну</button>
        </div>
      ) : (
        <div className={`card rep-wrap${edit ? ' is-edit' : ''}`}>
          <div className="adm-table-wrap rep-scroll">
          <table className="adm-table rep-table">
            <thead>
              <tr>
                <th className="rep-sticky">Учасник</th>
                {dates.map((d) => <th key={d} className="rep-date"><span>{monthLabel(d)}</span>{fmtDate(d, { day: '2-digit', month: '2-digit' })}</th>)}
                <th className="rep-num">Візитів</th>
                <th className="rep-num">Абон.</th>
                <th className="rep-num">Оплачено</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <Fragment key={r.id}>
                  {filter === 'all' && (i === 0 || list[i - 1].group !== r.group) && (
                    <tr key={`g-${r.group}`} className="rep-group"><td className="rep-sticky" colSpan={dates.length + 4}>{r.group ? GROUP_LABEL[r.group] : ''}</td></tr>
                  )}
                  <tr className={r.visits ? '' : 'rep-absent'}>
                    <td className="rep-sticky">{r.name}</td>
                    {dates.map((d) => {
                      const v = r.cells[d]
                      const key = `${r.id}|${d}`
                      const title = v ? (v.pay === 'cash' ? money(v.amount) : v.pay === 'pass' ? 'Абонемент' : 'Безкоштовно') : 'Не був'
                      return (
                        <td key={d} className={`rep-cell${v ? ` is-${v.pay}` : ''}${busyCell === key ? ' is-busy' : ''}${flash === key && v ? ' is-pop' : ''}`} title={title}>
                          {edit ? (
                            <button
                              type="button"
                              className="rep-cellbtn"
                              onClick={() => toggleCell(r.id, r.group, d)}
                              onAnimationEnd={() => setFlash(null)}
                              aria-label={`${r.name}, ${fmtDate(d)}: ${v ? title + ' — зняти' : 'відмітити'}`}
                              aria-pressed={!!v}
                            >
                              {v ? (v.pay === 'cash' ? '₴' : MARK[v.pay]) : '+'}
                            </button>
                          ) : v ? (v.pay === 'cash' ? '₴' : MARK[v.pay]) : ''}
                        </td>
                      )
                    })}
                    <td className="rep-num"><b>{r.visits}</b></td>
                    <td className="rep-num">{r.pass || ''}</td>
                    <td className="rep-num">{r.paid ? money(r.paid) : ''}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th className="rep-sticky">Присутніх</th>
                {dates.map((d) => <th key={d} className="rep-cell">{perDate[d]}</th>)}
                <th className="rep-num">{totals.visits}</th>
                <th />
                <th className="rep-num">{money(totals.cash)}</th>
              </tr>
            </tfoot>
          </table>
          </div>
          {edit && (
            <form className="rep-add" onSubmit={addPerson}>
              <span className="adm-cb adm-cb--add" aria-hidden="true"><Icon name="plus" size={16} /></span>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Нова людина у звіт" aria-label="Ім'я нового учасника" maxLength={80} />
              {filter === 'all' && (
                <Select<Group> className="rep-add__group" label="Група" value={newGroup} onChange={setNewGroup} options={GROUPS.map((g) => ({ value: g, label: GROUP_LABEL[g] }))} />
              )}
              <button className="btn btn--primary btn--sm" disabled={!newName.trim()}>Додати</button>
            </form>
          )}
          <p className="rep-legend"><span className="rep-cell is-pass">А</span> абонемент <span className="rep-cell is-cash">₴</span> разова оплата <span className="rep-cell is-free">Б</span> безкоштовно</p>
        </div>
      )}

      {passSales.length > 0 && (
        <details className="card rep-sales">
          <summary>Продані абонементи: {passSales.length} на {money(totals.passSum)}</summary>
          <table className="adm-table">
            <tbody>
              {passSales.map((p) => (
                <tr key={p.id}><td>{fmtDate(p.date)}</td><td>{p.name}</td><td>{GROUP_LABEL[p.group]}</td><td className="rep-num">{money(p.amount)}</td><td className="muted">{p.note}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  )
}
