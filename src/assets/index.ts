/**
 * Asset helpers — drop files in the folders below and they are picked up automatically.
 *
 *  src/assets/images/profile.(jpg|png|webp|avif)        → profile photo (About section)
 *  src/assets/images/projects/<project-id>.(jpg|png…)   → project screenshot
 *  src/assets/models/    → .glb models (if you replace the procedural rocket)
 *  src/assets/textures/  → extra textures
 *  src/assets/logos/     → technology / university logos
 */
const profileFiles = import.meta.glob('./images/profile.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const projectFiles = import.meta.glob('./images/projects/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export const profilePhoto: string | null = Object.values(profileFiles)[0] ?? null

export function getProjectImage(id: string): string | null {
  const key = Object.keys(projectFiles).find((k) => k.split('/').pop()?.replace(/\.[^.]+$/, '') === id)
  return key ? projectFiles[key] : null
}
