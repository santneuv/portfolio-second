uniform float uPaletteShift;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

varying vec3 vNormal;
varying vec3 vViewDir;
varying float vDisplacement;

// Cyclic three-stop gradient A → B → C → A, so hues stay within the theme.
vec3 palette(float t) {
  t = fract(t) * 3.0;
  if (t < 1.0) return mix(uColorA, uColorB, t);
  if (t < 2.0) return mix(uColorB, uColorC, t - 1.0);
  return mix(uColorC, uColorA, t - 2.0);
}

void main() {
  vec3 normal = normalize(vNormal);
  float facing = max(dot(normal, normalize(vViewDir)), 0.0);
  float fresnel = pow(1.0 - facing, 2.0);

  // Iridescence: hue depends on viewing angle and on how far the surface is displaced.
  vec3 color = palette(fresnel * 0.8 + vDisplacement * 1.2 + uPaletteShift);

  // Dark glossy core with a glowing rim.
  color *= 0.18 + fresnel * 1.4;

  vec3 lightDir = normalize(vec3(0.5, 0.8, 0.6));
  float spec = pow(max(dot(reflect(-lightDir, normal), normalize(vViewDir)), 0.0), 24.0);
  color += spec * 0.5;

  gl_FragColor = vec4(color * uIntensity, 1.0);
  #include <colorspace_fragment>
}
