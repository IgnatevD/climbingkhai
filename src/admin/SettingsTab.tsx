import { useEffect, useState } from 'react'
import { api, type AdminUser } from './api'
import { useAdmin } from './context'
import { GROUPS, GROUP_LABEL, WEEKDAYS_SHORT, type Settings } from './model'
import { Field, Icon } from './ui'

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // з понеділка

/** Розклад, тарифи за замовчуванням і резервна копія. */
export function SettingsTab() {
  const { settings, setSettings, notify, role } = useAdmin()
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

        <PasswordCard />
        {role === 'super' && <UsersCard />}

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

/** Зміна власного пароля (для тренерів; пароль суперадміна — лише в Netlify) */
function PasswordCard() {
  const { role, user, notify } = useAdmin()
  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const mismatch = again.length > 0 && next !== again
  const short = next.length > 0 && next.length < 8

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mismatch || short) return
    setBusy(true)
    try {
      await api.changePassword(cur, next)
      setCur(''); setNext(''); setAgain('')
      notify('Пароль змінено ✓ На інших пристроях потрібно буде увійти знову')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Помилка', true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="set-card card" aria-labelledby="set-pass-me">
      <header className="set-card__head">
        <span className="set-card__icon"><Icon name="helmet" size={20} /></span>
        <div>
          <h2 id="set-pass-me">Мій пароль</h2>
          <p>Ви увійшли як <b>{user}</b>{role === 'super' ? ' (суперадмін)' : ''}.</p>
        </div>
      </header>
      {role === 'super' ? (
        <p className="adm-note">Пароль суперадміна — резервний ключ: він змінюється лише в Netlify (змінна <code>SUPERADMIN_PASSWORD</code>). Нижче можна скинути пароль будь-якому тренеру.</p>
      ) : (
        <form className="set-fields set-fields--one" onSubmit={submit} autoComplete="on">
          <input type="text" name="username" value={user} autoComplete="username" readOnly hidden />
          <Field label="Поточний пароль">
            <input type={show ? 'text' : 'password'} value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
          </Field>
          <Field label="Новий пароль" hint={short ? 'Щонайменше 8 символів' : undefined}>
            <input type={show ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
          </Field>
          <Field label="Повторіть новий" hint={mismatch ? 'Паролі не збігаються' : undefined}>
            <input type={show ? 'text' : 'password'} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" required />
          </Field>
          <div className="set-row">
            <label className="adm-check"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Показати паролі</label>
            <button className="btn btn--primary btn--sm" disabled={busy || !cur || !next || mismatch || short}>{busy ? 'Змінюю…' : 'Змінити пароль'}</button>
          </div>
        </form>
      )}
    </section>
  )
}

/** Суперадмін: список тренерів, новий тренер, скидання пароля */
function UsersCard() {
  const { notify } = useAdmin()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api.users().then((r) => setUsers(r.users)).catch((e) => notify(e.message, true))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.saveUser(login.trim(), password)
      notify(users?.some((u) => u.login === login.trim()) ? `Пароль для «${login.trim()}» змінено ✓` : `Тренера «${login.trim()}» додано ✓`)
      setLogin(''); setPassword('')
      load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Помилка', true)
    } finally {
      setBusy(false)
    }
  }

  const reset = (u: AdminUser) => {
    setLogin(u.login)
    setPassword('')
    document.getElementById('set-user-pass')?.focus()
  }

  const remove = async (u: AdminUser) => {
    const msg = u.fromEnv
      ? `Скинути змінений пароль «${u.login}»? Знову діятиме пароль із налаштувань Netlify.`
      : `Видалити доступ тренера «${u.login}»?`
    if (!window.confirm(msg)) return
    try {
      await api.deleteUser(u.login)
      notify(u.fromEnv ? 'Пароль скинуто до початкового' : 'Доступ видалено')
      load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Помилка', true)
    }
  }

  const gen = () => {
    const abc = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const arr = crypto.getRandomValues(new Uint32Array(10))
    setPassword(Array.from(arr, (n) => abc[n % abc.length]).join(''))
  }

  return (
    <section className="set-card card set-card--wide" aria-labelledby="set-users">
      <header className="set-card__head">
        <span className="set-card__icon"><Icon name="users" size={20} /></span>
        <div>
          <h2 id="set-users">Тренери й доступ</h2>
          <p>Додайте тренера або задайте новий пароль тому, хто забув свій. Бачить лише суперадмін.</p>
        </div>
      </header>

      {!users ? (
        <span className="adm-spinner" />
      ) : (
        <ul className="set-users" role="list">
          {users.map((u) => (
            <li key={u.login}>
              <span className="set-users__name">
                <b>{u.login}</b>
                <small>{u.changedAt ? `пароль змінено ${new Date(u.changedAt).toLocaleDateString('uk-UA')}` : u.fromEnv ? 'пароль із Netlify' : ''}</small>
              </span>
              <button type="button" className="adm-pill" onClick={() => reset(u)}>Новий пароль</button>
              {(u.changedAt || !u.fromEnv) && (
                <button type="button" className="adm-icon adm-icon--danger" onClick={() => remove(u)} aria-label={u.fromEnv ? `Скинути пароль ${u.login}` : `Видалити ${u.login}`} title={u.fromEnv ? 'Скинути до пароля з Netlify' : 'Видалити доступ'}>
                  <Icon name="trash" size={18} />
                </button>
              )}
            </li>
          ))}
          {!users.length && <li className="adm-note">Ще немає жодного тренера.</li>}
        </ul>
      )}

      <form className="set-fields" onSubmit={save} autoComplete="off">
        <Field label="Логін"><input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="напр. oleg" required minLength={3} maxLength={40} autoComplete="off" /></Field>
        <Field label="Новий пароль">
          <span className="set-gen">
            <input id="set-user-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            <button type="button" className="adm-pill" onClick={gen} title="Згенерувати надійний пароль">Згенерувати</button>
          </span>
        </Field>
        <div className="set-row set-row--end">
          <button className="btn btn--primary btn--sm" disabled={busy || login.trim().length < 3 || password.length < 8}>{busy ? 'Зберігаю…' : 'Зберегти доступ'}</button>
        </div>
      </form>
    </section>
  )
}
