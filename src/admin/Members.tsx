import { useMemo, useState } from 'react'
import { api } from './api'
import { useAdmin } from './context'
import { GROUPS, GROUP_LABEL, addDays, fmtDate, money, passInfo, today, type Group, type Member } from './model'
import { Dialog, Field, Icon, PassChip, Select } from './ui'

type Filter = 'all' | Group
type Sort = 'name' | 'pass' | 'visit'

/** Таблиця учасників: додати, змінити, видалити, продати абонемент. */
export function Members() {
  const { members, notify, removeMember } = useAdmin()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [onlyAttention, setOnlyAttention] = useState(false)
  const [sort, setSort] = useState<Sort>('name')
  const [edit, setEdit] = useState<Partial<Member> | null>(null)
  const [passFor, setPassFor] = useState<Member | null>(null)

  const attention = (m: Member) => ['low', 'expired'].includes(passInfo(m).state)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = members.filter(
      (m) =>
        (filter === 'all' || m.group === filter) &&
        (!q || m.name.toLowerCase().includes(q) || m.phone?.includes(q)) &&
        (!onlyAttention || attention(m)),
    )
    const rank = { expired: 0, low: 1, ok: 2, future: 2, none: 3 }
    return out.sort((a, b) =>
      sort === 'pass'
        ? rank[passInfo(a).state] - rank[passInfo(b).state] || a.name.localeCompare(b.name, 'uk')
        : sort === 'visit'
          ? (b.lastVisit ?? '').localeCompare(a.lastVisit ?? '')
          : a.name.localeCompare(b.name, 'uk'),
    )
  }, [members, filter, query, onlyAttention, sort])

  const counts = { all: members.length, adult: members.filter((m) => m.group === 'adult').length, kids: members.filter((m) => m.group === 'kids').length }
  const attentionCount = members.filter(attention).length

  const remove = async (m: Member) => {
    if (!window.confirm(`Видалити «${m.name}»?\n\nВідвідування в минулих звітах залишаться.`)) return
    try {
      await api.deleteMember(m.id)
      removeMember(m.id)
      notify(`Видалено: ${m.name}`)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Помилка', true)
    }
  }

  return (
    <section aria-labelledby="mem-title">
      <div className="adm-head">
        <h1 id="mem-title" className="h3">Учасники <span className="muted">{members.length}</span></h1>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setEdit({ group: filter === 'kids' ? 'kids' : 'adult' })}><Icon name="helmet" size={18} /> Додати</button>
      </div>

      <div className="adm-toolbar mem-toolbar">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук за ім'ям або телефоном" aria-label="Пошук" />
        <div className="adm-seg" role="group" aria-label="Група">
          {(['all', ...GROUPS] as Filter[]).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Усі' : GROUP_LABEL[f]} <small>{counts[f]}</small>
            </button>
          ))}
        </div>
        <label className="adm-check">
          <input type="checkbox" checked={onlyAttention} onChange={(e) => setOnlyAttention(e.target.checked)} />
          Закінчується абонемент <span className="chip chip--low">{attentionCount}</span>
        </label>
        <Select<Sort>
          className="adm-sort"
          label="Сортування"
          prefix="Сортувати:"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'name', label: "за ім'ям" },
            { value: 'pass', label: 'за абонементом', hint: 'спершу ті, кому пора продовжити' },
            { value: 'visit', label: 'за останнім візитом' },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <div className="adm-empty card">{members.length ? 'Нікого не знайдено за цими умовами.' : 'Ще немає жодного учасника. Додайте першого кнопкою «+ Додати» або прямо на вкладці «Заняття».'}</div>
      ) : (
        <div className="adm-table-wrap card">
          <table className="adm-table mem-table">
            <thead>
              <tr>
                <th>Ім'я</th>
                <th>Група</th>
                <th>Телефон</th>
                <th>Абонемент</th>
                <th>Останній візит</th>
                <th><span className="sr-only">Дії</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className={`pass-${passInfo(m).state}`}>
                  <td data-label="Ім'я">
                    <button type="button" className="mem-name" onClick={() => setEdit(m)}>{m.name}</button>
                    <span className="mem-sub">
                      <span>{GROUP_LABEL[m.group]}</span>
                      {m.phone && <a href={`tel:${m.phone}`}>{m.phone}</a>}
                      {m.lastVisit && <span>був {fmtDate(m.lastVisit, { day: 'numeric', month: 'short' })}</span>}
                    </span>
                    {m.note && <small className="mem-note">{m.note}</small>}
                  </td>
                  <td data-label="Група">{GROUP_LABEL[m.group]}</td>
                  <td data-label="Телефон">{m.phone ? <a href={`tel:${m.phone}`}>{m.phone}</a> : <span className="muted">—</span>}</td>
                  <td data-label="Абонемент"><PassChip m={m} /></td>
                  <td data-label="Останній візит">{m.lastVisit ? fmtDate(m.lastVisit) : <span className="muted">—</span>}</td>
                  <td className="mem-actions">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPassFor(m)}><Icon name="ticket" size={18} /> {m.pass ? 'Абонемент' : 'Оформити'}</button>
                    <button type="button" className="adm-icon" onClick={() => setEdit(m)} aria-label={`Змінити ${m.name}`} title="Змінити"><Icon name="edit" size={18} /></button>
                    <button type="button" className="adm-icon adm-icon--danger" onClick={() => remove(m)} aria-label={`Видалити ${m.name}`} title="Видалити"><Icon name="trash" size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MemberDialog member={edit} onClose={() => setEdit(null)} />
      <PassDialog member={passFor} onClose={() => setPassFor(null)} />
    </section>
  )
}

