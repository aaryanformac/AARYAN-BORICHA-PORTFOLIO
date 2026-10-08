import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { scrollState } from '@/animations/scrollStore'
import { device } from '@/hooks/useDevice'
import { Rocket } from './Rocket'
import { SUN_DIR } from './lighting'
import { pathX, pathY } from './journey'
import { rocketState } from './rocketState'

/**
 * Per-section camera composition (desktop). Order = SECTION_IDS.
 * x: camera sideways offset (negative → rocket appears on the RIGHT of the screen)
 * y/z: camera height / distance, look: where on the rocket the camera aims, yaw: rocket turn
 */
const SHOTS = [
  { x: -2.5, y: 0.8, z: 9.2, look: 0.2, yaw: 0.38 }, // home       — rocket right, text left
  { x: 2.6, y: 0.7, z: 9.6, look: 0.2, yaw: -0.38 }, // about      — rocket left,  HUD right
  { x: -2.6, y: 1.0, z: 10, look: 0.3, yaw: 0.34 }, // skills     — rocket right
  { x: 0.2, y: 1.6, z: 12, look: 1.7, yaw: 0 }, // projects   — rocket low-centre
  { x: 2.6, y: 0.8, z: 9.8, look: 0.2, yaw: -0.4 }, // education  — rocket left
  { x: -2.6, y: 0.9, z: 10, look: 0.3, yaw: 0.36 }, // interests  — rocket right
  { x: 1.8, y: 1.3, z: 11, look: 1.5, yaw: -0.2 }, // contact    — rocket lower-left, station ahead
]

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const damp = THREE.MathUtils.damp

export function JourneyRig() {
  const rocket = useRef<THREE.Group>(null)
  const key = useRef<THREE.DirectionalLight>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const st = useRef({ d: 0, sec: 0, px: 0, py: 0, yaw: 0, bank: 0, look: new THREE.Vector3(), cam: new THREE.Vector3(), init: false })

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const s = st.current
    const rm = device.reducedMotion
    const lam = rm ? 30 : 5.5

    s.d = damp(s.d, scrollState.distance, lam, dt)
    s.sec = damp(s.sec, scrollState.sectionFloat, lam, dt)
    s.px = damp(s.px, state.pointer.x, 3, dt)
    s.py = damp(s.py, state.pointer.y, 3, dt)

    // --- Rocket on the flight path -------------------------------------
    const d = s.d
    const x = pathX(d), y = pathY(d)
    const dx = pathX(d + 2) - x, dy = pathY(d + 2) - y
    const i = Math.min(SHOTS.length - 1, Math.floor(s.sec))
    const t = smoothstep(0.62, 1, s.sec - i)
    const a = SHOTS[i], b = SHOTS[Math.min(SHOTS.length - 1, i + 1)]
    const lerp = (p: number, q: number) => p + (q - p) * t
    const targetYaw = lerp(a.yaw, b.yaw)
    s.yaw = damp(s.yaw, targetYaw, 3, dt)
    const sway = rm ? 0 : Math.sin(state.clock.elapsedTime * 0.7)
    s.bank = damp(s.bank, -dx * 3 + sway * 0.04, 4, dt)

    const r = rocket.current
    if (r) {
      r.position.set(x, y + (rm ? 0 : Math.sin(state.clock.elapsedTime * 1.1) * 0.05), -d)
      r.rotation.order = 'YXZ'
      r.rotation.set(Math.atan(dy / 2), s.yaw - Math.atan(dx / 2), s.bank)
    }

    // --- Camera ---------------------------------------------------------
    const aspect = size.width / size.height
    const portrait = aspect < 0.85
    const k = portrait ? 0.2 : Math.min(1, Math.max(0.45, (aspect - 0.85) / 0.75))
    const camX = lerp(a.x, b.x) * k + s.px * 0.55
    const camY = lerp(a.y, b.y) + s.py * 0.35 + (portrait ? 0.4 : 0)
    const camZ = lerp(a.z, b.z) * (portrait ? 1.3 : 1)
    const look = lerp(a.look, b.look) + (portrait ? 2.4 : 0)
    const px = x + camX, py = y + camY, pz = -d + camZ
    if (!s.init) {
      s.cam.set(px, py, pz)
      s.look.set(x, y + look, -d - 1.5)
      s.init = true
    }
    s.cam.set(damp(s.cam.x, px, lam * 0.8, dt), damp(s.cam.y, py, lam * 0.8, dt), damp(s.cam.z, pz, lam * 0.8, dt))
    s.look.set(damp(s.look.x, x, lam, dt), damp(s.look.y, y + look, lam, dt), damp(s.look.z, -d - 1.5, lam, dt))
    camera.position.copy(s.cam)
    camera.lookAt(s.look)
    // Speed → subtle field-of-view stretch
    const fovTarget = 42 + Math.min(Math.abs(scrollState.velocity) * 0.08, 5) + rocketState.boost * 4
    camera.fov = damp(camera.fov, fovTarget, 4, dt)
    camera.updateProjectionMatrix()

    // --- Key light rides with the rocket (so shadows stay sharp) -------
    const L = key.current
    if (L) {
      L.position.set(x + SUN_DIR.x * 30, y + SUN_DIR.y * 30, -d + SUN_DIR.z * 30)
      L.target.position.set(x, y, -d)
      L.target.updateMatrixWorld()
    }
  })

  return (
    <>
      <Rocket ref={rocket} />
      <directionalLight
        ref={key}
        color="#fff4e6"
        intensity={3.1}
        castShadow={device.tier === 'high'}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={5}
        shadow-camera-far={70}
        shadow-bias={-0.0006}
      />
    </>
  )
}
