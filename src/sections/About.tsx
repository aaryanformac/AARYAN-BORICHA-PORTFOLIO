import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { portfolioData } from '@/data/portfolioData'
import { profilePhoto } from '@/assets'
import { device } from '@/hooks/useDevice'
import { useReveal } from '@/hooks/useReveal'
import { SplitText } from '@/components/SplitText'

gsap.registerPlugin(ScrollTrigger)

export function About() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)
  const words = portfolioData.bio.split(' ')

  // Bio words light up progressively as you scroll through the section
  useLayoutEffect(() => {
    const el = root.current
    if (!el || device.reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.about__word', { opacity: 0.14 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 55%', end: 'top -55%', scrub: 0.6 },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  const facts = [
    ['Based in', portfolioData.location],
    ['Studying', `${portfolioData.education.degree.replace('B.Tech — ', 'B.Tech · ')}`],
    ['University', portfolioData.education.university],
    ['Looking for', portfolioData.seeking],
  ]

  return (
    <section id="about" ref={root} className="about" aria-labelledby="about-title">
      <div className="about__sticky">
        <div className="hud about__hud">
          <i className="hud__c hud__c--tl" /><i className="hud__c hud__c--tr" /><i className="hud__c hud__c--bl" /><i className="hud__c hud__c--br" />
          <div className="hud__bar mono"><span>01 — Profile</span><span className="hud__live">Transmission</span></div>
          <div className="about__head">
            <div className="avatar" data-reveal>
              {profilePhoto ? <img src={profilePhoto} alt={`Portrait of ${portfolioData.name}`} loading="lazy" /> : <span aria-hidden="true">AB</span>}
            </div>
            <SplitText text="About me" as="h2" by="words" className="h2" />
          </div>
          <p className="about__bio" id="about-title-bio">
            {words.map((w, i) => (
              <span key={i} className="about__word">{w} </span>
            ))}
          </p>
          <dl className="facts" data-reveal data-delay="0.1">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="mono">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <span id="about-title" className="sr-only">About {portfolioData.name}</span>
    </section>
  )
}
