import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { IMAGES, SITE } from '../content/site'
import { Grade, PageHero, Photo } from '../components/ui'
import { IconExternal, IconMail, IconPhone } from '../components/Icons'
import './pages.css'

export default function Promalp() {
  const { t } = useI18n()
  const p = t.promalp
  usePageMeta(`${t.nav.promalp} — ${t.meta.short}`, p.lead)

  return (
    <>
      <PageHero grade={p.grade} gradeValue="7a" title={p.title} lead={p.lead} />

      <section className="section">
        <div className="container">
          <div className="mosaic" data-reveal="scale">
            {IMAGES.promalp.map((src, i) => <Photo key={src} src={src} alt={`${p.title} — ${i + 1}`} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="stack">
            <div data-reveal><Grade value="18+">{p.requirementsTitle}</Grade></div>
            <h2 className="h2" data-reveal>{p.requirementsTitle}</h2>
            <p className="lead" data-reveal>{p.requirementsText}</p>
            <ul className="holds-list" data-reveal>{p.requirements.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          <div className="stack">
            <h2 className="h2" data-reveal>{p.stepsTitle}</h2>
            <ol role="list" className="steps">
              {p.steps.map((s, i) => (
                <li key={s.title} data-reveal style={{ '--delay': `${i * 80}ms` } as React.CSSProperties}>
                  <div><h3>{s.title}</h3><p className="muted">{s.text}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="stack">
            <h2 className="h2" data-reveal>{p.pricesTitle}</h2>
            <div className="prices">
              {p.prices.map((x) => <div key={x.label} className="price card" data-reveal><span>{x.label}</span><b>{x.value}</b></div>)}
            </div>
            <p className="note" data-reveal>ℹ️ {p.pricesNote}</p>
            <p className="muted" data-reveal>{p.corporate}</p>
          </div>
          <div className="stack">
            <div className="card card--pad stack" data-reveal>
              <h3 className="h3">🌍 {p.irataTitle}</h3>
              <p className="muted">{p.irataText}</p>
            </div>
            <div className="card card--pad stack" data-reveal style={{ '--delay': '100ms' } as React.CSSProperties}>
              <h3 className="h3">{p.contactTitle}</h3>
              <p className="muted">{p.contactPerson}</p>
              <ul role="list" className="contact-lines">
                {SITE.promalp.phones.map((ph) => <li key={ph.href}><a href={`tel:${ph.href}`}><IconPhone /> {ph.display}</a></li>)}
                <li><a href={`mailto:${SITE.promalp.email}`}><IconMail /> {SITE.promalp.email}</a></li>
                <li><a href={SITE.promalp.site} target="_blank" rel="noopener"><IconExternal /> {p.site}: utc-alpindustry.org</a></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
