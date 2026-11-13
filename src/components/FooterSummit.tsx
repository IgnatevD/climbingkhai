import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useI18n } from '../i18n'
import './FooterSummit.css'

/** Дальній хребет футера (viewBox 1440×160) — спільний для SVG і маски скелелаза */
export const RIDGE_FAR: [number, number][] = [
  [0, 110], [120, 70], [210, 98], [330, 40], [430, 92], [540, 58], [640, 100], [760, 20],
  [880, 90], [980, 62], [1090, 104], [1200, 50], [1320, 96], [1440, 66],
]
export const RIDGE_FAR_D = `M0 160 ${RIDGE_FAR.map(([x, y]) => `L${x} ${y}`).join(' ')} L1440 160Z`
export const PEAK: [number, number] = [760, 20]
const VB_W = 1440
const VB_H = 160

/** Небо над хребтом: скелелаз «виходить» з-за гори, а не з'являється в повітрі */
const SKY_CLIP = `polygon(0% -400%, 100% -400%, ${[...RIDGE_FAR]
  .reverse()
  .map(([x, y]) => `${((x / VB_W) * 100).toFixed(2)}% ${((y / VB_H) * 100).toFixed(2)}%`)
  .join(', ')})`

/** Висота хребта (у viewBox-одиницях) у точці x — лінійна інтерполяція між вершинами */
function groundY(x: number) {
  for (let i = 1; i < RIDGE_FAR.length; i++) {
    const [x1, y1] = RIDGE_FAR[i - 1]
    const [x2, y2] = RIDGE_FAR[i]
    if (x <= x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)
  }
  return RIDGE_FAR[RIDGE_FAR.length - 1][1]
}

/**
 * Вихід на вершину: коли людина догортає сторінку до кінця, маленький скелелаз
 * виходить з-за хребта до прапорця й махає рукою. Один раз на сторінку.
 */
export function FooterSummit({ children }: { children: React.ReactNode }) {
  const { t, to } = useI18n()
  const { pathname } = useLocation()
  const wrap = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0, h: 40 })
  const [upAt, setUpAt] = useState<string | null>(null)
  const up = upAt === pathname

  /* Де стоїть скелелаз: трохи лівіше від прапорця, ногами на схилі (хребет розтягнутий — рахуємо в пікселях) */
  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const place = () => {
      const { width: W, height: H } = el.getBoundingClientRect()
      if (!W) return
      const h = Math.round(Math.min(46, Math.max(28, H * 0.34))) // зріст скелелаза
      const px = (PEAK[0] / VB_W) * W - h * 0.42 // центр фігурки, px
      const vx = (px / W) * VB_W
      setPos({ x: px, y: (groundY(vx) / VB_H) * H, h })
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* Тригер: футер видно, і людина справді прогорнула сторінку */
  useEffect(() => {
    const el = wrap.current
    if (!el || up) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && window.scrollY > window.innerHeight * 0.5) setUpAt(pathname)
      },
      { threshold: 0.9 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [pathname, up])

  const style = { '--x': `${pos.x}px`, '--y': `${pos.y}px`, '--h': `${pos.h}px` } as React.CSSProperties

  return (
    <div ref={wrap} className={`summit${up ? ' is-up' : ''}`} style={style}>
      {children}
      <div className="summit__sky" style={{ clipPath: SKY_CLIP, WebkitClipPath: SKY_CLIP }} aria-hidden="true">
        <svg className="summit__climber" viewBox="0 0 40 60">
          <path d="M20 34 L13 58 M20 34 L27 58" className="summit__limb" />
          <path d="M20 21 L11 33" className="summit__limb" />
          <path d="M20 21 L31 8" className="summit__limb summit__wave" />
          <path d="M20 17 V35" className="summit__torso" />
          <path d="M15 33 H25" className="summit__harness" />
          <circle cx="20" cy="10" r="6" className="summit__head" />
          <path d="M13.6 9 a6.4 6.4 0 0 1 12.8 0 Z" className="summit__helmet" />
        </svg>
      </div>
      <p className="summit__bubble" inert={!up}>
        <b>{t.footer.summit}</b>
        <Link to={to('training')}>{t.footer.summitCta} <span aria-hidden="true">→</span></Link>
      </p>
    </div>
  )
}
