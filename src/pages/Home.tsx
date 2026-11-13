import { Link } from 'react-router'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { SITE, IMAGES } from '../content/site'
import { WallHero } from '../components/WallHero'
import { Counter, Grade, Marquee, Photo } from '../components/ui'
import { Schedule } from '../components/Schedule'
import { InstagramNews } from '../components/InstagramNews'
import { IconArrow, IconPhone } from '../components/Icons'
import './Home.css'

const PATH_COLORS = ['var(--hold-lime)', 'var(--hold-teal)', 'var(--hold-violet)', 'var(--hold-orange)']

export default function Home() {
  const { t, to } = useI18n()
  usePageMeta(t.meta.siteName, t.meta.description)

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="hero wall-dots">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="hero__eyebrow" data-reveal>{t.home.eyebrow}</p>
            <h1 className="display hero__title">
              <span className="hero__line" data-reveal style={{ '--delay': '80ms' } as React.CSSProperties}>{t.home.title1}</span>
              <span className="hero__line hero__line--accent" data-reveal style={{ '--delay': '180ms' } as React.CSSProperties}>{t.home.title2}</span>
            </h1>
            <p className="lead" data-reveal style={{ '--delay': '280ms' } as React.CSSProperties}>{t.home.text}</p>
            <div className="hero__actions" data-reveal style={{ '--delay': '380ms' } as React.CSSProperties}>
              <a href={`tel:${SITE.phone}`} className="btn btn--primary">{t.home.ctaPrimary} <span className="arrow">→</span></a>
              <Link to={to('training')} className="btn btn--ghost">{t.home.ctaSecondary}</Link>
            </div>
          </div>
          <div className="hero__visual" data-reveal="scale" style={{ '--delay': '150ms' } as React.CSSProperties}>
            <WallHero />
          </div>
        </div>
        <p className="hero__hint" aria-hidden="true"><span className="hero__mouse" />{t.home.scrollHint}</p>
      </section>

      <Marquee items={t.home.marquee} />

      {/* ---------- ФАКТИ ---------- */}
      <section className="section">
        <div className="container facts">
          <div className="facts__copy">
            <div data-reveal><Grade value="15m">{t.about.wallGrade}</Grade></div>
            <h2 className="h2" data-reveal>{t.home.factsTitle}</h2>
            <div className="facts__grid">
              {t.home.facts.map((f, i) => (
                <div key={f.label} data-reveal style={{ '--delay': `${i * 90}ms` } as React.CSSProperties}>
                  <Counter value={f.value} suffix={f.suffix} label={f.label} />
                </div>
              ))}
            </div>
            <Link to={to('about')} className="btn btn--ghost" data-reveal>{t.nav.about} <span className="arrow">→</span></Link>
          </div>
          <div className="facts__photo" data-reveal="scale">
            <Photo src={IMAGES.wall} alt={t.about.wallTitle} ratio="200 / 241" />
            <span className="facts__tag">{t.about.wallTitle}</span>
          </div>
        </div>
      </section>

      {/* ---------- МАРШРУТИ ---------- */}
      <section className="section paths">
        <div className="container">
          <div className="section-head">
            <div data-reveal><Grade value="4a→7a">{t.home.pathsGrade}</Grade></div>
            <h2 className="h2" data-reveal>{t.home.pathsTitle}</h2>
          </div>
          <ol role="list" className="paths__list">
            {t.home.paths.map((p, i) => (
              <li key={p.title} className="path card" data-reveal style={{ '--delay': `${i * 90}ms`, '--c': PATH_COLORS[i] } as React.CSSProperties}>
                <span className="path__grade">{p.grade}</span>
                <h3 className="h3">{p.title}</h3>
                <p className="muted">{p.text}</p>
                <Link to={to(p.to)} className="path__link">{p.cta} <IconArrow width={16} height={16} /></Link>
                <svg className="path__route" viewBox="0 0 60 120" aria-hidden="true">
                  <path d="M30 115 C10 95 50 80 28 60 S45 25 30 5" />
                </svg>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- КУРС + РОЗКЛАД ---------- */}
      <section className="section">
        <div className="container course">
          <div className="course__card card card--pad" data-reveal>
            <Grade value="4a">{t.home.courseGrade}</Grade>
            <h2 className="h2">{t.home.courseTitle}</h2>
            <p className="muted">{t.home.courseText}</p>
            <div className="course__price">
              <strong>{t.home.coursePrice}</strong>
              <span>{t.home.coursePriceNote}</span>
            </div>
            <a href={`tel:${SITE.phone}`} className="btn btn--primary"><IconPhone /> {t.home.courseCta}</a>
          </div>
          <div className="course__schedule card card--pad" data-reveal style={{ '--delay': '120ms' } as React.CSSProperties}>
            <h3 className="h3">{t.training.climbingTitle}</h3>
            <p className="muted">{t.training.coach}</p>
            <Schedule />
          </div>
        </div>
      </section>

      {/* ---------- НОВИНИ: 3 останні пости з Instagram (або події клубу) ---------- */}
      <InstagramNews />

      {/* ---------- ЗАКЛИК ---------- */}
      <section className="section">
        <div className="container">
          <div className="cta card" data-reveal="scale">
            <div className="cta__rope" aria-hidden="true" />
            <h2 className="h2">{t.home.ctaTitle}</h2>
            <p className="lead">{t.home.ctaText}</p>
            <a href={`tel:${SITE.phone}`} className="btn btn--primary cta__btn"><IconPhone /> {SITE.phoneDisplay}</a>
          </div>
        </div>
      </section>
    </>
  )
}
