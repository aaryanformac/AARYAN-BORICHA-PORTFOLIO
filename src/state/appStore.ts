import { useSyncExternalStore } from 'react'

/** Tiny reactive store for loading + navigation state (not for per-frame data). */
interface Snapshot {
  loaded: boolean
  progress: number
  webgl: boolean
  activeSection: number
}

/** Tasks the loader waits for before revealing the site */
const REQUIRED = ['scene', 'skybox', 'planet-hero']
const done = new Set<string>()
let snap: Snapshot = { loaded: false, progress: 0, webgl: true, activeSection: 0 }
const listeners = new Set<() => void>()

function emit(patch: Partial<Snapshot>) {
  snap = { ...snap, ...patch }
  listeners.forEach((l) => l())
}

export function completeTask(name: string) {
  if (done.has(name)) return
  done.add(name)
  emit({ progress: REQUIRED.filter((t) => done.has(t)).length / REQUIRED.length })
}
export function setLoaded() {
  emit({ loaded: true })
}
export function setWebGL(ok: boolean) {
  if (!ok) {
    REQUIRED.forEach((t) => done.add(t))
    emit({ webgl: false, progress: 1 })
  }
}
export function setActiveSection(i: number) {
  if (snap.activeSection !== i) emit({ activeSection: i })
}
export function useApp<T>(select: (s: Snapshot) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => select(snap),
  )
}
