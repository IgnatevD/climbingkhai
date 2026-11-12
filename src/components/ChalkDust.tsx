import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks'
import './ChalkDust.css'

/** Хмаринка магнезії при кожному натисканні — як після «намагнезювання» рук. */
export function ChalkDust() {
  const layer = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (reduce) return
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !layer.current) return
      const target = e.target as HTMLElement
      if (target.closest('input, textarea, select, iframe')) return
      const frag = document.createDocumentFragment()
      const count = 12
      for (let i = 0; i < count; i++) {
        const s = document.createElement('span')
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
        const dist = 18 + Math.random() * 38
        const size = 4 + Math.random() * 9
        s.className = 'chalk'
        s.style.left = `${e.clientX}px`
        s.style.top = `${e.clientY}px`
        s.style.width = s.style.height = `${size}px`
        s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
        s.style.setProperty('--dy', `${Math.sin(angle) * dist - 14}px`)
        s.style.animationDuration = `${520 + Math.random() * 380}ms`
        s.addEventListener('animationend', () => s.remove(), { once: true })
        frag.append(s)
      }
      layer.current.append(frag)
    }
    window.addEventListener('pointerdown', onDown, { passive: true })
    return () => window.removeEventListener('pointerdown', onDown)
  }, [reduce])

  return <div ref={layer} className="chalk-layer" aria-hidden="true" />
}
