import type { RootState } from '@react-three/fiber'
import { easing } from 'maath'
import type { Object3D } from 'three'
import { scrollState } from '../lib/scrollState'
import { sections } from '../lib/sections'

export const LAST_STAGE = sections.length - 1

export interface StageBlend {
  /** Index of the section we are leaving. */
  i: number
  /** Eased progress (0..1) towards section i + 1. */
  f: number
}

export interface SceneProps {
  reducedMotion: boolean
  /** False on slow devices: scenes should skip post-processing and heavy materials. */
  effects: boolean
}

/**
 * Moves `smoothed.value` towards the current scroll stage and returns which two
 * sections to blend between. With reduced motion it snaps to the nearest section.
 */
export function stepStage(
  smoothed: { value: number },
  reducedMotion: boolean,
  dt: number,
  smoothTime = 0.35,
): StageBlend {
  if (reducedMotion) smoothed.value = Math.round(scrollState.stage)
  else easing.damp(smoothed, 'value', scrollState.stage, smoothTime, dt)

  const s = Math.min(Math.max(smoothed.value, 0), LAST_STAGE)
  const i = Math.min(Math.floor(s), LAST_STAGE - 1)
  const raw = s - i
  return { i, f: raw * raw * (3 - 2 * raw) }
}

/** Interpolates a per-section value list (one entry per section). */
export function lerpStage(values: readonly number[], { i, f }: StageBlend) {
  return values[i] + (values[i + 1] - values[i]) * f
}

/**
 * Shared layout: shifts the object right on wide screens by a per-section
 * fraction of the viewport width and scales it down on narrow screens.
 */
export function layoutObject(
  object: Object3D,
  state: RootState,
  offsets: readonly number[],
  blend: StageBlend,
  reducedMotion: boolean,
  dt: number,
  fitWidth = 4.4,
) {
  const { viewport, size } = state
  const offset = size.width >= 900 ? lerpStage(offsets, blend) * viewport.width : 0
  const scale = Math.min(Math.max(viewport.width / fitWidth, 0.55), 1)
  if (reducedMotion) {
    object.position.x = offset
    object.scale.setScalar(scale)
  } else {
    easing.damp(object.position, 'x', offset, 0.25, dt)
    easing.damp3(object.scale, [scale, scale, scale], 0.25, dt)
  }
}