function MemberDialog({ member, onClose }: { member: Partial<Member> | null; onClose: () => void }) {
  const { mergeMembers, notify } = useAdmin()
  const [busy, setBusy] = useState(false)
  const isNew = !member?.id

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    try {
      const { member: saved } = await api.saveMember({
        id: member?.id,
        name: String(f.get('name')),
        group: f.get('group') as Group,
        phone: String(f.get('phone') ?? ''),
        note: String(f.get('note') ?? ''),
      })
      mergeMembers([saved])
      notify(isNew ? `Додано: ${saved.name}` : 'Збережено ✓')
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Помилка', true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!member} title={isNew ? 'Новий учасник' : 'Учасник'} onClose={onClose}>
      {member && (
        <form className="adm-form" onSubmit={submit}>
          <Field label="Ім'я та прізвище *"><input name="name" defaultValue={member.name} required maxLength={80} autoFocus /></Field>
          <Field label="Група">
            <Select<Group> name="group" label="Група" defaultValue={member.group ?? 'adult'} options={GROUPS.map((g) => ({ value: g, label: GROUP_LABEL[g] }))} />
          </Field>
          <Field label="Телефон"><input name="phone" type="tel" defaultValue={member.phone} maxLength={30} placeholder="+380…" /></Field>
          <Field label="Нотатка" hint="Напр.: батьки, медичні обмеження, рівень"><textarea name="note" defaultValue={member.note} maxLength={300} rows={2} /></Field>
          {!isNew && member.payments && member.payments.length > 0 && (
            <div className="adm-history">
              <b>Оплати абонементів</b>
              <ul>{[...member.payments].reverse().slice(0, 6).map((p) => <li key={p.id}>{fmtDate(p.date)} — {money(p.amount)} <span className="muted">{p.note}</span></li>)}</ul>
            </div>
          )}
          <div className="adm-form__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Скасувати</button>
            <button className="btn btn--primary" disabled={busy}>{busy ? 'Зберігаю…' : 'Зберегти'}</button>
          </div>
        </form>
      )}
    </Dialog>
  )
}

