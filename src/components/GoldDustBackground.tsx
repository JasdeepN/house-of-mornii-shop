import { useEffect, useRef } from 'react'

/* ──────────────────────────────────────────────────────────────────────────────
 *  Gold-Dust Wave — Optimized WebGL2 Point Sprites
 *
 *  Performance architecture:
 *    1. WebGL2 point sprites — ALL particles drawn in a single gl.drawArrays().
 *    2. Half-resolution canvas (RENDER_SCALE=0.5) — 4× fewer fragment invocations.
 *    3. Pre-computed 32×32 turbulence grid per frame — 1024 noise calls instead
 *       of 12K+ per-particle fastNoise lookups. Grid bilinear-interpolated.
 *    4. Reduced particle counts (12K desktop, 6K tablet, 2K mobile) with larger
 *       particle sizes to compensate visually.
 *    5. Pre-rendered smoke textures via Canvas2D noise — eliminates SVG
 *       feTurbulence re-computation (was 36M+ pixel filter ops at 4K).
 *    6. Sprite atlas as WebGL texture — sampled in fragment shader.
 *    7. Additive blending via gl.blendFunc(ONE, ONE) — glow on dark bg.
 *    8. will-change hints on all animated layers for compositor-only updates.
 *    9. Tiered performance: mobile 2K/30fps, tablet 6K/30fps, desktop 12K/45fps.
 * ────────────────────────────────────────────────────────────────────────────*/

// ─── Noise (pre-computed LUT, zero per-frame hash calls) ────────────────────

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0
  h = ((h ^ (h >> 13)) * 1274126177) | 0
  return (h ^ (h >> 16)) / 2147483648
}

const NOISE_SIZE = 256
const NOISE_MASK = 255
const NOISE_LUT  = new Float32Array(NOISE_SIZE * NOISE_SIZE)
for (let y = 0; y < NOISE_SIZE; y++)
  for (let x = 0; x < NOISE_SIZE; x++)
    NOISE_LUT[y * NOISE_SIZE + x] = (hash(x, y) + 1) * 0.5

function fastNoise(x: number, y: number): number {
  const xf = ((x % NOISE_SIZE) + NOISE_SIZE) % NOISE_SIZE
  const yf = ((y % NOISE_SIZE) + NOISE_SIZE) % NOISE_SIZE
  const ix = xf | 0
  const iy = yf | 0
  const fx = xf - ix
  const fy = yf - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const ix1 = (ix + 1) & NOISE_MASK
  const iy1 = (iy + 1) & NOISE_MASK
  const row0 = iy  * NOISE_SIZE
  const row1 = iy1 * NOISE_SIZE
  return (NOISE_LUT[row0 + ix] * (1 - sx) + NOISE_LUT[row0 + ix1] * sx) * (1 - sy)
       + (NOISE_LUT[row1 + ix] * (1 - sx) + NOISE_LUT[row1 + ix1] * sx) * sy
}

// ─── Gold palette — 12 deep colour variations ──────────────────────────────

const GOLDS: [number, number, number][] = [
  [201, 169, 97],  [212, 175, 55],  [244, 231, 195], [163, 139, 95],
  [232, 213, 163], [180, 145, 60],  [140, 110, 55],  [225, 195, 120],
  [170, 135, 45],  [255, 235, 180], [120, 95, 45],   [195, 165, 80],
]

// ─── Sprite atlas — pre-rendered glow dots ──────────────────────────────────

const SPRITE_SIZE = 32
const ATLAS_COLS  = GOLDS.length

function buildSpriteAtlas(): HTMLCanvasElement {
  const atlas = document.createElement('canvas')
  atlas.width  = SPRITE_SIZE * ATLAS_COLS
  atlas.height = SPRITE_SIZE
  const ac = atlas.getContext('2d')!
  for (let i = 0; i < ATLAS_COLS; i++) {
    const [r, g, b] = GOLDS[i]
    const cx = i * SPRITE_SIZE + SPRITE_SIZE / 2
    const cy = SPRITE_SIZE / 2
    const rad = SPRITE_SIZE / 2
    const grad = ac.createRadialGradient(cx, cy, 0, cx, cy, rad)
    grad.addColorStop(0.0,  `rgba(${r},${g},${b},1.0)`)
    grad.addColorStop(0.15, `rgba(${r},${g},${b},0.85)`)
    grad.addColorStop(0.4,  `rgba(${r},${g},${b},0.35)`)
    grad.addColorStop(0.7,  `rgba(${r},${g},${b},0.10)`)
    grad.addColorStop(1.0,  `rgba(${r},${g},${b},0.0)`)
    ac.fillStyle = grad
    ac.fillRect(i * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE)
  }
  return atlas
}

// ─── Gaussian random (Box-Muller) ───────────────────────────────────────────

