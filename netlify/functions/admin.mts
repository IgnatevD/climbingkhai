/**
 * API адмінки (облік груп і відвідувань): /api/admin/*
 *
 * Доступ: логін і пароль із змінних середовища Netlify
 *   ADMIN_LOGIN + ADMIN_PASSWORD           — один обліковий запис, або
 *   ADMIN_USERS="anna:пароль1;oleg:пароль2" — кілька тренерів.
 *   ADMIN_SECRET (необов'язково)           — ключ підпису сесій; без нього похідний від паролів
 *                                             (зміна пароля автоматично розлогінює всіх).
 * Сесія — підписаний HttpOnly-cookie на 30 днів. Після 8 невдалих спроб входу з IP — пауза 15 хв.
 *
 * Дані — у Netlify Blobs (сховище "club"):
 *   members        — { list: Member[] }
 *   settings       — Settings
 *   s/<дата>/<група> — Session (відмітки одного заняття)
 * Записи з перевіркою ETag, тож двоє тренерів одночасно не затруть зміни одне одного.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'
import {
  DEFAULT_SETTINGS, GROUPS, uid,
  type Group, type Member, type PayKind, type Session, type Settings, type Visit,
} from '../../src/admin/model'

export const config: Config = { path: '/api/admin/*' }

const COOKIE = 'adm'
const SESSION_DAYS = 30
const MAX_FAILS = 8
const LOCK_MS = 15 * 60 * 1000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const store = () => getStore({ name: 'club', consistency: 'strong' })

/* ---------- Відповіді ---------- */
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex', ...headers },
  })
const fail = (status: number, error: string) => json({ error }, status)

/* ---------- Облікові записи й сесії ---------- */
function users(): Record<string, string> {
  const map: Record<string, string> = {}
  const multi = Netlify.env.get('ADMIN_USERS')
  if (multi) {
    for (const pair of multi.split(/[;\n]/)) {
      const i = pair.indexOf(':')
      if (i > 0) map[pair.slice(0, i).trim()] = pair.slice(i + 1).trim()
    }
  }
  const login = Netlify.env.get('ADMIN_LOGIN')
  const password = Netlify.env.get('ADMIN_PASSWORD')
  if (login && password) map[login.trim()] = password
  return map
}

function secret(u: Record<string, string>) {
  return Netlify.env.get('ADMIN_SECRET') || createHash('sha256').update(JSON.stringify(u)).digest('hex')
}

const b64 = (s: string) => Buffer.from(s).toString('base64url')
const sign = (data: string, key: string) => createHmac('sha256', key).update(data).digest('base64url')

function safeEqual(a: string, b: string) {
  const x = createHash('sha256').update(a).digest()
  const y = createHash('sha256').update(b).digest()
  return timingSafeEqual(x, y)
}

function makeToken(user: string, key: string) {
  const payload = b64(JSON.stringify({ u: user, exp: Date.now() + SESSION_DAYS * 86400000 }))
  return `${payload}.${sign(payload, key)}`
}