function PassDialog({ member, onClose }: { member: Member | null; onClose: () => void }) {
  const { settings, mergeMembers, notify } = useAdmin()
  const [mode, setMode] = useState<'new' | 'edit'>('new')
  const [busy, setBusy] = useState(false)
  const [from, setFrom] = useState(today())
  const [until, setUntil] = useState(addDays(today(), settings.passDays))
  const [openFor, setOpenFor] = useState<string | null>(null)

  // Скидаємо форму, коли відкрили для іншої людини
  if (member && openFor !== member.id) {
    setOpenFor(member.id)
    setMode('new')
    setFrom(today())
    setUntil(addDays(today(), settings.passDays))
  }
  if (!member && openFor) setOpenFor(null)

  const p = member?.pass
  const editing = mode === 'edit' && !!p

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!member) return
    const f = new FormData(e.currentTarget)
    setBusy(true)
    try {
      const { member: saved } = await api.savePass({
        memberId: member.id,
        id: editing ? p!.id : undefined,
        sessions: Number(f.get('sessions')),
        amount: Number(f.get('amount')),
        from,
        until,
        used: editing ? Number(f.get('used')) : undefined,
      })
      mergeMembers([saved])
      notify(editing ? 'Абонемент виправлено ✓' : `Абонемент оформлено: ${saved.name} ✓`)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Помилка', true)
    } finally {
      setBusy(false)
    }
  }

  const cancelPass = async () => {
    if (!member || !window.confirm('Скасувати поточний абонемент? Оплата за нього зникне зі звітів.')) return
    try {
      const { member: saved } = await api.deletePass(member.id)
      mergeMembers([saved])
      notify('Абонемент скасовано')
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Помилка', true)
    }
  }

  return (
    <Dialog open={!!member} title={member ? `Абонемент — ${member.name}` : 'Абонемент'} onClose={onClose}>
      {member && (
        <form className="adm-form" onSubmit={submit} key={`${member.id}-${mode}`}>
          {p && (
            <div className="adm-pass-now">
              <PassChip m={member} />
              <span className="muted">Використано {p.used} з {p.sessions} · {fmtDate(p.from)} — {fmtDate(p.until)} · {money(p.amount)}</span>
              <div className="adm-seg" role="group" aria-label="Дія">
                <button type="button" aria-pressed={mode === 'new'} onClick={() => { setMode('new'); setFrom(today()); setUntil(addDays(today(), settings.passDays)) }}>Новий</button>
                <button type="button" aria-pressed={mode === 'edit'} onClick={() => { setMode('edit'); setFrom(p.from); setUntil(p.until) }}>Виправити поточний</button>
              </div>
            </div>
          )}
          <div className="adm-form__grid">
            <Field label="Занять"><input name="sessions" type="number" min={1} max={500} defaultValue={editing ? p!.sessions : settings.passSessions} required /></Field>
            <Field label="Сума, ₴"><input name="amount" type="number" min={0} step={50} defaultValue={editing ? p!.amount : settings.passPrice[member.group]} required /></Field>
            <Field label="З"><input type="date" value={from} onChange={(e) => { setFrom(e.target.value); if (!editing) setUntil(addDays(e.target.value, settings.passDays)) }} required /></Field>
            <Field label="До (включно)"><input type="date" value={until} min={from} onChange={(e) => setUntil(e.target.value)} required /></Field>
            {editing && <Field label="Вже використано" hint="Рахується автоматично за відмітками"><input name="used" type="number" min={0} defaultValue={p!.used} /></Field>}
          </div>
          {!editing && p && passInfo(member).state !== 'expired' && (
            <p className="adm-note">Поточний абонемент ще діє — новий його замінить.</p>
          )}
          <div className="adm-form__actions">
            {editing && <button type="button" className="adm-link adm-link--danger" onClick={cancelPass}>Скасувати абонемент</button>}
            <button type="button" className="btn btn--ghost" onClick={onClose}>Закрити</button>
            <button className="btn btn--primary" disabled={busy}>{busy ? 'Зберігаю…' : editing ? 'Зберегти' : 'Оформити'}</button>
          </div>
        </form>
      )}
    </Dialog>
  )
}
