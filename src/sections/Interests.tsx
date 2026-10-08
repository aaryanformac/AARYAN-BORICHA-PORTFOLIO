import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { portfolioData } from '@/data/portfolioData'
import { device } from '@/hooks/useDevice'
import { useReveal } from '@/hooks/useReveal'
import { SplitText } from '@/components/SplitText'

gsap.registerPlugin(ScrollTrigger)

export function Interests() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  // Highlight the stop the spacecraft is currently passing
  useLayoutEffect(() => {
    const el = root.current
    if (!el || device.reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.route__stop').forEach((stop) => {
        ScrollTrigger.create({
          trigger: stop, start: 'top 62%', end: 'bottom 38%',
          onToggle: (self) => stop.classList.toggle('is-active', self.isActive),
        })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section id="interests" ref={root} className="section interests" aria-labelledby="interests-title">
      <div className="interests__inner">
        <div data-panel>
          <p className="eyebrow" data-reveal>05 — Flight plan</p>
          <SplitText text="Career interests" as="h2" by="words" className="h2" />
          <span id="interests-title" className="sr-only">Career interests</span>
        </div>
        <ol className="route">
          {portfolioData.interests.map((it, i) => (
            <li key={it} className="route__stop" data-reveal>
              <span className="route__node mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="route__label">{it}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
