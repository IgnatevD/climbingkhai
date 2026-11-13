import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { I18nProvider } from '../i18n'
import { ThemeToggle } from '../components/ThemeToggle'
import { Carabiner } from '../components/Icons'
import { api, ApiError } from './api'
import { Ctx, type AdminCtx } from './context'
import type { Member, Settings } from './model'
import { Attendance } from './Attendance'
import { Members } from './Members'
import { Report } from './Report'
import { SettingsTab } from './SettingsTab'
import { Icon, type IconName } from './ui'
import './admin.css'

const TABS = [
  { id: 'today', label: 'Заняття', icon: 'carabiner' },
  { id: 'members', label: 'Учасники', icon: 'helmet' },
  { id: 'report', label: 'Звіт', icon: 'peaks' },
  { id: 'settings', label: 'Налаштування', short: 'Ще', icon: 'rope' },
] as const satisfies readonly { id: string; label: string; short?: string; icon: IconName }[]
type TabId = (typeof TABS)[number]['id']

/** Сторінка /admin: вхід → облік занять. Не індексується пошуковиками. */
export default function AdminApp() {
  useEffect(() => {
    document.title = 'Облік занять — Climbing KhAI'
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    return () => meta.remove()
  }, [])

  return (
    <I18nProvider>
      <Gate />
    </I18nProvider>
  )
}

type Data = { user: string; members: Member[]; settings: Settings }

function Gate() {
  const [data, setData] = useState<Data | null>(null)
  const [phase, setPhase] = useState<'loading' | 'login' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setData(await api.state())
      setPhase('ready')
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setPhase('login')
      else {
        setError(e instanceof Error ? e.message : 'Помилка')
        setPhase('error')
      }
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (phase === 'loading') return <div className="adm-center"><span className="adm-spinner" aria-label="Завантаження" /></div>
  if (phase === 'login') return <Login onDone={load} />
  if (phase === 'error' || !data)
    return (
      <div className="adm-center">
        <div className="adm-login card">
          <h1 className="h3">Не вдалося завантажити</h1>
          <p className="muted">{error}</p>
          <button className="btn btn--primary" onClick={() => { setPhase('loading'); load() }}>Спробувати ще</button>
        </div>
      </div>
    )
  return <Shell data={data} setData={setData} onLogout={() => setPhase('login')} />
}

function Login({ onDone }: { onDone: () => void }) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.login(login, password)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка')
      setBusy(false)
    }
  }

  return (
    <div className="adm-center wall-dots">
      <form className="adm-login card" onSubmit={submit}>
        <div className="adm-login__logo"><Carabiner /> Climbing KhAI</div>
        <h1 className="h3">Вхід для тренерів</h1>
        <label className="adm-field">
          <span>Логін</span>
          <input autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} required autoFocus />
        </label>
        <label className="adm-field">
          <span>Пароль</span>
          <div className="adm-pass">
            <input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="adm-icon" onClick={() => setShow(!show)} aria-label={show ? 'Сховати пароль' : 'Показати пароль'}>{show ? '🙈' : '👁'}</button>
          </div>
        </label>
        {error && <p className="adm-error" role="alert">{error}</p>}
        <button className="btn btn--primary" disabled={busy}>{busy ? 'Входимо…' : 'Увійти'}</button>
        <Link to="/" className="adm-login__back">← На сайт</Link>
      </form>
    </div>
  )
}

function Shell({ data, setData, onLogout }: { data: Data; setData: React.Dispatch<React.SetStateAction<Data | null>>; onLogout: () => void }) {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'today') as TabId
  const [toast, setToast] = useState<{ text: string; error: boolean; id: number } | null>(null)
  const toastTimer = useRef(0)

  const notify = useCallback((text: string, error = false) => {
    clearTimeout(toastTimer.current)
    setToast({ text, error, id: Date.now() })
    toastTimer.current = window.setTimeout(() => setToast(null), error ? 5000 : 2200)
  }, [])

  // Функції стабільні (залежать лише від setData), щоб ефекти вкладок не перезапускались після кожного збереження
  const mergeMembers = useCallback(
    (list: Member[]) =>
      setData((d) => {
        if (!d || !list.length) return d
        const map = new Map(d.members.map((m) => [m.id, m]))
        list.forEach((m) => map.set(m.id, m))
        return { ...d, members: [...map.values()] }
      }),
    [setData],
  )
  const removeMember = useCallback((id: string) => setData((d) => (d ? { ...d, members: d.members.filter((m) => m.id !== id) } : d)), [setData])
  const setSettings = useCallback((settings: Settings) => setData((d) => (d ? { ...d, settings } : d)), [setData])

  const ctx = useMemo<AdminCtx>(
    () => ({ user: data.user, members: data.members, settings: data.settings, mergeMembers, removeMember, setSettings, notify }),
    [data, mergeMembers, removeMember, setSettings, notify],
  )

  const logout = async () => {
    await api.logout().catch(() => {})
    onLogout()
  }

  return (
    <Ctx.Provider value={ctx}>
      <div className="adm">
        <header className="adm-top">
          <div className="adm-top__row">
            <Link to="/" className="adm-brand" title="На сайт"><Carabiner /> <span>Облік <b>ХАІ</b></span></Link>
            {/* На ноутбуці вкладки — у шапці, на телефоні — внизу екрана, під великим пальцем */}
            <nav className="adm-tabs" aria-label="Розділи">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`adm-tab${tab === t.id ? ' is-active' : ''}`}
                  aria-current={tab === t.id ? 'page' : undefined}
                  onClick={() => { setParams(t.id === 'today' ? {} : { tab: t.id }); window.scrollTo({ top: 0 }) }}
                >
                  <Icon name={t.icon} size={22} />
                  <span className="adm-tab__full">{t.label}</span>
                  <span className="adm-tab__short">{'short' in t ? t.short : t.label}</span>
                </button>
              ))}
            </nav>
            <div className="adm-top__right">
              <ThemeToggle />
              <button type="button" className="adm-icon adm-logout" onClick={logout} title={`Вийти (${data.user})`} aria-label="Вийти">
                <Icon name="logout" />
              </button>
            </div>
          </div>
        </header>

        <main className="adm-main">
          {tab === 'today' && <Attendance />}
          {tab === 'members' && <Members />}
          {tab === 'report' && <Report />}
          {tab === 'settings' && <SettingsTab />}
        </main>

        {toast && (
          <div key={toast.id} className={`adm-toast${toast.error ? ' is-error' : ''}`} role={toast.error ? 'alert' : 'status'}>
            {toast.text}
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}
