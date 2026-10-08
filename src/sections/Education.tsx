import { useRef } from 'react'
import { portfolioData } from '@/data/portfolioData'
import { useReveal } from '@/hooks/useReveal'
import { SplitText } from '@/components/SplitText'

export function Education() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)
  const e = portfolioData.education
  return (
    <section id="education" ref={root} className="section education" aria-labelledby="education-title">
      <div className="education__inner" data-panel>
        <p className="eyebrow" data-reveal>04 — Home world</p>
        <SplitText text="Education" as="h2" by="words" className="h2" />
        <span id="education-title" className="sr-only">Education</span>
        <div className="hud edu-card" data-reveal data-delay="0.1">
          <i className="hud__c hud__c--tl" /><i className="hud__c hud__c--br" />
          <p className="mono edu-card__period">{e.period}</p>
          <h3 className="edu-card__degree">{e.degree}</h3>
          <p className="edu-card__uni">{e.university}, {e.location}</p>
          <p className="edu-card__status"><span className="pulse" aria-hidden="true" />{e.status}</p>
        </div>
      </div>
    </section>
  )
}
