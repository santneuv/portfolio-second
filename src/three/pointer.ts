import type { RootState } from '@react-three/fiber'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
import { scrollState } from '../lib/scrollState'

// Scratch objects reused every frame.
const raycaster = new Raycaster()
const ndc = new Vector2()
const plane = new Plane(new Vector3(0, 0, 1), 0)

/** A raycaster pointing from the camera through the current pointer position. */
export function pointerRay(state: RootState, at: { x: number; y: number } = scrollState.pointer) {
  ndc.set(at.x, at.y)
  raycaster.setFromCamera(ndc, state.camera)
  return raycaster
}

/** Where the pointer ray hits the world plane z = `z`. Returns null if it misses. */
export function pointerOnPlane(
  state: RootState,
  out: Vector3,
  z = 0,
  at: { x: number; y: number } = scrollState.pointer,
) {
  plane.constant = -z
  return pointerRay(state, at).ray.intersectPlane(plane, out)
}

/** Seconds since the last background click. */
export function clickAge() {
  return (performance.now() - scrollState.click.time) / 1000
}
