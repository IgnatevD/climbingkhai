import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import './Altimeter.css'

const WALL_HEIGHT = 15 // метрів — висота стенда ХАІ

/**
 * «Висотомір»: прокрутка сторінки = підйом на 15-метровий стенд.
 * Десктоп — вертикальна мотузка з карабіном праворуч, мобільний — тонка смуга під шапкою.
 */
export function Altimeter() {
  const { t, lang } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [meters, setMeters] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      ref.current?.style.setProperty('--p', p.toFixed(4))
      setMeters(Math.round(p * WALL_HEIGHT * 10) / 10)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const top = meters >= WALL_HEIGHT - 0.05

  return (
    <div ref={ref} className={`altimeter${top ? ' is-top' : ''}`} aria-hidden="true">
      <div className="altimeter__track">
        <div className="altimeter__rope" />
        {[0, 5, 10, 15].map((m) => (
          <span key={m} className="altimeter__tick" style={{ '--m': m / WALL_HEIGHT } as React.CSSProperties}>{m}</span>
        ))}
        <div className="altimeter__climber">
          <svg viewBox="0 0 24 32" width="18" height="24">
            <rect x="5" y="2" width="12" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M17 9v12" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="altimeter__label">
            <small>{t.altimeter.label}</small>
            {top ? t.altimeter.top : `${meters.toFixed(1)} ${lang === 'en' ? 'm' : 'м'}`}
          </span>
        </div>
        <span className="altimeter__flag">🚩</span>
      </div>
      <div className="altimeter__bar" />
    </div>
  )
}
