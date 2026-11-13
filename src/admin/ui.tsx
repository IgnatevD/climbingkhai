import { useEffect, useRef, type ReactNode } from 'react'
import { fmtDate, passInfo, type Member } from './model'

/** Плашка стану абонемента: «5 з 8 · до 30.11» */
export function PassChip({ m, date }: { m: Member; date?: string }) {
  const info = passInfo(m, date)
  if (info.state === 'none') return <span className="chip chip--none">Без абонемента</span>
  const p = m.pass!
  const until = fmtDate(p.until, { day: '2-digit', month: '2-digit' })
  if (info.state === 'expired') {
    const why = p.sessions - p.used <= 0 ? 'Абонемент: заняття скінчились' : `Абонемент скінчився ${until}`
    return <span className="chip chip--expired" title={`Абонемент: ${p.used} з ${p.sessions}`}>{why}</span>
  }
  return (
    <span className={`chip chip--${info.state}`} title={`Використано ${p.used} з ${p.sessions}, діє до ${fmtDate(p.until)}`}>
      ще {info.left} з {p.sessions} · до {until}
    </span>
  )
}

/** Модальне вікно на нативному <dialog>: Esc і фокус працюють «з коробки» */
export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="adm-dialog"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      aria-label={title}
    >
      {open && (
        <div className="adm-dialog__body">
          <header className="adm-dialog__head">
            <h2>{title}</h2>
            <button type="button" className="adm-icon" onClick={onClose} aria-label="Закрити"><Icon name="close" /></button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}

/* ---------- Іконки (stroke, 24×24) ---------- */
const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  /* Скелелазні: карабін з галочкою, каска, вершини з прапорцем, бухта мотузки, магнезія */
  carabiner: 'M9.5 3h5A4.5 4.5 0 0 1 19 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-5A4.5 4.5 0 0 1 5 16.5v-9A4.5 4.5 0 0 1 9.5 3zM19 9l-3 2M9 12.3l2 2 3.8-4',
  helmet: 'M3.5 15a8.5 8.5 0 0 1 17 0v1.5h-17zM12 6.5v3M8 8l1.2 2.4M16 8l-1.2 2.4M7 16.5v1a5 5 0 0 0 10 0v-1',
  peaks: 'M2.5 20.5l6.5-10 3.5 5 2.5-3.5 6.5 8.5zM14.5 12V4l4.5 1.7-4.5 1.8',
  rope: 'M12 20a8 8 0 1 1 8-8M12 16a4 4 0 1 1 4-4M12 12h0M20 12v8.5',
  chalk: 'M7 9h10l1.5 10.5a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5zM8.5 9V7a3.5 3.5 0 0 1 7 0v2M10 4.5l-1-1.5M14 4.5l1-1.5',
  users: 'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5M20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.2a3.25 3.25 0 0 1 0 6.1',
  chart: 'M4 20h16M7 16.5V11M12 16.5V6.5M17 16.5v-4',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V19a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z',
  plus: 'M12 5v14M5 12h14',
  left: 'M14.5 6l-6 6 6 6',
  right: 'M9.5 6l6 6-6 6',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  edit: 'M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10',
  download: 'M12 4v11M7 10.5l5 5 5-5M5 20h14',
  print: 'M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M7 14h10v6H7z',
  ticket: 'M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4zM10 6v12',
  close: 'M6 6l12 12M18 6L6 18',
  calendar: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 4v4M16 4v4',
} as const
export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

/** Квадратик-відмітка: галочка «малюється», коли людину відмічено */
export function CheckBox({ on }: { on: boolean }) {
  return (
    <span className={`adm-cb${on ? ' is-on' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    </span>
  )
}
