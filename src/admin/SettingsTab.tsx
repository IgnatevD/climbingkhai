import { useState } from 'react'
import { api } from './api'
import { useAdmin } from './context'
import { GROUPS, GROUP_LABEL, WEEKDAYS_SHORT, type Settings } from './model'
import { Field, Icon } from './ui'

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // з понеділка

/** Розклад, тарифи за замовчуванням і резервна копія. */
export function SettingsTab() {
  const { settings, setSettings, notify } = useAdmin()
  const [s, setS] = useState<Settings>(settings)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(s) !== JSON.stringify(settings)

  const toggleDay = (d: number) => setS({ ...s, days: s.days.includes(d) ? s.days.filter((x) => x !== d) : [...s.days, d].sort() })
  const setGroupVal = <K extends 'price' | 'passPrice' | 'time'>(key: K, g: (typeof GROUPS)[number], v: Settings[K][typeof g]) =>
    setS({ ...s, [key]: { ...s[key], [g]: v } })

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const r = await api.saveSettings(s)
      setSettings(r.settings)
      setS(r.settings)
      notify('Налаштування збережено ✓')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Помилка', true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="set-title">
      <div className="adm-head"><h1 id="set-title" className="h3">Налаштування</h1></div>
      <form className="set-grid" onSubmit={save}>
        <section className="set-card card" aria-labelledby="set-days">
          <header className="set-card__head">
            <span className="set-card__icon"><Icon name="carabiner" size={20} /></span>
            <div>
              <h2 id="set-days">Розклад</h2>
              <p>Стрілки ‹ › на вкладці «Заняття» перескакують між цими днями.</p>
            </div>
          </header>
          <div className="set-days" role="group" aria-label="Дні занять">
            {WEEK_ORDER.map((d) => (
              <button key={d} type="button" className="adm-day" aria-pressed={s.days.includes(d)} onClick={() => toggleDay(d)}>{WEEKDAYS_SHORT[d]}</button>
            ))}
          </div>
          <div className="set-fields">
            {GROUPS.map((g) => (
              <Field key={g} label={`Час — ${GROUP_LABEL[g].toLowerCase()}`}>
                <input value={s.time[g]} onChange={(e) => setGroupVal('time', g, e.target.value)} maxLength={40} placeholder="19:00" />
              </Field>
            ))}
          </div>
        </section>

        <section className="set-card card" aria-labelledby="set-price">
          <header className="set-card__head">
            <span className="set-card__icon"><Icon name="chalk" size={20} /></span>
            <div>
              <h2 id="set-price">Разове заняття</h2>
              <p>Підставляється, коли людина без чинного абонемента. На занятті суму можна змінити.</p>
            </div>
          </header>
          <div className="set-fields">
            {GROUPS.map((g) => (
              <Field key={g} label={GROUP_LABEL[g]}>
                <span className="set-money"><input type="number" inputMode="numeric" min={0} step={10} value={s.price[g]} onChange={(e) => setGroupVal('price', g, Number(e.target.value))} /><span>₴</span></span>
              </Field>
            ))}
          </div>
        </section>

        <section className="set-card card" aria-labelledby="set-pass">
          <header className="set-card__head">
            <span className="set-card__icon"><Icon name="ticket" size={20} /></span>
            <div>
              <h2 id="set-pass">Абонемент</h2>
              <p>Значення, які підставляються при оформленні нового абонемента.</p>
            </div>
          </header>
          <div className="set-fields">
            <Field label="Занять"><input type="number" inputMode="numeric" min={1} value={s.passSessions} onChange={(e) => setS({ ...s, passSessions: Number(e.target.value) })} /></Field>
            <Field label="Діє, днів"><input type="number" inputMode="numeric" min={1} value={s.passDays} onChange={(e) => setS({ ...s, passDays: Number(e.target.value) })} /></Field>
            {GROUPS.map((g) => (
              <Field key={g} label={`Ціна — ${GROUP_LABEL[g].toLowerCase()}`}>
                <span className="set-money"><input type="number" inputMode="numeric" min={0} step={50} value={s.passPrice[g]} onChange={(e) => setGroupVal('passPrice', g, Number(e.target.value))} /><span>₴</span></span>
              </Field>
            ))}
          </div>
        </section>

        <section className="set-card card" aria-labelledby="set-backup">
          <header className="set-card__head">
            <span className="set-card__icon"><Icon name="rope" size={20} /></span>
            <div>
              <h2 id="set-backup">Резервна копія</h2>
              <p>Усі учасники, абонементи й відмітки одним файлом. Варто зберігати раз на місяць.</p>
            </div>
          </header>
          <a className="btn btn--ghost set-card__btn" href="/api/admin/export" download><Icon name="download" size={18} /> Завантажити копію</a>
        </section>

        {dirty && (
          <div className="set-save" role="status">
            <span className="set-save__hint">Зміни не збережені</span>
            <button type="button" className="adm-link" onClick={() => setS(settings)}>Скасувати</button>
            <button className="btn btn--primary btn--sm" disabled={busy}>{busy ? 'Зберігаю…' : 'Зберегти'}</button>
          </div>
        )}
      </form>
    </section>
  )
}
