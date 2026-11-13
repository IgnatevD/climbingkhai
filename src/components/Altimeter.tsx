import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useI18n } from '../i18n'
import './Altimeter.css'

const WALL_HEIGHT = 15 // метрів — висота стенда ХАІ
const MAX_DRAWS = 7 // більше відтяжок — уже «шум»

type Draw = { f: number; label: string }

/** Розділи сторінки → позиції відтяжок на мотузці (0..1 — частка прокрутки) */
function measureDraws(sections: HTMLElement[]): Draw[] {
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 0) return []
  const all: Draw[] = []
  for (const s of sections) {
    const top = s.getBoundingClientRect().top + window.scrollY
    // Відтяжка «клацає», коли заголовок розділу доходить до середини екрана
    const f = (top - window.innerHeight * 0.45) / max
    if (f < 0.04 || f > 0.985) continue
    const label = s.querySelector('h1, h2')?.textContent?.trim() ?? ''
    if (all.length && f - all[all.length - 1].f < 0.05) continue // занадто близько — пропускаємо
    all.push({ f, label })
  }
  if (all.length <= MAX_DRAWS) return all
  const step = all.length / MAX_DRAWS
  return Array.from({ length: MAX_DRAWS }, (_, i) => all[Math.floor(i * step)])
}

/**
 * «Висотомір»: прокрутка сторінки = підйом на 15-метровий стенд.
 * На мотузці — відтяжки навпроти кожного розділу: проходиш розділ — мотузка клацає в карабін.
 * Десктоп — вертикальна мотузка праворуч, мобільний — тонка смуга під шапкою з «точками-відтяжками».
 */
export function Altimeter() {
  const { t, lang } = useI18n()
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const sectionsRef = useRef<HTMLElement[]>([])
  const [p, setP] = useState(0)
  const [draws, setDraws] = useState<Draw[]>([])

  /* Прогрес прокрутки */
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const v = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      ref.current?.style.setProperty('--p', v.toFixed(4))
      setP(Math.round(v * 1000) / 1000)
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

  /* Відтяжки: перераховуємо при зміні сторінки та висоти документа (ліниві блоки, фото) */
  useEffect(() => {
    let raf = 0
    const recalc = () => {
      raf = 0
      const main = document.getElementById('main')
      const list = main ? Array.from(main.querySelectorAll<HTMLElement>('section')).filter((s) => s.querySelector('h1, h2')) : []
      sectionsRef.current = list
      const next = measureDraws(list)
      setDraws((prev) =>
        prev.length === next.length && prev.every((d, i) => Math.abs(d.f - next[i].f) < 0.002 && d.label === next[i].label) ? prev : next,
      )
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(recalc) }
    schedule()
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    window.addEventListener('resize', schedule)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(raf)
    }
  }, [pathname])

  const meters = Math.round(p * WALL_HEIGHT * 10) / 10
  const top = p >= 0.997

  const jump = (d: Draw) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: d.f * max + 2, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div ref={ref} className={`altimeter${top ? ' is-top' : ''}`}>
      <div className="altimeter__track">
        <div className="altimeter__rope" aria-hidden="true" />
        {[0, 5, 10, 15].map((m) => (
          <span key={m} className="altimeter__tick" aria-hidden="true" style={{ '--m': m / WALL_HEIGHT } as React.CSSProperties}>{m}</span>
        ))}

        {draws.map((d, i) => {
          const clipped = p >= d.f - 0.002
          return (
            <button
              key={`${pathname}-${i}`}
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className={`qd${clipped ? ' is-clipped' : ''}`}
              style={{ '--f': d.f } as React.CSSProperties}
              onClick={() => jump(d)}
            >
              <span className="qd__bolt" />
              <svg className="qd__icon" viewBox="0 0 14 36" width="14" height="36">
                {/* верхній карабін (на шлямбурі) */}
                <path d="M4.5 1.5 h5 a3 3 0 0 1 3 3 v4 a4.5 4.5 0 0 1-9 0 v-4 a3 3 0 0 1 1-3" className="qd__biner" />
                {/* оттяжка-стропа */}
                <rect x="4.5" y="12" width="5" height="10" rx="2" className="qd__sling" />
                {/* нижній карабін — сюди клацає мотузка */}
                <path d="M4.5 23 h5 a3 3 0 0 1 3 3 v4 a4.5 4.5 0 0 1-9 0 v-4 a3 3 0 0 1 3-3" className="qd__biner qd__biner--rope" />
                <path d="M12.5 26 L9.5 31" className="qd__gate" />
              </svg>
              {d.label && <span className="qd__tip">{d.label}</span>}
            </button>
          )
        })}

        <div className="altimeter__climber" aria-hidden="true">
          <svg viewBox="0 0 24 32" width="18" height="24">
            <rect x="5" y="2" width="12" height="26" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />
            <path d="M17 9v12" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="altimeter__label">
            <small>{t.altimeter.label}</small>
            {top ? t.altimeter.top : `${meters.toFixed(1)} ${lang === 'en' ? 'm' : 'м'}`}
          </span>
        </div>
        <span className="altimeter__flag" aria-hidden="true">🚩</span>
      </div>

      {/* Мобільний */}
      <div className="altimeter__bar" aria-hidden="true" />
      <div className="altimeter__marks" aria-hidden="true">
        {draws.map((d, i) => (
          <span key={`${pathname}-${i}`} className={`altimeter__mark${p >= d.f - 0.002 ? ' is-clipped' : ''}`} style={{ '--f': d.f } as React.CSSProperties} />
        ))}
      </div>
    </div>
  )
}
