import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks'
import './WallHero.css'

/** Зачепи маршруту (знизу вгору) — по них лізе скелелаз */
const ROUTE: [number, number][] = [
  [200, 560], [150, 500], [220, 440], [170, 380], [250, 320], [190, 255], [260, 195], [210, 130], [230, 60],
]
const ROUTE_D = 'M' + ROUTE.map(([x, y]) => `${x} ${y}`).join(' L')
/** Довжина маршруту в пікселях — для анімації «малювання» лінії (pathLength у Safari ненадійний) */
const ROUTE_LEN = Math.round(ROUTE.slice(1).reduce((sum, [x, y], i) => sum + Math.hypot(x - ROUTE[i][0], y - ROUTE[i][1]), 0))
const ANCHOR: [number, number] = [230, 28]
/** Масштаб фігурки скелелаза */
const SCALE = 1.4

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

/* ---------------------------------------------------------
   Хореографія: перехват від зачепу до зачепу → відпочинок на топі →
   спуск на верхній страховці → коротка пауза внизу → знову.
   --------------------------------------------------------- */
const T = { start: 1.8, move: 0.75, rest: 0.4, top: 1.6, lower: 2.6, bottom: 0.9 }
const SEGMENTS = ROUTE.length - 1
const UP = SEGMENTS * (T.move + T.rest)
const CYCLE = UP + T.top + T.lower + T.bottom

/** Пози кінцівок (кінці рук і ніг відносно стегон): A — тягнеться лівою, B — правою */
type Pose = { la: [number, number]; ra: [number, number]; ll: [number, number]; rl: [number, number] }
const POSE_A: Pose = { la: [-13, -33], ra: [12, -19], ll: [-12, 18], rl: [10, 9] }
const POSE_B: Pose = { la: [-12, -19], ra: [13, -33], ll: [-10, 9], rl: [12, 18] }
/** Спуск: руки тримають мотузку, ноги впираються в стіну */
const POSE_LOWER: Pose = { la: [-4, -26], ra: [4, -30], ll: [-11, 14], rl: [11, 14] }

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mix = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
const mixPose = (a: Pose, b: Pose, t: number): Pose => ({ la: mix(a.la, b.la, t), ra: mix(a.ra, b.ra, t), ll: mix(a.ll, b.ll, t), rl: mix(a.rl, b.rl, t) })
const poseFor = (i: number) => (i % 2 === 0 ? POSE_A : POSE_B)

/** Точка на маршруті: s від 0 (старт) до SEGMENTS (топ) */
function pointAt(s: number): [number, number] {
  const i = Math.max(0, Math.min(SEGMENTS - 1, Math.floor(s)))
  const f = Math.max(0, Math.min(1, s - i))
  return mix(ROUTE[i], ROUTE[i + 1], f)
}

/** Стан скелелаза в момент часу t (секунди від початку циклу) */
function frame(t: number): { s: number; pose: Pose; swing: number } {
  if (t < UP) {
    const seg = Math.floor(t / (T.move + T.rest))
    const local = t - seg * (T.move + T.rest)
    const k = local < T.move ? ease(local / T.move) : 1
    return { s: seg + k, pose: mixPose(poseFor(seg), poseFor(seg + 1), k), swing: Math.sin(k * Math.PI) * 3 }
  }
  t -= UP
  if (t < T.top) return { s: SEGMENTS, pose: poseFor(SEGMENTS), swing: 0 }
  t -= T.top
  if (t < T.lower) {
    const k = ease(t / T.lower)
    const blend = Math.min(1, t / 0.4)
    return { s: SEGMENTS * (1 - k), pose: mixPose(poseFor(SEGMENTS), POSE_LOWER, blend), swing: Math.sin(t * 5) * 2 }
  }
  t -= T.lower
  const k = Math.min(1, t / T.bottom)
  return { s: 0, pose: mixPose(POSE_LOWER, POSE_A, ease(k)), swing: 0 }
}

/** Шлях кінцівок: руки від плечей, ноги від стегон */
const limbsPath = (p: Pose) =>
  `M0 -10 L${p.la[0]} ${p.la[1]} M0 -10 L${p.ra[0]} ${p.ra[1]} M0 6 L${p.ll[0]} ${p.ll[1] + 12} M0 6 L${p.rl[0]} ${p.rl[1] + 12}`

