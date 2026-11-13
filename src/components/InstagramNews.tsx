import { Link } from 'react-router'
import { useI18n, type Lang } from '../i18n'
import { useInstagram, type IgPost } from '../hooks/useInstagram'
import { EVENTS, sortedEvents } from '../content/events'
import { SITE } from '../content/site'
import { Grade } from './ui'
import { EventCard } from './EventCard'
import { IconCalendar, IconExternal, IconInstagram } from './Icons'
import './InstagramNews.css'

const LOCALE: Record<Lang, string> = { uk: 'uk-UA', en: 'en-GB' }
const COUNT = 3

/** Заголовок посту: перший рядок підпису (без хештегів), решта — текст новини */
function splitCaption(caption: string) {
  const clean = caption.replace(/\s+#[\p{L}\p{N}_]+/gu, '').trim()
  const [first, ...rest] = clean.split(/\n+/)
  const title = first.length > 90 ? first.slice(0, 87).trimEnd() + '…' : first
  return { title, text: rest.join(' ').trim() || (first.length > 90 ? first : '') }
}

function PostCard({ post, index }: { post: IgPost; index: number }) {
  const { t, lang } = useI18n()
  const { title, text } = splitCaption(post.caption || t.instagram.title)
  const date = new Date(post.timestamp).toLocaleDateString(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <article className="ig-news card" data-reveal style={{ '--delay': `${index * 80}ms` } as React.CSSProperties}>
      <div className="ig-news__media">
        <img src={post.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        {post.type !== 'IMAGE' && <span className="ig-news__type">{post.type === 'VIDEO' ? `▶ ${t.instagram.video}` : `❐ ${t.instagram.album}`}</span>}
      </div>
      <div className="ig-news__body">
        <div className="ig-news__meta">
          <span className="ig-news__src"><IconInstagram width={14} height={14} /> Instagram</span>
          <span className="event-card__date"><IconCalendar width={14} height={14} /> {date}</span>
        </div>
        <h3 className="ig-news__title">
          <a href={post.permalink} target="_blank" rel="noopener" className="ig-news__link">{title}</a>
        </h3>
        {text && <p className="ig-news__text muted">{text}</p>}
        <span className="ig-news__more">{t.instagram.readMore} <IconExternal width={14} height={14} /></span>
      </div>
    </article>
  )
}

/**
 * «Новини» на головній: 3 останні пости з Instagram.
 * Поки Instagram не підключено (або він недоступний) — 3 останні події клубу.
 */
export function InstagramNews() {
  const { t, to } = useI18n()
  const { ref, status, posts } = useInstagram<HTMLElement>(COUNT)
  const fromIg = status === 'ready'
  const events = sortedEvents(EVENTS.filter((e) => !e.pinned)).slice(0, COUNT)

  return (
    <section ref={ref} className="section" aria-labelledby="news-title">
      <div className="container">
        <div className="events-head">
          <div className="section-head">
            <div data-reveal><Grade value={fromIg ? 'IG' : '★'}>{fromIg ? t.home.newsGrade : t.home.eventsGrade}</Grade></div>
            <h2 id="news-title" className="h2" data-reveal>{fromIg ? t.home.newsTitle : t.home.eventsTitle}</h2>
            {fromIg && <p className="lead" data-reveal>{t.home.newsText}</p>}
          </div>
          <div className="ig-news__actions" data-reveal>
            {fromIg && (
              <a href={SITE.instagram} target="_blank" rel="noopener" className="btn btn--ghost"><IconInstagram /> {t.home.newsAll}</a>
            )}
            <Link to={to('events')} className="btn btn--ghost">{t.home.eventsAll} <span className="arrow">→</span></Link>
          </div>
        </div>

        <div className="events-grid" aria-busy={status === 'idle'}>
          {status === 'idle' && Array.from({ length: COUNT }, (_, i) => <div key={i} className="ig-news ig-news--skeleton card" aria-hidden="true" />)}
          {status === 'ready' && posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
          {status === 'off' && events.map((e, i) => <EventCard key={e.slug} event={e} index={i} />)}
        </div>
      </div>
    </section>
  )
}
