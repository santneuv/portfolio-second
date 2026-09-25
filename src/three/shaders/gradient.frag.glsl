uniform float uTime;
uniform vec3 uColors[4];

varying vec2 vUv;

// Soft "mesh gradient": four slowly drifting coloured blobs over a warm base.
void main() {
  vec3 color = vec3(0.953, 0.937, 0.914);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 center = vec2(
      0.5 + 0.32 * sin(uTime * 0.11 + fi * 1.7),
      0.5 + 0.28 * cos(uTime * 0.09 + fi * 2.3)
    );
    vec2 d = (vUv - center) * vec2(2.0, 1.0);
    float w = exp(-dot(d, d) * 5.0);
    color = mix(color, uColors[i], w * 0.75);
  }
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
