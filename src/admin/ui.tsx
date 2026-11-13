import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { fmtDate, passInfo, type Member } from './model'

/** Плашка стану абонемента: «5 з 8 · до 30.11» */
export function PassChip({ m, date }: { m: Member; date?: string }) {
  const info = passInfo(m, date)
  if (info.state === 'none') return <span className="chip chip--none">Без абонемента</span>
  const p = m.pass!
  const until = fmtDate(p.until, { day: '2-digit', month: '2-digit' })
  if (info.state === 'expired') {
    const why = info.reason === 'used' ? 'Абонемент: заняття скінчились' : `Абонемент скінчився ${until}`
    return <span className="chip chip--expired" title={`Використано ${p.used} з ${p.sessions}, діяв ${fmtDate(p.from)} — ${fmtDate(p.until)}`}>{why}</span>
  }
  if (info.state === 'future') {
    const from = fmtDate(p.from, { day: '2-digit', month: '2-digit' })
    return <span className="chip chip--ok" title={`Абонемент на ${p.sessions} занять, діє ${fmtDate(p.from)} — ${fmtDate(p.until)}`}>{p.sessions - p.used} з {p.sessions} · з {from} до {until}</span>
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
  down: 'M6.5 9.5l5.5 5.5 5.5-5.5',
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

/* ---------- Власний випадний список ----------
   Виглядає однаково на iPhone, Android і ноутбуці, керується з клавіатури
   (↑ ↓ Enter Esc, перша літера), закривається тапом поза ним.
   Працює і як керований (value + onChange), і в формі (name + defaultValue). */
export type Option<T extends string> = { value: T; label: string; hint?: string }

export function Select<T extends string>({
  value, defaultValue, onChange, options, name, label, className, prefix,
}: {
  value?: T
  defaultValue?: T
  onChange?: (v: T) => void
  options: Option<T>[]
  name?: string
  label: string
  className?: string
  prefix?: string
}) {
  const [inner, setInner] = useState<T>(defaultValue ?? options[0].value)
  const current = value ?? inner
  const [open, setOpen] = useState(false)
  const [up, setUp] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const id = useId()
  const selected = options.find((o) => o.value === current) ?? options[0]

  const choose = (v: T) => {
    if (value === undefined) setInner(v)
    onChange?.(v)
    setOpen(false)
    btn.current?.focus()
  }

  const show = () => {
    const r = btn.current?.getBoundingClientRect()
    if (r) setUp(r.bottom + Math.min(options.length * 46 + 16, 300) > window.innerHeight - 80 && r.top > 260)
    setActive(Math.max(0, options.findIndex((o) => o.value === current)))
    setOpen(true)
  }

  /* Закрити тапом поза списком */
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show() }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0) }
    else if (e.key === 'End') { e.preventDefault(); setActive(options.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(options[active].value) }
    else if (e.key === 'Tab') setOpen(false)
    else if (e.key.length === 1) {
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()))
      if (i >= 0) setActive(i)
    }
  }

  return (
    <div ref={root} className={`adm-select${open ? ' is-open' : ''}${className ? ' ' + className : ''}`}>
      <button
        ref={btn}
        type="button"
        className="adm-select__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${selected.label}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKey}
      >
        {prefix && <span className="adm-select__prefix">{prefix}</span>}
        <span className="adm-select__value">{selected.label}</span>
        <Icon name="down" size={18} className="adm-select__chev" />
      </button>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className={`adm-select__list${up ? ' is-up' : ''}`}
          aria-activedescendant={`${id}-${active}`}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === current}
              className={i === active ? 'is-active' : ''}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
            >
              <span>
                {o.label}
                {o.hint && <small>{o.hint}</small>}
              </span>
              {o.value === current && <Icon name="check" size={16} />}
            </li>
          ))}
        </ul>
      )}
      {name && <input type="hidden" name={name} value={current} />}
    </div>
  )
}
