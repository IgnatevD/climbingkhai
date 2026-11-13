import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { usePageMeta } from '../hooks'
import { Grade } from '../components/ui'
import { Carabiner } from '../components/Icons'
import { LeadGame, type Hud, type RunStats } from '../game/engine'
import './Game.css'

type Leader = { name: string; score: number; height: number; at: number }
type Phase = 'menu' | 'live' | 'paused' | 'over'

const LS_NAME = 'lead-game:name'
const LS_BEST = 'lead-game:best'
const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* приватний режим — не страшно */
    }
  },
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/game/${path}`, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  return data as T
}

const EMPTY_HUD: Hud = { score: 0, height: 0, combo: 0, level: 1, clips: 0, warn: null }

/**
 * Сторінка гри «Лід». Сама гра — canvas (src/game/engine.ts), тут — інтерфейс:
 * старт, пауза, результат, збереження в таблицю лідерів (Netlify Blobs через /api/game).
 */
export default function Game() {
  const { t, lang } = useI18n()
  const g = t.game
  usePageMeta(`${g.title} — ${t.meta.short}`, g.meta)

  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<LeadGame | null>(null)
  const ticket = useRef<Promise<string | null> | null>(null)
  const phaseRef = useRef<Phase>('menu')

  const [phase, setPhaseState] = useState<Phase>('menu')
  const [hud, setHud] = useState<Hud>(EMPTY_HUD)
  const [result, setResult] = useState<RunStats | null>(null)
  const [best, setBest] = useState(() => Number(ls.get(LS_BEST)) || 0)
  const [newBest, setNewBest] = useState(false)
  const [name, setName] = useState(() => ls.get(LS_NAME) ?? '')
  const [editName, setEditName] = useState(() => !ls.get(LS_NAME))
  const [save, setSave] = useState<{ state: 'idle' | 'saving' | 'done' | 'error'; text?: string }>({ state: 'idle' })
  const [leaders, setLeaders] = useState<Leader[] | null>(null)
  const [boardError, setBoardError] = useState(false)

  const setPhase = (p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }

  const loadBoard = useCallback(() => {
    api<{ top: Leader[] }>('top')
      .then((d) => {
        setLeaders(d.top)
        setBoardError(false)
      })
      .catch(() => setBoardError(true))
  }, [])

  useEffect(loadBoard, [loadBoard])

  const submit = useCallback(
    async (stats: RunStats, who: string) => {
      const clean = who.replace(/\s+/g, ' ').trim()
      if (clean.length < 2 || stats.score <= 0) return
      setSave({ state: 'saving' })
      try {
        const token = await ticket.current
        if (!token) throw new Error(g.unavailable)
        const r = await api<{ rank: number | null; top: Leader[] }>('score', {
          method: 'POST',
          body: JSON.stringify({ token, name: clean, score: stats.score, moves: stats.moves, clips: stats.clips }),
        })
        ls.set(LS_NAME, clean)
        setEditName(false)
        setLeaders(r.top)
        setBoardError(false)
        setSave({ state: 'done', text: r.rank ? g.saved.replace('{n}', String(r.rank)) : g.savedOut })
      } catch (e) {
        setSave({ state: 'error', text: e instanceof Error ? e.message : g.unavailable })
      }
    },
    [g],
  )

  // Створення рушія — один раз; тексти оновлюються при зміні мови
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const game = new LeadGame(el, g.labels, {
      hud: setHud,
      over: (stats) => {
        setResult(stats)
        setPhase('over')
        const prev = Number(ls.get(LS_BEST)) || 0
        const record = stats.score > prev
        setNewBest(record)
        if (record) {
          ls.set(LS_BEST, String(stats.score))
          setBest(stats.score)
        }
        const saved = ls.get(LS_NAME)
        if (saved && stats.score > 0) void submit(stats, saved)
      },
    })
    engine.current = game
    if (import.meta.env.DEV) (window as unknown as { __lead?: LeadGame }).__lead = game
    const ro = new ResizeObserver(() => game.resize())
    ro.observe(el)
    // Перемикач теми: перемальовуємо кольори
    const mo = new MutationObserver(() => game.refreshTheme())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    const mq = matchMedia('(prefers-color-scheme: light)')
    const onScheme = () => game.refreshTheme()
    mq.addEventListener('change', onScheme)
    return () => {
      ro.disconnect()
      mo.disconnect()
      mq.removeEventListener('change', onScheme)
      game.destroy()
      engine.current = null
    }
  }, [lang])

  const start = useCallback(() => {
    ticket.current = api<{ token: string }>('start', { method: 'POST' })
      .then((d) => d.token)
      .catch(() => null)
    setResult(null)
    setSave({ state: 'idle' })
    setNewBest(false)
    setHud(EMPTY_HUD)
    setPhase('live')
    // Після того як сцена розгорнулась на весь екран (телефон) — оновити розмір і почати
    requestAnimationFrame(() => {
      engine.current?.resize()
      engine.current?.start()
      const el = stage.current
      if (!el) return
      el.focus({ preventScroll: true })
      // Ноутбук: підкрутити сторінку так, щоб уся сцена була на екрані під шапкою
      if (matchMedia('(min-width: 760px)').matches) {
        const header = document.querySelector('.header')?.getBoundingClientRect().height ?? 64
        const top = el.getBoundingClientRect().top + window.scrollY - header - 12
        if (Math.abs(window.scrollY - top) > 4) window.scrollTo({ top, behavior: 'smooth' })
      }
    })
  }, [])

  const pause = useCallback(() => {
    if (phaseRef.current !== 'live') return
    engine.current?.pause()
    setPhase('paused')
  }, [])
  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return
    setPhase('live')
    requestAnimationFrame(() => engine.current?.resume())
  }, [])
  const exit = useCallback(() => {
    engine.current?.destroy()
    setResult(null)
    setPhase('menu')
  }, [])

  // Телефон: вийти з повноекранного режиму й показати таблицю лідерів
  const toBoard = useCallback(() => {
    setPhase('menu')
    requestAnimationFrame(() => document.getElementById('game-board-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [])

  // Клавіатура
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = phaseRef.current
      if ((e.target as HTMLElement)?.closest('input, textarea')) return
      if (p === 'live') {
        const lane = { ArrowLeft: 0, KeyA: 0, ArrowDown: 1, ArrowUp: 1, KeyS: 1, KeyW: 1, ArrowRight: 2, KeyD: 2 }[e.code]
        if (lane !== undefined) {
          e.preventDefault()
          if (!e.repeat) engine.current?.grab(lane)
        } else if (e.code === 'Space' || e.code === 'KeyC' || e.code === 'KeyF') {
          e.preventDefault()
          if (!e.repeat) engine.current?.clip()
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault()
          pause()
        }
      } else if (p === 'paused' && (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'Space')) {
        e.preventDefault()
        resume()
      } else if ((p === 'menu' || p === 'over') && (e.code === 'Enter' || e.code === 'Space') && stage.current?.matches(':hover, :focus-within')) {
        e.preventDefault()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pause, resume, start])

  // Пауза, коли вкладку сховали
  useEffect(() => {
    const onVis = () => document.hidden && pause()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('blur', pause)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('blur', pause)
    }
  }, [pause])

  // На телефоні під час гри сцена на весь екран — блокуємо прокрутку сторінки
  useEffect(() => {
    const live = phase !== 'menu'
    document.documentElement.classList.toggle('game-lock', live)
    return () => document.documentElement.classList.remove('game-lock')
  }, [phase])

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phaseRef.current !== 'live') return
    e.preventDefault()
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    engine.current?.grab(x < 1 / 3 ? 0 : x < 2 / 3 ? 1 : 2)
  }

  const live = phase !== 'menu'
  const fmt = (n: number) => n.toLocaleString(lang === 'uk' ? 'uk-UA' : 'en-US')
  const myName = (ls.get(LS_NAME) ?? '').toLocaleLowerCase()

  return (
    <section className="game-page">
      <div className="container game-page__head">
        <Grade value="∞">{g.grade}</Grade>
        <h1 className="h2">{g.title}</h1>
        <p className="lead">{g.lead}</p>
      </div>

      <div className="container game-layout">
        <div
          ref={stage}
          className={`game-stage${live ? ' is-live' : ''}`}
          tabIndex={-1}
          aria-label={g.title}
        >
          <canvas ref={canvas} className="game-canvas" onPointerDown={onPointer} aria-hidden="true" />

          {/* Панель зверху */}
          {(phase === 'live' || phase === 'paused') && (
            <div className="game-hud">
              <div className="game-hud__stat">
                <span>{g.score}</span>
                <b>{fmt(hud.score)}</b>
              </div>
              <div className="game-hud__stat">
                <span>{g.height}</span>
                <b>
                  {hud.height.toFixed(1)} {g.m}
                </b>
              </div>
              {hud.combo >= 2 && (
                <div className="game-hud__stat game-hud__combo" key={hud.combo}>
                  <span>{g.combo}</span>
                  <b>×{hud.combo}</b>
                </div>
              )}
              <button type="button" className="game-hud__pause" onClick={pause} aria-label={g.pause}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Кнопка вщелкування */}
          {phase === 'live' && (
            <button
              type="button"
              className={`game-clip${hud.warn === 'clip' ? ' is-ready' : ''}${hud.warn === 'runout' ? ' is-runout' : ''}`}
              onPointerDown={(e) => {
                e.preventDefault()
                engine.current?.clip()
              }}
              aria-label={g.clip}
            >
              <Carabiner width={26} height={26} />
              <span>{hud.warn === 'clip' ? g.warnClip : hud.warn === 'runout' ? g.warnRunout : g.clip}</span>
            </button>
          )}

          {phase === 'menu' && (
            <div className="game-overlay">
              <div className="game-card">
                <h2 className="game-card__title">{g.title}</h2>
                <ol className="game-how" role="list">
                  {g.how.map((h, i) => (
                    <li key={h.t}>
                      <span className="game-how__n">{i + 1}</span>
                      <div>
                        <b>{h.t}</b>
                        <p>{h.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <ul className="game-holds" role="list">
                  {(Object.keys(g.holds) as (keyof typeof g.holds)[]).map((k) => (
                    <li key={k}>
                      <i className={`game-hold game-hold--${k}`} aria-hidden="true" />
                      {g.holds[k]}
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn btn--primary game-card__cta" onClick={start}>
                  {g.play} <span className="arrow">→</span>
                </button>
                <p className="game-card__keys">
                  <span className="only-touch">{g.taps}</span>
                  <span className="only-mouse">{g.keys}</span>
                </p>
                {best > 0 && (
                  <p className="game-card__best">
                    {g.best}: <b>{fmt(best)}</b>
                  </p>
                )}
              </div>
            </div>
          )}

          {phase === 'paused' && (
            <div className="game-overlay">
              <div className="game-card game-card--small">
                <h2 className="game-card__title">{g.paused}</h2>
                <button type="button" className="btn btn--primary game-card__cta" onClick={resume}>
                  {g.resume}
                </button>
                <button type="button" className="btn btn--ghost" onClick={exit}>
                  {g.exit}
                </button>
              </div>
            </div>
          )}

          {phase === 'over' && result && (
            <div className="game-overlay">
              <div className="game-card">
                <p className="game-card__fall">{g.fall}</p>
                <p className="muted">{g.reasons[result.reason]}</p>
                <div className="game-result">
                  <div>
                    <span>{g.score}</span>
                    <b>{fmt(result.score)}</b>
                  </div>
                  <div>
                    <span>{g.height}</span>
                    <b>
                      {result.height.toFixed(1)} {g.m}
                    </b>
                  </div>
                  <div>
                    <span>{g.best}</span>
                    <b>{fmt(best)}</b>
                  </div>
                </div>
                {newBest && <p className="game-card__record">{g.newBest}</p>}

                {result.score > 0 &&
                  (editName || save.state === 'error' ? (
                    <form
                      className="game-save"
                      onSubmit={(e) => {
                        e.preventDefault()
                        void submit(result, name)
                      }}
                    >
                      <label htmlFor="game-name">{g.name}</label>
                      <div className="game-save__row">
                        <input
                          id="game-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={g.namePh}
                          maxLength={20}
                          minLength={2}
                          autoComplete="nickname"
                          enterKeyHint="send"
                          required
                        />
                        <button type="submit" className="btn btn--ghost" disabled={save.state === 'saving' || save.state === 'done'}>
                          {save.state === 'saving' ? g.saving : g.save}
                        </button>
                      </div>
                      {save.state === 'error' && <p className="game-save__err">{save.text}</p>}
                    </form>
                  ) : (
                    <p className="game-save__status">
                      {save.state === 'saving' ? g.saving : save.text}
                      {save.state !== 'saving' && (
                        <button type="button" className="game-link" onClick={() => { setEditName(true); setSave({ state: 'idle' }) }}>
                          {g.change}
                        </button>
                      )}
                    </p>
                  ))}

                <button type="button" className="btn btn--primary game-card__cta" onClick={start}>
                  {g.again} <span className="arrow">↻</span>
                </button>
                <button type="button" className="game-link game-card__board" onClick={toBoard}>
                  {g.leaders} ↓
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="game-board card" aria-labelledby="game-board-title">
          <h2 id="game-board-title" className="game-board__title">
            <Carabiner width={20} height={20} /> {g.leaders}
          </h2>
          {boardError && !leaders?.length ? (
            <p className="muted game-board__note">{g.unavailable}</p>
          ) : leaders === null ? (
            <ol className="game-board__list is-loading" role="list">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} />
              ))}
            </ol>
          ) : leaders.length === 0 ? (
            <p className="muted game-board__note">{g.empty}</p>
          ) : (
            <ol className="game-board__list" role="list">
              {leaders.map((l, i) => (
                <li key={l.name + l.at} className={l.name.toLocaleLowerCase() === myName ? 'is-me' : undefined}>
                  <span className="game-board__rank">{i + 1}</span>
                  <span className="game-board__name">
                    {l.name}
                    {l.name.toLocaleLowerCase() === myName && <em> · {g.you}</em>}
                  </span>
                  <span className="game-board__h">
                    {l.height.toFixed(1)} {g.m}
                  </span>
                  <b className="game-board__score">{fmt(l.score)}</b>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </section>
  )
}
