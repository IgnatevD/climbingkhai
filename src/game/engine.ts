/**
 * «Лід» — нескінченна траса з нижньою страховкою. Чистий Canvas 2D без бібліотек:
 * малюються лише видимі ряди, DPR обмежений 2, тож гра йде плавно й на старих телефонах.
 *
 * Механіка
 *  • Стіна — ряди по 3 позиції (ліво / центр / право). Щоразу обираєш зачіп у наступному ряду.
 *  • Баланс — «перевернутий маятник»: нахил сам наростає. Хилить праворуч — бери лівий
 *    зачіп, ліворуч — правий, рівно — центральний (він гасить розгойдування).
 *  • Зачепи: «ручка» — надійна; «щипок» — швидко забиває руки; «слопер» — ковзає
 *    (поправляє слабше й непередбачувано); тріснутий — відламується і смикає вбік.
 *  • Кожні 5 рядів — шлямбур із відтяжкою: встигни вщелкнути мотузку (кнопка / пробіл).
 *    Дві пропущені поспіль — ранаут і зрив. Вщелкування коштує трохи сил (одна рука відпущена).
 *  • Сили (кільце довкола зачепа) тануть — не зволікай. З висотою все швидшає.
 *  • Зрив: якщо |нахил| ≥ 1, закінчились сили або ранаут. Мотузка ловить на останній відтяжці.
 */

export type HoldType = 'jug' | 'crimp' | 'sloper' | 'loose'
export type FallReason = 'balance' | 'pump' | 'runout'
export type Hud = { score: number; height: number; combo: number; level: number; clips: number; warn: 'clip' | 'runout' | null }
export type RunStats = { score: number; height: number; moves: number; clips: number; reason: FallReason; seconds: number }
export type Labels = {
  perfect: string
  clip: string
  missed: string
  hintLeft: string
  hintRight: string
  hintCenter: string
  broke: string
}

type Hold = { lane: number; type: HoldType; broken?: boolean }
type Row = { holds: (Hold | null)[]; bolt: null | { side: -1 | 1; clipped: boolean; missed: boolean } }
type Vec = { x: number; y: number }
type Pose = { hl: Vec; hr: Vec; fl: Vec; fr: Vec; hip: Vec; sh: Vec; head: Vec }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number }
type Floater = { x: number; y: number; text: string; life: number; color: string; tag?: string }

/* Константи балів (сервер перевіряє ті самі межі: netlify/functions/game.mts) */
export const METERS_PER_MOVE = 0.6
const CLIP_EVERY = 5
const LEVEL_MAX = 3
const MULT_MAX = 2

const HOLD_GRIP: Record<HoldType, number> = { jug: 1, crimp: 0.68, sloper: 0.8, loose: 1 }

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpV = (a: Vec, b: Vec, t: number): Vec => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) })
const easeOut = (t: number) => 1 - (1 - t) ** 3

type Colors = Record<'wall' | 'wall2' | 'seam' | 'dot' | 'text' | 'text2' | 'rope' | 'accent' | 'jug' | 'crimp' | 'sloper' | 'loose' | 'skin' | 'shirt' | 'pants' | 'danger' | 'ok' | 'warn' | 'metal', string>

function readColors(): Colors {
  const cs = getComputedStyle(document.documentElement)
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f
  const light = cs.colorScheme?.includes('light') && !cs.colorScheme.includes('dark')
  const text = v('--text', '#eef1ed')
  return {
    wall: v('--bg-2', '#171e25'),
    wall2: v('--bg', '#11161b'),
    seam: v('--border-strong', 'rgba(255,255,255,.17)'),
    dot: v('--grid-dot', 'rgba(255,255,255,.06)'),
    text,
    text2: v('--text-2', '#a9b3b8'),
    rope: v('--rope', '#ff6b35'),
    accent: v('--accent', '#ff6b35'),
    jug: v('--hold-teal', '#2ec4b6'),
    crimp: v('--hold-yellow', '#ffd23f'),
    sloper: v('--hold-violet', '#9b7bff'),
    loose: v('--hold-pink', '#ff5d8f'),
    skin: '#e9b48a',
    shirt: v('--hold-teal', '#2ec4b6'),
    pants: light ? '#3a4249' : '#56626b',
    danger: '#e5484d',
    ok: v('--ok', '#57d68d'),
    warn: v('--warn', '#ffcb57'),
    metal: light ? '#8a949b' : '#c9d1d6',
  }
}

