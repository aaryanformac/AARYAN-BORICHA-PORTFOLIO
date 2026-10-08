import { forwardRef, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { scrollState } from '@/animations/scrollStore'
import { device } from '@/hooks/useDevice'
import { radialTexture } from './textures'
import { rocketState } from './rocketState'

/**
 * Procedural spacecraft (no external assets / licences needed).
 * Built from lathe profiles, extruded fins, nozzles and an additive exhaust.
 * Model axis = +Y (nose up); the outer wrapper rotates it to point down -Z.
 * Want a real glTF model instead? Drop it in src/assets/models and swap this component.
 */
const R = 0.42

const lathe = (pts: [number, number][], seg = 56) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)

const flameVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const flameFragment = /* glsl */ `
  varying vec2 vUv; uniform float uTime; uniform float uPower;
  void main(){
    float t = vUv.y;
    float core = pow(1.0 - t, 1.5);
    float flick = 0.85 + 0.15 * sin(uTime * 38.0 + t * 14.0) * sin(uTime * 23.0);
    vec3 col = mix(vec3(0.55, 0.75, 1.0), vec3(1.0, 0.42, 0.1), smoothstep(0.0, 0.75, t));
    col = mix(col, vec3(1.0), core * 0.6);
    gl_FragColor = vec4(col * (1.0 + core * 2.2), core * flick * uPower * 0.9);
  }`

