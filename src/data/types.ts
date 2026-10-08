export type PlanetKind = 'terra' | 'ocean' | 'rocky' | 'ice' | 'gas' | 'desert'

export interface Project {
  /** Unique id. Also used to find a screenshot: src/assets/images/projects/<id>.jpg|png|webp */
  id: string
  name: string
  type: string
  description: string
  /** Optional bullet points shown under the description */
  points?: string[]
  /** Technologies — only list what is true for this project */
  technologies: string[]
  /** Short highlight chips shown when no technologies are listed */
  highlights?: string[]
  github?: string
  liveDemo?: string
  /** Which procedural planet represents this project in the 3D scene */
  planet: PlanetKind
  /** Draw a ring around the planet */
  ring?: boolean
}

export interface SkillCategory {
  id: string
  label: string
  items: string[]
}

export interface Education {
  degree: string
  university: string
  location: string
  period: string
  status: string
}
