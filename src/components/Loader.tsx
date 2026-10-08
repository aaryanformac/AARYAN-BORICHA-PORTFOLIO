import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { portfolioData } from '@/data/portfolioData'
import { setLoaded, useApp } from '@/state/appStore'
import { device } from '@/hooks/useDevice'
import { SplitText } from './SplitText'

const MIN_MS = 1900
const MAX_MS = 7000

/** Short cinematic loader: rocket ignites, name appears, progress line fills, then it lifts away. */
export function Loader() {
  const progress = useApp((s) => s.progress)
  const [shown, setShown] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const start = useRef(performance.now())
  const [gone, setGone] = useState(false)

  useEffect(() => {
    gsap.fromTo('.loader .split__unit', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.04, ease: 'power4.out', delay: 0.2 })
  }, [])

  // Smoothly follow real progress, never finishing before MIN_MS
  useEffect(() => {
    let raf = 0
    let finished = false
    const loop = () => {
      const t = performance.now() - start.current
      const timeP = Math.min(1, t / MIN_MS)
      const target = Math.min(progress, timeP)
      setShown((s) => s + (target - s) * 0.12)
      if (!finished && ((progress >= 1 && t > MIN_MS) || t > MAX_MS)) {
        finished = true
        setShown(1)
        exit()
        return
      }
      raf = requestAnimationFrame(loop)
    }
    const exit = () => {
      const tl = gsap.timeline({ onComplete: () => setGone(true) })
      tl.to('.loader__content', { opacity: 0, y: -30, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' })
        .add(() => setLoaded(), '-=0.1')
        .to(root.current, { opacity: 0, duration: device.reducedMotion ? 0.2 : 0.9, ease: 'power2.inOut' }, '-=0.05')
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [progress])

  if (gone) return null
  return (
    <div className="loader" ref={root} role="status" aria-live="polite" aria-label="Loading portfolio">
      <div className="loader__content">
        <svg className="loader__rocket" viewBox="0 0 24 48" aria-hidden="true">
          <path d="M12 2c4 5 5 13 4 22l3 6-4-1-3 4-3-4-4 1 3-6c-1-9 0-17 4-22z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="12" cy="16" r="2" fill="none" stroke="currentColor" strokeWidth="1" />
          <path className="loader__flame" d="M9.5 36c.8 4 1.5 7 2.5 10 1-3 1.7-6 2.5-10" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
        <SplitText text={portfolioData.name} as="p" by="chars" className="loader__name" scroll={false} />
        <div className="loader__bar"><span style={{ transform: `scaleX(${shown})` }} /></div>
        <p className="loader__label">Initialising flight systems · {Math.round(shown * 100)}%</p>
      </div>
    </div>
  )
}
