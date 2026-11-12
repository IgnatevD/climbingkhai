import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { localize, stripLang, useI18n, type Lang } from '../i18n'
import { SITE } from '../content/site'
import { ThemeToggle } from './ThemeToggle'
import { Carabiner, IconInstagram, IconPhone } from './Icons'
import './Header.css'

const NAV = ['about', 'training', 'promalp', 'events', 'gallery', 'contacts'] as const

function LangSwitch() {
  const { lang, t } = useI18n()
  const { pathname, search, hash } = useLocation()
  const base = stripLang(pathname)
  const item = (l: Lang, label: string) => (
    <Link
      to={localize(l, base) + search + hash}
      className="lang__item"
      aria-current={lang === l ? 'true' : undefined}
      hrefLang={l}
      lang={l}
    >
      {label}
    </Link>
  )
  return (
    <div className="lang" role="group" aria-label={t.nav.langLabel} data-lang={lang}>
      <span className="lang__pill" aria-hidden="true" />
      {item('uk', 'UA')}
      {item('en', 'EN')}
    </div>
  )
}

export function Header() {
  const { t, to } = useI18n()
  const { pathname } = useLocation()
  // Меню відкрите лише на тій сторінці, де його відкрили — після переходу закривається само
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname
  const setOpen = (v: boolean | ((o: boolean) => boolean)) => {
    const next = typeof v === 'function' ? v(open) : v
    setOpenAt(next ? pathname : null)
  }
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenAt(null)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="header__bar container">
        <Link to={to('/')} className="brand" aria-label={t.meta.siteName}>
          <Carabiner className="brand__mark" />
          <span className="brand__text">
            <b>Climbing</b>
            <span>KhAI</span>
          </span>
        </Link>

        <nav id="site-nav" className="nav" aria-label={t.nav.menu}>
          <ul role="list" className="nav__list">
            {NAV.map((key, i) => (
              <li key={key} style={{ '--i': i } as React.CSSProperties}>
                <NavLink to={to(key)} className="nav__link">
                  <span className="nav__num">{String(i + 1).padStart(2, '0')}</span>
                  {t.nav[key]}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="nav__extra">
            <a href={`tel:${SITE.phone}`} className="btn btn--primary"><IconPhone /> {SITE.phoneDisplay}</a>
            <a href={SITE.instagram} className="btn btn--ghost" target="_blank" rel="noopener"><IconInstagram /> {SITE.instagramHandle}</a>
          </div>
        </nav>

        <div className="header__tools">
          <LangSwitch />
          <ThemeToggle />
          <a href={`tel:${SITE.phone}`} className="header__cta btn btn--primary">{t.nav.signUp}</a>
          <button
            type="button"
            className="burger"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? t.nav.close : t.nav.menu}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  )
}