function gaussRand(sigma = 1): number {
  const u1 = Math.random() || 1e-10
  const u2 = Math.random()
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// ─── Particle data — Float32Array for performance ───────────────────────────
//
// Layout per particle (12 floats):
//   0: baseOffX   1: baseOffY   2: driftX     3: driftY
//   4: size        5: baseOpacity 6: colorIdx  7: speedBias
//   8: twinklePhase 9: distNorm  10: delay     11: depth

const STRIDE = 12
const TRAIL_SIZE = 512
const TRAIL_MASK = TRAIL_SIZE - 1
const TRAIL_MAX  = 480

function initParticles(
  buf: Float32Array, count: number, sigmaX: number, sigmaY: number,
) {
  for (let i = 0; i < count; i++) {
    const o = i * STRIDE
    const ox = gaussRand(sigmaX)
    const oy = gaussRand(sigmaY)
    const dist = Math.sqrt((ox / sigmaX) ** 2 + (oy / sigmaY) ** 2)
    const distNorm = Math.min(dist / 2.5, 1)
    const centreBias = 1 - distNorm * 0.6

    buf[o + 0]  = ox
    buf[o + 1]  = oy
    buf[o + 2]  = 0
    buf[o + 3]  = 0
    buf[o + 4]  = (0.25 + Math.pow(Math.random(), 2.2) * 5.0) * centreBias
    buf[o + 5]  = (0.18 + Math.random() * 0.65) * centreBias
    buf[o + 6]  = Math.floor(Math.random() * ATLAS_COLS)
    buf[o + 7]  = 0.5 + Math.random() * 1.0
    buf[o + 8]  = Math.random() * Math.PI * 2
    buf[o + 9]  = distNorm
    buf[o + 10] = Math.min(
      Math.floor(-Math.log(Math.random() + 0.00001) * 80),
      TRAIL_MAX,
    )
    buf[o + 11] = 0.25 + Math.random() * 0.75
  }
}

// ─── Catmull-Rom spline path system ─────────────────────────────────────────

interface Pt { nx: number; ny: number }

function cr(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t, t3 = t2 * t
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  )
}

function evalSpline(pts: Pt[], u: number): Pt {
  const n = pts.length
  const s = Math.min(u, 0.9999) * (n - 1)
  const i = Math.floor(s)
  const t = s - i
  const i0 = Math.max(i - 1, 0)
  const i1 = i
  const i2 = Math.min(i + 1, n - 1)
  const i3 = Math.min(i + 2, n - 1)
  return {
    nx: cr(pts[i0].nx, pts[i1].nx, pts[i2].nx, pts[i3].nx, t),
    ny: cr(pts[i0].ny, pts[i1].ny, pts[i2].ny, pts[i3].ny, t),
  }
}

type SpeedProfile = 'constant' | 'ease-inout' | 'slow-middle' | 'pulse' | 'accelerate'

function speedMultiplier(profile: SpeedProfile, progress: number, age: number): number {
  switch (profile) {
    case 'constant':    return 1.0
    case 'ease-inout':  return 0.4 + 1.2 * Math.sin(progress * Math.PI)
    case 'slow-middle': return 0.3 + 1.4 * (1 - Math.sin(progress * Math.PI))
    case 'pulse':       return 0.5 + 0.8 * (0.5 + 0.5 * Math.sin(age * 0.08))
    case 'accelerate':  return 0.4 + 1.2 * progress
  }
}

