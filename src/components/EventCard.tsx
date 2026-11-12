import { Link } from 'react-router'
import { useI18n } from '../i18n'
import type { ClubEvent } from '../content/events'
import { CATEGORY_COLOR, formatEventDate } from '../content/eventUtils'
import { Photo } from './ui'
import { IconArrow, IconCalendar } from './Icons'
import './EventCard.css'

export function EventCard({ event, index = 0 }: { event: ClubEvent; index?: number }) {
  const { lang, t, to, pick } = useI18n()
  const date = formatEventDate(event, lang)
  return (
    <article
      className="event-card card"
      data-reveal
      style={{ '--delay': `${(index % 3) * 80}ms`, '--cat': CATEGORY_COLOR[event.category] } as React.CSSProperties}
    >
      {event.image && <Photo src={event.image} alt="" className="event-card__img" ratio="16 / 9" />}
      <div className="event-card__body">
        <div className="event-card__meta">
          <span className="event-card__cat">{t.events.categories[event.category]}</span>
          {date && <span className="event-card__date"><IconCalendar width={14} height={14} /> {date}</span>}
        </div>
        <h3 className="event-card__title">
          <Link to={to(`events/${event.slug}`)} className="event-card__link">{pick(event.title)}</Link>
        </h3>
        <p className="muted">{pick(event.summary)}</p>
        <span className="event-card__more">{t.events.readMore} <IconArrow width={16} height={16} /></span>
      </div>
    </article>
  )
}
