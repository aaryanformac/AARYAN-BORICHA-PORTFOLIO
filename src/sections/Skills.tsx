import { useRef } from 'react'
import { portfolioData } from '@/data/portfolioData'
import { useReveal } from '@/hooks/useReveal'
import { SplitText } from '@/components/SplitText'
import { TiltCard } from '@/components/TiltCard'

export function Skills() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)
  return (
    <section id="skills" ref={root} className="section skills" aria-labelledby="skills-title">
      <div className="skills__inner" data-panel>
        <p className="eyebrow" data-reveal>02 — Control panel</p>
        <SplitText text="Technical skills" as="h2" by="words" className="h2" />
        <span id="skills-title" className="sr-only">Technical skills</span>
        <div className="modules">
          {portfolioData.skills.map((cat, i) => (
            <div key={cat.id} data-reveal data-delay={(i % 2) * 0.12}>
              <TiltCard className="module hud">
                <i className="hud__c hud__c--tl" /><i className="hud__c hud__c--br" />
                <div className="module__head mono">
                  <span>MOD-{String(i + 1).padStart(2, '0')}</span>
                  <span>{String(cat.items.length).padStart(2, '0')} items</span>
                </div>
                <h3 className="module__title tilt-z">{cat.label}</h3>
                <ul className="chips">
                  {cat.items.map((s) => (
                    <li key={s} className="chip tilt-z">{s}</li>
                  ))}
                </ul>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
