import { useState } from 'react'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { SITE } from '../content/site'
import { PageHero } from '../components/ui'
import { IconExternal, IconInstagram, IconMail, IconPhone, IconPin } from '../components/Icons'
import './pages.css'
import './Contacts.css'

function CopyButton({ value }: { value: string }) {
  const { t } = useI18n()
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className={`copy${done ? ' is-done' : ''}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1600) } catch { /* без доступу до буфера */ }
      }}
    >
      {done ? t.contacts.copied : t.contacts.copy}
    </button>
  )
}

export default function Contacts() {
  const { t } = useI18n()
  const c = t.contacts
  usePageMeta(`${t.nav.contacts} — ${t.meta.short}`, c.lead)
  const [showMap, setShowMap] = useState(false)

  return (
    <>
      <PageHero grade={c.grade} gradeValue="📍" title={c.title} lead={c.lead} />

      <section className="section">
        <div className="container contacts">
          <div className="contact-cards">
            <div className="contact-card card" data-reveal>
              <span className="contact-card__icon" style={{ '--c': 'var(--hold-orange)' } as React.CSSProperties}><IconPhone /></span>
              <span className="contact-card__label">{c.phone}</span>
              <a href={`tel:${SITE.phone}`} className="contact-card__value">{SITE.phoneDisplay}</a>
              <CopyButton value={SITE.phoneDisplay} />
            </div>
            <div className="contact-card card" data-reveal style={{ '--delay': '80ms' } as React.CSSProperties}>
              <span className="contact-card__icon" style={{ '--c': 'var(--hold-teal)' } as React.CSSProperties}><IconMail /></span>
              <span className="contact-card__label">{c.email}</span>
              <a href={`mailto:${SITE.email}`} className="contact-card__value">{SITE.email}</a>
              <CopyButton value={SITE.email} />
            </div>
            <div className="contact-card card" data-reveal style={{ '--delay': '160ms' } as React.CSSProperties}>
              <span className="contact-card__icon" style={{ '--c': 'var(--hold-violet)' } as React.CSSProperties}><IconInstagram /></span>
              <span className="contact-card__label">Instagram</span>
              <a href={SITE.instagram} target="_blank" rel="noopener" className="contact-card__value">{SITE.instagramHandle}</a>
            </div>
          </div>

          <div className="split">
            <div className="card card--pad stack" data-reveal>
              <h2 className="h3"><IconPin /> {c.addressTitle}</h2>
              <address className="address">{c.address.map((l) => <span key={l}>{l}</span>)}</address>
              <div className="map">
                {showMap ? (
                  <iframe title={c.addressTitle} src={SITE.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                ) : (
                  <button type="button" className="map__placeholder wall-dots" onClick={() => setShowMap(true)}>
                    <span className="map__pin"><IconPin width={28} height={28} /></span>
                    <span className="btn btn--primary">{c.mapButton}</span>
                  </button>
                )}
              </div>
              <a href={SITE.mapsUrl} target="_blank" rel="noopener" className="btn btn--ghost" style={{ justifySelf: 'start' }}><IconExternal /> {c.mapOpen}</a>
            </div>

            <div className="card card--pad stack" data-reveal style={{ '--delay': '100ms' } as React.CSSProperties}>
              <h2 className="h3">🚌 {c.transitTitle}</h2>
              <ol role="list" className="transit">
                {c.transit.map((r) => (
                  <li key={r.from}>
                    <b>{r.from}</b>
                    <span>{r.how}</span>
                    <small>→ {r.stop}</small>
                  </li>
                ))}
              </ol>
              <p className="note">ℹ️ {c.transitNote}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
