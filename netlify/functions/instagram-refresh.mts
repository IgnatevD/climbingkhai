/**
 * Запланована функція: раз на тиждень продовжує довгостроковий токен Instagram
 * (він живе 60 днів; оновити можна, якщо йому вже більше доби).
 * Новий токен зберігається в Netlify Blobs і далі використовується функцією instagram.
 */
import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'

export default async () => {
  const store = getStore({ name: 'instagram', consistency: 'strong' })
  const saved = (await store.get('token', { type: 'json' })) as { token: string } | null
  const token = saved?.token || Netlify.env.get('IG_ACCESS_TOKEN')
  if (!token) {
    console.log('[instagram-refresh] IG_ACCESS_TOKEN не задано — пропускаємо')
    return
  }

  const res = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`)
  if (!res.ok) {
    console.error('[instagram-refresh] помилка', res.status, (await res.text()).slice(0, 300))
    return
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  await store.setJSON('token', { token: data.access_token, refreshedAt: new Date().toISOString(), expiresIn: data.expires_in })
  console.log('[instagram-refresh] токен оновлено, діє ще', Math.round(data.expires_in / 86400), 'днів')
}

export const config: Config = { schedule: '@weekly' }
