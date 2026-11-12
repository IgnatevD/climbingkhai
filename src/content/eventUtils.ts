import type { Lang } from '../i18n'
import type { ClubEvent, EventCategory } from './events'

const LOCALE: Record<Lang, string> = { uk: 'uk-UA', en: 'en-GB' }
export const CATEGORY_COLOR: Record<EventCategory, string> = {
  course: 'var(--hold-lime)',
  competition: 'var(--hold-orange)',
  trip: 'var(--hold-teal)',
  club: 'var(--hold-pink)',
  promalp: 'var(--hold-violet)',
  tips: 'var(--hold-yellow)',
}

/** «23 грудня 2018», «6–8 квітня 2018», «серпень 2015» */
export function formatEventDate(e: ClubEvent, lang: Lang): string | null {
  if (!e.date) return null
  const loc = LOCALE[lang]
  const d = new Date(`${e.date}T12:00:00`)
  if (e.approx) return d.toLocaleDateString(loc, { month: 'long', year: 'numeric' })
  const full = (x: Date) => x.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })
  if (!e.dateEnd) return full(d)
  const end = new Date(`${e.dateEnd}T12:00:00`)
  if (d.getMonth() === end.getMonth() && d.getFullYear() === end.getFullYear()) {
    return `${d.getDate()}–${full(end)}`
  }
  return `${d.toLocaleDateString(loc, { day: 'numeric', month: 'long' })} – ${full(end)}`
}