export function WallHero() {
  const ref = useRef<HTMLDivElement>(null)
  const climberRef = useRef<SVGGElement>(null)
  const limbsRef = useRef<SVGPathElement>(null)
  const ropeRef = useRef<SVGLineElement>(null)
  const reduce = useReducedMotion()

  /* Малюємо кадр: позиція, поза, мотузка верхньої страховки */
  const draw = (t: number) => {
    const { s, pose, swing } = frame(t)
    const [x, y] = pointAt(s)
    // Скелелаз висить під зачепом: руки на зачепі, стегна нижче
    const bx = x + swing
    const by = y + 40
    climberRef.current?.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)}) scale(${SCALE})`)
    limbsRef.current?.setAttribute('d', limbsPath(pose))
    if (ropeRef.current) {
      ropeRef.current.setAttribute('x2', bx.toFixed(1))
      ropeRef.current.setAttribute('y2', (by + 4 * SCALE).toFixed(1))
    }
  }

  /* Анімація через requestAnimationFrame — однаково працює в Safari, Chrome і Firefox.
     Зупиняється, коли стіна поза екраном або вкладка неактивна. */
  useEffect(() => {
    if (reduce) {
      draw(UP * 0.48) // статична поза посередині маршруту
      return
    }
    let raf = 0
    let last = 0
    let elapsed = -T.start // чекаємо, поки з'являться зачепи й мотузка
    let visible = true
    draw(0)

    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0
      last = now
      elapsed += dt
      if (elapsed >= 0) draw(elapsed % CYCLE)
      raf = requestAnimationFrame(loop)
    }
    const start = () => { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(loop) } }
    const stop = () => { cancelAnimationFrame(raf); raf = 0 }

    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop() })
      : null
    if (io && ref.current) io.observe(ref.current)
    const onVis = () => (document.hidden ? stop() : start())
    document.addEventListener('visibilitychange', onVis)
    start()
    return () => { stop(); io?.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [reduce]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Нахил стіни за мишею — лише на комп'ютері з мишею */
  useEffect(() => {
    const el = ref.current
    if (!el || reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    el.classList.add('is-tilt')
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
    return () => {
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(raf)
      el.classList.remove('is-tilt')
    }
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

          {/* Лінія маршруту, що «малюється» знизу вгору */}
          <path d={ROUTE_D} className="wall__route" style={{ strokeDasharray: ROUTE_LEN, strokeDashoffset: ROUTE_LEN }} />

          <g className="wall__layer wall__layer--front">
            {ROUTE.map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                {/* Вкладена група: CSS-анімація не конфліктує з атрибутом transform (важливо для Safari) */}
                <g className="route-hold" style={{ '--i': i } as React.CSSProperties}>
                  <path d={SHAPES[i % SHAPES.length]} transform={`rotate(${(i * 61) % 360}) scale(1.15)`} className="hold hold--orange" />
                  <circle r="2.6" className="hold__bolt" />
                </g>
              </g>
            ))}
            {/* Топ-станція */}
            <g transform={`translate(${ANCHOR[0]} ${ANCHOR[1]})`} className="wall__anchor">
              <circle r="9" />
              <circle r="4" />
            </g>
          </g>

          {/* Мотузка верхньої страховки: від станції до скелелаза */}
          <line ref={ropeRef} x1={ANCHOR[0]} y1={ANCHOR[1] + 6} x2={ROUTE[0][0]} y2={ROUTE[0][1] + 46} className="wall__toprope" />

          {/* Скелелаз (позицію й позу задає JS) */}
          <g ref={climberRef} className="climber" transform={`translate(${ROUTE[0][0]} ${ROUTE[0][1] + 40}) scale(${SCALE})`}>
            <path ref={limbsRef} d={limbsPath(POSE_A)} className="climber__limbs" />
            <path d="M0 -12 L0 8" className="climber__torso" />
            <circle cx="0" cy="-19" r="7" className="climber__head" />
            <path d="M-5 -24 Q0 -30 5 -24" className="climber__helmet" />
            <circle cx="0" cy="4" r="3.2" className="climber__harness" />
          </g>
        </svg>

        {/* Позначки висоти */}
        <div className="wall__scale">
          {[15, 10, 5, 0].map((m) => <span key={m}>{m} м</span>)}
        </div>
      </div>
    </div>
  )
}
