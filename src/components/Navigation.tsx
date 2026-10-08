import { useEffect, useRef, useState } from 'react'
import { portfolioData } from '@/data/portfolioData'
import { useApp } from '@/state/appStore'
import { lockScroll, scrollToSection } from '@/animations/smoothScroll'
import { SECTION_IDS } from '@/three/journey'

/** Nav items. `ids` = page sections that highlight this item. */
const ITEMS = [
  { label: 'Home', ids: ['home'] },
  { label: 'About', ids: ['about'] },
  { label: 'Skills', ids: ['skills'] },
  { label: 'Projects', ids: ['projects'] },
  { label: 'Education', ids: ['education', 'interests'] },
  { label: 'Contact', ids: ['contact'] },
]

export function Navigation() {
  const active = useApp((s) => s.activeSection)
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const activeId = SECTION_IDS[active]

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    scrollToSection(id)
  }

  useEffect(() => {
    lockScroll(open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="nav">
      <a className="nav__brand" href="#home" onClick={go('home')} aria-label={`${portfolioData.name} — back to top`} data-cursor="Top">
        <span className="nav__mark" aria-hidden="true">AB</span>
        <span className="nav__name">{portfolioData.name}</span>
      </a>

      <nav className="nav__links" aria-label="Primary">
        {ITEMS.map((it) => {
          const current = it.ids.includes(activeId)
          return (
            <a key={it.label} href={`#${it.ids[0]}`} onClick={go(it.ids[0])} aria-current={current ? 'true' : undefined} className="nav__link">
              {it.label}
            </a>
          )
        })}
      </nav>

      <button
        ref={toggle}
        className="nav__toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="nav__bars" aria-hidden="true" />
      </button>

      <div id="mobile-menu" className={`menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <ul>
          {ITEMS.map((it, i) => (
            <li key={it.label} style={{ ['--i' as string]: i }}>
              <a href={`#${it.ids[0]}`} onClick={go(it.ids[0])} aria-current={it.ids.includes(activeId) ? 'true' : undefined} tabIndex={open ? 0 : -1}>
                <span className="menu__num">0{i + 1}</span>
                {it.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="menu__mail">{portfolioData.contact.email}</p>
      </div>
    </header>
  )
}