export const Rocket = forwardRef<THREE.Group>(function Rocket(_, ref) {
  const inner = useRef<THREE.Group>(null)
  const flames = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const glow = useRef<THREE.Sprite>(null)
  const navRed = useRef<THREE.Mesh>(null)
  const navGreen = useRef<THREE.Mesh>(null)
  const power = useRef(1)
  const shadows = device.tier === 'high'

  const g = useMemo(() => {
    const nose: [number, number][] = []
    for (let i = 0; i <= 28; i++) {
      const t = i / 28
      nose.push([R * Math.pow(1 - t * t, 0.62), 0.9 + 1.55 * t])
    }
    const finShape = new THREE.Shape()
    finShape.moveTo(0.4, -0.35); finShape.lineTo(1.0, -1.75); finShape.lineTo(1.0, -2.02); finShape.lineTo(0.4, -1.92); finShape.closePath()
    const fin = new THREE.ExtrudeGeometry(finShape, { depth: 0.05, bevelEnabled: false })
    fin.translate(0, 0, -0.025)
    const ringGeo = new THREE.TorusGeometry(R + 0.004, 0.011, 8, 64)
    ringGeo.rotateX(Math.PI / 2)
    const cone = new THREE.ConeGeometry(0.13, 1.5, 20, 1, true)
    cone.rotateX(Math.PI)
    cone.translate(0, -0.75, 0)
    return {
      body: lathe([[0, -1.8], [R, -1.8], [R, 0.9]]),
      nose: lathe(nose),
      skirt: lathe([[0.2, -2.06], [0.52, -2.06], [0.52, -1.78], [R, -1.72]]),
      nozzle: lathe([[0.05, 0.12], [0.07, -0.04], [0.1, -0.24], [0.165, -0.5]], 28),
      lowerBand: new THREE.CylinderGeometry(R + 0.003, R + 0.003, 0.7, 56, 1, true),
      accent: new THREE.CylinderGeometry(R + 0.006, R + 0.006, 0.1, 56, 1, true),
      fin,
      ringGeo,
      cone,
      thruster: new THREE.BoxGeometry(0.1, 0.12, 0.09),
    }
  }, [])

  const m = useMemo(
    () => ({
      white: new THREE.MeshPhysicalMaterial({ color: '#e7eaf1', roughness: 0.42, metalness: 0.1, clearcoat: 0.45, clearcoatRoughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: '#15181e', roughness: 0.38, metalness: 0.55 }),
      band: new THREE.MeshStandardMaterial({ color: '#272b34', roughness: 0.55, metalness: 0.5 }),
      metal: new THREE.MeshStandardMaterial({ color: '#8d939e', roughness: 0.34, metalness: 1 }),
      nozzle: new THREE.MeshStandardMaterial({ color: '#2b2e35', roughness: 0.4, metalness: 0.95, side: THREE.DoubleSide }),
      fin: new THREE.MeshStandardMaterial({ color: '#2a2e37', roughness: 0.45, metalness: 0.7 }),
      accent: new THREE.MeshStandardMaterial({ color: '#3a5797', roughness: 0.5, metalness: 0.35 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#0a1430', roughness: 0.04, metalness: 0, clearcoat: 1, envMapIntensity: 2.2 }),
      flame: new THREE.ShaderMaterial({
        vertexShader: flameVertex, fragmentShader: flameFragment, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uPower: { value: 1 } },
      }),
      red: new THREE.MeshBasicMaterial({ color: '#ff3b30', toneMapped: false }),
      green: new THREE.MeshBasicMaterial({ color: '#2cff8a', toneMapped: false }),
    }),
    [],
  )

  const glowTex = useMemo(() => radialTexture(128, [[0, 'rgba(255,200,150,1)'], [0.25, 'rgba(255,130,60,0.45)'], [1, 'rgba(255,90,20,0)']]), [])

  const engines: [number, number][] = useMemo(
    () => [[0, 0], ...[0, 1, 2].map((i): [number, number] => [Math.cos((i * Math.PI * 2) / 3) * 0.25, Math.sin((i * Math.PI * 2) / 3) * 0.25])],
    [],
  )

  useFrame((state, dt) => {
    dt = Math.min(dt, 0.05)
    const t = state.clock.elapsedTime
    const calm = device.reducedMotion ? 0.2 : 1
    if (inner.current) inner.current.rotation.y += dt * (0.12 + (rocketState.hover ? 0.9 : 0)) * calm
    // Exhaust power follows scroll speed, hover and click boost
    rocketState.boost = Math.max(0, rocketState.boost - dt * 0.9)
    const target = 0.75 + Math.min(Math.abs(scrollState.velocity) * 0.035, 1.1) + (rocketState.hover ? 0.35 : 0) + rocketState.boost * 1.2
    power.current += (target - power.current) * Math.min(1, dt * 6)
    const flick = 1 + Math.sin(t * 41) * 0.05 * calm + Math.sin(t * 17.3) * 0.06 * calm
    const p = power.current
    m.flame.uniforms.uTime.value = t
    m.flame.uniforms.uPower.value = Math.min(p, 1.6)
    if (flames.current) flames.current.scale.set(1 + (p - 1) * 0.12, p * flick, 1 + (p - 1) * 0.12)
    if (light.current) light.current.intensity = (4 + p * 5) * flick
    if (glow.current) glow.current.scale.setScalar(2.4 + p * 1.6)
    // Navigation strobes
    const blink = (Math.sin(t * 3) > 0.92 ? 1 : 0.15)
    if (navRed.current) navRed.current.scale.setScalar(blink)
    if (navGreen.current) navGreen.current.scale.setScalar(Math.sin(t * 3 + 1.6) > 0.92 ? 1 : 0.15)
  })

  const sh = { castShadow: shadows, receiveShadow: shadows }

  return (
    <group
      ref={ref}
      onPointerOver={() => { if (device.finePointer) rocketState.hover = true }}
      onPointerOut={() => { rocketState.hover = false }}
      onClick={() => { rocketState.boost = 1 }}
    >
      <group ref={inner} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={g.body} material={m.white} {...sh} />
        <mesh geometry={g.nose} material={m.dark} {...sh} />
        <mesh geometry={g.skirt} material={m.band} {...sh} />
        <mesh geometry={g.lowerBand} material={m.band} position={[0, -1.45, 0]} />
        <mesh geometry={g.accent} material={m.accent} position={[0, 0.55, 0]} />
        {[-1.1, -0.2, 0.9].map((y) => (
          <mesh key={y} geometry={g.ringGeo} material={m.metal} position={[0, y, 0]} />
        ))}
        {/* Fins */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} geometry={g.fin} material={m.fin} rotation={[0, (i * Math.PI) / 2, 0]} {...sh} />
        ))}
        {/* Porthole */}
        <group position={[0, 0.35, R - 0.006]}>
          <mesh material={m.metal}>
            <torusGeometry args={[0.095, 0.02, 12, 32]} />
          </mesh>
          <mesh material={m.glass} position={[0, 0, 0.004]}>
            <circleGeometry args={[0.092, 32]} />
          </mesh>
        </group>
        {/* RCS thruster blocks */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            geometry={g.thruster}
            material={m.dark}
            position={[Math.cos((i * Math.PI) / 2 + Math.PI / 4) * (R + 0.01), 0.78, Math.sin((i * Math.PI) / 2 + Math.PI / 4) * (R + 0.01)]}
            rotation={[0, -((i * Math.PI) / 2 + Math.PI / 4) + Math.PI / 2, 0]}
          />
        ))}
        {/* Nozzles + exhaust */}
        {engines.map(([x, z], i) => (
          <mesh key={i} geometry={g.nozzle} material={m.nozzle} position={[x, -2.04, z]} {...sh} />
        ))}
        <group ref={flames} position={[0, -2.5, 0]}>
          {engines.map(([x, z], i) => (
            <mesh key={i} geometry={g.cone} material={m.flame} position={[x, 0, z]} />
          ))}
        </group>
        <pointLight ref={light} position={[0, -2.9, 0]} color="#ff9a52" distance={11} decay={2} intensity={6} />
        <sprite ref={glow} position={[0, -2.7, 0]} scale={[3, 3, 1]}>
          <spriteMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0.75} />
        </sprite>
        {/* Wing-tip strobes */}
        <mesh ref={navRed} material={m.red} position={[1.0, -1.95, 0.04]}>
          <sphereGeometry args={[0.035, 10, 10]} />
        </mesh>
        <mesh ref={navGreen} material={m.green} position={[-1.0, -1.95, 0.04]}>
          <sphereGeometry args={[0.035, 10, 10]} />
        </mesh>
      </group>
    </group>
  )
})
