import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { budget, device } from '@/hooks/useDevice'
import { completeTask } from '@/state/appStore'
import { dotTexture, galaxyTexture, generateSkyTexture, nebulaTexture } from './textures'
import { TOTAL_DISTANCE, pathX, pathY } from './journey'

/** A group that stays centred on the camera, so its contents look infinitely far away */
function FollowCamera({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((s) => ref.current?.position.copy(s.camera.position))
  return <group ref={ref}>{children}</group>
}

function rand(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

/* ------------------------------ Skybox ------------------------------ */
function Skybox() {
  const [tex, setTex] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    let alive = true
    const w = device.tier === 'low' ? 768 : 1280
    generateSkyTexture(w, w / 2).then((t) => {
      if (!alive) return t.dispose()
      setTex(t)
      completeTask('skybox')
    })
    return () => {
      alive = false
    }
  }, [])
  if (!tex) return null
  return (
    <mesh renderOrder={-10}>
      <sphereGeometry args={[2500, 48, 32]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} toneMapped={false} fog={false} />
    </mesh>
  )
}

/* ------------------------------- Stars ------------------------------- */
const starVertex = /* glsl */ `
  attribute float aSize; attribute float aPhase; attribute vec3 aColor;
  uniform float uTime; uniform float uPx;
  varying vec3 vColor; varying float vTw;
  void main(){
    vColor = aColor;
    vTw = 0.82 + 0.18 * sin(uTime * (0.6 + aPhase * 1.4) + aPhase * 40.0);
    gl_PointSize = aSize * uPx;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`
const starFragment = /* glsl */ `
  varying vec3 vColor; varying float vTw;
  void main(){
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.6) * vTw;
    gl_FragColor = vec4(vColor, a);
  }`

function Stars() {
  const { gl } = useThree()
  const mat = useRef<THREE.ShaderMaterial>(null)
  const geo = useMemo(() => {
    const n = budget.stars
    const r = rand(99)
    const pos = new Float32Array(n * 3), size = new Float32Array(n), phase = new Float32Array(n), col = new Float32Array(n * 3)
    const cool = new THREE.Color('#a9c3ff'), warm = new THREE.Color('#fff0dc'), c = new THREE.Color()
    for (let i = 0; i < n; i++) {
      // 45% of stars hug a tilted galactic plane (matches the skybox band)
      let x: number, y: number, z: number
      if (r() < 0.45) {
        const a = r() * Math.PI * 2
        const off = (r() + r() + r() - 1.5) * 0.28
        const px = Math.cos(a), pz = Math.sin(a)
        const nx = 0.34, ny = 0.9, nz = 0.28
        x = px + nx * off * 2; y = ny * off * 2; z = pz + nz * off * 2
        const dot = x * nx + y * ny + z * nz
        x -= nx * dot * 0.8; y -= ny * dot * 0.8; z -= nz * dot * 0.8
      } else {
        const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u)
        x = s * Math.cos(a); y = u; z = s * Math.sin(a)
      }
      const l = Math.hypot(x, y, z) || 1
      pos.set([(x / l) * 2000, (y / l) * 2000, (z / l) * 2000], i * 3)
      const mag = Math.pow(r(), 7)
      size[i] = 0.9 + mag * 3.4
      phase[i] = r()
      c.copy(cool).lerp(warm, r())
      const bright = 0.45 + mag * 0.55 + r() * 0.2
      col.set([c.r * bright, c.g * bright, c.b * bright], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    return g
  }, [])
  useFrame((s) => {
    if (mat.current && !device.reducedMotion) mat.current.uniforms.uTime.value = s.clock.elapsedTime
  })
  return (
    <points geometry={geo} frustumCulled={false} renderOrder={-9}>
      <shaderMaterial
        ref={mat}
        vertexShader={starVertex}
        fragmentShader={starFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uPx: { value: gl.getPixelRatio() } }}
      />
    </points>
  )
}

/* ---------------------- Distant galaxies (fixed) ---------------------- */
function DistantGalaxies() {
  const tex = useMemo(() => galaxyTexture(256), [])
  const items: { dir: [number, number, number]; size: number; rot: number; op: number }[] = [
    { dir: [-0.55, 0.5, -0.67], size: 190, rot: 0.6, op: 0.85 },
    { dir: [0.72, 0.22, -0.65], size: 110, rot: -0.9, op: 0.65 },
    { dir: [0.2, -0.45, -0.87], size: 80, rot: 1.9, op: 0.55 },
  ]
  return (
    <>
      {items.map((g, i) => (
        <sprite key={i} position={[g.dir[0] * 1800, g.dir[1] * 1800, g.dir[2] * 1800]} scale={[g.size, g.size * 0.55, 1]} renderOrder={-8}>
          <spriteMaterial map={tex} rotation={g.rot} transparent opacity={g.op} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      ))}
    </>
  )
}

/* ------------------- Nebula clouds in world space ------------------- */
function Nebulae() {
  const textures = useMemo(() => [nebulaTexture(192, 3), nebulaTexture(192, 11)], [])
  const clouds = useMemo(() => {
    const r = rand(31)
    const tints = ['#3b4fa8', '#5a3f9c', '#2c6a9a', '#7a4a96']
    const n = device.tier === 'low' ? 5 : 9
    return Array.from({ length: n }, (_, i) => {
      const d = (i / n) * TOTAL_DISTANCE + r() * 40
      const side = i % 2 === 0 ? -1 : 1
      return {
        pos: [pathX(d) + side * (110 + r() * 90), pathY(d) + (r() - 0.5) * 120, -d - 60] as [number, number, number],
        size: 220 + r() * 220,
        tint: tints[i % tints.length],
        tex: textures[i % 2],
        rot: r() * 6,
        op: 0.1 + r() * 0.1,
      }
    })
  }, [textures])
  return (
    <>
      {clouds.map((c, i) => (
        <sprite key={i} position={c.pos} scale={[c.size, c.size, 1]} renderOrder={-7}>
          <spriteMaterial map={c.tex} color={c.tint} rotation={c.rot} transparent opacity={c.op} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </sprite>
      ))}
    </>
  )
}

/* ------------------------- Dust (parallax motes) ------------------------- */
function Dust() {
  const map = useMemo(() => dotTexture(), [])
  const geo = useMemo(() => {
    const n = budget.dust
    const r = rand(555)
    const p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const d = r() * (TOTAL_DISTANCE + 80) - 30
      p.set([pathX(d) + (r() - 0.5) * 60, pathY(d) + (r() - 0.5) * 36, -d], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [])
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={map} size={0.07} sizeAttenuation transparent opacity={0.5} depthWrite={false} color="#cfe0ff" blending={THREE.AdditiveBlending} />
    </points>
  )
}

export function Backdrop() {
  return (
    <>
      <FollowCamera>
        <Skybox />
        <Stars />
        <DistantGalaxies />
      </FollowCamera>
      <Nebulae />
      <Dust />
    </>
  )
}
