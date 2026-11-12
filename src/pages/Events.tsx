import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { EVENTS, sortedEvents, type EventCategory } from '../content/events'
import { PageHero } from '../components/ui'
import { EventCard } from '../components/EventCard'
import { CATEGORY_COLOR } from '../content/eventUtils'
import './pages.css'
import './Events.css'

const CATS = Object.keys(CATEGORY_COLOR) as EventCategory[]

export default function Events() {
  const { t } = useI18n()
  usePageMeta(`${t.nav.events} — ${t.meta.short}`, t.events.lead)
  const [params, setParams] = useSearchParams()
  const active = (params.get('c') as EventCategory | null) ?? null

  const list = useMemo(() => sortedEvents(active ? EVENTS.filter((e) => e.category === active) : EVENTS), [active])
  const counts = useMemo(() => Object.fromEntries(CATS.map((c) => [c, EVENTS.filter((e) => e.category === c).length])), [])

  // Групуємо за роками — як «пітчі» довгого маршруту
  const byYear = useMemo(() => {
    const map = new Map<string, typeof list>()
    list.forEach((e) => {
      const y = e.pinned || !e.date ? '★' : e.date.slice(0, 4)
      map.set(y, [...(map.get(y) ?? []), e])
    })
    return [...map.entries()]
  }, [list])

  const select = (c: EventCategory | null) => setParams(c ? { c } : {}, { replace: true, preventScrollReset: true })

  return (
    <>
      <PageHero grade={t.events.grade} gradeValue="★" title={t.events.title} lead={t.events.lead}>
        <div className="chips" role="group" aria-label={t.events.grade} data-reveal>
          <button type="button" className="chip" aria-pressed={!active} onClick={() => select(null)}>
            {t.events.all} <small>{EVENTS.length}</small>
          </button>
          {CATS.filter((c) => counts[c]).map((c) => (
            <button key={c} type="button" className="chip chip--cat" style={{ '--cat': CATEGORY_COLOR[c] } as React.CSSProperties} aria-pressed={active === c} onClick={() => select(c)}>
              {t.events.categories[c]} <small>{counts[c]}</small>
            </button>
          ))}
        </div>
      </PageHero>

      <section className="section">
        <div className="container timeline">
          {byYear.map(([year, items]) => (
            <div key={year} className="timeline__year">
              <h2 className="timeline__label" data-reveal="left"><span>{year}</span></h2>
              <div className="timeline__items">
                {items.map((e, i) => <EventCard key={e.slug} event={e} index={i} />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
