import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { device } from '@/hooks/useDevice'

/** Card that tilts toward the pointer (CSS 3D). Children with .tilt-z pop forward. */
export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const enabled = device.finePointer && !device.reducedMotion
  const onMove = (e: React.PointerEvent) => {
    if (!enabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    gsap.to(ref.current, { rotateY: px * 9, rotateX: -py * 9, duration: 0.5, ease: 'power3.out', transformPerspective: 900 })
    ref.current.style.setProperty('--mx', `${(px + 0.5) * 100}%`)
    ref.current.style.setProperty('--my', `${(py + 0.5) * 100}%`)
  }
  const onLeave = () => ref.current && enabled && gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'power3.out' })
  return (
    <div ref={ref} className={`tilt ${className}`} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  )
}
