import { useRef, useState } from 'react'
import { portfolioData } from '@/data/portfolioData'
import { useReveal } from '@/hooks/useReveal'
import { scrollToSection } from '@/animations/smoothScroll'
import { SplitText } from '@/components/SplitText'
import { MagneticButton } from '@/components/MagneticButton'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)
  const [copied, setCopied] = useState(false)
  const { contact, social } = portfolioData

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${contact.email}`
    }
  }

  const links = [
    social.github && { label: 'GitHub', url: social.github },
    social.linkedin && { label: 'LinkedIn', url: social.linkedin },
    ...social.other,
  ].filter(Boolean) as { label: string; url: string }[]

  return (
    <section id="contact" ref={root} className="section contact" aria-labelledby="contact-title">
      <div className="contact__inner">
        <p className="eyebrow" data-reveal>06 — Destination reached</p>
        <h2 className="h2 h2--xl contact__title" id="contact-title">
          <SplitText text="Let's build something together." as="span" by="words" />
        </h2>
        <p className="lead" data-reveal data-delay="0.1">
          I'm looking for an internship opportunity to gain industry experience and contribute to real-world software projects.
        </p>
        <div className="contact__cta" data-reveal data-delay="0.15">
          <MagneticButton href={`mailto:${contact.email}`} cursor="Mail" className="btn--lg">
            {contact.email} <span aria-hidden="true">→</span>
          </MagneticButton>
          <MagneticButton variant="ghost" onClick={copy} label="Copy email address">
            <span aria-live="polite">{copied ? 'Copied ✓' : 'Copy email'}</span>
          </MagneticButton>
        </div>
        <ul className="contact__links" data-reveal data-delay="0.2">
          <li><span className="mono">Base</span>{portfolioData.location}</li>
          {contact.phone && <li><span className="mono">Phone</span><a href={`tel:${contact.phone}`}>{contact.phone}</a></li>}
          {links.map((l) => (
            <li key={l.label}><span className="mono">{l.label}</span><a href={l.url} target="_blank" rel="noopener noreferrer" data-cursor="Open">{l.url.replace(/^https?:\/\/(www\.)?/, '')}</a></li>
          ))}
        </ul>
      </div>
      <footer className="footer">
        <span>© {new Date().getFullYear()} {portfolioData.name}</span>
        <a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection('home') }}>Back to launch ↑</a>
      </footer>
    </section>
  )
}
