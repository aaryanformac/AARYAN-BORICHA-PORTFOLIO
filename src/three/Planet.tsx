import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { PlanetKind } from '@/data/types'
import { budget, device } from '@/hooks/useDevice'
import { completeTask } from '@/state/appStore'
import { generatePlanetTextures, ringTexture, type PlanetTextures } from './textures'
import { SUN_DIR } from './lighting'

const BASE_COLOR: Record<PlanetKind, string> = {
  terra: '#1d4a6e', ocean: '#1b4468', rocky: '#6f665c', ice: '#c4d6e6', gas: '#b49a78', desert: '#9a5e42',
}

const atmoVertex = /* glsl */ `
  varying vec3 vN; varying vec3 vW;
  void main(){
    vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`
const atmoFragment = /* glsl */ `
  uniform vec3 uColor; uniform vec3 uSun; uniform float uPower; uniform float uIntensity;
  varying vec3 vN; varying vec3 vW;
  void main(){
    vec3 n = normalize(vN);
    vec3 v = normalize(cameraPosition - vW);
    float rim = pow(1.0 - max(dot(n, v), 0.0), uPower);
    float sun = smoothstep(-0.3, 0.55, dot(n, uSun));
    float a = clamp(rim * uIntensity * (0.1 + 0.9 * sun), 0.0, 1.0);
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }`

export interface PlanetProps {
  kind: PlanetKind
  position: [number, number, number]
  radius: number
  seed?: number
  /** radians / second */
  spin?: number
  tilt?: number
  clouds?: boolean
  atmosphere?: string
  ring?: boolean
  /** texture width; height = width / 2 */
  texSize?: number
  /** marks the loader task complete once textures are ready */
  taskName?: string
}

export function Planet({
  kind, position, radius, seed = 1, spin = 0.01, tilt = 0.25, clouds = false, atmosphere, ring = false, texSize, taskName,
}: PlanetProps) {
  const body = useRef<THREE.Mesh>(null)
  const cloudRef = useRef<THREE.Mesh>(null)
  const [tex, setTex] = useState<PlanetTextures | null>(null)
  const w = texSize ?? budget.planetTex
  const seg = Math.max(24, Math.round(budget.sphereSeg * (radius > 20 ? 1 : radius > 5 ? 0.7 : 0.5)))

  useEffect(() => {
    let alive = true
    let result: PlanetTextures | null = null
    generatePlanetTextures(kind, w, w / 2, seed, clouds).then((t) => {
      result = t
      if (!alive) {
        t.map.dispose(); t.bump.dispose(); t.clouds?.dispose()
        return
      }
      setTex(t)
      if (taskName) completeTask(taskName)
    })
    return () => {
      alive = false
      result?.map.dispose(); result?.bump.dispose(); result?.clouds?.dispose()
    }
  }, [kind, w, seed, clouds, taskName])

  const atmo = useMemo(
    () =>
      atmosphere
        ? new THREE.ShaderMaterial({
            vertexShader: atmoVertex,
            fragmentShader: atmoFragment,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            uniforms: {
              uColor: { value: new THREE.Color(atmosphere) },
              uSun: { value: SUN_DIR.clone() },
              uPower: { value: 3.2 },
              uIntensity: { value: 1.6 },
            },
          })
        : null,
    [atmosphere],
  )

  const ringTex = useMemo(() => (ring ? ringTexture() : null), [ring])
  const ringGeo = useMemo(() => {
    if (!ring) return null
    const inner = radius * 1.35, outer = radius * 2.25
    const g = new THREE.RingGeometry(inner, outer, 128, 1)
    const pos = g.attributes.position as THREE.BufferAttribute
    const uv = g.attributes.uv as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i))
      uv.setXY(i, (r - inner) / (outer - inner), 0.5)
    }
    return g
  }, [ring, radius])

  useFrame((_, dt) => {
    const m = device.reducedMotion ? 0.15 : 1
    if (body.current) body.current.rotation.y += Math.min(dt, 0.05) * spin * m
    if (cloudRef.current) cloudRef.current.rotation.y += Math.min(dt, 0.05) * spin * 1.35 * m
  })

  return (
    <group position={position} rotation={[0, 0, tilt]}>
      <mesh ref={body}>
        <sphereGeometry args={[radius, seg, Math.round(seg * 0.75)]} />
        <meshStandardMaterial
          color={tex ? '#ffffff' : BASE_COLOR[kind]}
          map={tex?.map ?? null}
          bumpMap={tex?.bump ?? null}
          bumpScale={radius * 0.012}
          roughness={kind === 'ice' ? 0.55 : 0.92}
          metalness={0}
          envMapIntensity={0.12}
        />
      </mesh>
      {clouds && tex?.clouds && (
        <mesh ref={cloudRef} scale={1.012}>
          <sphereGeometry args={[radius, seg, Math.round(seg * 0.75)]} />
          <meshStandardMaterial map={tex.clouds} transparent depthWrite={false} roughness={1} envMapIntensity={0.1} />
        </mesh>
      )}
      {atmo && (
        <mesh scale={1.035} material={atmo}>
          <sphereGeometry args={[radius, seg, Math.round(seg * 0.75)]} />
        </mesh>
      )}
      {ringGeo && ringTex && (
        <mesh geometry={ringGeo} rotation={[Math.PI / 2 - 0.12, 0, 0]}>
          <meshStandardMaterial map={ringTex} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} envMapIntensity={0.1} />
        </mesh>
      )}
    </group>
  )
}
