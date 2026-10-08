import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { device } from './useDevice'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll-triggered reveals inside a section:
 *  [data-reveal]        fade/rise/de-blur when entering the viewport (data-delay="0.1")
 *  [data-split]         character / word masks (see <SplitText>)
 *  [data-panel]         the whole panel softly fades out as it leaves upward
 * Everything is skipped when the visitor prefers reduced motion.
 */
export function useReveal(root: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const el = root.current
    if (!el || device.reducedMotion) return
    const blur = device.tier !== 'low'
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((node) => {
        const delay = parseFloat(node.dataset.delay ?? '0')
        gsap.from(node, {
          y: 38, opacity: 0, filter: blur ? 'blur(8px)' : 'none', duration: 1, delay, ease: 'power3.out',
          scrollTrigger: { trigger: node, start: 'top 90%', toggleActions: 'play none none reverse' },
          clearProps: 'filter',
        })
      })
      gsap.utils.toArray<HTMLElement>('[data-split]').forEach((node) => {
        const units = node.querySelectorAll('.split__unit')
        gsap.from(units, {
          yPercent: 115, rotate: 5, duration: 1.05, ease: 'power4.out', stagger: node.dataset.split === 'words' ? 0.07 : 0.025,
          scrollTrigger: { trigger: node, start: 'top 88%', toggleActions: 'play none none reverse' },
        })
      })
      gsap.utils.toArray<HTMLElement>('[data-panel]').forEach((node) => {
        gsap.to(node, {
          opacity: 0, y: -50, ease: 'none',
          scrollTrigger: { trigger: node, start: 'bottom 42%', end: 'bottom 8%', scrub: true },
        })
      })
    }, el)
    return () => ctx.revert()
  }, [root])
}
