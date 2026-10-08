import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { scrollState } from '@/animations/scrollStore'
import { SECTION_IDS } from '@/three/journey'

const NAMES = ['Launch', 'About', 'Skills', 'Projects', 'Education', 'Interests', 'Contact']

/** Small flight-telemetry readout (desktop). Updates the DOM directly — no React re-renders. */
export function Telemetry() {
  const sector = useRef<HTMLSpanElement>(null)
  const dist = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const tick = () => {
      const i = Math.min(SECTION_IDS.length - 1, Math.floor(scrollState.sectionFloat + 0.0001))
      if (sector.current) sector.current.textContent = `${String(i + 1).padStart(2, '0')} / ${String(SECTION_IDS.length).padStart(2, '0')} · ${NAMES[i]}`
      if (dist.current) dist.current.textContent = `${(scrollState.distance * 1.84).toFixed(1).padStart(7, '0')} Mkm`
      if (bar.current) bar.current.style.transform = `scaleY(${Math.min(1, scrollState.y / scrollState.max)})`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <aside className="telemetry" aria-hidden="true">
      <span className="telemetry__bar"><span ref={bar} /></span>
      <div>
        <span className="telemetry__k">Sector</span>
        <span ref={sector} className="telemetry__v" />
        <span className="telemetry__k">Distance</span>
        <span ref={dist} className="telemetry__v" />
      </div>
    </aside>
  )
}