const PATH_TEMPLATES: Pt[][] = [
  // 0 — left → right, gentle arc up
  [{ nx: -0.15, ny: 0.65 }, { nx: 0.15, ny: 0.65 }, { nx: 0.5, ny: 0.28 }, { nx: 0.85, ny: 0.35 }, { nx: 1.15, ny: 0.40 }],
  // 1 — left → right, arc down
  [{ nx: -0.15, ny: 0.35 }, { nx: 0.15, ny: 0.35 }, { nx: 0.5, ny: 0.70 }, { nx: 0.85, ny: 0.65 }, { nx: 1.15, ny: 0.60 }],
  // 2 — left → right, S-curve
  [{ nx: -0.15, ny: 0.70 }, { nx: 0.15, ny: 0.70 }, { nx: 0.30, ny: 0.25 }, { nx: 0.55, ny: 0.55 }, { nx: 0.70, ny: 0.75 }, { nx: 0.85, ny: 0.30 }, { nx: 1.15, ny: 0.30 }],
  // 3 — right → left, S-curve (mirrored)
  [{ nx: 1.15, ny: 0.30 }, { nx: 0.85, ny: 0.30 }, { nx: 0.70, ny: 0.75 }, { nx: 0.55, ny: 0.55 }, { nx: 0.30, ny: 0.25 }, { nx: 0.15, ny: 0.70 }, { nx: -0.15, ny: 0.70 }],
  // 4 — left → right, big clockwise loop then exit
  [{ nx: -0.15, ny: 0.50 }, { nx: 0.20, ny: 0.50 }, { nx: 0.40, ny: 0.20 }, { nx: 0.70, ny: 0.20 }, { nx: 0.80, ny: 0.50 }, { nx: 0.70, ny: 0.78 }, { nx: 0.40, ny: 0.78 }, { nx: 0.55, ny: 0.50 }, { nx: 0.85, ny: 0.45 }, { nx: 1.15, ny: 0.45 }],
  // 5 — top → bottom diagonal
  [{ nx: 0.15, ny: -0.10 }, { nx: 0.20, ny: 0.15 }, { nx: 0.45, ny: 0.50 }, { nx: 0.70, ny: 0.80 }, { nx: 0.85, ny: 1.10 }],
  // 6 — bottom → top diagonal
  [{ nx: 0.20, ny: 1.10 }, { nx: 0.25, ny: 0.80 }, { nx: 0.50, ny: 0.45 }, { nx: 0.75, ny: 0.20 }, { nx: 0.80, ny: -0.10 }],
  // 7 — enter left, exit bottom
  [{ nx: -0.15, ny: 0.35 }, { nx: 0.15, ny: 0.35 }, { nx: 0.40, ny: 0.40 }, { nx: 0.55, ny: 0.60 }, { nx: 0.55, ny: 0.85 }, { nx: 0.50, ny: 1.10 }],
  // 8 — enter bottom, exit right
  [{ nx: 0.35, ny: 1.10 }, { nx: 0.35, ny: 0.80 }, { nx: 0.45, ny: 0.60 }, { nx: 0.60, ny: 0.45 }, { nx: 0.80, ny: 0.40 }, { nx: 1.15, ny: 0.38 }],
  // 9 — deep wide S
  [{ nx: -0.15, ny: 0.20 }, { nx: 0.10, ny: 0.20 }, { nx: 0.25, ny: 0.80 }, { nx: 0.50, ny: 0.20 }, { nx: 0.75, ny: 0.80 }, { nx: 0.90, ny: 0.20 }, { nx: 1.15, ny: 0.20 }],
  // 10 — right → left, arc up
  [{ nx: 1.15, ny: 0.65 }, { nx: 0.85, ny: 0.65 }, { nx: 0.50, ny: 0.28 }, { nx: 0.15, ny: 0.35 }, { nx: -0.15, ny: 0.40 }],
  // 11 — right → left, big counter-clockwise loop
  [{ nx: 1.15, ny: 0.50 }, { nx: 0.80, ny: 0.50 }, { nx: 0.60, ny: 0.80 }, { nx: 0.30, ny: 0.80 }, { nx: 0.20, ny: 0.50 }, { nx: 0.30, ny: 0.22 }, { nx: 0.60, ny: 0.22 }, { nx: 0.45, ny: 0.50 }, { nx: 0.15, ny: 0.45 }, { nx: -0.15, ny: 0.45 }],
]

const SPEED_PROFILES: SpeedProfile[] = ['constant', 'ease-inout', 'slow-middle', 'pulse', 'accelerate']

// ─── Wave state ─────────────────────────────────────────────────────────────

interface WaveState {
  cx: number; cy: number; progress: number; dt: number; age: number
  buf: Float32Array; count: number; spline: Pt[]; speedProfile: SpeedProfile
  trailX: Float32Array; trailY: Float32Array
  trailHead: number; trailFilled: number
  draining: boolean; drainAge: number
}

function spawnWave(W: number, H: number, count: number): WaveState {
  const sigmaX = W * 0.055
  const sigmaY = H * 0.10
  const spline = PATH_TEMPLATES[Math.floor(Math.random() * PATH_TEMPLATES.length)]
  const speedProfile = SPEED_PROFILES[Math.floor(Math.random() * SPEED_PROFILES.length)]

  const steps = 40
  let pathLen = 0
  for (let i = 1; i <= steps; i++) {
    const a = evalSpline(spline, (i - 1) / steps)
    const b = evalSpline(spline, i / steps)
    pathLen += Math.hypot((b.nx - a.nx) * W, (b.ny - a.ny) * H)
  }
  const targetSpeed = 3.5 + Math.random() * 3.0
  const dt = 1 / (pathLen / targetSpeed)

  const buf = new Float32Array(count * STRIDE)
  initParticles(buf, count, sigmaX, sigmaY)
  const start = evalSpline(spline, 0)

  return {
    cx: start.nx * W, cy: start.ny * H, progress: 0, dt, age: 0,
    buf, count, spline, speedProfile,
    trailX: new Float32Array(TRAIL_SIZE), trailY: new Float32Array(TRAIL_SIZE),
    trailHead: 0, trailFilled: 0, draining: false, drainAge: 0,
  }
}

// ─── Performance tiers ──────────────────────────────────────────────────────

interface PerfTier {
  count: number; fpsTarget: number
  pauseMin: number; pauseMax: number
}

const TIER_MOBILE:  PerfTier = { count: 2000,  fpsTarget: 30, pauseMin: 120, pauseMax: 300 }
const TIER_TABLET:  PerfTier = { count: 6000,  fpsTarget: 30, pauseMin: 80,  pauseMax: 200 }
const TIER_DESKTOP: PerfTier = { count: 12000, fpsTarget: 45, pauseMin: 60,  pauseMax: 180 }

function detectTier(): PerfTier {
  const w = window.innerWidth
  if (w < 768) return TIER_MOBILE
  if (w < 1024) return TIER_TABLET
  return TIER_DESKTOP
}

