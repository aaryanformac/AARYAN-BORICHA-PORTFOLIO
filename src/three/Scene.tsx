import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { portfolioData } from '@/data/portfolioData'
import { budget, device } from '@/hooks/useDevice'
import { Backdrop } from './Backdrop'
import { JourneyRig } from './JourneyRig'
import { Planet } from './Planet'
import { AsteroidField, Debris, Satellite, SpaceStation } from './SpaceObjects'
import { TOTAL_DISTANCE, at, distanceAt } from './journey'
import { rocketState } from './rocketState'
import type { PlanetKind } from '@/data/types'

const INTEREST_KINDS: PlanetKind[] = ['rocky', 'ice', 'desert', 'gas', 'ocean']

/** A moon circling a parent position */
function Moon({ centre, radius, orbit, speed, kind, seed }: { centre: [number, number, number]; radius: number; orbit: number; speed: number; kind: PlanetKind; seed: number }) {
  const g = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (!g.current) return
    const t = device.reducedMotion ? 0 : s.clock.elapsedTime * speed
    g.current.position.set(centre[0] + Math.cos(t) * orbit, centre[1] + Math.sin(t * 0.7) * orbit * 0.12, centre[2] + Math.sin(t) * orbit)
  })
  return (
    <group ref={g}>
      <Planet kind={kind} position={[0, 0, 0]} radius={radius} seed={seed} spin={0.02} texSize={256} />
    </group>
  )
}

export default function Scene() {
  const { projects, interests } = portfolioData
  const nP = Math.max(1, projects.length)
  const nI = Math.max(1, interests.length)
  const high = device.tier === 'high'

  // Click anywhere on the rocket → engine surge (handled in JourneyRig/Rocket via rocketState)
  const eduPos = at(distanceAt('education', 0.62), -17, 2)

  return (
    <>
      <ambientLight intensity={0.05} color="#7f95ff" />
      {/* Cool rim light from the front-right gives the cinematic blue edge */}
      <directionalLight position={[8, 3, -14]} intensity={0.55} color="#6a7dff" />
      <Environment resolution={128} frames={1}>
        <color attach="background" args={['#02040a']} />
        <Lightformer form="rect" intensity={3.2} color="#ffe2c4" position={[-6, 4, 3]} scale={[9, 4, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#5470ff" position={[7, 1, -6]} rotation={[0, -Math.PI / 3, 0]} scale={[8, 4, 1]} />
        <Lightformer form="ring" intensity={0.9} color="#a5b8ff" position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} scale={4} />
      </Environment>

      <Backdrop />
      <JourneyRig />

      {/* HOME — planetary horizon, a passing satellite and a distant moon */}
      <Planet kind="terra" position={[14, -52, -22]} radius={48} seed={3} spin={0.004} tilt={0.18} clouds atmosphere="#6ea2ff" texSize={budget.planetTex} taskName="planet-hero" />
      <Satellite position={at(30, -7, 3.2)} scale={0.45} />
      <Planet kind="rocky" position={[-38, 16, -110]} radius={4} seed={21} spin={0.02} texSize={384} />

      {/* ABOUT — approach a space station */}
      <SpaceStation position={at(distanceAt('about', 0.72), -15, 4)} scale={1.7} />
      <Satellite position={at(distanceAt('about', 0.25), 10, 3.5)} scale={0.4} rotation={[0.5, 1.1, 0]} />

      {/* SKILLS — asteroid belt with a survey satellite */}
      <AsteroidField from={distanceAt('skills', 0.05)} to={distanceAt('skills', 1)} count={budget.asteroids} spread={[34, 16]} seed={5} />
      <Satellite position={at(distanceAt('skills', 0.35), -9, 4)} scale={0.5} rotation={[0.2, 2.2, 0.3]} />

      {/* PROJECTS — each project is a destination planet, alternating sides */}
      {projects.map((p, i) => {
        const d = distanceAt('projects', (i + 0.55) / nP)
        const side = i % 2 === 0 ? -1 : 1
        return (
          <Planet
            key={p.id}
            kind={p.planet}
            position={at(d, side * (19 + (i % 3) * 2), i % 2 ? -3 : 3)}
            radius={8.5 + (i % 3)}
            seed={40 + i * 7}
            spin={0.012}
            tilt={0.3 * side}
            clouds={p.planet === 'ocean' || p.planet === 'terra'}
            ring={p.ring ?? p.planet === 'gas'}
            atmosphere={p.planet === 'ice' ? '#8fb4ff' : p.planet === 'desert' ? '#e0916a' : '#7ea6ff'}
            texSize={Math.min(budget.planetTex, 768)}
          />
        )
      })}

      {/* EDUCATION — an oceanic world with an orbiting moon */}
      <Planet kind="ocean" position={eduPos} radius={11} seed={77} spin={0.01} tilt={0.35} clouds atmosphere="#6aa0ff" texSize={Math.min(budget.planetTex, 768)} />
      <Moon centre={eduPos} radius={1.5} orbit={19} speed={0.22} kind="rocky" seed={8} />

      {/* INTERESTS — a chain of small worlds, one per interest */}
      {interests.map((_, i) => {
        const d = distanceAt('interests', (i + 0.5) / nI)
        const side = i % 2 === 0 ? 1 : -1
        return (
          <Planet
            key={i}
            kind={INTEREST_KINDS[i % INTEREST_KINDS.length]}
            position={at(d, side * (9 + (i % 2) * 2.5), (i - 2) * 1.1)}
            radius={1.7 + (i % 3) * 0.55}
            seed={100 + i * 13}
            spin={0.05}
            tilt={0.2 * side}
            ring={i === 3}
            atmosphere={i % 2 ? '#7ea6ff' : undefined}
            texSize={256}
          />
        )
      })}

      {/* CONTACT — arrival at the station, a planet below and debris drifting past */}
      <SpaceStation position={at(TOTAL_DISTANCE + 24, 9, 5)} scale={2.6} rotation={[0.1, -0.7, 0.04]} />
      <Planet kind="gas" position={[-30, -88, -(TOTAL_DISTANCE + 20)]} radius={66} seed={9} spin={0.003} tilt={0.1} atmosphere="#b4c7ff" texSize={Math.min(budget.planetTex, 768)} />

      <Debris count={budget.debris} from={20} to={TOTAL_DISTANCE} />

      {high && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom intensity={0.6} luminanceThreshold={1} luminanceSmoothing={0.25} mipmapBlur />
          <Vignette offset={0.25} darkness={0.75} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  )
}
