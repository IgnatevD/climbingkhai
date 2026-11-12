import { Link } from 'react-router'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { IMAGES } from '../content/site'
import { Grade, PageHero, Photo } from '../components/ui'
import './pages.css'

const COLORS = ['var(--hold-orange)', 'var(--hold-teal)', 'var(--hold-violet)', 'var(--hold-yellow)']

export default function About() {
  const { t, to } = useI18n()
  const a = t.about
  usePageMeta(`${t.nav.about} — ${t.meta.short}`, a.lead)

  return (
    <>
      <PageHero grade={a.grade} gradeValue="5a" title={a.title} lead={a.lead} />

      <section className="section">
        <div className="container split">
          <div className="stack">
            <div data-reveal><Grade value="15m">{a.wallGrade}</Grade></div>
            <h2 className="h2" data-reveal>{a.wallTitle}</h2>
            <p className="lead" data-reveal>{a.wallText}</p>
            <ul role="list" className="specs card card--pad" data-reveal>
              {a.specs.map((s) => <li key={s.label}><span>{s.label}</span><b>{s.value}</b></li>)}
            </ul>
          </div>
          <div data-reveal="scale" style={{ maxWidth: 380, justifySelf: 'center', width: '100%' }}>
            <Photo src={IMAGES.wall} alt={a.wallTitle} ratio="200 / 241" className="about-wall" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div data-reveal><Grade value="6a">{a.disciplinesGrade}</Grade></div>
            <h2 className="h2" data-reveal>{a.disciplinesTitle}</h2>
          </div>
          <div className="tiles">
            {a.disciplines.map((d, i) => (
              <div key={d.title} className="tile card" data-reveal style={{ '--delay': `${i * 80}ms`, '--c': COLORS[i] } as React.CSSProperties}>
                <span className="tile__icon" aria-hidden="true" />
                <h3 className="h3">{d.title}</h3>
                <p className="muted">{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div data-reveal><Grade value="7a">{a.mentorGrade}</Grade></div>
            <h2 className="h2" data-reveal>{a.mentorTitle}</h2>
          </div>
          <article className="mentor card card--pad" data-reveal>
            <Photo src={IMAGES.mentor} alt={a.mentorName} ratio="150 / 175" className="mentor__photo" />
            <div className="stack">
              <div>
                <h3 className="h3">{a.mentorName}</h3>
                <p className="muted">{a.mentorRole}</p>
              </div>
              <ul className="holds-list">{a.mentorFacts.map((f) => <li key={f}>{f}</li>)}</ul>
              <Link to={to('training')} className="btn btn--primary" style={{ justifySelf: 'start' }}>{t.nav.training} <span className="arrow">→</span></Link>
            </div>
          </article>
        </div>
      </section>
    </>
  )
}
