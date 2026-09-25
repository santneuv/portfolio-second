uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uIntensity;

varying float vRandom;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Soft round glow that fades to the edge of the point sprite.
  float alpha = pow(1.0 - d * 2.0, 2.5);

  vec3 color = mix(uColorA, uColorB, vRandom);
  // A few particles get a white-hot core for sparkle.
  color = mix(color, vec3(1.0), step(0.93, vRandom) * 0.6);

  gl_FragColor = vec4(color * uIntensity, alpha);
  #include <colorspace_fragment>
}
