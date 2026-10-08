/**
 * Journey configuration: how far (in world units) the spacecraft travels
 * through each page section. Scroll position is mapped onto this distance.
 */
import { portfolioData } from '@/data/portfolioData'

export const SECTION_IDS = ['home', 'about', 'skills', 'projects', 'education', 'interests', 'contact'] as const
export type SectionId = (typeof SECTION_IDS)[number]

const nProjects = Math.max(1, portfolioData.projects.length)
const nInterests = Math.max(1, portfolioData.interests.length)

export const SECTION_LENGTH: Record<SectionId, number> = {
  home: 70,
  about: 80,
  skills: 90,
  projects: 70 * nProjects,
  education: 80,
  interests: 26 * nInterests,
  contact: 60,
}

export const SECTION_START = {} as Record<SectionId, number>
let acc = 0
for (const id of SECTION_IDS) {
  SECTION_START[id] = acc
  acc += SECTION_LENGTH[id]
}
export const TOTAL_DISTANCE = acc

/** Distance along the journey at fraction `f` (0–1) of a section */
export const distanceAt = (id: SectionId, f = 0) => SECTION_START[id] + SECTION_LENGTH[id] * f

/** The flight path wanders gently left/right and up/down */
export const pathX = (d: number) => Math.sin(d * 0.021) * 3.2
export const pathY = (d: number) => Math.sin(d * 0.013 + 1.2) * 1.4

/** World position beside the flight path at distance d (offset dx, dy) */
export const at = (d: number, dx = 0, dy = 0): [number, number, number] => [pathX(d) + dx, pathY(d) + dy, -d]
