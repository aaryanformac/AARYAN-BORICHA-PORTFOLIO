import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { device } from '@/hooks/useDevice'

interface Props {
  children: ReactNode
  href?: string
  onClick?: (e: React.MouseEvent) => void
  variant?: 'primary' | 'ghost'
  strength?: number
  external?: boolean
  label?: string
  className?: string
  cursor?: string
}

/** Button/link that leans toward the pointer. Falls back to a plain element on touch. */
export function MagneticButton({ children, href, onClick, variant = 'primary', strength = 0.32, external, label, className = '', cursor }: Props) {
  const ref = useRef<HTMLElement>(null)
  const inner = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !device.finePointer || device.reducedMotion) return
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
    const ix = gsap.quickTo(inner.current, 'x', { duration: 0.6, ease: 'power3.out' })
    const iy = gsap.quickTo(inner.current, 'y', { duration: 0.6, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      mx(dx * strength); my(dy * strength)
      ix(dx * strength * 0.5); iy(dy * strength * 0.5)
    }
    const leave = () => { mx(0); my(0); ix(0); iy(0) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength])

  const cls = `btn btn--${variant} ${className}`
  const content = (
    <span className="btn__inner" ref={inner}>
      {children}
    </span>
  )
  const common = { 'data-magnetic': '', 'data-cursor': cursor ?? '', 'aria-label': label }
  if (href) {
    return (
      <a ref={ref as React.RefObject<HTMLAnchorElement>} className={cls} href={href} onClick={onClick} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...common}>
        {content}
      </a>
    )
  }
  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>} className={cls} type="button" onClick={onClick} {...common}>
      {content}
    </button>
  )
}