export class LeadGame {
  private ctx: CanvasRenderingContext2D
  private W = 0
  private H = 0
  private dpr = 1
  private rowH = 90
  private laneW = 110
  private c: Colors
  private raf = 0
  private last = 0
  private running = false
  private paused = false
  private reduce: boolean

  /* Стан забігу */
  private rand = rng(1)
  private rows: Row[] = []
  private path: number[] = [] // обраний зачіп у кожному ряду (рука)
  private r = 3 // ряд, де зараз верхня рука
  private lean = 0
  private vel = 0
  private grip = 1
  private gripTime = 2.8
  private score = 0
  private moves = 0
  private clips = 0
  private combo = 0
  private missedRow = 0
  private t0 = 0
  private camY = 0
  private shake = 0
  private pose!: Pose
  private poseFrom!: Pose
  private poseT = 1
  private particles: Particle[] = []
  private floaters: Floater[] = []
  private fall: null | { reason: FallReason; t: number; y: number; vy: number; restY: number | null; ground: number; anchor: Vec | null; spin: number; done: boolean } = null
  private warn: Hud['warn'] = null
  private tutorial = 6
  private wallTile: HTMLCanvasElement | null = null

  private canvas: HTMLCanvasElement
  private labels: Labels
  private on: { hud: (h: Hud) => void; over: (s: RunStats) => void }

  constructor(canvas: HTMLCanvasElement, labels: Labels, on: { hud: (h: Hud) => void; over: (s: RunStats) => void }) {
    this.canvas = canvas
    this.labels = labels
    this.on = on
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas 2D недоступний')
    this.ctx = ctx
    this.c = readColors()
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    this.resize()
    this.reset()
    this.drawFrame()
  }

