uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;
varying float vDepth;

// Thin bright line at every integer of x, `sharpness` controls the width.
float lines(float x, float sharpness) {
  return pow(1.0 - abs(fract(x) - 0.5) * 2.0, sharpness);
}

void main() {
  // uv.x runs along the tunnel, uv.y around it.
  float rings = lines(vUv.x * 90.0 - uTime * 1.2, 36.0);
  float rails = lines(vUv.y * 12.0, 70.0) * 0.45;
  // Occasional brighter "gates" to mark distance.
  float gates = lines(vUv.x * 14.0 - uTime * 0.15, 60.0) * 1.5;

  vec3 color = mix(uColorA, uColorB, 0.5 + 0.5 * sin(vUv.x * 24.0 + vUv.y * 6.2831 + uTime * 0.4));
  float fog = exp(-vDepth * 0.07);
  float glow = rings + rails + gates;

  gl_FragColor = vec4(color * (glow * 1.3 + 0.03) * fog * uIntensity, 1.0);
  #include <colorspace_fragment>
}