// ─── WebGL2 Shaders ─────────────────────────────────────────────────────────

const VERT_SRC = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
layout(location=1) in float a_size;
layout(location=2) in float a_alpha;
layout(location=3) in float a_colIdx;
uniform vec2 u_res;
out float v_alpha;
out float v_colIdx;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = a_size;
  v_alpha  = a_alpha;
  v_colIdx = a_colIdx;
}
`

const FRAG_SRC = `#version 300 es
precision mediump float;
in float v_alpha;
in float v_colIdx;
uniform sampler2D u_atlas;
uniform float u_atlasInvCols;
out vec4 fragColor;
void main() {
  vec2 uv = gl_PointCoord;
  uv.x = (v_colIdx + uv.x) * u_atlasInvCols;
  vec4 t = texture(u_atlas, uv);
  fragColor = vec4(t.rgb * v_alpha, t.a * v_alpha);
}
`

// ─── WebGL helpers ──────────────────────────────────────────────────────────

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error('Shader compile: ' + gl.getShaderInfoLog(s))
  return s
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const p = gl.createProgram()!
  gl.attachShader(p, vs)
  gl.attachShader(p, fs)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    throw new Error('Program link: ' + gl.getProgramInfoLog(p))
  return p
}

function createTexFromCanvas(gl: WebGL2RenderingContext, src: HTMLCanvasElement): WebGLTexture {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src)
  return tex
}

// ─── Render buffer layout — CPU fills, GPU reads ────────────────────────────
// Per visible particle: [x, y, drawSize, alpha, colorIdx] = 5 floats
const RBUF_STRIDE = 5

// ─── Pre-rendered smoke textures (replaces SVG feTurbulence) ─────────────────
// Generated once using Canvas2D noise, eliminating continuous SVG filter re-computation.

interface SmokeLayer {
  scaleX: number; scaleY: number; seed: number
  r: number; g: number; b: number
  alphaScale: number; alphaOffset: number
  blur: number
}

const SMOKE_LAYERS: SmokeLayer[] = [
  { scaleX: 0.018, scaleY: 0.024, seed: 42,  r: 0.30, g: 0.22, b: 0.08, alphaScale: 2.0, alphaOffset: -0.65, blur: 2 },
  { scaleX: 0.030, scaleY: 0.018, seed: 137, r: 0.08, g: 0.18, b: 0.22, alphaScale: 2.2, alphaOffset: -0.75, blur: 2 },
  { scaleX: 0.012, scaleY: 0.018, seed: 89,  r: 0.22, g: 0.14, b: 0.05, alphaScale: 1.8, alphaOffset: -0.55, blur: 2 },
]

function generateSmokeTexture(
  w: number, h: number, layer: SmokeLayer,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width  = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const d = img.data
  const { scaleX, scaleY, seed, r, g, b, alphaScale, alphaOffset } = layer
  const seedX = seed * 17.3
  const seedY = seed * 31.7
  const r255 = (r * 255) | 0
  const g255 = (g * 255) | 0
  const b255 = (b * 255) | 0

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const nx = px * scaleX + seedX
      const ny = py * scaleY + seedY
      // 2-octave fractal noise (matches SVG numOctaves=2)
      const n = (fastNoise(nx, ny) + fastNoise(nx * 2, ny * 2) * 0.5) / 1.5
      let a = n * alphaScale + alphaOffset
      if (a < 0) a = 0; else if (a > 1) a = 1
      const idx = (py * w + px) * 4
      d[idx]     = r255
      d[idx + 1] = g255
      d[idx + 2] = b255
      d[idx + 3] = (a * 255) | 0
    }
  }
  ctx.putImageData(img, 0, 0)

  // Apply soft blur if supported
  const blurred = document.createElement('canvas')
  blurred.width  = w
  blurred.height = h
  const bCtx = blurred.getContext('2d')!
  if ('filter' in bCtx) {
    bCtx.filter = `blur(${layer.blur}px)`
  }
  bCtx.drawImage(canvas, 0, 0)
  return blurred
}

// Lazy-generated smoke data URLs (runs once on first call, ~30ms total)
let _smokeDataUrls: string[] | null = null
function getSmokeDataUrls(): string[] {
  if (_smokeDataUrls) return _smokeDataUrls
  const w = Math.max(256, Math.round(window.innerWidth / 6))
  const h = Math.max(144, Math.round(window.innerHeight / 6))
  _smokeDataUrls = SMOKE_LAYERS.map(layer =>
    generateSmokeTexture(w, h, layer).toDataURL()
  )
  return _smokeDataUrls
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GoldDustBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const canvas = canvasRef.current
    if (!canvas) return

    const tier = detectTier()
    const COUNT = tier.count
    const FRAME_INTERVAL = 1000 / tier.fpsTarget

    // Build assets once
    const atlas = buildSpriteAtlas()

    // ── Try WebGL2 (97%+ browser support) ──
    const gl = canvas.getContext('webgl2', {
      alpha: false, premultipliedAlpha: false, antialias: false,
      depth: false, stencil: false, powerPreference: 'low-power',
    }) as WebGL2RenderingContext | null

    // Fallback: Canvas2D (opaque black + CSS screen blend = transparent black)
    const ctx = gl ? null : canvas.getContext('2d', { alpha: false })
    const useWebGL = !!gl

    // ── WebGL2 resource handles ──
    let particleProg: WebGLProgram | null = null
    let particleVAO: WebGLVertexArrayObject | null = null
    let particleVBO: WebGLBuffer | null = null
    let atlasTex: WebGLTexture | null = null
    let uRes: WebGLUniformLocation | null = null

    // Pre-allocated render buffer
    const renderBuf = new Float32Array(COUNT * RBUF_STRIDE)

    if (useWebGL && gl) {
      // Compile shaders & link programs
      const vs  = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC)
      const fs  = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC)
      particleProg = linkProgram(gl, vs, fs)
      gl.deleteShader(vs); gl.deleteShader(fs)

      // Particle VAO + VBO
      const BPF = 4
      particleVAO = gl.createVertexArray()!
      gl.bindVertexArray(particleVAO)
      particleVBO = gl.createBuffer()!
      gl.bindBuffer(gl.ARRAY_BUFFER, particleVBO)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, RBUF_STRIDE * BPF, 0)             // a_pos
      gl.enableVertexAttribArray(1)
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, RBUF_STRIDE * BPF, 2 * BPF)       // a_size
      gl.enableVertexAttribArray(2)
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, RBUF_STRIDE * BPF, 3 * BPF)       // a_alpha
      gl.enableVertexAttribArray(3)
      gl.vertexAttribPointer(3, 1, gl.FLOAT, false, RBUF_STRIDE * BPF, 4 * BPF)       // a_colIdx
      gl.bindVertexArray(null)

      // Texture
      atlasTex = createTexFromCanvas(gl, atlas)

      // Uniform locations
      uRes = gl.getUniformLocation(particleProg, 'u_res')

      // Additive blending — ONE+ONE on dark bg ≈ screen but cheaper
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE)
      gl.disable(gl.DEPTH_TEST)

      // Static uniforms
      gl.useProgram(particleProg)
      gl.uniform1i(gl.getUniformLocation(particleProg, 'u_atlas'), 0)
      gl.uniform1f(gl.getUniformLocation(particleProg, 'u_atlasInvCols'), 1.0 / ATLAS_COLS)
    }

    let raf = 0
    let pauseTimer = 0
    let running = true
    let lastFrameTime = 0

    const dpr = 1
    const RENDER_SCALE = 0.5
    function resize() {
      const vw = window.innerWidth, vh = window.innerHeight
      canvas!.width  = Math.round(vw * RENDER_SCALE)
      canvas!.height = Math.round(vh * RENDER_SCALE)
      canvas!.style.width  = vw + 'px'
      canvas!.style.height = vh + 'px'
      if (useWebGL && gl) {
        gl.viewport(0, 0, canvas!.width, canvas!.height)
      } else if (ctx) {
        ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0)
      }
    }
    resize()
    window.addEventListener('resize', resize)

    const W = () => window.innerWidth
    const H = () => window.innerHeight

    let wave: WaveState | null = null

    function startPause() {
      const pauseMs = (tier.pauseMin + Math.random() * (tier.pauseMax - tier.pauseMin)) * (1000 / 60)
      if (useWebGL && gl) {
        gl.clear(gl.COLOR_BUFFER_BIT)
      } else if (ctx) {
        ctx.clearRect(0, 0, W(), H())
      }
      // Hide CSS glow orbs during pause
      const gc = glowRef.current
      if (gc) for (let i = 0; i < gc.children.length; i++)
        (gc.children[i] as HTMLElement).style.opacity = '0'
      pauseTimer = window.setTimeout(() => {
        if (!running) return
        wave = spawnWave(W(), H(), COUNT)
        lastFrameTime = 0
        raf = requestAnimationFrame(frame)
      }, pauseMs)
    }

    // Adaptive particle throttle
    let activeCount = COUNT
    const TARGET_MS = FRAME_INTERVAL - 4

    // Turbulence constants
    const TURB_SCALE     = 0.004
    const TURB_STRENGTH  = 0.45
    const DRIFT_DECAY    = 0.982

    // Sin/Cos LUT (used for twinkle)
    const SIN_LUT = new Float32Array(1024)
    for (let i = 0; i < 1024; i++) {
      SIN_LUT[i] = Math.sin((i / 1024) * Math.PI * 2)
    }
    function fastSin(a: number) { return SIN_LUT[((a % (Math.PI * 2) + Math.PI * 2) / (Math.PI * 2) * 1024) & 1023] }

    // ── Turbulence grid — pre-computed per frame (replaces per-particle noise) ──
    const TURB_GRID = 32
    const turbPushX = new Float32Array(TURB_GRID * TURB_GRID)
    const turbPushY = new Float32Array(TURB_GRID * TURB_GRID)

    function fillTurbulenceGrid(ageNoise: number, viewW: number, viewH: number) {
      const cellW = viewW / TURB_GRID
      const cellH = viewH / TURB_GRID
      const TWO_PI = Math.PI * 2
      for (let gy = 0; gy < TURB_GRID; gy++) {
        const wy = (gy + 0.5) * cellH
        for (let gx = 0; gx < TURB_GRID; gx++) {
          const wx = (gx + 0.5) * cellW
          const noiseVal = fastNoise(wx * TURB_SCALE + ageNoise, wy * TURB_SCALE + ageNoise * 0.75)
          const angle = noiseVal * TWO_PI
          const idx = gy * TURB_GRID + gx
          turbPushX[idx] = Math.cos(angle) * TURB_STRENGTH
          turbPushY[idx] = Math.sin(angle) * TURB_STRENGTH
        }
      }
    }

    /** Simulate one particle and write directly into the render buffer.
     *  Returns true if the particle is visible, false if culled.
     *  Uses pre-computed turbulence grid instead of per-particle noise. */
    function simulateParticle(
      buf: Float32Array, i: number, trailX: Float32Array, trailY: Float32Array,
      tHead: number, tFilled: number, ageTwinkle: number,
      cw: number, ch: number, out: Float32Array, outOff: number,
    ): boolean {
      const o = i * STRIDE
      const bAlpha = buf[o + 5]
      const dNorm  = buf[o + 9]
      const delay  = buf[o + 10] | 0
      const depth  = buf[o + 11]

      // Early alpha cull
      const lookback = delay < tFilled ? delay : tFilled - 1
      const tailFade = 1 - lookback / (TRAIL_MAX * 1.1)
      const edgeFade = 1 - dNorm * dNorm * 1.2
      const depthAlpha = 0.25 + depth * 0.75
      if (tailFade <= 0 || edgeFade <= 0 || bAlpha * edgeFade * tailFade * depthAlpha < 0.008) return false

      const baseOX = buf[o + 0]
      const baseOY = buf[o + 1]
      let   driftX = buf[o + 2]
      let   driftY = buf[o + 3]
      const size   = buf[o + 4]
      const colIdx = buf[o + 6]
      const tPhase = buf[o + 8]
      const depthSpread = 0.4 + depth * 0.6
      const depthSize   = 0.35 + depth * 0.65

      const tIdx  = (tHead - 1 - lookback) & TRAIL_MASK
      const ptx   = trailX[tIdx]
      const pty   = trailY[tIdx]
      const roughX = ptx + baseOX * depthSpread
      const roughY = pty + baseOY * depthSpread
      if (roughX < -250 || roughX > cw + 250 || roughY < -150 || roughY > ch + 150) return false

      // Turbulence — bilinear grid lookup (replaces per-particle fastNoise + churn)
      const turbX = ((roughX + driftX) / cw) * (TURB_GRID - 1)
      const turbY = ((roughY + driftY) / ch) * (TURB_GRID - 1)
      const tgx = turbX < 0 ? 0 : turbX > TURB_GRID - 2 ? TURB_GRID - 2 : turbX | 0
      const tgy = turbY < 0 ? 0 : turbY > TURB_GRID - 2 ? TURB_GRID - 2 : turbY | 0
      const tfx = turbX - tgx
      const tfy = turbY - tgy
      const tgi = tgy * TURB_GRID + tgx
      const pushX = (turbPushX[tgi] * (1 - tfx) + turbPushX[tgi + 1] * tfx) * (1 - tfy)
                   + (turbPushX[tgi + TURB_GRID] * (1 - tfx) + turbPushX[tgi + TURB_GRID + 1] * tfx) * tfy
      const pushY = (turbPushY[tgi] * (1 - tfx) + turbPushY[tgi + 1] * tfx) * (1 - tfy)
                   + (turbPushY[tgi + TURB_GRID] * (1 - tfx) + turbPushY[tgi + TURB_GRID + 1] * tfx) * tfy

      driftX = (driftX + pushX) * DRIFT_DECAY
      driftY = (driftY + pushY) * DRIFT_DECAY
      buf[o + 2] = driftX
      buf[o + 3] = driftY

      const px = ptx + (baseOX + driftX) * depthSpread
      const py = pty + (baseOY + driftY) * depthSpread
      if (px < -30 || px > cw + 30 || py < -30 || py > ch + 30) return false

      const twinkle = 0.6 + 0.4 * fastSin(ageTwinkle * (0.5 + depth * 0.5) + tPhase)
      const alpha = bAlpha * edgeFade * tailFade * twinkle * depthAlpha
      if (alpha < 0.008) return false

      const drawSize = (size * depthSize * 4 * RENDER_SCALE) | 0 || 1
      out[outOff    ] = px * RENDER_SCALE
      out[outOff + 1] = py * RENDER_SCALE
      out[outOff + 2] = drawSize
      out[outOff + 3] = alpha
      out[outOff + 4] = colIdx
      return true
    }

    function frame(now: number) {
      if (!running) return

      // FPS cap
      if (lastFrameTime && now - lastFrameTime < FRAME_INTERVAL * 0.85) {
        raf = requestAnimationFrame(frame)
        return
      }
      lastFrameTime = now

      const frameStart = performance.now()
      const cw = W(), ch = H()

      if (!wave) { startPause(); return }

      // Advance along spline
      wave.age++
      if (!wave.draining) {
        const spMul = speedMultiplier(wave.speedProfile, wave.progress, wave.age)
        wave.progress = Math.min(wave.progress + wave.dt * spMul, 1)
        const pos = evalSpline(wave.spline, wave.progress)
        const noiseWobble = fastNoise(wave.age * 0.0008, wave.progress * 4) * (ch * 0.025)
        wave.cx = pos.nx * cw
        wave.cy = pos.ny * ch + noiseWobble
        if (wave.progress >= 1) wave.draining = true
      } else {
        wave.drainAge++
        if (wave.drainAge > TRAIL_MAX) { wave = null; startPause(); return }
      }

      // Push to trail ring buffer
      const wh = wave.trailHead & TRAIL_MASK
      wave.trailX[wh] = wave.cx
      wave.trailY[wh] = wave.cy
      wave.trailHead++
      if (wave.trailFilled < TRAIL_SIZE) wave.trailFilled++

      const drainFade = wave.draining ? Math.max(0, 1 - wave.drainAge / (TRAIL_MAX * 0.5)) : 1

      const buf       = wave.buf
      const trailX    = wave.trailX
      const trailY    = wave.trailY
      const tHead     = wave.trailHead
      const tFilled   = wave.trailFilled
      const ageNoise  = wave.age * 0.0025
      const ageTwinkle = wave.age * 0.025
      const visLimit  = Math.min(activeCount, wave.count)

      // Pre-compute turbulence grid for this frame (1024 noise calls instead of 12K+)
      fillTurbulenceGrid(ageNoise, cw, ch)

      // Canvas dimensions (render-scaled)
      const canvasW = Math.round(cw * RENDER_SCALE)
      const canvasH = Math.round(ch * RENDER_SCALE)

      // ── WebGL2 render path ──
      if (useWebGL && gl) {
        gl.clear(gl.COLOR_BUFFER_BIT)

        // Particles — fill render buffer (zero allocations)
        let visCount = 0
        for (let i = 0; i < visLimit; i++) {
          if (simulateParticle(buf, i, trailX, trailY, tHead, tFilled, ageTwinkle, cw, ch, renderBuf, visCount * RBUF_STRIDE)) {
            visCount++
          }
        }

        // Upload + draw ALL particles in ONE call
        gl.useProgram(particleProg!)
        gl.uniform2f(uRes!, canvasW, canvasH)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, atlasTex!)
        gl.bindVertexArray(particleVAO!)
        gl.bindBuffer(gl.ARRAY_BUFFER, particleVBO!)
        gl.bufferData(gl.ARRAY_BUFFER, renderBuf.subarray(0, visCount * RBUF_STRIDE), gl.DYNAMIC_DRAW)
        gl.drawArrays(gl.POINTS, 0, visCount)

      // ── Canvas2D fallback ──
      } else if (ctx) {
        ctx.clearRect(0, 0, canvasW, canvasH)

        // Particles — simulate into renderBuf, then draw
        let visCount = 0
        for (let i = 0; i < visLimit; i++) {
          if (simulateParticle(buf, i, trailX, trailY, tHead, tFilled, ageTwinkle, cw, ch, renderBuf, visCount * RBUF_STRIDE)) {
            visCount++
          }
        }
        for (let j = 0; j < visCount; j++) {
          const ro = j * RBUF_STRIDE
          const drawSize = renderBuf[ro + 2]
          const halfDraw = drawSize >> 1
          ctx.globalAlpha = renderBuf[ro + 3]
          ctx.drawImage(
            atlas, (renderBuf[ro + 4] | 0) * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE,
            (renderBuf[ro] | 0) - halfDraw, (renderBuf[ro + 1] | 0) - halfDraw, drawSize, drawSize,
          )
        }
        ctx.globalAlpha = 1
      }

      // ── Update CSS glow divs (GPU-composited, float-precision blur) ──
      const glowContainer = glowRef.current
      if (glowContainer) {
        const glowKids = glowContainer.children as HTMLCollectionOf<HTMLElement>
        // Glow positions: wave center + trail lookbacks
        const glowPositions: { x: number; y: number; opacity: number }[] = [
          { x: wave.cx, y: wave.cy, opacity: 0.18 * drainFade },
        ]
        const trailSteps = [50, 120, 220, 350]
        const trailOpacities = [0.12, 0.08, 0.05, 0.03]
        for (let g = 0; g < trailSteps.length; g++) {
          const back = trailSteps[g]
          if (wave.trailFilled > back) {
            const ti = (wave.trailHead - 1 - Math.min(back, wave.trailFilled - 1)) & TRAIL_MASK
            glowPositions.push({
              x: wave.trailX[ti],
              y: wave.trailY[ti],
              opacity: trailOpacities[g] * drainFade,
            })
          }
        }
        for (let i = 0; i < glowKids.length; i++) {
          const el = glowKids[i]
          if (i < glowPositions.length) {
            const gp = glowPositions[i]
            el.style.transform = `translate(${gp.x}px, ${gp.y}px)`
            el.style.opacity = String(gp.opacity)
          } else {
            el.style.opacity = '0'
          }
        }
      }

      // Adaptive throttle — aggressive recovery
      if (wave.age > 30) {
        const elapsed = performance.now() - frameStart
        if (elapsed > TARGET_MS && activeCount > COUNT * 0.25)
          activeCount = (activeCount * 0.85) | 0
        else if (elapsed < TARGET_MS * 0.6 && activeCount < COUNT)
          activeCount = Math.min(activeCount + 200, COUNT)
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    function onVis() {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
        clearTimeout(pauseTimer)
      } else {
        running = true
        lastFrameTime = 0
        if (wave) raf = requestAnimationFrame(frame)
        else startPause()
      }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      clearTimeout(pauseTimer)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
      // WebGL resource cleanup
      if (gl) {
        if (particleVBO) gl.deleteBuffer(particleVBO)
        if (particleVAO) gl.deleteVertexArray(particleVAO)
        if (atlasTex) gl.deleteTexture(atlasTex)
        if (particleProg) gl.deleteProgram(particleProg)
      }
    }
  }, [])

  const smokeUrls = getSmokeDataUrls()

  return (
    <>
      {/* CSS keyframes for slow smoke drift animations */}
      <style>{`
        @keyframes smokeDrift1 {
          0%   { transform: translate(-6%, -4%) scale(1.12) rotate(-1deg); opacity: 0.38; }
          25%  { transform: translate(-2%, -1%) scale(1.18) rotate(0deg);  opacity: 0.45; }
          50%  { transform: translate(4%,   3%) scale(1.22) rotate(1.5deg); opacity: 0.40; }
          75%  { transform: translate(2%,   5%) scale(1.16) rotate(0.5deg); opacity: 0.48; }
          100% { transform: translate(-6%, -4%) scale(1.12) rotate(-1deg); opacity: 0.38; }
        }
        @keyframes smokeDrift2 {
          0%   { transform: translate(5%,  3%) scale(1.2)  rotate(1deg);  opacity: 0.28; }
          30%  { transform: translate(1%,  6%) scale(1.15) rotate(-0.5deg); opacity: 0.35; }
          60%  { transform: translate(-4%, 1%) scale(1.22) rotate(-2deg); opacity: 0.30; }
          100% { transform: translate(5%,  3%) scale(1.2)  rotate(1deg);  opacity: 0.28; }
        }
        @keyframes smokeDrift3 {
          0%   { transform: translate(0%,  -3%) scale(1.1)  rotate(0deg);  opacity: 0.20; }
          40%  { transform: translate(-3%, 2%)  scale(1.18) rotate(2deg);  opacity: 0.26; }
          70%  { transform: translate(2%,  4%)  scale(1.22) rotate(-1deg); opacity: 0.22; }
          100% { transform: translate(0%,  -3%) scale(1.1)  rotate(0deg);  opacity: 0.20; }
        }
      `}</style>

      {/* Pre-rendered smoke textures — static canvas noise, zero per-frame filter cost */}
      {/* Layer 1: Warm gold smoke */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 1,
          inset: '-10%',
          width: '120%',
          height: '120%',
          mixBlendMode: 'screen',
          animation: 'smokeDrift1 50s ease-in-out infinite',
          willChange: 'transform, opacity',
          backgroundImage: `url(${smokeUrls[0]})`,
          backgroundSize: 'cover',
        }}
        aria-hidden="true"
      />

      {/* Layer 2: Teal mist */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 1,
          inset: '-10%',
          width: '120%',
          height: '120%',
          mixBlendMode: 'screen',
          animation: 'smokeDrift2 65s ease-in-out infinite',
          willChange: 'transform, opacity',
          backgroundImage: `url(${smokeUrls[1]})`,
          backgroundSize: 'cover',
        }}
        aria-hidden="true"
      />

      {/* Layer 3: Deep warm wisps */}
      <div
        className="fixed pointer-events-none"
        style={{
          zIndex: 1,
          inset: '-10%',
          width: '120%',
          height: '120%',
          mixBlendMode: 'screen',
          animation: 'smokeDrift3 80s ease-in-out infinite',
          willChange: 'transform, opacity',
          backgroundImage: `url(${smokeUrls[2]})`,
          backgroundSize: 'cover',
        }}
        aria-hidden="true"
      />

      {/* CSS glow orbs — GPU-composited filter:blur() */}
      <div
        ref={glowRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1, willChange: 'transform' }}
        aria-hidden="true"
      >
        {[80, 55, 35].map((blur, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: -blur,
              top: -blur,
              width: blur * 2,
              height: blur * 2,
              borderRadius: '50%',
              background: 'oklch(0.50 0.10 78)',
              filter: `blur(${blur}px)`,
              opacity: 0,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Dust-wave particle canvas — screen blend lights up the dark background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1, mixBlendMode: 'screen' }}
        aria-hidden="true"
      />
    </>
  )
}