  /* ---------- Публічне API ---------- */
  start() {
    this.reset()
    this.running = true
    this.paused = false
    this.t0 = performance.now()
    this.loop()
  }
  pause() {
    if (!this.running || this.fall) return
    this.paused = true
    cancelAnimationFrame(this.raf)
    this.drawFrame()
  }
  resume() {
    if (!this.running || !this.paused) return
    this.paused = false
    this.loop()
  }
  /** Для автотестів (лише у dev): стан балансу й наступного ряду */
  get debug() {
    return { lean: this.lean, grip: this.grip, r: this.r, next: this.row(this.r + 1).holds.map((h) => h?.type ?? null), clipReady: this.clipBoltRow() !== null }
  }
  get isPaused() {
    return this.paused
  }
  destroy() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }
  refreshTheme() {
    this.c = readColors()
    this.wallTile = null
    if (!this.running || this.paused) this.drawFrame()
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.W = Math.max(280, rect.width)
    this.H = Math.max(360, rect.height)
    this.canvas.width = Math.round(this.W * this.dpr)
    this.canvas.height = Math.round(this.H * this.dpr)
    this.rowH = clamp(this.H / 6.6, 64, 118)
    this.laneW = clamp(this.W * 0.27, 84, 150)
    this.wallTile = null
    if (this.pose) {
      this.pose = this.targetPose()
      this.poseT = 1
      this.camY = this.camTarget()
      if (!this.running || this.paused) this.drawFrame()
    }
  }

  /** Обрати зачіп у наступному ряду: 0 — лівий, 1 — центр, 2 — правий */
  grab(lane: number) {
    if (!this.running || this.paused || this.fall) return
    const next = this.row(this.r + 1)
    const hold = next.holds[lane]
    if (!hold) {
      this.shake = Math.max(this.shake, 4)
      this.grip = Math.max(0, this.grip - 0.08) // хапнув повітря — втратив трохи сил
      return
    }
    this.poseFrom = this.currentPose()
    this.poseT = 0
    this.r++
    this.path[this.r] = lane
    this.moves++

    const side = lane - 1
    const lvl = this.level()
    if (hold.type === 'sloper') {
      this.lean += side * 0.3 + (this.rand() - 0.5) * 0.36
      if (side === 0) this.lean *= 0.7
      this.vel *= 0.65
    } else {
      if (side === 0) this.lean *= 0.42
      else this.lean += side * 0.5
      this.vel *= 0.3
    }
    if (hold.type === 'loose') {
      hold.broken = true
      const kick = this.rand() < 0.5 ? -1 : 1
      this.lean += kick * 0.42
      this.vel += kick * 0.45
      this.float(this.holdPos(this.r, lane), this.labels.broke, this.c.loose)
      this.shake = 8
    }

    const perfect = Math.abs(this.lean) < 0.18 && hold.type !== 'loose'
    this.combo = perfect ? this.combo + 1 : 0
    const mult = this.mult()
    this.score += Math.round(10 * lvl * mult)
    if (perfect && this.combo >= 2) this.float(this.holdPos(this.r, lane), `${this.labels.perfect} ×${mult.toFixed(1)}`, this.c.ok, 'perfect')

    this.gripTime = (2.8 / lvl ** 0.75) * HOLD_GRIP[hold.type]
    this.grip = 1
    if (this.tutorial > 0) this.tutorial--
    this.chalk(this.holdPos(this.r, lane))
    this.checkBolts()
    this.emitHud()
  }

  /** Вщелкнути мотузку у відтяжку поруч */
  clip() {
    if (!this.running || this.paused || this.fall) return
    const b = this.clipBoltRow()
    if (b === null) {
      this.shake = Math.max(this.shake, 3)
      return
    }
    const row = this.row(b)
    row.bolt!.clipped = true
    this.clips++
    this.missedRow = 0
    const bonus = Math.round(25 * this.mult())
    this.score += bonus
    this.grip = Math.max(0.05, this.grip - 0.22)
    this.vel += (this.rand() - 0.5) * 0.3
    this.float(this.boltPos(b), `${this.labels.clip} +${bonus}`, this.c.accent)
    this.emitHud()
  }

  /* ---------- Генерація траси ---------- */
  private reset() {
    this.rand = rng((Math.random() * 2 ** 32) >>> 0)
    this.rows = []
    this.path = [0, 2, 0, 2]
    this.r = 3
    this.lean = (this.rand() - 0.5) * 0.3
    this.vel = 0
    this.grip = 1
    this.gripTime = 2.8
    this.score = 0
    this.moves = 0
    this.clips = 0
    this.combo = 0
    this.missedRow = 0
    this.fall = null
    this.particles = []
    this.floaters = []
    this.warn = null
    this.tutorial = 6
    this.shake = 0
    this.pose = this.targetPose()
    this.poseFrom = this.pose
    this.poseT = 1
    this.camY = this.camTarget()
    this.emitHud()
  }

  private row(i: number): Row {
    while (this.rows.length <= i) this.rows.push(this.genRow(this.rows.length))
    return this.rows[i]
  }

  private genRow(i: number): Row {
    const bolt = i >= CLIP_EVERY && i % CLIP_EVERY === 0 ? { side: (i / CLIP_EVERY) % 2 ? 1 : -1, clipped: false, missed: false } as Row['bolt'] : null
    if (i <= 4) return { holds: [0, 1, 2].map((lane) => ({ lane, type: 'jug' as HoldType })), bolt }
    const depth = clamp((i - 5) / 60, 0, 1)
    const pick = (): HoldType => {
      const w = { jug: 0.46 - 0.2 * depth, crimp: 0.3, sloper: 0.2 + 0.1 * depth, loose: i > 14 ? 0.04 + 0.12 * depth : 0 }
      let x = this.rand() * (w.jug + w.crimp + w.sloper + w.loose)
      for (const k of ['jug', 'crimp', 'sloper', 'loose'] as HoldType[]) {
        x -= w[k]
        if (x <= 0) return k
      }
      return 'jug'
    }
    const holds: (Hold | null)[] = [0, 1, 2].map((lane) => ({ lane, type: pick() }))
    // Здебільшого одна позиція порожня — треба обирати з того, що є
    if (this.rand() < 0.62) holds[Math.floor(this.rand() * 3)] = null
    // Хоча б один надійний зачіп у ряду
    if (!holds.some((h) => h && h.type !== 'loose')) {
      const h = holds.find(Boolean)!
      h.type = 'jug'
    }
    return { holds, bolt }
  }

  /* ---------- Простір ---------- */
  private laneX(lane: number) {
    return this.W / 2 + (lane - 1) * this.laneW
  }
  private rowY(i: number) {
    return -i * this.rowH
  }
  private holdPos(i: number, lane: number): Vec {
    // Невеликий «природний» зсув, щоб стіна не виглядала як сітка
    const j = ((i * 7919 + lane * 104729) % 97) / 97 - 0.5
    return { x: this.laneX(lane) + j * this.laneW * 0.22, y: this.rowY(i) + j * this.rowH * 0.18 }
  }
  private boltPos(i: number): Vec {
    const b = this.row(i).bolt!
    return { x: this.W / 2 + b.side * this.laneW * 0.5, y: this.rowY(i) + this.rowH * 0.42 }
  }
  private camTarget() {
    return this.rowY(this.r) - this.H * 0.36
  }
  private level() {
    return Math.min(LEVEL_MAX, 1 + this.moves / 35)
  }
  private mult() {
    return Math.min(MULT_MAX, 1 + Math.min(this.combo, 10) * 0.1)
  }

  private clipBoltRow(): number | null {
    for (const b of [this.r, this.r - 1]) {
      const row = b >= 0 ? this.row(b) : null
      if (row?.bolt && !row.bolt.clipped && !row.bolt.missed) return b
    }
    return null
  }

  private checkBolts() {
    const b = this.r - 2
    const row = b >= 0 ? this.row(b) : null
    if (row?.bolt && !row.bolt.clipped && !row.bolt.missed) {
      row.bolt.missed = true
      this.missedRow++
      this.float(this.boltPos(b), this.labels.missed, this.c.danger)
      if (this.missedRow >= 2) this.startFall('runout')
    }
    this.warn = this.clipBoltRow() !== null ? 'clip' : this.missedRow > 0 ? 'runout' : null
  }

  /* ---------- Поза скелелаза ---------- */
  private targetPose(): Pose {
    const a = this.holdPos(this.r, this.path[this.r] ?? 1)
    const b = this.holdPos(this.r - 1, this.path[this.r - 1] ?? 1)
    let [hl, hr] = a.x <= b.x ? [a, b] : [b, a]
    if (Math.abs(hl.x - hr.x) < 10) {
      hl = { x: hl.x - 12, y: hl.y }
      hr = { x: hr.x + 12, y: hr.y }
    }
    const f1 = this.holdPos(this.r - 2, this.path[this.r - 2] ?? 0)
    const f2 = this.holdPos(this.r - 3, this.path[this.r - 3] ?? 2)
    let [fl, fr] = f1.x <= f2.x ? [f1, f2] : [f2, f1]
    if (Math.abs(fl.x - fr.x) < 10) {
      fl = { x: fl.x - 14, y: fl.y }
      fr = { x: fr.x + 14, y: fr.y }
    }
    const lean = this.lean * this.laneW * 0.45
    const midX = (hl.x + hr.x + fl.x + fr.x) / 4
    // Плечі — трохи нижче середини між руками, таз — на рівні нижчої ноги (високий крок)
    const handX = (hl.x + hr.x) / 2
    const sh = { x: lerp(handX, midX, 0.4) + lean, y: (hl.y + hr.y) / 2 + this.rowH * 0.62 }
    const hip = { x: midX + lean * 1.25, y: sh.y + this.rowH * 0.74 }
    const head = { x: sh.x + lean * 0.1, y: sh.y - this.rowH * 0.34 }
    return { hl, hr, fl, fr, hip, sh, head }
  }

  private currentPose(): Pose {
    const target = this.targetPose()
    if (this.poseT >= 1) return target
    const t = easeOut(this.poseT)
    const p = {} as Pose
    for (const k of Object.keys(target) as (keyof Pose)[]) p[k] = lerpV(this.poseFrom[k], target[k], t)
    return p
  }

  /* ---------- Цикл ---------- */
  private loop = () => {
    this.last = performance.now()
    const tick = (now: number) => {
      if (!this.running || this.paused) return
      const dt = Math.min(1 / 30, (now - this.last) / 1000)
      this.last = now
      this.update(dt)
      this.drawFrame()
      this.raf = requestAnimationFrame(tick)
    }
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(tick)
  }

  private update(dt: number) {
    if (this.fall) {
      this.updateFall(dt)
    } else {
      const lvl = this.level()
      // Перші метри — спокійні, далі маятник розгойдується все швидше
      const w = 0.82 + 0.78 * (lvl - 1)
      this.vel += this.lean * w * w * dt + (this.rand() - 0.5) * 0.4 * lvl * dt
      this.vel *= Math.exp(-0.7 * dt)
      this.lean += this.vel * dt
      this.grip -= dt / this.gripTime
      if (Math.abs(this.lean) >= 1) this.startFall('balance')
      else if (this.grip <= 0) this.startFall('pump')
      this.poseT = Math.min(1, this.poseT + dt / 0.14)
      this.pose = this.currentPose()
      this.camY = lerp(this.camY, this.camTarget(), 1 - Math.exp(-dt * 7))
    }
    this.shake = Math.max(0, this.shake - dt * 30)
    for (const p of this.particles) {
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 60 * dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const f of this.floaters) {
      f.life -= dt
      f.y -= 38 * dt
    }
    this.floaters = this.floaters.filter((f) => f.life > 0)
  }

  private startFall(reason: FallReason) {
    if (this.fall) return
    // Найвища вщелкнута відтяжка — на ній мотузка й зловить
    let anchor: Vec | null = null
    for (let i = this.r; i >= 0; i--) {
      const row = this.rows[i]
      if (row?.bolt?.clipped) {
        anchor = this.boltPos(i)
        anchor = { x: anchor.x, y: anchor.y + 16 }
        break
      }
    }
    const hipY = this.pose.hip.y
    // Без жодної вщелкнутої відтяжки — падіння до землі (зловить хіба що страхувальник біля самого старту)
    const ground = this.rowY(-1) - this.rowH * 0.35
    const restY = anchor ? Math.min(ground, anchor.y + (anchor.y - hipY) + this.rowH * 1.4) : null
    this.fall = { reason, t: 0, y: 0, vy: -60, restY: restY === null ? null : restY - hipY, ground: ground - hipY, anchor, spin: (this.lean >= 0 ? 1 : -1) * 0.6, done: false }
    this.warn = null
    this.shake = 10
    navigator.vibrate?.(reason === 'runout' ? [60, 40, 120] : 120)
  }

  private updateFall(dt: number) {
    const f = this.fall!
    f.t += dt
    if (f.restY !== null && f.y > f.restY) {
      // Динамічна мотузка м'яко гасить ривок
      f.vy += (-(f.y - f.restY) * 26 - f.vy * 3.2) * dt
    } else {
      f.vy += 1500 * dt
    }
    f.y += f.vy * dt
    if (f.y > f.ground) {
      f.y = f.ground
      f.vy = 0
    }
    f.spin *= Math.exp(-dt * 1.5)
    const focus = this.pose.hip.y + f.y - this.H * 0.55
    this.camY = lerp(this.camY, Math.min(focus, this.rowY(-1) + this.rowH - this.H), 1 - Math.exp(-dt * 5))
    if (!f.done && f.t > (f.restY === null ? 1.1 : 1.6)) {
      f.done = true
      this.running = false
      this.drawFrame()
      this.on.over({
        score: this.score,
        height: Math.round(this.moves * METERS_PER_MOVE * 10) / 10,
        moves: this.moves,
        clips: this.clips,
        reason: f.reason,
        seconds: (performance.now() - this.t0) / 1000,
      })
    }
  }

  private emitHud() {
    this.on.hud({
      score: this.score,
      height: Math.round(this.moves * METERS_PER_MOVE * 10) / 10,
      combo: this.combo,
      level: Math.round(this.level() * 10) / 10,
      clips: this.clips,
      warn: this.warn,
    })
  }

  private chalk(at: Vec) {
    if (this.reduce) return
    for (let i = 0; i < 7; i++) {
      const a = this.rand() * Math.PI * 2
      const s = 20 + this.rand() * 50
      this.particles.push({ x: at.x, y: at.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 0.5 + this.rand() * 0.3, max: 0.8, r: 2 + this.rand() * 3 })
    }
  }
  private float(at: Vec, text: string, color: string, tag?: string) {
    // Новий «Ідеально» замінює попередній, щоб підписи не налазили один на одного
    if (tag) this.floaters = this.floaters.filter((f) => f.tag !== tag)
    this.floaters.push({ x: at.x, y: at.y - 18, text, life: 1.1, color, tag })
  }

  /* ---------- Малювання ---------- */
  private makeWallTile() {
    const tile = document.createElement('canvas')
    const tw = Math.round(this.laneW)
    const th = Math.round(this.rowH * 4)
    tile.width = Math.round(tw * this.dpr)
    tile.height = Math.round(th * this.dpr)
    const g = tile.getContext('2d')!
    g.scale(this.dpr, this.dpr)
    g.fillStyle = this.c.wall
    g.fillRect(0, 0, tw, th)
    g.fillStyle = this.c.dot
    const step = this.laneW / 4
    for (let y = step / 2; y < th; y += step) for (let x = step / 2; x < tw; x += step) {
      g.beginPath()
      g.arc(x, y, 1.6, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = this.c.seam
    g.globalAlpha = 0.5
    g.lineWidth = 1
    g.strokeRect(0.5, 0.5, tw - 1, th - 1)
    this.wallTile = tile
  }

  private drawFrame() {
    const { ctx, W, H, c } = this
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0
    const sy = this.shake ? (Math.random() - 0.5) * this.shake : 0

    // Стіна: панелі-плитки, що зсуваються разом із камерою
    if (!this.wallTile) this.makeWallTile()
    const tile = this.wallTile!
    const tw = tile.width / this.dpr
    const th = tile.height / this.dpr
    const ox = (((W / 2 - this.laneW * 1.5) % tw) + tw) % tw
    const oy = ((-this.camY % th) + th) % th
    for (let y = oy - th; y < H; y += th) for (let x = ox - tw; x < W; x += tw) ctx.drawImage(tile, x + sx, y + sy, tw, th)

    ctx.save()
    ctx.translate(sx, -this.camY + sy)

    const first = Math.max(0, Math.floor(-(this.camY + H) / this.rowH) - 1)
    const lastRow = Math.ceil(-this.camY / this.rowH) + 1

    // Земля під стартом
    const groundY = this.rowY(-1) + this.rowH * 0.2
    if (groundY - this.camY < H + 10) {
      ctx.fillStyle = c.wall2
      ctx.fillRect(-10, groundY, W + 20, H)
      ctx.fillStyle = c.seam
      ctx.fillRect(-10, groundY, W + 20, 2)
    }

    // Зачепи
    for (let i = first; i <= lastRow; i++) {
      const row = this.row(i)
      const isNext = !this.fall && i === this.r + 1
      for (const h of row.holds) if (h) this.drawHold(i, h, isNext, i <= this.r)
    }

    // Відтяжки
    for (let i = first; i <= lastRow; i++) if (this.row(i).bolt) this.drawBolt(i)

    // Мотузка: від страхувальника знизу через вщелкнуті відтяжки до обв'язки
    const fy = this.fall?.y ?? 0
    const pose = this.offsetPose(this.pose, fy)
    const pts: Vec[] = [{ x: W / 2 - this.laneW * 0.9, y: this.rowY(-1) + this.rowH * 0.2 }]
    for (let i = 0; i <= this.r; i++) {
      const row = this.rows[i]
      if (row?.bolt?.clipped) {
        const p = this.boltPos(i)
        pts.push({ x: p.x, y: p.y + 16 })
      }
    }
    this.drawRope(pts, pose.hip)

    this.drawClimber(pose)

    // Крейда й підписи
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.8
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.textAlign = 'center'
    ctx.font = `800 ${Math.round(clamp(this.W / 26, 13, 17))}px ${getComputedStyle(document.body).fontFamily}`
    for (const f of this.floaters) {
      ctx.globalAlpha = clamp(f.life * 1.6, 0, 1)
      ctx.lineWidth = 4
      ctx.strokeStyle = c.wall
      ctx.strokeText(f.text, f.x, f.y)
      ctx.fillStyle = f.color
      ctx.fillText(f.text, f.x, f.y)
    }
    ctx.globalAlpha = 1
    ctx.restore()

    if (!this.fall) this.drawBalance()
  }

  private offsetPose(p: Pose, dy: number): Pose {
    if (!dy) return p
    const f = this.fall!
    // Під час зриву руки й ноги відриваються від зачепів і летять разом із тілом
    const hip = { x: p.hip.x + (f.anchor ? (f.anchor.x - p.hip.x) * clamp(f.t * 1.5, 0, 0.8) : 0), y: p.hip.y + dy }
    const rel = (v: Vec, k: number) => ({ x: hip.x + (v.x - p.hip.x) * k, y: hip.y + (v.y - p.hip.y) * k })
    const k = Math.max(0.55, 1 - f.t * 0.8)
    return { hl: rel(p.hl, k), hr: rel(p.hr, k), fl: rel(p.fl, k), fr: rel(p.fr, k), hip, sh: rel(p.sh, 1), head: rel(p.head, 1) }
  }

  private drawHold(i: number, h: Hold, next: boolean, done: boolean) {
    const { ctx, c } = this
    if (h.broken) return
    const p = this.holdPos(i, h.lane)
    const s = clamp(this.rowH / 90, 0.75, 1.3)
    const color = c[h.type]
    ctx.globalAlpha = done ? 0.55 : 1

    if (next) {
      ctx.fillStyle = color
      ctx.globalAlpha = 0.16
      ctx.beginPath()
      ctx.arc(p.x, p.y, 30 * s, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(0,0,0,.28)'
    ctx.lineWidth = 2
    ctx.beginPath()
    if (h.type === 'jug' || h.type === 'loose') {
      ctx.ellipse(p.x, p.y, 17 * s, 12 * s, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = 'rgba(0,0,0,.32)'
      ctx.beginPath()
      ctx.ellipse(p.x, p.y - 3 * s, 10 * s, 4.5 * s, 0, 0, Math.PI) // «ручка», за яку тримаються
      ctx.fill()
      if (h.type === 'loose') {
        ctx.strokeStyle = 'rgba(0,0,0,.65)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(p.x - 4 * s, p.y - 11 * s)
        ctx.lineTo(p.x + 1 * s, p.y - 3 * s)
        ctx.lineTo(p.x - 3 * s, p.y + 3 * s)
        ctx.lineTo(p.x + 3 * s, p.y + 11 * s)
        ctx.stroke()
      }
    } else if (h.type === 'crimp') {
      ctx.roundRect(p.x - 15 * s, p.y - 4 * s, 30 * s, 9 * s, 4 * s)
      ctx.fill()
      ctx.stroke()
    } else {
      ctx.arc(p.x, p.y + 4 * s, 18 * s, Math.PI, 0)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,.22)'
      ctx.beginPath()
      ctx.ellipse(p.x - 5 * s, p.y - 4 * s, 6 * s, 3 * s, -0.4, 0, Math.PI * 2)
      ctx.fill()
    }
    // Болт зачепа
    ctx.fillStyle = 'rgba(0,0,0,.45)'
    ctx.beginPath()
    ctx.arc(p.x, p.y + (h.type === 'crimp' ? 0 : 1) * s, 2.2 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    // Кільце сил довкола зачепа, на якому висить верхня рука
    if (i === this.r && h.lane === this.path[this.r] && !this.fall && this.running) {
      const g = clamp(this.grip, 0, 1)
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.strokeStyle = 'rgba(0,0,0,.25)'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 26 * s, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = g > 0.5 ? c.ok : g > 0.25 ? c.warn : c.danger
      ctx.beginPath()
      ctx.arc(p.x, p.y, 26 * s, -Math.PI / 2, -Math.PI / 2 + g * Math.PI * 2)
      ctx.stroke()
      ctx.lineCap = 'butt'
    }
  }

  private drawBolt(i: number) {
    const { ctx, c } = this
    const b = this.row(i).bolt!
    const p = this.boltPos(i)
    const s = clamp(this.rowH / 90, 0.75, 1.3)
    const active = !this.fall && this.running && this.clipBoltRow() === i
    if (active) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 140)
      ctx.strokeStyle = c.accent
      ctx.globalAlpha = 0.35 + 0.45 * pulse
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(p.x, p.y + 10 * s, 22 * s, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    ctx.globalAlpha = b.missed ? 0.4 : 1
    // Шлямбур
    ctx.fillStyle = c.metal
    ctx.beginPath()
    ctx.arc(p.x, p.y - 8 * s, 5 * s, 0, Math.PI * 2)
    ctx.fill()
    // Відтяжка: стропа + нижній карабін
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 4 * s
    ctx.beginPath()
    ctx.moveTo(p.x, p.y - 6 * s)
    ctx.lineTo(p.x, p.y + 8 * s)
    ctx.stroke()
    ctx.strokeStyle = c.metal
    ctx.lineWidth = 2.4 * s
    ctx.beginPath()
    ctx.ellipse(p.x, p.y + 14 * s, 5 * s, 8 * s, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  private drawRope(pts: Vec[], harness: Vec) {
    const { ctx, c } = this
    ctx.strokeStyle = c.rope
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
    const a = pts[pts.length - 1]
    const d = Math.hypot(harness.x - a.x, harness.y - a.y)
    const taut = this.fall && this.fall.anchor && this.fall.y > 0
    const sag = taut ? 0 : Math.min(60, d * 0.25)
    ctx.quadraticCurveTo((a.x + harness.x) / 2, Math.max(a.y, harness.y) + sag, harness.x, harness.y)
    ctx.stroke()
  }

  private drawClimber(p: Pose) {
    const { ctx, c } = this
    const s = clamp(this.rowH / 90, 0.75, 1.3)
    const spin = this.fall ? this.fall.spin * Math.min(1, this.fall.t * 2) : this.lean * 0.25
    ctx.save()
    ctx.translate(p.hip.x, p.hip.y)
    ctx.rotate(spin)
    ctx.translate(-p.hip.x, -p.hip.y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const limb = (from: Vec, to: Vec, out: number, color: string, w: number) => {
      const mx = (from.x + to.x) / 2
      const my = (from.y + to.y) / 2
      const dx = to.x - from.x
      const dy = to.y - from.y
      const len = Math.hypot(dx, dy) || 1
      const bend = out * clamp(this.rowH * 1.1 - len * 0.5, 4, 26)
      const jx = mx + (-dy / len) * bend
      const jy = my + (dx / len) * bend
      ctx.strokeStyle = color
      ctx.lineWidth = w
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(jx, jy)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    }

    // Ноги
    const hipL = { x: p.hip.x - 6 * s, y: p.hip.y }
    const hipR = { x: p.hip.x + 6 * s, y: p.hip.y }
    limb(hipL, p.fl, -1, c.pants, 9 * s)
    limb(hipR, p.fr, 1, c.pants, 9 * s)
    // Тулуб
    ctx.strokeStyle = c.shirt
    ctx.lineWidth = 15 * s
    ctx.beginPath()
    ctx.moveTo(p.hip.x, p.hip.y)
    ctx.lineTo(p.sh.x, p.sh.y)
    ctx.stroke()
    // Обв'язка
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 4 * s
    ctx.beginPath()
    ctx.moveTo(p.hip.x - 8 * s, p.hip.y - 2 * s)
    ctx.lineTo(p.hip.x + 8 * s, p.hip.y - 2 * s)
    ctx.stroke()
    // Руки
    const shL = { x: p.sh.x - 7 * s, y: p.sh.y }
    const shR = { x: p.sh.x + 7 * s, y: p.sh.y }
    limb(shL, p.hl, 1, c.skin, 7 * s)
    limb(shR, p.hr, -1, c.skin, 7 * s)
    // Голова й каска
    ctx.fillStyle = c.skin
    ctx.beginPath()
    ctx.arc(p.head.x, p.head.y, 9 * s, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c.accent
    ctx.beginPath()
    ctx.arc(p.head.x, p.head.y - 1 * s, 10.5 * s, Math.PI * 1.05, Math.PI * 1.95)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  private drawBalance() {
    const { ctx, c, W } = this
    const bw = Math.min(280, W * 0.62)
    const x = (W - bw) / 2
    const y = 64
    const h = 10
    ctx.fillStyle = 'rgba(0,0,0,.32)'
    ctx.beginPath()
    ctx.roundRect(x - 4, y - 4, bw + 8, h + 8, 9)
    ctx.fill()
    // Небезпечні краї
    const zone = bw * 0.15
    ctx.fillStyle = c.danger
    ctx.globalAlpha = 0.55
    ctx.beginPath()
    ctx.roundRect(x, y, zone, h, [5, 0, 0, 5])
    ctx.roundRect(x + bw - zone, y, zone, h, [0, 5, 5, 0])
    ctx.fill()
    ctx.globalAlpha = 0.5
    ctx.fillStyle = c.ok
    ctx.fillRect(x + bw / 2 - bw * 0.09, y, bw * 0.18, h)
    ctx.globalAlpha = 1
    // Стрілка нахилу
    const nx = x + bw / 2 + clamp(this.lean, -1, 1) * (bw / 2)
    const danger = Math.abs(this.lean) > 0.7
    ctx.fillStyle = danger ? c.danger : '#fff'
    ctx.beginPath()
    ctx.roundRect(nx - 3, y - 6, 6, h + 12, 3)
    ctx.fill()

    // Підказка для перших ходів
    if (this.tutorial > 0 && this.running) {
      const hint = Math.abs(this.lean) < 0.18 ? this.labels.hintCenter : this.lean > 0 ? this.labels.hintRight : this.labels.hintLeft
      ctx.font = `700 13px ${getComputedStyle(document.body).fontFamily}`
      ctx.textAlign = 'center'
      ctx.lineWidth = 4
      ctx.strokeStyle = c.wall
      ctx.strokeText(hint, W / 2, y + h + 24)
      ctx.fillStyle = c.text
      ctx.fillText(hint, W / 2, y + h + 24)
    }
  }
}
