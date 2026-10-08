import * as THREE from 'three'
import type { PlanetKind } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Procedural noise (seamless on a sphere because we sample in 3D)    */
/* ------------------------------------------------------------------ */
function hash(ix: number, iy: number, iz: number, seed: number) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1274126177) ^ Math.imul(seed, 1103515245)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
const fade = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function noise3(x: number, y: number, z: number, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi)
  const c000 = hash(xi, yi, zi, seed), c100 = hash(xi + 1, yi, zi, seed)
  const c010 = hash(xi, yi + 1, zi, seed), c110 = hash(xi + 1, yi + 1, zi, seed)
  const c001 = hash(xi, yi, zi + 1, seed), c101 = hash(xi + 1, yi, zi + 1, seed)
  const c011 = hash(xi, yi + 1, zi + 1, seed), c111 = hash(xi + 1, yi + 1, zi + 1, seed)
  return lerp(
    lerp(lerp(c000, c100, xf), lerp(c010, c110, xf), yf),
    lerp(lerp(c001, c101, xf), lerp(c011, c111, xf), yf),
    zf,
  )
}

export function fbm3(x: number, y: number, z: number, oct: number, seed = 0) {
  let sum = 0, amp = 0.5, f = 1, norm = 0
  for (let i = 0; i < oct; i++) {
    sum += noise3(x * f, y * f, z * f, seed + i * 17) * amp
    norm += amp
    amp *= 0.5
    f *= 2.03
  }
  return sum / norm
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/* ------------------------------------------------------------------ */
/*  Async job queue: textures are generated in small slices so the     */
/*  main thread (and scrolling) never freezes.                         */
/* ------------------------------------------------------------------ */
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))
let chain: Promise<unknown> = Promise.resolve()
export function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const p = chain.then(job)
  chain = p.catch(() => undefined)
  return p
}

function canvasTexture(data: Uint8ClampedArray, w: number, h: number, srgb: boolean) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d')!.putImageData(new ImageData(data, w, h), 0, 0)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

/* ------------------------------------------------------------------ */
/*  Planet surfaces                                                     */
/* ------------------------------------------------------------------ */
const out = [0, 0, 0, 0] // r, g, b, height (scratch to avoid allocations)
const mix3 = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number, t: number) => {
  out[0] = r1 + (r2 - r1) * t
  out[1] = g1 + (g2 - g1) * t
  out[2] = b1 + (b2 - b1) * t
}

function shade(kind: PlanetKind, x: number, y: number, z: number, lat: number, seed: number) {
  const polar = Math.abs(lat)
  switch (kind) {
    case 'terra':
    case 'ocean': {
      const sea = kind === 'terra' ? 0.52 : 0.62
      const b = fbm3(x * 2.2, y * 2.2, z * 2.2, 6, seed)
      if (b < sea) {
        mix3(5, 16, 36, 20, 68, 104, smooth(0.25, sea, b))
        out[3] = 0.3
      } else {
        const e = clamp01((b - sea) / 0.28)
        const m = fbm3(x * 4 + 9, y * 4, z * 4, 4, seed + 5)
        mix3(58, 84, 50, 128, 108, 78, m)
        if (e > 0.55) mix3(out[0], out[1], out[2], 150, 146, 140, smooth(0.55, 1, e))
        out[3] = 0.45 + e * 0.55
      }
      const ice = 1.12 - 0.28 * fbm3(x * 5, y * 5, z * 5, 3, seed + 9)
      if (polar > ice) {
        mix3(out[0], out[1], out[2], 236, 242, 248, smooth(ice, ice + 0.12, polar))
        out[3] = 0.55
      }
      break
    }
    case 'rocky': {
      const v = fbm3(x * 3, y * 3, z * 3, 6, seed)
      const ridge = 1 - Math.abs(2 * fbm3(x * 6, y * 6, z * 6, 4, seed + 3) - 1)
      mix3(64, 58, 52, 152, 140, 124, v)
      const k = 0.78 + 0.4 * ridge
      out[0] *= k; out[1] *= k; out[2] *= k
      out[3] = v * 0.7 + ridge * 0.3
      break
    }
    case 'ice': {
      const v = fbm3(x * 2.5, y * 2.5, z * 2.5, 5, seed)
      mix3(168, 196, 220, 238, 246, 252, v)
      const crack = Math.abs(fbm3(x * 7, y * 7, z * 7, 3, seed + 2) - 0.5)
      if (crack < 0.018) mix3(out[0], out[1], out[2], 96, 130, 168, 0.75)
      out[3] = v * 0.8 + (crack < 0.018 ? -0.2 : 0)
      break
    }
    case 'gas': {
      const warp = fbm3(x * 1.5, y * 3, z * 1.5, 4, seed) * 0.6
      const band = Math.sin((y + warp * 0.35) * 15) * 0.5 + 0.5
      const fine = fbm3(x * 1.2, y * 11, z * 1.2, 3, seed + 4)
      mix3(138, 112, 86, 224, 206, 172, clamp01(band * 0.65 + fine * 0.45))
      if (fine > 0.66) mix3(out[0], out[1], out[2], 108, 92, 80, 0.4)
      out[3] = 0.5
      break
    }
    case 'desert': {
      const v = fbm3(x * 2.4, y * 2.4, z * 2.4, 6, seed)
      if (v < 0.5) mix3(98, 52, 36, 176, 110, 72, v * 2)
      else mix3(176, 110, 72, 214, 174, 134, (v - 0.5) * 2)
      if (fbm3(x * 5, y * 5, z * 5, 3, seed + 6) > 0.64) mix3(out[0], out[1], out[2], 52, 34, 28, 0.55)
      if (polar > 1.25) mix3(out[0], out[1], out[2], 230, 232, 236, smooth(1.25, 1.4, polar))
      out[3] = v
      break
    }
  }
}

