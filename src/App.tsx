import { Suspense, lazy, useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { hasWebGL } from '@/hooks/useDevice'
import { setWebGL, useApp } from '@/state/appStore'
import { initSmoothScroll } from '@/animations/smoothScroll'
import { Navigation } from '@/components/Navigation'
import { Cursor } from '@/components/Cursor'
import { Loader } from '@/components/Loader'
import { Telemetry } from '@/components/Telemetry'
import { Hero } from '@/sections/Hero'
import { About } from '@/sections/About'
import { Skills } from '@/sections/Skills'
import { Projects } from '@/sections/Projects'
import { Education } from '@/sections/Education'
import { Interests } from '@/sections/Interests'
import { Contact } from '@/sections/Contact'

// The whole 3D stack is code-split: the page shell + loader appear first.
const Experience = lazy(() => import('@/three/Experience'))
const webgl = hasWebGL()
if (!webgl) setWebGL(false)

export default function App() {
  const loaded = useApp((s) => s.loaded)

  useEffect(() => {
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    const cleanup = initSmoothScroll()
    return cleanup
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('is-loaded', loaded)
    if (loaded) requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [loaded])

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className={`fallback-sky ${webgl ? '' : 'is-visible'}`} aria-hidden="true" />
      {webgl && (
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      )}
      <div className="grain" aria-hidden="true" />
      <Navigation />
      <Telemetry />
      <main id="main" tabIndex={-1}>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Education />
        <Interests />
        <Contact />
      </main>
      <Cursor />
      <Loader />
    </>
  )
}
