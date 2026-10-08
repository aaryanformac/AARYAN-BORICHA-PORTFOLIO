import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { device } from '@/hooks/useDevice'

/** Desktop-only custom cursor: a dot + a trailing ring that grows on interactive elements. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!device.finePointer) return
    document.documentElement.classList.add('has-cursor')
    const d = dot.current!, r = ring.current!, l = label.current!
    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 0 })
    const dx = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'none' })
    const dy = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'none' })
    const rx = gsap.quickTo(r, 'x', { duration: 0.55, ease: 'power3.out' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.55, ease: 'power3.out' })
    let magnet: HTMLElement | null = null
    let shown = false

    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true
        gsap.to([d, r], { opacity: 1, duration: 0.3 })
      }
      dx(e.clientX); dy(e.clientY)
      if (magnet) {
        const b = magnet.getBoundingClientRect()
        rx(e.clientX + (b.left + b.width / 2 - e.clientX) * 0.35)
        ry(e.clientY + (b.top + b.height / 2 - e.clientY) * 0.35)
      } else {
        rx(e.clientX); ry(e.clientY)
      }
    }
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('a, button, [data-cursor], input, textarea')
      if (t) {
        magnet = t.hasAttribute('data-magnetic') ? t : null
        const text = t.dataset.cursor
        l.textContent = text ?? ''
        r.classList.add('is-active')
        r.classList.toggle('has-label', !!text)
      } else {
        magnet = null
        r.classList.remove('is-active', 'has-label')
      }
    }
    const down = () => r.classList.add('is-down')
    const up = () => r.classList.remove('is-down')
    const leave = () => { shown = false; gsap.to([d, r], { opacity: 0, duration: 0.25 }) }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerover', over)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [])

  if (!device.finePointer) return null
  return (
    <div aria-hidden="true">
      <div className="cursor-ring" ref={ring}>
        <span ref={label} className="cursor-label" />
      </div>
      <div className="cursor-dot" ref={dot} />
    </div>
  )
}
