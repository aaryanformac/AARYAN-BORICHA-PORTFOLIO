import { SECTION_IDS, SECTION_LENGTH, SECTION_START } from '@/three/journey'
import { setActiveSection } from '@/state/appStore'

/**
 * Mutable scroll → journey state, read every frame by the 3D scene.
 * (Deliberately NOT React state: no re-renders while scrolling.)
 */
export const scrollState = {
  y: 0,
  velocity: 0,
  max: 1,
  /** Distance travelled along the 3D journey path */
  distance: 0,
  /** Fractional section index, e.g. 2.4 = 40% through "skills" */
  sectionFloat: 0,
  tops: [] as number[],
}

export function measureSections() {
  const y = window.scrollY
  scrollState.tops = SECTION_IDS.map((id) => {
    const el = document.getElementById(id)
    return el ? el.getBoundingClientRect().top + y : 0
  })
  scrollState.max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  applyScroll(y, scrollState.velocity)
}

export function applyScroll(y: number, velocity: number) {
  const s = scrollState
  s.y = y
  s.velocity = velocity
  const tops = s.tops
  if (!tops.length) return
  let i = 0
  for (let k = 0; k < tops.length; k++) if (y >= tops[k] - 1) i = k
  const end = i + 1 < tops.length ? tops[i + 1] : s.max
  const frac = Math.min(1, Math.max(0, (y - tops[i]) / Math.max(1, end - tops[i])))
  const id = SECTION_IDS[i]
  s.distance = SECTION_START[id] + frac * SECTION_LENGTH[id]
  s.sectionFloat = i + frac

  const probe = y + window.innerHeight * 0.45
  let active = 0
  for (let k = 0; k < tops.length; k++) if (probe >= tops[k]) active = k
  setActiveSection(active)
}
