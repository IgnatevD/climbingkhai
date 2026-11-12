import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

/* ---------------------------------------------------------
   Зменшений рух (системне налаштування)
   --------------------------------------------------------- */
const RM_QUERY = '(prefers-reduced-motion: reduce)'
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(RM_QUERY)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(RM_QUERY).matches,
    () => false,
  )
}

/* ---------------------------------------------------------
   Поява елементів [data-reveal] при прокрутці.
   Один спостерігач на весь сайт + MutationObserver для
   елементів, що з'являються пізніше (ліниві сторінки).
   --------------------------------------------------------- */
export function useRevealAll(key: string) {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    const scan = () => document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el))
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [key])
}

/* ---------------------------------------------------------
   Видимість елемента (для лінивого завантаження блоків)
   --------------------------------------------------------- */
export function useInView<T extends Element>(rootMargin = '200px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (!('IntersectionObserver' in window)) { setInView(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect() } }, { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin])
  return [ref, inView] as const
}

/* ---------------------------------------------------------
   Анімований лічильник
   --------------------------------------------------------- */
export function useCountUp(target: number, start: boolean, duration = 1400) {
  const reduce = useReducedMotion()
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!start) return
    if (reduce) { setValue(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target, duration, reduce])
  return value
}

/* ---------------------------------------------------------
   Тема: світла / темна. Зберігається в localStorage,
   за замовчуванням — як у системі.
   --------------------------------------------------------- */
export type Theme = 'light' | 'dark'
const THEME_KEY = 'ck-theme'
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')
const readTheme = (): Theme => {
  const set = document.documentElement.dataset.theme
  if (set === 'light' || set === 'dark') return set
  return darkQuery().matches ? 'dark' : 'light'
}
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      const mq = darkQuery()
      mq.addEventListener('change', cb)
      return () => { listeners.delete(cb); mq.removeEventListener('change', cb) }
    },
    readTheme,
    () => 'dark' as Theme,
  )

  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const next: Theme = readTheme() === 'dark' ? 'light' : 'dark'
    const apply = () => {
      document.documentElement.dataset.theme = next
      try { localStorage.setItem(THEME_KEY, next) } catch { /* приватний режим */ }
      notify()
    }
    const reduce = window.matchMedia(RM_QUERY).matches
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (!doc.startViewTransition || reduce) { apply(); return }
    const x = origin?.x ?? window.innerWidth - 40
    const y = origin?.y ?? 40
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const root = document.documentElement.style
    root.setProperty('--vt-x', `${x}px`)
    root.setProperty('--vt-y', `${y}px`)
    root.setProperty('--vt-r', `${r}px`)
    doc.startViewTransition(apply)
  }, [])

  useEffect(() => {
    const meta = document.querySelectorAll('meta[name="theme-color"]')
    meta.forEach((m) => m.setAttribute('content', theme === 'dark' ? '#11161b' : '#f4efe6'))
  }, [theme])

  return { theme, toggle }
}

/* ---------------------------------------------------------
   Заголовок і опис сторінки
   --------------------------------------------------------- */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}
