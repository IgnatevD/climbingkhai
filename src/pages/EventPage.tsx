import { Link, useParams } from 'react-router'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { getEvent, sortedEvents, EVENTS, type Block } from '../content/events'
import { Photo } from '../components/ui'
import { EventCard } from '../components/EventCard'
import { formatEventDate, CATEGORY_COLOR } from '../content/eventUtils'
import { IconCalendar, IconExternal } from '../components/Icons'
import NotFound from './NotFound'
import './pages.css'
import './EventPage.css'

function Body({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if ('p' in b) return <p key={i}>{b.p}</p>
        if ('ul' in b) return <ul key={i} className="holds-list">{b.ul.map((x) => <li key={x}>{x}</li>)}</ul>
        return (
          <dl key={i} className="event-rows">
            {b.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        )
      })}
    </>
  )
}

export default function EventPage() {
  const { slug = '' } = useParams()
  const { t, to, pick, lang } = useI18n()
  const event = getEvent(slug)
  usePageMeta(event ? `${pick(event.title)} — ${t.meta.short}` : t.notFound.title, event ? pick(event.summary) : undefined)
  if (!event) return <NotFound />

  const date = formatEventDate(event, lang)
  const more = sortedEvents(EVENTS.filter((e) => e.slug !== slug && e.category === event.category)).slice(0, 3)

  return (
    <>
      <article className="event-page" style={{ '--cat': CATEGORY_COLOR[event.category] } as React.CSSProperties}>
        <header className="event-page__head wall-dots">
          <div className="container event-page__head-inner">
            <Link to={to('events')} className="event-page__back" data-reveal>← {t.events.back}</Link>
            <div className="event-page__meta" data-reveal>
              <span className="event-card__cat">{t.events.categories[event.category]}</span>
              {date && <span className="event-card__date"><IconCalendar width={14} height={14} /> {date}</span>}
            </div>
            <h1 className="display event-page__title" data-reveal>{pick(event.title)}</h1>
            <p className="lead" data-reveal>{pick(event.summary)}</p>
          </div>
        </header>

        <div className={`container event-page__body${event.image ? ' has-img' : ''}`}>
          {event.image && <Photo src={event.image} alt="" className="event-page__img" />}
          <div className="event-page__text" data-reveal>
            <Body blocks={pick(event.body)} />
            {event.source && (
              <a href={event.source} target="_blank" rel="noopener" className="btn btn--ghost event-page__source">
                <IconExternal /> {t.events.original}
              </a>
            )}
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="h2" style={{ marginBottom: 'var(--s-5)' }}>{t.events.categories[event.category]}</h2>
            <div className="events-related">{more.map((e, i) => <EventCard key={e.slug} event={e} index={i} />)}</div>
          </div>
        </section>
      )}
    </>
  )
}
