uniform float uTime;
uniform float uFlow;          // ring scroll offset, sped up by fast pointer movement
uniform vec3 uCamPos;
uniform vec3 uMouseDir;       // world-space ray from the camera through the pointer
uniform float uMouseStrength;
uniform float uCamT;          // camera position along the tunnel (0..1, same as uv.x)
uniform float uPulseAge;      // seconds since the last click
uniform float uPulseStrength;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;
varying float vDepth;
varying vec3 vWorld;

// Thin bright line at every integer of x, `sharpness` controls the width.
float lines(float x, float sharpness) {
  return pow(1.0 - abs(fract(x) - 0.5) * 2.0, sharpness);
}

void main() {
  // uv.x runs along the tunnel, uv.y around it.
  float rings = lines(vUv.x * 90.0 - uFlow, 36.0);
  float rails = lines(vUv.y * 12.0, 70.0) * 0.45;
  // Occasional brighter "gates" to mark distance.
  float gates = lines(vUv.x * 14.0 - uTime * 0.15, 60.0) * 1.5;

  vec3 color = mix(uColorA, uColorB, 0.5 + 0.5 * sin(vUv.x * 24.0 + vUv.y * 6.2831 + uTime * 0.4));
  float fog = exp(-vDepth * 0.07);

  // Flashlight: the wall area the pointer aims at lights up.
  float aim = dot(normalize(vWorld - uCamPos), uMouseDir);
  float spot = smoothstep(0.95, 0.998, aim) * uMouseStrength;

  // Click pulse: a bright ring that starts at the camera and races down the tunnel.
  float pulseAt = uCamT + 0.012 + uPulseAge * 0.12;
  float pulse = exp(-pow((vUv.x - pulseAt) * 180.0, 2.0)) * exp(-uPulseAge * 0.7) * uPulseStrength;

  float glow = rings * (1.0 + spot * 2.5) + rails * (1.0 + spot) + gates + spot * 0.08 + pulse * 1.6;
  color = mix(color, vec3(1.0), clamp(pulse + spot * 0.3, 0.0, 1.0) * 0.3);

  gl_FragColor = vec4(color * (glow * 1.3 + 0.03) * fog * uIntensity, 1.0);
  #include <colorspace_fragment>
}
