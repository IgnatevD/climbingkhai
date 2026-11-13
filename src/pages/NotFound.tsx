import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useI18n } from '../i18n'
import { usePageMeta, useReducedMotion } from '../hooks'
import { Holds } from '../components/ui'
import './NotFound.css'

/* Фізика зриву (одиниці viewBox ≈ пікселі) */
const A = { x: 110, y: 40 } // карабін відтяжки, через який іде мотузка
const L = 150 // довжина мотузки до обв'язки
const G = 1400 // «гравітація»
const K = 420 // жорсткість динамічної мотузки (м'яко ловить)
const ROPE_DAMP = 7
const AIR_DAMP = 0.45
const SWAY = 10 // ледь помітне погойдування, щоб не завмирав
const START = { x: A.x + 34, y: A.y - 18 } // скелелаз трохи вище відтяжки — звідти й зрив
const REST = { x: A.x, y: A.y + L + G / K }

/**
 * 404 «Зрив!»: скелелаз зривається, динамічна мотузка м'яко ловить, і він гойдається.
 * Торкнись — розгойдаєш. Анімація — requestAnimationFrame + атрибути SVG (однаково працює в Safari).
 */
export default function NotFound() {
  const { t, to } = useI18n()
  usePageMeta(`404 — ${t.meta.short}`)
  const reduce = useReducedMotion()
  const climber = useRef<SVGGElement>(null)
  const rope = useRef<SVGPathElement>(null)
  const push = useRef(0)
  const [caught, setCaught] = useState(false)

  useEffect(() => {
    const draw = (x: number, y: number, phi: number) => {
      const dx = x - A.x
      const dy = y - A.y
      const d = Math.hypot(dx, dy)
      // Поки мотузка не натягнута — провисає дугою
      const sag = Math.max(0, L - d) * 0.55
      const mx = (A.x + x) / 2
      const my = Math.max(A.y, y) + sag
      rope.current?.setAttribute('d', `M${A.x} ${A.y} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`)
      climber.current?.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((phi * 180) / Math.PI).toFixed(2)})`)
    }

    if (reduce) {
      draw(REST.x, REST.y, 0)
      return
    }

    let raf = 0
    let last = 0
    let t0 = 0
    let wasCaught = false
    const p = { ...START }
    const v = { x: 0, y: 0 }
    let phi = 0.2

    const tick = (now: number) => {
      if (!t0) t0 = last = now
      const dt = Math.min(1 / 30, (now - last) / 1000)
      last = now
      const time = (now - t0) / 1000

      if (time > 0.7) {
        // Сили: гравітація, мотузка (лише коли натягнута), опір повітря, легке погойдування
        let fx = -AIR_DAMP * v.x + SWAY * Math.sin(time * Math.sqrt(G / L))
        let fy = G - AIR_DAMP * v.y
        if (push.current) { v.x += push.current; push.current = 0 }
        const dx = p.x - A.x
        const dy = p.y - A.y
        const d = Math.hypot(dx, dy) || 1
        const taut = d > L
        if (taut) {
          const ux = dx / d
          const uy = dy / d
          const vr = v.x * ux + v.y * uy
          const f = -K * (d - L) - ROPE_DAMP * vr
          fx += f * ux
          fy += f * uy
          if (!wasCaught) { wasCaught = true; setCaught(true) }
        }
        v.x += fx * dt
        v.y += fy * dt
        p.x += v.x * dt
        p.y += v.y * dt

        // Тіло — вздовж мотузки; поки летить — майже вертикально
        const target = taut || wasCaught ? Math.atan2(A.x - p.x, -(A.y - p.y)) : -0.25
        phi += (target - phi) * Math.min(1, dt * 12)
        draw(p.x, p.y, phi)
      } else {
        // Перед зривом: «тремтить» на зачепах
        draw(START.x + Math.sin(time * 60) * 0.8, START.y, 0.2)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduce])

  const onPush = (e: React.PointerEvent<SVGSVGElement>) => {
    if (reduce) return
    const box = e.currentTarget.getBoundingClientRect()
    push.current = e.clientX < box.left + box.width / 2 ? 240 : -240
  }

  return (
    <section className="nf wall-dots">
      <Holds count={9} seed={404} />
      <div className="container nf__inner">
        <div className={`nf__scene${caught || reduce ? ' is-caught' : ''}`}>
          <svg className="nf__fall" viewBox="0 0 220 260" onPointerDown={onPush} role="img" aria-label={t.notFound.fall}>
            <title>{t.notFound.push}</title>
            {/* мотузка до страхувальника */}
            <path d={`M${A.x} ${A.y} Q${A.x - 30} ${A.y + 120} 24 262`} className="nf__rope nf__rope--belay" />
            {/* шлямбур + відтяжка */}
            <circle cx={A.x} cy="10" r="6" className="nf__bolt" />
            <rect x={A.x - 3} y="15" width="6" height="14" rx="2.5" className="nf__sling" />
            <rect x={A.x - 6} y="29" width="12" height="16" rx="6" className="nf__biner" />
            {/* мотузка до скелелаза */}
            <path ref={rope} className="nf__rope" d={`M${A.x} ${A.y} L${START.x} ${START.y}`} />
            {/* скелелаз: початок координат — точка кріплення на обв'язці */}
            <g ref={climber} transform={`translate(${START.x} ${START.y}) rotate(11)`}>
              <path d="M-1 3 L-14 22 L-9 43 M1 3 L12 24 L18 42" className="nf__limb" />
              <path d="M-5 -29 L-2 -52 M5 -29 L2 -46" className="nf__limb" />
              <path d="M0 -2 V-30" className="nf__torso" />
              <path d="M-7 -1 H7" className="nf__harness" />
              <circle cx="0" cy="-41" r="8.5" className="nf__head" />
              <path d="M-9 -42.5 a9 9 0 0 1 18 0 Z" className="nf__helmet" />
            </g>
          </svg>
          <p className="nf__shout" aria-hidden="true">{t.notFound.fall}</p>
        </div>
        <p className="nf__code">404</p>
        <h1 className="h2">{t.notFound.title}</h1>
        <p className="lead">{t.notFound.text}</p>
        <div className="nf__actions">
          <Link to={to('/')} className="btn btn--primary">{t.notFound.home} <span className="arrow">→</span></Link>
          <Link to={to('training')} className="btn btn--ghost">{t.nav.training}</Link>
          <Link to={to('contacts')} className="btn btn--ghost">{t.nav.contacts}</Link>
        </div>
        {!reduce && <p className="nf__hint muted">{t.notFound.push}</p>}
      </div>
    </section>
  )
}
