import { useEffect, useState } from 'react'
import { useInView } from './index'

export type IgPost = {
  id: string
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  image: string
  caption: string
  permalink: string
  timestamp: string
}
export type IgStatus = 'idle' | 'ready' | 'off'

/** Один запит на всю сесію: головна, галерея й новини беруть дані з того самого кешу */
let cache: Promise<IgPost[]> | null = null
function loadPosts(): Promise<IgPost[]> {
  cache ??= fetch('/api/instagram?limit=24')
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((d: { posts?: IgPost[] }) => d.posts ?? [])
    .catch(() => [])
  return cache
}

/**
 * Пости з Instagram через серверну функцію /api/instagram.
 * Завантажуються, лише коли блок наближається до екрана.
 * status: idle — ще вантажимо, ready — є пости, off — Instagram не підключено або недоступний.
 */
export function useInstagram<T extends Element>(limit: number) {
  const [ref, inView] = useInView<T>('400px')
  const [state, setState] = useState<{ status: IgStatus; posts: IgPost[] }>({ status: 'idle', posts: [] })

  useEffect(() => {
    if (!inView || state.status !== 'idle') return
    let alive = true
    loadPosts().then((all) => {
      if (!alive) return
      const posts = all.slice(0, limit)
      setState({ status: posts.length ? 'ready' : 'off', posts })
    })
    return () => { alive = false }
  }, [inView, limit, state.status])

  return { ref, ...state }
}