export interface PlanetTextures {
  map: THREE.CanvasTexture
  bump: THREE.CanvasTexture
  clouds?: THREE.CanvasTexture
}

export function generatePlanetTextures(kind: PlanetKind, w: number, h: number, seed: number, withClouds: boolean) {
  return enqueue(async (): Promise<PlanetTextures> => {
    const col = new Uint8ClampedArray(w * h * 4)
    const bmp = new Uint8ClampedArray(w * h * 4)
    const cosL = new Float32Array(w), sinL = new Float32Array(w)
    for (let x = 0; x < w; x++) {
      const lon = (x / w) * Math.PI * 2
      cosL[x] = Math.cos(lon)
      sinL[x] = Math.sin(lon)
    }
    let t0 = performance.now()
    for (let y = 0; y < h; y++) {
      const lat = (0.5 - (y + 0.5) / h) * Math.PI
      const cl = Math.cos(lat), sl = Math.sin(lat)
      for (let x = 0; x < w; x++) {
        shade(kind, cosL[x] * cl, sl, sinL[x] * cl, lat, seed)
        const i = (y * w + x) * 4
        col[i] = out[0]; col[i + 1] = out[1]; col[i + 2] = out[2]; col[i + 3] = 255
        const hv = clamp01(out[3]) * 255
        bmp[i] = hv; bmp[i + 1] = hv; bmp[i + 2] = hv; bmp[i + 3] = 255
      }
      if (performance.now() - t0 > 6) {
        await nextFrame()
        t0 = performance.now()
      }
    }
    const result: PlanetTextures = { map: canvasTexture(col, w, h, true), bump: canvasTexture(bmp, w, h, false) }

    if (withClouds) {
      const cw = Math.max(256, w >> 1), ch = Math.max(128, h >> 1)
      const cd = new Uint8ClampedArray(cw * ch * 4)
      for (let y = 0; y < ch; y++) {
        const lat = (0.5 - (y + 0.5) / ch) * Math.PI
        const cl = Math.cos(lat), sl = Math.sin(lat)
        for (let x = 0; x < cw; x++) {
          const lon = (x / cw) * Math.PI * 2
          const c = fbm3(Math.cos(lon) * cl * 3.2 + 10, sl * 4.4, Math.sin(lon) * cl * 3.2, 5, seed + 3)
          const a = smooth(0.5, 0.74, c)
          const i = (y * cw + x) * 4
          cd[i] = 244; cd[i + 1] = 246; cd[i + 2] = 250; cd[i + 3] = a * 230
        }
        if (performance.now() - t0 > 6) {
          await nextFrame()
          t0 = performance.now()
        }
      }
      result.clouds = canvasTexture(cd, cw, ch, true)
    }
    return result
  })
}

