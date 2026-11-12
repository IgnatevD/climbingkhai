/**
 * GET /api/instagram?limit=8 — останні пости з Instagram клубу.
 *
 * Працює через офіційний Instagram API (Instagram API with Instagram Login).
 * Потрібна змінна середовища IG_ACCESS_TOKEN (довгостроковий токен бізнес- або автор-акаунта).
 * Відповідь кешується у Netlify Blobs на 30 хв, щоб не вичерпувати ліміти API.
 * Токен автоматично продовжується функцією instagram-refresh (раз на тиждень).
 */
import { getStore } from '@netlify/blobs'

const GRAPH = 'https://graph.instagram.com'
const CACHE_MS = 30 * 60 * 1000
const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'

type IgMedia = {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp: string
}

const json = (body: unknown, status = 200, maxAge = 300) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // Браузер і CDN Netlify тримають відповідь кілька хвилин — сайт не чекає на Instagram
      'cache-control': `public, max-age=60, s-maxage=${maxAge}, stale-while-revalidate=600`,
    },
  })

export async function currentToken(store: ReturnType<typeof getStore>): Promise<string | null> {
  const saved = (await store.get('token', { type: 'json' })) as { token: string } | null
  return saved?.token || Netlify.env.get('IG_ACCESS_TOKEN') || null
}

export default async (req: Request) => {
  const limit = Math.min(24, Math.max(1, Number(new URL(req.url).searchParams.get('limit')) || 8))
  const store = getStore({ name: 'instagram', consistency: 'strong' })

  // 1. Свіжий кеш — віддаємо одразу
  const cached = (await store.get('feed', { type: 'json' })) as { at: number; posts: unknown[] } | null
  if (cached && Date.now() - cached.at < CACHE_MS) return json({ configured: true, cached: true, posts: cached.posts.slice(0, limit) })

  const token = await currentToken(store)
  if (!token) return json({ configured: false, posts: [] }, 200, 60)

  try {
    const url = `${GRAPH}/me/media?fields=${FIELDS}&limit=24&access_token=${encodeURIComponent(token)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Instagram API ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = (await res.json()) as { data: IgMedia[] }

    const posts = data.data
      .map((m) => ({
        id: m.id,
        type: m.media_type,
        image: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url,
        caption: (m.caption ?? '').trim(),
        permalink: m.permalink,
        timestamp: m.timestamp,
      }))
      .filter((p) => p.image)

    await store.setJSON('feed', { at: Date.now(), posts })
    return json({ configured: true, posts: posts.slice(0, limit) })
  } catch (err) {
    console.error('[instagram]', err)
    // 2. Instagram недоступний — віддаємо старий кеш, якщо він є
    if (cached) return json({ configured: true, stale: true, posts: cached.posts.slice(0, limit) }, 200, 120)
    return json({ configured: true, error: 'unavailable', posts: [] }, 200, 60)
  }
}

export const config = { path: '/api/instagram' }
