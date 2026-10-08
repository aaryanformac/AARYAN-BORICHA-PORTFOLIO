import { useRef } from 'react'
import { portfolioData } from '@/data/portfolioData'
import { getProjectImage } from '@/assets'
import { useReveal } from '@/hooks/useReveal'
import { SplitText } from '@/components/SplitText'
import { MagneticButton } from '@/components/MagneticButton'

export function Projects() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)
  const { projects } = portfolioData
  return (
    <section id="projects" ref={root} className="projects" aria-labelledby="projects-title">
      <header className="projects__head" data-panel>
        <p className="eyebrow" data-reveal>03 — Destinations</p>
        <SplitText text="Projects" as="h2" by="chars" className="h2 h2--xl" />
        <span id="projects-title" className="sr-only">Projects</span>
        <p className="lead" data-reveal data-delay="0.1">Each project is a destination on the route.</p>
      </header>

      {projects.map((p, i) => {
        const img = getProjectImage(p.id)
        const chips = p.technologies.length ? p.technologies : p.highlights ?? []
        return (
          <article key={p.id} className={`project ${i % 2 === 0 ? 'project--right' : 'project--left'}`}>
            <div className="project__wrap" data-panel>
            <div className="hud project__card" data-reveal>
              <i className="hud__c hud__c--tl" /><i className="hud__c hud__c--tr" /><i className="hud__c hud__c--bl" /><i className="hud__c hud__c--br" />
              <div className="hud__bar mono"><span>Destination {String(i + 1).padStart(2, '0')}</span><span>{p.type}</span></div>
              {img && <img className="project__img" src={img} alt={`Screenshot of ${p.name}`} loading="lazy" />}
              <h3 className="project__name">{p.name}</h3>
              <p className="project__desc">{p.description}</p>
              {p.points && (
                <ul className="project__points">
                  {p.points.map((pt) => <li key={pt}>{pt}</li>)}
                </ul>
              )}
              {chips.length > 0 && (
                <>
                  <p className="mono project__label">{p.technologies.length ? 'Technologies' : 'Highlights'}</p>
                  <ul className="chips chips--sm">
                    {chips.map((c) => <li key={c} className="chip">{c}</li>)}
                  </ul>
                </>
              )}
              {(p.github || p.liveDemo) && (
                <div className="project__links">
                  {p.liveDemo && <MagneticButton href={p.liveDemo} external variant="primary" cursor="Open">Live demo <span aria-hidden="true">↗</span></MagneticButton>}
                  {p.github && <MagneticButton href={p.github} external variant="ghost" cursor="Open">GitHub <span aria-hidden="true">↗</span></MagneticButton>}
                </div>
              )}
            </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
