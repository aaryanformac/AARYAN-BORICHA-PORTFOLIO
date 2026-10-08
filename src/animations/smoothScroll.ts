import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { applyScroll, measureSections } from './scrollStore'
import { device } from '@/hooks/useDevice'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null

/** Starts smooth scrolling (Lenis) and keeps GSAP ScrollTrigger + the 3D journey in sync. */
export function initSmoothScroll(): () => void {
  const onResize = () => {
    measureSections()
    ScrollTrigger.refresh()
  }
  let timer = 0
  const debounced = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(onResize, 120)
  }

  let tick: ((time: number) => void) | null = null
  let nativeScroll: (() => void) | null = null

  if (!device.reducedMotion) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 })
    lenis.on('scroll', (l: Lenis) => {
      ScrollTrigger.update()
      applyScroll(l.scroll, l.velocity)
    })
    tick = (time: number) => lenis?.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
  } else {
    nativeScroll = () => applyScroll(window.scrollY, 0)
    window.addEventListener('scroll', nativeScroll, { passive: true })
  }

  window.addEventListener('resize', debounced)
  const ro = new ResizeObserver(debounced)
  ro.observe(document.body)
  ScrollTrigger.addEventListener('refresh', measureSections)
  measureSections()
  document.fonts?.ready.then(onResize)

  return () => {
    window.clearTimeout(timer)
    window.removeEventListener('resize', debounced)
    ro.disconnect()
    ScrollTrigger.removeEventListener('refresh', measureSections)
    if (tick) gsap.ticker.remove(tick)
    if (nativeScroll) window.removeEventListener('scroll', nativeScroll)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = id === 'home' ? 0 : el.getBoundingClientRect().top + window.scrollY
  if (lenis) lenis.scrollTo(top, { duration: 1.8, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
  else window.scrollTo({ top, behavior: 'auto' })
}

export function lockScroll(lock: boolean) {
  if (lenis) {
    if (lock) lenis.stop()
    else lenis.start()
  }
  document.documentElement.style.overflow = lock ? 'hidden' : ''
}
