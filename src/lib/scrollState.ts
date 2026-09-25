// Shared mutable state between the DOM and the WebGL scene.
// Written from event listeners and read inside useFrame, so scrolling
// and pointer movement never trigger React re-renders.
export const scrollState = {
  /** Continuous section position: 0 = centred on the first section, 1 = second, ... */
  stage: 0,
  /** Pointer position in normalised device coordinates (-1..1). */
  pointer: { x: 0, y: 0 },
}