/** Equirectangular deep-space backdrop: milky-way band + faint nebula clouds */
export function generateSkyTexture(w: number, h: number) {
  return enqueue(async () => {
    const data = new Uint8ClampedArray(w * h * 4)
    let t0 = performance.now()
    for (let y = 0; y < h; y++) {
      const lat = (0.5 - (y + 0.5) / h) * Math.PI
      const cl = Math.cos(lat), sl = Math.sin(lat)
      for (let x = 0; x < w; x++) {
        const lon = (x / w) * Math.PI * 2
        const px = Math.cos(lon) * cl, py = sl, pz = Math.sin(lon) * cl
        // Tilted galactic plane
        const tilt = px * 0.34 + py * 0.9 + pz * 0.28
        const band = Math.exp(-(tilt * tilt) / 0.045)
        const dust = fbm3(px * 3.1 + 4, py * 3.1, pz * 3.1, 5, 41)
        const clouds = fbm3(px * 1.6 + 20, py * 1.6, pz * 1.6, 5, 77)
        const neb = smooth(0.52, 0.78, clouds)
        const lane = smooth(0.45, 0.75, fbm3(px * 5, py * 5, pz * 5, 4, 13))
        let r = 2, g = 4, b = 10
        const core = band * (0.5 + dust * 0.9) * (1 - lane * 0.55)
        r += core * 40; g += core * 46; b += core * 62
        r += neb * 20 * (0.4 + band); g += neb * 10; b += neb * 40 * (0.4 + band)
        const warm = smooth(0.6, 0.85, fbm3(px * 2 + 50, py * 2, pz * 2, 4, 5)) * band
        r += warm * 22; g += warm * 12
        const i = (y * w + x) * 4
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255
      }
      if (performance.now() - t0 > 6) {
        await nextFrame()
        t0 = performance.now()
      }
    }
    return canvasTexture(data, w, h, true)
  })
}

/* ------------------------------------------------------------------ */
/*  Small synchronous sprites                                           */
/* ------------------------------------------------------------------ */
export function radialTexture(size: number, stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  stops.forEach(([o, col]) => grad.addColorStop(o, col))
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Soft cloudy nebula sprite (greyscale alpha, tinted by the material colour) */
export function nebulaTexture(size: number, seed: number) {
  const data = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size - 0.5, v = y / size - 0.5
      const r = Math.sqrt(u * u + v * v) * 2
      const n = fbm3(u * 3.4 + 7, v * 3.4, seed, 5, seed)
      const a = smooth(0.35, 0.8, n) * Math.pow(clamp01(1 - r), 1.6)
      const i = (y * size + x) * 4
      data[i] = data[i + 1] = data[i + 2] = 255
      data[i + 3] = a * 255
    }
  }
  const c = document.createElement('canvas')
  c.width = c.height = size
  c.getContext('2d')!.putImageData(new ImageData(data, size, size), 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Spiral galaxy sprite */
export function galaxyTexture(size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')!
  g.clearRect(0, 0, size, size)
  const glow = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  glow.addColorStop(0, 'rgba(255,240,220,0.9)')
  glow.addColorStop(0.12, 'rgba(200,215,255,0.35)')
  glow.addColorStop(0.5, 'rgba(120,140,220,0.08)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = glow
  g.fillRect(0, 0, size, size)
  let s = 1234
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 2600; i++) {
    const arm = i % 2
    const t = Math.pow(rnd(), 0.7)
    const ang = t * 7 + arm * Math.PI + (rnd() - 0.5) * 0.5
    const rad = t * size * 0.46
    const x = size / 2 + Math.cos(ang) * rad
    const y = size / 2 + Math.sin(ang) * rad
    g.fillStyle = `rgba(${190 + rnd() * 60},${200 + rnd() * 50},255,${0.15 + rnd() * 0.5})`
    g.fillRect(x, y, 1.2, 1.2)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Round soft point sprite for dust */
export function dotTexture() {
  return radialTexture(32, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']])
}

export function solarPanelTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = '#0c1a3a'
  g.fillRect(0, 0, 128, 128)
  g.strokeStyle = 'rgba(140,170,230,0.55)'
  g.lineWidth = 1.5
  for (let i = 0; i <= 128; i += 16) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke()
    g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/** Fine ring-band texture for planetary rings (alpha varies radially) */
export function ringTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 4
  const g = c.getContext('2d')!
  for (let x = 0; x < 512; x++) {
    const n = fbm3(x * 0.05, 0.5, 0.5, 4, 3)
    const gap = x > 210 && x < 235 ? 0.1 : 1
    const a = clamp01((n - 0.25) * 1.6) * gap * (x < 12 || x > 500 ? 0.3 : 1)
    g.fillStyle = `rgba(${190 + n * 40},${170 + n * 40},${140 + n * 30},${a * 0.85})`
    g.fillRect(x, 0, 1, 4)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
