import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks'
import './WallHero.css'

/** Зачепи маршруту (знизу вгору) — по них «лізе» скелелаз */
const ROUTE: [number, number][] = [
  [200, 560], [150, 500], [220, 440], [170, 380], [250, 320], [190, 255], [260, 195], [210, 130], [230, 60],
]
const ROUTE_D = 'M' + ROUTE.map(([x, y]) => `${x} ${y}`).join(' L')

/** Інші зачепи на стіні — інші кольори, інші траси */
const OTHER: [number, number, string, number][] = [
  [70, 520, 'teal', 1.1], [95, 430, 'teal', 0.9], [60, 340, 'teal', 1.2], [105, 250, 'teal', 0.8], [70, 150, 'teal', 1],
  [330, 540, 'violet', 1.2], [345, 450, 'violet', 0.9], [315, 360, 'violet', 1.1], [350, 270, 'violet', 0.8], [320, 170, 'violet', 1.3], [345, 80, 'violet', 0.9],
  [120, 585, 'yellow', 0.9], [290, 480, 'yellow', 0.8], [130, 300, 'yellow', 1], [300, 110, 'yellow', 0.7], [140, 90, 'lime', 0.9],
  [280, 600, 'pink', 1.1], [40, 230, 'pink', 0.8], [370, 360, 'pink', 0.9], [100, 40, 'lime', 1.2],
]
const SHAPES = [
  'M0 -12c7 0 12 4 11 10s-7 11-13 10-11-6-10-12 5-8 12-8Z',
  'M-11 -6c4-6 16-6 20 0s2 14-5 15-17-2-17-8 0-5 2-7Z',
  'M-2 -12c6 1 14 6 13 13s-10 11-16 10-10-7-8-13 5-11 11-10Z',
]

export function WallHero() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  // Паралакс за мишею (лише миша, не тачскрін)
  useEffect(() => {
    const el = ref.current
    if (!el || reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3))
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3))
      })
    }
    const onLeave = () => { el.style.setProperty('--mx', '0'); el.style.setProperty('--my', '0') }
    window.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => { window.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); cancelAnimationFrame(raf) }
  }, [reduce])

  return (
    <div ref={ref} className="wall" aria-hidden="true">
      <div className="wall__panel">
        <svg className="wall__svg" viewBox="0 0 400 640">
          <defs>
            <pattern id="bolts" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="2.4" className="wall__bolt" />
            </pattern>
            <linearGradient id="wallShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="wall__shade-top" />
              <stop offset="1" className="wall__shade-bottom" />
            </linearGradient>
          </defs>
          <rect width="400" height="640" rx="28" fill="url(#wallShade)" />
          <rect width="400" height="640" rx="28" fill="url(#bolts)" />
          {/* стики панелей */}
          {[160, 320, 480].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} className="wall__seam" />)}
          <line x1="200" x2="200" y1="0" y2="640" className="wall__seam" />

          <g className="wall__layer wall__layer--back">
            {OTHER.map(([x, y, c, s], i) => (
              <path key={i} d={SHAPES[i % SHAPES.length]} transform={`translate(${x} ${y}) rotate(${(i * 47) % 360}) scale(${s})`} className={`hold hold--${c}`} />
            ))}
          </g>

          {/* Мотузка, що «малюється» по маршруту */}
          <path d={ROUTE_D} className="wall__rope" pathLength={1} />

          <g className="wall__layer wall__layer--front">
            {ROUTE.map(([x, y], i) => (
              <g key={i} className="route-hold" style={{ '--i': i } as React.CSSProperties} transform={`translate(${x} ${y})`}>
                <path d={SHAPES[i % SHAPES.length]} transform={`rotate(${(i * 61) % 360}) scale(1.15)`} className="hold hold--orange" />
                <circle r="2.6" className="hold__bolt" />
              </g>
            ))}
            {/* Топ-станція */}
            <g transform="translate(230 28)" className="wall__anchor">
              <circle r="9" />
              <circle r="4" />
            </g>
          </g>

          {/* Скелелаз */}
          {!reduce && (
            <g className="climber">
              <g transform="translate(0 -18)">
                <circle cx="0" cy="-14" r="7" className="climber__head" />
                <path d="M0 -6 L0 12 M0 0 L-12 -12 M0 0 L12 -10 M0 12 L-10 26 M0 12 L11 24" className="climber__body" />
                <circle cx="0" cy="6" r="3" className="climber__harness" />
              </g>
              <animateMotion dur="11s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.82;1" calcMode="linear" path={ROUTE_D} />
            </g>
          )}
        </svg>

        {/* Позначки висоти */}
        <div className="wall__scale">
          {[15, 10, 5, 0].map((m) => <span key={m}>{m} м</span>)}
        </div>
      </div>
    </div>
  )
}
