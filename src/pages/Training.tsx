import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { SITE } from '../content/site'
import { Grade, PageHero } from '../components/ui'
import { Schedule } from '../components/Schedule'
import { IconPhone } from '../components/Icons'
import './pages.css'
import './Training.css'

export default function Training() {
  const { t } = useI18n()
  const tr = t.training
  usePageMeta(`${t.nav.training} — ${t.meta.short}`, tr.lead)

  return (
    <>
      <PageHero grade={tr.grade} gradeValue="5c" title={tr.title} lead={tr.lead}>
        <a href={`tel:${SITE.phone}`} className="btn btn--primary" data-reveal><IconPhone /> {SITE.phoneDisplay}</a>
      </PageHero>

      {/* Скелелазіння */}
      <section className="section">
        <div className="container split split--wide">
          <div className="card card--pad stack" data-reveal>
            <h2 className="h2">{tr.climbingTitle}</h2>
            <p className="muted">{tr.coach} · {tr.booking}: <a href={`tel:${SITE.phone}`} className="accent">{SITE.phoneDisplay}</a></p>
            <Schedule />
          </div>
          <div className="card card--pad stack" data-reveal style={{ '--delay': '100ms' } as React.CSSProperties}>
            <h3 className="h3">{tr.needTitle}</h3>
            <ul className="holds-list">{tr.need.map((n) => <li key={n}>{n}</li>)}</ul>
            <div className="shoe" aria-hidden="true">👟</div>
          </div>
        </div>
      </section>

      {/* Базовий курс */}
      <section className="section" id="course">
        <div className="container split">
          <div className="stack">
            <div data-reveal><Grade value="4a">{t.home.courseGrade}</Grade></div>
            <h2 className="h2" data-reveal>{tr.courseTitle}</h2>
            <ul className="holds-list" data-reveal>{tr.courseItems.map((n) => <li key={n}>{n}</li>)}</ul>
            <p className="muted" data-reveal>{tr.courseStart}</p>
          </div>
          <div className="course-facts" data-reveal="scale">
            {tr.courseFacts.map((f, i) => (
              <div key={f.label} className="course-fact card" style={{ '--i': i } as React.CSSProperties}>
                <span>{f.label}</span>
                <b>{f.value}</b>
              </div>
            ))}
            <a href={`tel:${SITE.phone}`} className="btn btn--primary course-facts__cta"><IconPhone /> {t.home.courseCta}</a>
          </div>
        </div>
        <div className="container"><p className="note" data-reveal>ℹ️ {tr.priceNote}</p></div>
      </section>

      {/* Альпінізм */}
      <section className="section" id="alpinism">
        <div className="container">
          <div className="section-head">
            <div data-reveal><Grade value="6b">{tr.alpTitle}</Grade></div>
            <h2 className="h2" data-reveal>{tr.alpTitle}</h2>
            <p className="lead" data-reveal>{tr.alpText}</p>
            <p className="note" data-reveal>⏸ {tr.alpStatus}</p>
          </div>
          <h3 className="h3" data-reveal style={{ marginBottom: 'var(--s-4)' }}>{tr.alpProgramTitle}</h3>
          <ol role="list" className="knots">
            {tr.alpProgram.map((p, i) => (
              <li key={p} className="knot card" data-reveal style={{ '--delay': `${(i % 3) * 70}ms` } as React.CSSProperties}>
                <svg viewBox="0 0 40 40" className="knot__icon" aria-hidden="true">
                  <path d="M4 28 C14 28 12 10 22 10 S30 30 20 30 S10 16 36 14" />
                </svg>
                <span>{p}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
