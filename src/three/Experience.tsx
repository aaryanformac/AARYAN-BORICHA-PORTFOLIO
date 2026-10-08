import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { device } from '@/hooks/useDevice'
import { completeTask } from '@/state/appStore'
import Scene from './Scene'

/** Fixed full-screen WebGL layer that sits behind all page content. */
export default function Experience() {
  const maxDpr = device.tier === 'high' ? 1.75 : device.tier === 'mid' ? 1.4 : 1.15
  const [dpr, setDpr] = useState(maxDpr)

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={[1, dpr]}
        shadows={device.tier === 'high'}
        camera={{ fov: 42, near: 0.1, far: 5000, position: [0, 1, 9] }}
        gl={{ antialias: device.tier !== 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
        eventSource={document.getElementById('root') ?? undefined}
        eventPrefix="client"
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          gl.shadowMap.type = THREE.PCFSoftShadowMap
          scene.background = new THREE.Color('#02040a')
          completeTask('scene')
        }}
      >
        {/* If the frame rate drops, quietly lower the resolution */}
        <PerformanceMonitor flipflops={3} onDecline={() => setDpr((d) => Math.max(1, d - 0.35))} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
