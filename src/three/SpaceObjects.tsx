import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { device } from '@/hooks/useDevice'
import { fbm3, solarPanelTexture } from './textures'
import { pathX, pathY } from './journey'

const calm = () => (device.reducedMotion ? 0.12 : 1)

/* ----------------------------- Satellite ----------------------------- */
export function Satellite({ position, scale = 1, speed = 0.15, rotation = [0.3, 0.4, 0.1] as [number, number, number] }: {
  position: [number, number, number]; scale?: number; speed?: number; rotation?: [number, number, number]
}) {
  const grp = useRef<THREE.Group>(null)
  const led = useRef<THREE.Mesh>(null)
  const panelTex = useMemo(() => {
    const t = solarPanelTexture()
    t.repeat.set(4, 2)
    return t
  }, [])
  useFrame((s, dt) => {
    if (grp.current) {
      grp.current.rotation.y += Math.min(dt, 0.05) * speed * calm()
      grp.current.rotation.x += Math.min(dt, 0.05) * speed * 0.3 * calm()
    }
    if (led.current) led.current.visible = Math.sin(s.clock.elapsedTime * 2.2) > 0.6
  })
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <group ref={grp}>
        <mesh>
          <boxGeometry args={[1, 1, 1.5]} />
          <meshStandardMaterial color="#b88b34" metalness={1} roughness={0.32} envMapIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0, 0.82]}>
          <cylinderGeometry args={[0.35, 0.42, 0.2, 20]} />
          <meshStandardMaterial color="#6e737d" metalness={0.9} roughness={0.4} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
              <meshStandardMaterial color="#aab0ba" metalness={1} roughness={0.3} />
            </mesh>
            <mesh position={[s * 2.7, 0, 0]}>
              <boxGeometry args={[3, 0.05, 1.3]} />
              <meshStandardMaterial map={panelTex} metalness={0.7} roughness={0.28} envMapIntensity={1.6} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.75, -0.2]} rotation={[0.5, 0, 0]}>
          <sphereGeometry args={[0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.3]} />
          <meshStandardMaterial color="#d6d9df" metalness={0.5} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.15, -0.05]}>
          <cylinderGeometry args={[0.015, 0.015, 0.7, 6]} />
          <meshStandardMaterial color="#cfd3da" metalness={1} roughness={0.3} />
        </mesh>
        <mesh ref={led} position={[0.35, 0.52, 0.5]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#ff4a3a" toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

/* --------------------------- Space station --------------------------- */
export function SpaceStation({ position, scale = 1, rotation = [0.15, -0.5, 0.05] as [number, number, number] }: {
  position: [number, number, number]; scale?: number; rotation?: [number, number, number]
}) {
  const wheel = useRef<THREE.Group>(null)
  const panelTex = useMemo(() => {
    const t = solarPanelTexture()
    t.repeat.set(6, 2)
    return t
  }, [])
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.z += Math.min(dt, 0.05) * 0.18 * calm()
  })
  const metal = { color: '#b5bac4', metalness: 0.85, roughness: 0.38 } as const
  return (
    <group position={position} scale={scale} rotation={rotation}>
      {/* Long axis = Z */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 7, 32]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, 0, 4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.8, 1, 24]} />
        <meshStandardMaterial color="#8c929d" metalness={0.9} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 4.7]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.07, 10, 28]} />
        <meshStandardMaterial color="#d8dbe2" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, -4]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.8, 1, 24]} />
        <meshStandardMaterial color="#8c929d" metalness={0.9} roughness={0.35} />
      </mesh>
      {/* Habitat wheel */}
      <group ref={wheel} position={[0, 0, 0.6]}>
        <mesh>
          <torusGeometry args={[4.6, 0.38, 16, 80]} />
          <meshStandardMaterial {...metal} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]} position={[Math.cos((i * Math.PI) / 3) * 2.4, Math.sin((i * Math.PI) / 3) * 2.4, 0]}>
            <boxGeometry args={[4.4, 0.07, 0.07]} />
            <meshStandardMaterial color="#8a909b" metalness={0.9} roughness={0.4} />
          </mesh>
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i * Math.PI) / 6) * 4.6, Math.sin((i * Math.PI) / 6) * 4.6, 0.36]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffe1a8" emissive="#ffcf8a" emissiveIntensity={5} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Modules */}
      <mesh position={[1.3, 0, -1.4]}>
        <boxGeometry args={[1.2, 1, 1.8]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[-1.3, 0.1, 2.6]}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 20]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {/* Solar arrays */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, s * 0.9, -2.2]}>
          <mesh position={[0, s * 0.8, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />
            <meshStandardMaterial color="#9aa0aa" metalness={1} roughness={0.3} />
          </mesh>
          <mesh position={[0, s * 4.2, 0]}>
            <boxGeometry args={[2.1, 5.6, 0.05]} />
            <meshStandardMaterial map={panelTex} metalness={0.7} roughness={0.3} envMapIntensity={1.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ----------------------------- Asteroids ----------------------------- */
function makeAsteroidGeometry(seed: number) {
  const g = new THREE.IcosahedronGeometry(1, 3)
  const pos = g.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    const n = fbm3(v.x * 1.7 + seed, v.y * 1.7, v.z * 1.7, 4, seed)
    const crater = fbm3(v.x * 4 + 3, v.y * 4, v.z * 4 + seed, 3, seed + 9)
    const d = 0.72 + n * 0.62 - (crater > 0.66 ? (crater - 0.66) * 1.1 : 0)
    pos.setXYZ(i, v.x * d, v.y * d * 0.85, v.z * d)
    const shade = 0.55 + fbm3(v.x * 3, v.y * 3, v.z * 3, 3, seed + 4) * 0.7
    colors[i * 3] = shade; colors[i * 3 + 1] = shade * 0.96; colors[i * 3 + 2] = shade * 0.92
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

function rand(seed: number) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

interface FieldProps {
  /** Distance range along the journey the field covers */
  from: number
  to: number
  count: number
  spread: [number, number]
  /** Keep this radius around the flight path free */
  corridor?: number
  size?: [number, number]
  seed?: number
}

export function AsteroidField({ from, to, count, spread, corridor = 5.5, size = [0.35, 2.2], seed = 7 }: FieldProps) {
  const variants = 3
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([])
  const geos = useMemo(() => Array.from({ length: variants }, (_, i) => makeAsteroidGeometry(i * 11 + seed)), [seed])
  const data = useMemo(() => {
    const r = rand(seed * 977 + 13)
    const items = Array.from({ length: variants }, () => [] as { p: THREE.Vector3; s: number; rot: THREE.Euler; sp: THREE.Vector3 }[])
    for (let i = 0; i < count; i++) {
      const d = from + r() * (to - from)
      let dx = (r() - 0.5) * 2 * spread[0]
      const dy = (r() - 0.5) * 2 * spread[1]
      if (Math.hypot(dx, dy) < corridor) dx = (dx < 0 ? -1 : 1) * (corridor + r() * 4)
      const s = size[0] + Math.pow(r(), 3) * (size[1] - size[0])
      items[i % variants].push({
        p: new THREE.Vector3(pathX(d) + dx, pathY(d) + dy, -d),
        s,
        rot: new THREE.Euler(r() * 6, r() * 6, r() * 6),
        sp: new THREE.Vector3((r() - 0.5) * 0.4, (r() - 0.5) * 0.4, (r() - 0.5) * 0.4),
      })
    }
    return items
  }, [count, from, to, spread, corridor, size, seed])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  const init = (mesh: THREE.InstancedMesh | null, vi: number) => {
    meshes.current[vi] = mesh
    if (!mesh) return
    data[vi].forEach((a, i) => {
      dummy.position.copy(a.p)
      dummy.rotation.copy(a.rot)
      dummy.scale.setScalar(a.s)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      color.setHSL(0.07, 0.08, 0.5 + ((i * 37) % 10) / 40)
      mesh.setColorAt(i, color)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  const mid = (-(from + to) / 2)
  useFrame((state, dt) => {
    const cz = state.camera.position.z
    if (Math.abs(cz - mid) > (to - from) / 2 + 90) return // only animate when near
    const m = calm()
    if (m < 0.2) return
    dt = Math.min(dt, 0.05)
    meshes.current.forEach((mesh, vi) => {
      if (!mesh) return
      data[vi].forEach((a, i) => {
        a.rot.x += a.sp.x * dt
        a.rot.y += a.sp.y * dt
        a.rot.z += a.sp.z * dt
        dummy.position.copy(a.p)
        dummy.rotation.copy(a.rot)
        dummy.scale.setScalar(a.s)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <group>
      {geos.map((geo, vi) => (
        <instancedMesh key={vi} ref={(m) => init(m, vi)} args={[geo, undefined, Math.max(1, data[vi].length)]} frustumCulled={false}>
          <meshStandardMaterial vertexColors roughness={0.96} metalness={0.02} envMapIntensity={0.25} />
        </instancedMesh>
      ))}
    </group>
  )
}

/* ------------------------------- Debris ------------------------------- */
/** Small tumbling metallic fragments scattered along the entire journey */
export function Debris({ count, from, to }: { count: number; from: number; to: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const items = useMemo(() => {
    const r = rand(4242)
    return Array.from({ length: count }, () => {
      const d = from + r() * (to - from)
      const side = r() < 0.5 ? -1 : 1
      return {
        p: new THREE.Vector3(pathX(d) + side * (5 + r() * 14), pathY(d) + (r() - 0.5) * 12, -d),
        s: 0.15 + r() * 0.5,
        rot: new THREE.Euler(r() * 6, r() * 6, r() * 6),
        sp: new THREE.Vector3((r() - 0.5) * 0.9, (r() - 0.5) * 0.9, (r() - 0.5) * 0.9),
      }
    })
  }, [count, from, to])

  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    const k = calm()
    dt = Math.min(dt, 0.05)
    items.forEach((a, i) => {
      a.rot.x += a.sp.x * dt * k
      a.rot.y += a.sp.y * dt * k
      dummy.position.copy(a.p)
      dummy.rotation.copy(a.rot)
      dummy.scale.set(a.s * 1.6, a.s * 0.12, a.s)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#9a9fa8" metalness={0.95} roughness={0.38} envMapIntensity={1.2} />
    </instancedMesh>
  )
}
