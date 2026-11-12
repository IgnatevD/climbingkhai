import { useState, type ReactNode } from 'react'
import { useCountUp, useInView } from '../hooks'
import { media } from '../content/site'
import './ui.css'

/* ---------------------------------------------------------
   «Грейд» — підпис секції у вигляді категорії складності
   --------------------------------------------------------- */
export function Grade({ value, children }: { value: string; children: ReactNode }) {
  return <span className="grade"><b>{value}</b>{children}</span>
}

/* ---------------------------------------------------------
   Заголовок внутрішньої сторінки з декоративними зачепами
   --------------------------------------------------------- */
export function PageHero({ grade, gradeValue, title, lead, children }: { grade: string; gradeValue: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <section className="page-hero wall-dots">
      <Holds count={7} seed={title.length} />
      <div className="container page-hero__inner">
        <div data-reveal><Grade value={gradeValue}>{grade}</Grade></div>
        <h1 className="display page-hero__title" data-reveal style={{ '--delay': '80ms' } as React.CSSProperties}>{title}</h1>
        {lead && <p className="lead" data-reveal style={{ '--delay': '160ms' } as React.CSSProperties}>{lead}</p>}
        {children}
      </div>
    </section>
  )
}

/* ---------------------------------------------------------
   Декоративні зачепи (детерміновані — однакові при кожному рендері)
   --------------------------------------------------------- */
const HOLD_COLORS = ['var(--hold-orange)', 'var(--hold-teal)', 'var(--hold-yellow)', 'var(--hold-violet)', 'var(--hold-lime)', 'var(--hold-pink)']
const HOLD_SHAPES = [
  'M12 2c6 0 10 4 9 9s-6 9-11 8S1 14 2 9s4-7 10-7Z',
  'M4 6c3-5 12-5 15 0s2 12-4 13-14-2-14-7 1-4 3-6Z',
  'M10 1c5 1 12 5 11 11s-8 10-13 9-8-6-7-11 4-10 9-9Z',
  'M2 12c0-6 6-10 11-9s9 5 8 10-6 7-11 7-8-3-8-8Z',
]
function rand(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
export function Holds({ count = 8, seed = 1 }: { count?: number; seed?: number }) {
  const r = rand(seed * 9301 + 49297)
  return (
    <div className="holds" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const size = 26 + r() * 46
        return (
          <svg
            key={i}
            className="holds__item"
            viewBox="0 0 24 22"
            style={{
              left: `${r() * 96}%`,
              top: `${r() * 92}%`,
              width: size,
              rotate: `${Math.round(r() * 360)}deg`,
              '--float': `${6 + r() * 6}s`,
              '--delay': `${-r() * 6}s`,
            } as React.CSSProperties}
          >
            <path d={HOLD_SHAPES[i % HOLD_SHAPES.length]} fill={HOLD_COLORS[(i + seed) % HOLD_COLORS.length]} />
            <circle cx="11.5" cy="10.5" r="1.8" fill="rgba(0,0,0,.35)" />
          </svg>
        )
      })}
    </div>
  )
}

/* ---------------------------------------------------------
   Фото зі старого сайту з плавною появою та запасним варіантом
   --------------------------------------------------------- */
export function Photo({ src, alt, className = '', ratio }: { src: string; alt: string; className?: string; ratio?: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  return (
    <div className={`photo photo--${state} ${className}`} style={ratio ? { aspectRatio: ratio } : undefined}>
      {state !== 'error' && (
        <img src={media(src)} alt={alt} loading="lazy" decoding="async" onLoad={() => setState('ok')} onError={() => setState('error')} />
      )}
      {state === 'error' && <Holds count={4} seed={src.length} />}
    </div>
  )
}

/* ---------------------------------------------------------
   Лічильник, що «набирає висоту» при появі
   --------------------------------------------------------- */
export function Counter({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const [ref, inView] = useInView<HTMLDivElement>('0px')
  const n = useCountUp(value, inView)
  return (
    <div ref={ref} className="counter">
      <strong>{n}<span>{suffix}</span></strong>
      <small>{label}</small>
    </div>
  )
}

/* ---------------------------------------------------------
   Біжучий рядок
   --------------------------------------------------------- */
export function Marquee({ items }: { items: string[] }) {
  const row = items.map((w, i) => (
    <span key={i} className="marquee__item">{w}<i aria-hidden="true" /></span>
  ))
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">{row}{row}</div>
    </div>
  )
}
