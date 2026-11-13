/**
 * Модель даних обліку занять. Спільна для адмінки (браузер) і серверної функції netlify/functions/admin.mts.
 * Дати — рядки YYYY-MM-DD (місцевий час клубу), гроші — гривні (цілі числа).
 */

export type Group = 'adult' | 'kids'
export const GROUPS: Group[] = ['adult', 'kids']
export const GROUP_LABEL: Record<Group, string> = { adult: 'Дорослі', kids: 'Діти' }

/** Абонемент: N занять до певної дати */
export type Pass = {
  id: string
  sessions: number // оплачено занять
  used: number // використано (рахує сервер за відмітками)
  from: string
  until: string
  amount: number // скільки заплачено
}

export type Payment = { id: string; date: string; amount: number; kind: 'pass' | 'other'; note?: string }

export type Member = {
  id: string
  name: string
  group: Group
  phone?: string
  note?: string
  pass?: Pass | null
  payments: Payment[]
  createdAt: string
  lastVisit?: string
}

/** Як оплачене відвідування: з абонемента, разово (сума), безкоштовно (пробне тощо) */
export type PayKind = 'pass' | 'cash' | 'free'
export const PAY_LABEL: Record<PayKind, string> = { pass: 'Абонемент', cash: 'Разово', free: 'Безкоштовно' }

export type Visit = { pay: PayKind; amount: number; passId?: string; name: string }

/** Одне заняття однієї групи */
export type Session = { date: string; group: Group; visits: Record<string, Visit>; updatedAt?: string }

export type Settings = {
  days: number[] // дні тижня занять: 0 — неділя … 6 — субота
  time: Record<Group, string>
  price: Record<Group, number> // разове заняття
  passSessions: number
  passDays: number
  passPrice: Record<Group, number>
}

export const DEFAULT_SETTINGS: Settings = {
  days: [2, 4, 6], // вівторок, четвер, субота
  time: { adult: '19:00', kids: '17:00' },
  price: { adult: 200, kids: 150 },
  passSessions: 8,
  passDays: 30,
  passPrice: { adult: 1200, kids: 1000 },
}

/* ---------- Дати ---------- */
const pad = (n: number) => String(n).padStart(2, '0')
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const today = () => toISO(new Date())
export const addDays = (s: string, n: number) => {
  const d = fromISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}
export const weekday = (s: string) => fromISO(s).getDay()
export const daysBetween = (a: string, b: string) => Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000)
export const fmtDate = (s: string, opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) =>
  fromISO(s).toLocaleDateString('uk-UA', opts)
export const WEEKDAYS_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

/** Найближчий день занять від дати в напрямку dir (+1 / -1), не включаючи саму дату */
export function nextTrainingDay(from: string, dir: 1 | -1, days: number[]) {
  if (!days.length) return addDays(from, dir)
  let d = from
  for (let i = 0; i < 14; i++) {
    d = addDays(d, dir)
    if (days.includes(weekday(d))) return d
  }
  return addDays(from, dir)
}

/* ---------- Абонемент ---------- */
export type PassState = 'none' | 'ok' | 'low' | 'expired'
export type PassInfo = { state: PassState; left: number; daysLeft: number }

/** Стан абонемента на дату: ok — все добре, low — лишилось ≤1 заняття або ≤3 дні, expired — скінчився */
export function passInfo(m: Pick<Member, 'pass'>, date = today()): PassInfo {
  const p = m.pass
  if (!p) return { state: 'none', left: 0, daysLeft: 0 }
  const left = p.sessions - p.used
  const daysLeft = daysBetween(date, p.until)
  if (left <= 0 || daysLeft < 0 || date < p.from) return { state: 'expired', left: Math.max(0, left), daysLeft }
  if (left <= 1 || daysLeft <= 3) return { state: 'low', left, daysLeft }
  return { state: 'ok', left, daysLeft }
}

/** Відмітка за замовчуванням: є чинний абонемент — списуємо з нього, інакше разова оплата за тарифом */
export function defaultVisit(m: Member, date: string, s: Settings): Visit {
  const info = passInfo(m, date)
  if (m.pass && info.state !== 'expired') return { pay: 'pass', amount: 0, passId: m.pass.id, name: m.name }
  return { pay: 'cash', amount: s.price[m.group], name: m.name }
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
export const money = (n: number) => `${n.toLocaleString('uk-UA')} ₴`
