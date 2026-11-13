import { Link } from 'react-router'
import { useI18n } from '../i18n'
import { SITE } from '../content/site'
import { Carabiner, IconInstagram, IconMail, IconPhone, IconPin } from './Icons'
import { FooterSummit, RIDGE_FAR_D, PEAK } from './FooterSummit'
import './Footer.css'

const YEAR = new Date().getFullYear()
const NAV = ['about', 'training', 'promalp', 'events', 'gallery', 'contacts'] as const

export function Footer() {
  const { t, to } = useI18n()
  return (
    <footer className="footer">
      {/* Гірський хребет — «вершина» сторінки; на неї виходить скелелаз */}
      <FooterSummit>
        <svg className="footer__ridge" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
          <path className="ridge-far" d={RIDGE_FAR_D} />
          <path className="ridge-near" d="M0 160 L0 130 L160 100 L260 126 L380 88 L520 132 L640 104 L760 80 L900 130 L1040 98 L1180 128 L1300 104 L1440 124 L1440 160Z" />
          <g className="ridge-flag" transform={`translate(${PEAK[0]} ${PEAK[1]})`}>
            <path d="M0 0 V-34" stroke="currentColor" strokeWidth="3" />
            <path d="M0 -34 L22 -27 L0 -20Z" fill="var(--accent)" />
          </g>
        </svg>
      </FooterSummit>

      <div className="footer__body">
        <div className="container footer__grid">
          <div className="footer__brand">
            <Link to={to('/')} className="footer__logo"><Carabiner /> {t.meta.short}</Link>
            <p className="muted">{t.footer.tagline}</p>
            <a href={SITE.instagram} target="_blank" rel="noopener" className="footer__social"><IconInstagram /> {SITE.instagramHandle}</a>
          </div>

          <nav aria-label={t.footer.nav}>
            <h2 className="footer__title">{t.footer.nav}</h2>
            <ul role="list" className="footer__links">
              {NAV.map((k) => <li key={k}><Link to={to(k)}>{t.nav[k]}</Link></li>)}
            </ul>
          </nav>

          <div>
            <h2 className="footer__title">{t.footer.contacts}</h2>
            <ul role="list" className="footer__links footer__contacts">
              <li><a href={`tel:${SITE.phone}`}><IconPhone /> {SITE.phoneDisplay}</a></li>
              <li><a href={`mailto:${SITE.email}`}><IconMail /> {SITE.email}</a></li>
              <li><Link to={to('contacts')}><IconPin /> {t.contacts.address[0]}</Link></li>
            </ul>
          </div>
        </div>

        <div className="container footer__bottom">
          <span>© {YEAR} {t.footer.rights}</span>
          <button type="button" className="footer__top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t.footer.top}</button>
        </div>
      </div>
    </footer>
  )
}
