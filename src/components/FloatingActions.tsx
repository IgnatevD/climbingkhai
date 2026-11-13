import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useI18n } from '../i18n'
import { useReducedMotion } from '../hooks'
import { SITE } from '../content/site'
import { IconClose, IconInstagram, IconMail, IconPhone, IconPin } from './Icons'
import './FloatingActions.css'

const WALL_HEIGHT = 15 // м — як у висотоміра
const SHOW_TOP_AFTER = 600 // px прокрутки
const RING = 2 * Math.PI * 23

/**
 * Плаваючі кнопки внизу праворуч:
 *  • «Зв'язатися» — кнопка-зачеп; відкриває «маршрут» із контактами;
 *  • «Вгору» — з'являється після прокрутки, кільце-мотузка показує пройдену висоту.
 */
export function FloatingActions() {
  const { t, to } = useI18n()
  const { pathname } = useLocation()
  const reduce = useReducedMotion()
  const mainRef = useRef<HTMLButtonElement>(null)

  // Меню відкрите лише на сторінці, де його відкрили — після переходу закривається само
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname
  const setOpen = (v: boolean) => setOpenAt(v ? pathname : null)

  const [progress, setProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)
  const [flying, setFlying] = useState(false)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
      setShowTop(window.scrollY > SHOW_TOP_AFTER)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpenAt(null); mainRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const toTop = () => {
    setFlying(true)
    window.setTimeout(() => setFlying(false), 700)
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  const meters = (progress * WALL_HEIGHT).toFixed(1)
  const items = [
    { key: 'call', href: `tel:${SITE.phone}`, label: t.fab.call, sub: SITE.phoneDisplay, icon: <IconPhone />, color: 'var(--hold-orange)' },
    { key: 'ig', href: SITE.instagram, label: t.fab.instagram, sub: SITE.instagramHandle, icon: <IconInstagram />, color: 'var(--hold-pink)', external: true },
    { key: 'mail', href: `mailto:${SITE.email}`, label: t.fab.email, sub: SITE.email, icon: <IconMail />, color: 'var(--hold-teal)' },
    { key: 'route', to: to('contacts'), label: t.fab.route, sub: t.contacts.address[0], icon: <IconPin />, color: 'var(--hold-violet)' },
  ]

  return (
    <div className={`fab${open ? ' is-open' : ''}`}>
      <button type="button" className="fab__backdrop" tabIndex={-1} aria-hidden="true" onClick={() => setOpen(false)} />

      {/* Маршрут контактів: пункти «виростають» по черзі над кнопкою */}
      <ul id="fab-menu" role="list" className="fab__menu" aria-label={t.fab.contactTitle} inert={!open}>
        {items.map((it, i) => {
          const content = (
            <>
              <span className="fab__item-text"><b>{it.label}</b><small>{it.sub}</small></span>
              <span className="fab__item-icon" style={{ '--c': it.color } as React.CSSProperties}>{it.icon}</span>
            </>
          )
          return (
            <li key={it.key} style={{ '--i': items.length - 1 - i } as React.CSSProperties}>
              {it.to ? (
                <Link to={it.to} className="fab__item" onClick={() => setOpen(false)}>{content}</Link>
              ) : (
                <a href={it.href} className="fab__item" onClick={() => setOpen(false)} {...(it.external ? { target: '_blank', rel: 'noopener' } : {})}>{content}</a>
              )}
            </li>
          )
        })}
      </ul>

      {/* Вгору: кільце-мотузка = пройдена висота */}
      <button
        type="button"
        className={`fab__top${showTop && !open ? ' is-visible' : ''}${flying ? ' is-flying' : ''}`}
        onClick={toTop}
        aria-label={`${t.fab.toTop} (${t.fab.height}: ${meters} м)`}
        tabIndex={showTop && !open ? 0 : -1}
      >
        <svg viewBox="0 0 54 54" className="fab__ring" aria-hidden="true">
          <circle cx="27" cy="27" r="23" className="fab__ring-track" />
          <circle cx="27" cy="27" r="23" className="fab__ring-rope" style={{ strokeDasharray: `${(progress * RING).toFixed(1)} ${RING.toFixed(1)}` }} />
        </svg>
        <svg viewBox="0 0 24 24" className="fab__arrow" aria-hidden="true">
          <path d="M12 19V6M6 11l6-6 6 6" />
        </svg>
        <span className="fab__tip" aria-hidden="true">{t.fab.toTop} · {meters} м</span>
      </button>

      {/* Головна кнопка-зачеп */}
      <button
        ref={mainRef}
        type="button"
        className="fab__main"
        aria-expanded={open}
        aria-controls="fab-menu"
        aria-label={open ? t.fab.close : t.fab.contactTitle}
        onClick={() => setOpen(!open)}
      >
        <span className="fab__hold" aria-hidden="true">
          <span className="fab__icon fab__icon--phone"><IconPhone width={24} height={24} /></span>
          <span className="fab__icon fab__icon--close"><IconClose width={24} height={24} /></span>
          <i className="fab__bolt" />
        </span>
        <span className="fab__label">{open ? t.fab.close : t.fab.contact}</span>
      </button>
    </div>
  )
}
