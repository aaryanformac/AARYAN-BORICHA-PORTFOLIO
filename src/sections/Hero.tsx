import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { portfolioData } from '@/data/portfolioData'
import { useApp } from '@/state/appStore'
import { device } from '@/hooks/useDevice'
import { scrollToSection } from '@/animations/smoothScroll'
import { SplitText } from '@/components/SplitText'
import { MagneticButton } from '@/components/MagneticButton'

gsap.registerPlugin(ScrollTrigger)

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const loaded = useApp((s) => s.loaded)
  const played = useRef(false)

  // Hero text lifts away as the journey begins (scroll-scrubbed)
  useLayoutEffect(() => {
    const el = root.current
    if (!el || device.reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.to('.hero__content', {
        opacity: 0, y: -70, filter: device.tier === 'low' ? 'none' : 'blur(10px)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: '+=55%', scrub: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  // Entrance animation — plays once the loader has lifted.
  // (Elements are hidden by CSS until <html> gets .is-loaded, so there is no flash.)
  useLayoutEffect(() => {
    const el = root.current
    if (!el || !loaded || played.current || device.reducedMotion) return
    played.current = true
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.fromTo('.hero__eyebrow', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9 })
        .fromTo('.hero .split__unit', { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.045 }, '-=0.6')
        .fromTo('.hero__fade:not(.hero__eyebrow)', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.12 }, '-=0.9')
        .fromTo('.hero__cue', { opacity: 0 }, { opacity: 1, duration: 1 }, '-=0.4')
    }, el)
    return () => ctx.revert()
  }, [loaded])

  return (
    <section id="home" ref={root} className="hero" aria-label="Introduction">
      <div className="hero__sticky">
        <div className="hero__content">
          <p className="eyebrow hero__fade hero__eyebrow">Portfolio · {portfolioData.location}</p>
          <h1 className="hero__name">
            <SplitText text={portfolioData.name.split(' ')[0]} by="chars" scroll={false} as="span" className="hero__line" />
            <SplitText text={portfolioData.name.split(' ')[1]} by="chars" scroll={false} as="span" className="hero__line" />
          </h1>
          <p className="hero__title hero__fade">{portfolioData.title}</p>
          <p className="hero__intro hero__fade">{portfolioData.intro}</p>
          <div className="hero__cta hero__fade">
            <MagneticButton href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about') }} cursor="Go">
              Explore My Journey <span aria-hidden="true">→</span>
            </MagneticButton>
            <MagneticButton variant="ghost" href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection('contact') }}>
              Get in touch
            </MagneticButton>
          </div>
        </div>
        <div className="hero__cue" aria-hidden="true">
          <span>Scroll to fly</span>
          <i />
        </div>
      </div>
    </section>
  )
}
