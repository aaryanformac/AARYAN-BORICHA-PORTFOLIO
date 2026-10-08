export type Tier = 'low' | 'mid' | 'high'

export interface DeviceInfo {
  tier: Tier
  isMobile: boolean
  finePointer: boolean
  reducedMotion: boolean
}

function detect(): DeviceInfo {
  const mq = (q: string) => window.matchMedia(q).matches
  const reducedMotion = mq('(prefers-reduced-motion: reduce)')
  const finePointer = mq('(hover: hover) and (pointer: fine)')
  const isMobile = mq('(pointer: coarse)') || window.innerWidth < 820
  const nav = navigator as Navigator & { deviceMemory?: number }
  const mem = nav.deviceMemory ?? 8
  const cores = navigator.hardwareConcurrency ?? 8
  const weak = mem <= 4 || cores <= 4
  let tier: Tier
  if (isMobile) tier = weak ? 'low' : 'mid'
  else tier = weak ? 'mid' : 'high'
  if (reducedMotion && tier === 'high') tier = 'mid'
  return { tier, isMobile, finePointer, reducedMotion }
}

/** Evaluated once at start-up. Used by the 3D scene to scale quality. */
export const device: DeviceInfo = detect()

window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  device.reducedMotion = e.matches
})

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Particle / geometry budgets per quality tier */
export const budget = {
  stars: { low: 1800, mid: 3500, high: 6000 }[device.tier],
  dust: { low: 450, mid: 1000, high: 2200 }[device.tier],
  asteroids: { low: 45, mid: 90, high: 170 }[device.tier],
  debris: { low: 14, mid: 30, high: 60 }[device.tier],
  planetTex: { low: 512, mid: 768, high: 1024 }[device.tier],
  sphereSeg: { low: 40, mid: 64, high: 96 }[device.tier],
}
