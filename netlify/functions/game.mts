/**
 * Таблиця лідерів гри «Лід» (/game).
 *
 *   POST /api/game/start  → { token }     — підписаний квиток на одну спробу (час старту)
 *   POST /api/game/score  { token, name, score, moves, clips } → { rank, best, top }
 *   GET  /api/game/top    → { top }       — топ-20
 *
 * Дані — у Netlify Blobs (сховище "game"), тож рекорди спільні для всіх пристроїв.
 * Захист від підробки: підписаний квиток (одноразовий), перевірка, що бали можливі
 * за такий час і таку кількість перехоплень, і не частіше одного результату на 4 с з однієї IP.
 * Ключ підпису: GAME_SECRET або ADMIN_SECRET, а якщо їх немає — випадковий, збережений у Blobs.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'

export const config: Config = { path: '/api/game/*' }

const TOP_KEEP = 100
const TOP_SHOW = 20
const USED_KEEP = 600
/* Ті самі межі, що й у грі (src/game/engine.ts) */
const MAX_PER_MOVE = 60 // 10 × рівень 3 × комбо ×2
const MAX_PER_CLIP = 50 // 25 × комбо ×2
const CLIP_EVERY = 5
const METERS_PER_MOVE = 0.6
const MAX_MOVES_PER_SEC = 5

type Entry = { name: string; score: number; height: number; clips: number; at: number }
type Board = { top: Entry[]; used: string[] }

const store = () => getStore({ name: 'game', consistency: 'strong' })

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
const fail = (status: number, error: string) => json({ error }, status)

let cachedSecret: string | null = null
async function secret(): Promise<string> {
  if (cachedSecret) return cachedSecret
  const env = Netlify.env.get('GAME_SECRET') || Netlify.env.get('ADMIN_SECRET')
  if (env) return (cachedSecret = env)
  const s = store()
  let v = (await s.get('secret')) as string | null
  if (!v) {
    await s.set('secret', randomBytes(32).toString('hex'), { onlyIfNew: true })
    v = (await s.get('secret')) as string | null
  }
  return (cachedSecret = v ?? 'climbing-khai')
}

const b64 = (s: string) => Buffer.from(s).toString('base64url')
const sign = async (payload: string) => createHmac('sha256', await secret()).update(payload).digest('base64url')

async function makeTicket() {
  const payload = b64(JSON.stringify({ id: randomBytes(9).toString('base64url'), t: Date.now() }))
  return `${payload}.${await sign(payload)}`
}
async function readTicket(token: unknown): Promise<{ id: string; t: number } | null> {
  if (typeof token !== 'string' || token.length > 300) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const good = Buffer.from(await sign(payload))
  const got = Buffer.from(sig)
  if (good.length !== got.length || !timingSafeEqual(good, got)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { id: string; t: number }
    return typeof data.id === 'string' && Number.isFinite(data.t) ? data : null
  } catch {
    return null
  }
}

async function mutate(fn: (b: Board) => Board): Promise<Board> {
  const s = store()
  for (let i = 0; i < 6; i++) {
    const got = await s.getWithMetadata('board', { type: 'json' })
    const cur = (got?.data as Board | undefined) ?? { top: [], used: [] }
    const next = fn(structuredClone(cur))
    const res = got?.etag ? await s.setJSON('board', next, { onlyIfMatch: got.etag }) : await s.setJSON('board', next, { onlyIfNew: true })
    if (res.modified) return next
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 120))
  }
  throw new Error('Сервер зайнятий, спробуйте ще раз')
}

const cleanName = (v: unknown) =>
  typeof v === 'string' ? v.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, 20) : ''
const NAME_RE = /^[\p{L}\p{N} ._'-]{2,20}$/u
const int = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : -1)
const publicTop = (top: Entry[]) => top.slice(0, TOP_SHOW).map(({ name, score, height, at }) => ({ name, score, height, at }))

export default async (req: Request, context: Context) => {
  const route = new URL(req.url).pathname.replace(/^\/api\/game\/?/, '')
  try {
    if (route === 'top' && req.method === 'GET') {
      const board = (await store().get('board', { type: 'json' })) as Board | null
      return json({ top: publicTop(board?.top ?? []) })
    }

    if (route === 'start' && req.method === 'POST') {
      return json({ token: await makeTicket() })
    }

    if (route === 'score' && req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
      const name = cleanName(body.name)
      if (!NAME_RE.test(name)) return fail(400, 'Імʼя: 2–20 літер або цифр')
      const score = int(body.score)
      const moves = int(body.moves)
      const clips = int(body.clips)
      if (score < 0 || moves < 0 || clips < 0) return fail(400, 'Некоректний результат')

      const ticket = await readTicket(body.token)
      if (!ticket) return fail(400, 'Спроба не підтверджена — зіграйте ще раз')
      const seconds = (Date.now() - ticket.t) / 1000
      if (seconds > 3 * 3600) return fail(400, 'Спроба застаріла')
      const possible =
        moves <= seconds * MAX_MOVES_PER_SEC + 3 &&
        clips <= Math.floor(moves / CLIP_EVERY) + 1 &&
        score <= moves * MAX_PER_MOVE + clips * MAX_PER_CLIP
      if (!possible) return fail(400, 'Результат не схожий на справжній')

      // Не частіше одного результату на 4 с з однієї адреси
      const s = store()
      const rlKey = `rl/${createHash('sha256').update(context.ip || 'unknown').digest('hex').slice(0, 16)}`
      const last = (await s.get(rlKey, { type: 'json' })) as { t: number } | null
      if (last && Date.now() - last.t < 4000) return fail(429, 'Зачекайте кілька секунд')
      await s.setJSON(rlKey, { t: Date.now() })

      const entry: Entry = { name, score, height: Math.round(moves * METERS_PER_MOVE * 10) / 10, clips, at: Date.now() }
      let duplicate = false
      const board = await mutate((b) => {
        if (b.used.includes(ticket.id)) {
          duplicate = true
          return b
        }
        b.used = [...b.used, ticket.id].slice(-USED_KEEP)
        // Одне місце на імʼя — зберігаємо найкращий результат
        const key = name.toLocaleLowerCase('uk')
        const i = b.top.findIndex((e) => e.name.toLocaleLowerCase('uk') === key)
        if (i >= 0 && b.top[i].score >= score) return b
        if (i >= 0) b.top.splice(i, 1)
        b.top.push(entry)
        b.top.sort((a, c) => c.score - a.score || a.at - c.at)
        b.top = b.top.slice(0, TOP_KEEP)
        return b
      })
      if (duplicate) return fail(409, 'Цей результат уже збережено')

      const rank = board.top.filter((e) => e.score > score).length + 1
      const best = board.top.find((e) => e.name.toLocaleLowerCase('uk') === name.toLocaleLowerCase('uk'))?.score ?? score
      return json({ rank: rank <= TOP_KEEP ? rank : null, best, top: publicTop(board.top) })
    }

    return fail(404, 'Not found')
  } catch (e) {
    return fail(500, e instanceof Error ? e.message : 'Помилка сервера')
  }
}