function readUser(req: Request): string | null {
  const u = users()
  if (!Object.keys(u).length) return null
  const raw = req.headers.get('cookie')?.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
  if (!raw) return null
  const [payload, sig] = raw.split('.')
  if (!payload || !sig || !safeEqual(sig, sign(payload, secret(u)))) return null
  try {
    const { u: user, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { u: string; exp: number }
    return exp > Date.now() && user in u ? user : null
  } catch {
    return null
  }
}

const cookie = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`

/* ---------- Запис із перевіркою ETag ---------- */
async function mutate<T>(key: string, init: () => T, fn: (cur: T) => T | Promise<T>): Promise<T> {
  const s = store()
  for (let attempt = 0; attempt < 6; attempt++) {
    const got = await s.getWithMetadata(key, { type: 'json' })
    const cur = got ? (got.data as T) : init()
    const next = await fn(structuredClone(cur))
    const res = got?.etag ? await s.setJSON(key, next, { onlyIfMatch: got.etag }) : await s.setJSON(key, next, { onlyIfNew: true })
    if (res.modified) return next
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120))
  }
  throw new Error('Конфлікт запису, спробуйте ще раз')
}

type MembersDoc = { list: Member[] }
const loadMembers = async () => ((await store().get('members', { type: 'json' })) as MembersDoc | null)?.list ?? []
const loadSettings = async () => ({ ...DEFAULT_SETTINGS, ...(((await store().get('settings', { type: 'json' })) as Settings | null) ?? {}) })
const mutateMembers = (fn: (list: Member[]) => Member[] | void) =>
  mutate<MembersDoc>('members', () => ({ list: [] }), (doc) => ({ list: fn(doc.list) ?? doc.list }))

/* ---------- Перевірка вхідних даних ---------- */
const str = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const num = (v: unknown, min = 0, max = 1_000_000) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min
}
const date = (v: unknown) => (typeof v === 'string' && DATE_RE.test(v) ? v : null)
const group = (v: unknown): Group => (GROUPS.includes(v as Group) ? (v as Group) : 'adult')
const payKind = (v: unknown): PayKind => (v === 'pass' || v === 'free' ? v : 'cash')

async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  if (!req.headers.get('content-type')?.includes('application/json')) throw new Error('JSON expected')
  return (await req.json()) as T
}

/* ---------- Маршрути ---------- */
export default async (req: Request, context: Context) => {
  const route = new URL(req.url).pathname.replace(/^\/api\/admin\/?/, '')
  const q = new URL(req.url).searchParams
  const method = req.method

  try {
    /* Вхід */
    if (route === 'login' && method === 'POST') {
      const u = users()
      if (!Object.keys(u).length) return fail(503, 'Адмінку ще не налаштовано: додайте ADMIN_LOGIN і ADMIN_PASSWORD у Netlify')
      const ip = context.ip || 'unknown'
      const rlKey = `rl/${createHash('sha256').update(ip).digest('hex').slice(0, 16)}`
      const s = store()
      const rl = ((await s.get(rlKey, { type: 'json' })) as { fails: number; since: number } | null) ?? { fails: 0, since: Date.now() }
      if (rl.fails >= MAX_FAILS && Date.now() - rl.since < LOCK_MS) return fail(429, 'Забагато спроб. Зачекайте 15 хвилин')

      const { login, password } = await body<{ login?: string; password?: string }>(req)
      const name = str(login, 60)
      const ok = name in u && safeEqual(String(password ?? ''), u[name])
      if (!ok) {
        const fresh = Date.now() - rl.since > LOCK_MS
        await s.setJSON(rlKey, { fails: fresh ? 1 : rl.fails + 1, since: fresh ? Date.now() : rl.since })
        await new Promise((r) => setTimeout(r, 600)) // уповільнюємо перебір
        return fail(401, 'Невірний логін або пароль')
      }
      await s.delete(rlKey)
      return json({ user: name }, 200, { 'set-cookie': cookie(makeToken(name, secret(u)), SESSION_DAYS * 86400) })
    }

    if (route === 'logout' && method === 'POST') return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) })

    /* Усе інше — лише для авторизованих */
    const user = readUser(req)
    if (!user) return fail(401, 'Потрібен вхід')

    if (route === 'me') return json({ user })

    if (route === 'state' && method === 'GET') {
      const [members, settings] = await Promise.all([loadMembers(), loadSettings()])
      return json({ user, members, settings })
    }

    /* Учасники */
    if (route === 'member' && method === 'PUT') {
      const b = await body<Partial<Member>>(req)
      const name = str(b.name, 80)
      if (!name) return fail(400, "Вкажіть ім'я")
      let saved: Member | undefined
      await mutateMembers((list) => {
        const i = b.id ? list.findIndex((m) => m.id === b.id) : -1
        const base: Member = i >= 0 ? list[i] : { id: uid(), name, group: 'adult', payments: [], createdAt: new Date().toISOString() }
        saved = { ...base, name, group: group(b.group), phone: str(b.phone, 30) || undefined, note: str(b.note, 300) || undefined }
        if (i >= 0) list[i] = saved
        else list.push(saved)
      })
      return json({ member: saved })
    }

    if (route === 'member' && method === 'DELETE') {
      const id = q.get('id')
      await mutateMembers((list) => list.filter((m) => m.id !== id))
      return json({ ok: true })
    }

    /* Абонемент: новий (без id) або виправлення поточного (з id) */
    if (route === 'pass' && method === 'POST') {
      const b = await body<{ memberId: string; id?: string; sessions: number; from: string; until: string; amount: number; used?: number }>(req)
      const from = date(b.from)
      const until = date(b.until)
      if (!from || !until || until < from) return fail(400, 'Перевірте дати абонемента')
      let saved: Member | undefined
      await mutateMembers((list) => {
        const m = list.find((x) => x.id === b.memberId)
        if (!m) throw new Error('Учасника не знайдено')
        const amount = num(b.amount)
        const sessions = num(b.sessions, 1, 500)
        if (b.id && m.pass?.id === b.id) {
          m.pass = { ...m.pass, sessions, from, until, amount, used: b.used === undefined ? m.pass.used : num(b.used, 0, 500) }
          const pay = m.payments.find((p) => p.id === b.id)
          if (pay) Object.assign(pay, { amount, date: from })
        } else {
          const id = uid()
          m.pass = { id, sessions, used: 0, from, until, amount }
          if (amount > 0) m.payments.push({ id, date: from, amount, kind: 'pass', note: `Абонемент на ${sessions} занять` })
        }
        saved = m
      })
      return json({ member: saved })
    }

    if (route === 'pass' && method === 'DELETE') {
      const memberId = q.get('memberId')
      let saved: Member | undefined
      await mutateMembers((list) => {
        const m = list.find((x) => x.id === memberId)
        if (!m) return
        if (m.pass) m.payments = m.payments.filter((p) => p.id !== m.pass!.id)
        m.pass = null
        saved = m
      })
      return json({ member: saved })
    }

    /* Заняття */
    if (route === 'sessions' && method === 'GET') {
      const from = date(q.get('from'))
      const to = date(q.get('to'))
      if (!from || !to) return fail(400, 'Вкажіть період')
      const s = store()
      const { blobs } = await s.list({ prefix: 's/' })
      const keys = blobs.map((b) => b.key).filter((k) => {
        const d = k.slice(2, 12)
        return d >= from && d <= to
      })
      if (keys.length > 400) return fail(400, 'Завеликий період')
      const sessions = (await Promise.all(keys.map((k) => s.get(k, { type: 'json' })))).filter(Boolean) as Session[]
      sessions.sort((a, b) => (a.date === b.date ? a.group.localeCompare(b.group) : a.date.localeCompare(b.date)))
      return json({ sessions })
    }

    if (route === 'session' && method === 'PUT') {
      const b = await body<{ date: string; group: Group; visits: Record<string, Visit> }>(req)
      const d = date(b.date)
      if (!d) return fail(400, 'Невірна дата')
      const g = group(b.group)
      const visits: Record<string, Visit> = {}
      for (const [id, v] of Object.entries(b.visits ?? {}).slice(0, 300)) {
        const pay = payKind(v?.pay)
        visits[str(id, 40)] = {
          pay,
          amount: pay === 'cash' ? num(v?.amount) : 0,
          passId: pay === 'pass' ? str(v?.passId, 40) || undefined : undefined,
          name: str(v?.name, 80),
        }
      }

      // Зміни списань з абонементів: було / стало
      let deltas = new Map<string, number>()
      const session = await mutate<Session>(`s/${d}/${g}`, () => ({ date: d, group: g, visits: {} }), (cur) => {
        deltas = new Map()
        const ids = new Set([...Object.keys(cur.visits), ...Object.keys(visits)])
        for (const id of ids) {
          const before = cur.visits[id]?.pay === 'pass' ? cur.visits[id].passId : undefined
          const after = visits[id]?.pay === 'pass' ? visits[id].passId : undefined
          if (before === after) continue
          if (before) deltas.set(before, (deltas.get(before) ?? 0) - 1)
          if (after) deltas.set(after, (deltas.get(after) ?? 0) + 1)
        }
        return { date: d, group: g, visits, updatedAt: new Date().toISOString() }
      })

      const present = Object.keys(visits)
      const doc = await mutateMembers((list) => {
        for (const m of list) {
          if (m.pass && deltas.has(m.pass.id)) m.pass.used = Math.max(0, m.pass.used + deltas.get(m.pass.id)!)
          if (present.includes(m.id) && (!m.lastVisit || m.lastVisit < d)) m.lastVisit = d
        }
      })
      const touched = doc.list.filter((m) => present.includes(m.id) || (m.pass && deltas.has(m.pass.id)))
      return json({ session, members: touched })
    }

    /* Налаштування */
    if (route === 'settings' && method === 'PUT') {
      const b = await body<Partial<Settings>>(req)
      const cur = await loadSettings()
      const next: Settings = {
        days: Array.isArray(b.days) ? [...new Set(b.days.map((x) => num(x, 0, 6)))].sort() : cur.days,
        time: { adult: str(b.time?.adult, 40) || cur.time.adult, kids: str(b.time?.kids, 40) || cur.time.kids },
        price: { adult: num(b.price?.adult ?? cur.price.adult), kids: num(b.price?.kids ?? cur.price.kids) },
        passSessions: num(b.passSessions ?? cur.passSessions, 1, 500),
        passDays: num(b.passDays ?? cur.passDays, 1, 400),
        passPrice: { adult: num(b.passPrice?.adult ?? cur.passPrice.adult), kids: num(b.passPrice?.kids ?? cur.passPrice.kids) },
      }
      await store().setJSON('settings', next)
      return json({ settings: next })
    }

    /* Резервна копія всіх даних */
    if (route === 'export' && method === 'GET') {
      const s = store()
      const { blobs } = await s.list({ prefix: 's/' })
      const sessions = await Promise.all(blobs.map((b) => s.get(b.key, { type: 'json' })))
      const [members, settings] = await Promise.all([loadMembers(), loadSettings()])
      return json({ exportedAt: new Date().toISOString(), settings, members, sessions }, 200, {
        'content-disposition': `attachment; filename="climbing-khai-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      })
    }

    return fail(404, 'Not found')
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Помилка сервера'
    return fail(message === 'JSON expected' ? 415 : 500, message)
  }
}
