import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks'
import './ChalkDust.css'

/** Що «пилить» магнезією: головні кнопки дій, а не кожен клік по сторінці */
const TARGETS = '.btn, .fab__main, .fab__top'

/** Хмаринка магнезії при натисканні на кнопку — як після «намагнезювання» рук. */
export function ChalkDust() {
  const layer = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const puff = (x: number, y: number, big: boolean) => {
      if (!layer.current) return
      const frag = document.createDocumentFragment()
      const count = big ? 14 : 9
      for (let i = 0; i < count; i++) {
        const s = document.createElement('span')
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
        const dist = (big ? 22 : 14) + Math.random() * (big ? 40 : 26)
        const size = 4 + Math.random() * 9
        s.className = 'chalk'
        s.style.left = `${x}px`
        s.style.top = `${y}px`
        s.style.width = s.style.height = `${size}px`
        s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
        s.style.setProperty('--dy', `${Math.sin(angle) * dist - 14}px`)
        s.style.animationDuration = `${520 + Math.random() * 380}ms`
        s.addEventListener('animationend', () => s.remove(), { once: true })
        frag.append(s)
      }
      layer.current.append(frag)
    }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const el = (e.target as HTMLElement).closest<HTMLElement>(TARGETS)
      if (el) puff(e.clientX, e.clientY, el.classList.contains('btn--primary'))
    }
    // Клавіатура (Enter/Space): хмаринка з центру кнопки
    const onClick = (e: MouseEvent) => {
      if (e.detail !== 0) return
      const el = (e.target as HTMLElement).closest<HTMLElement>(TARGETS)
      if (!el) return
      const r = el.getBoundingClientRect()
      puff(r.left + r.width / 2, r.top + r.height / 2, el.classList.contains('btn--primary'))
    }
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('click', onClick)
    }
  }, [reduce])

  return <div ref={layer} className="chalk-layer" aria-hidden="true" />
}
