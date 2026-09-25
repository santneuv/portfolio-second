import { useFrame } from '@react-three/fiber'
import { easing } from 'maath'
import { scrollState } from '../../lib/scrollState'

/** Subtle parallax: the camera drifts towards the pointer and keeps looking at the centre. */
export function CameraRig() {
  useFrame((state, delta) => {
    const { x, y } = scrollState.pointer
    easing.damp3(state.camera.position, [x * 0.5, y * 0.35, 6], 0.5, Math.min(delta, 0.1))
    state.camera.lookAt(0, 0, 0)
  })
  return null
}
