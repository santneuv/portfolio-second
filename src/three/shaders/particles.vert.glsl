uniform float uTime;       // only advances when motion is allowed
uniform float uSize;
uniform float uPixelRatio;
uniform float uMotion;     // 1 = full motion, 0 = prefers-reduced-motion
uniform vec4 uWeights;     // blend weights for sphere, torus, galaxy, ring

attribute vec3 aTorus;
attribute vec3 aGalaxy;
attribute vec3 aRing;
attribute float aRandom;

varying float vRandom;

mat3 rotateX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);
}

mat3 rotateY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);
}

mat3 rotateZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);
}

void main() {
  // Each shape spins around its own axis, so e.g. the ring never turns edge-on.
  vec3 sphere = rotateY(uTime * 0.15) * position;
  vec3 torus = rotateY(uTime * 0.2) * rotateX(0.45) * aTorus;
  vec3 galaxy = rotateX(0.9) * rotateY(uTime * 0.08) * aGalaxy;
  vec3 ring = rotateZ(uTime * 0.1) * aRing;

  vec3 pos = sphere * uWeights.x + torus * uWeights.y + galaxy * uWeights.z + ring * uWeights.w;

  // Halfway between two shapes the particles burst outwards, then settle.
  float peak = max(max(uWeights.x, uWeights.y), max(uWeights.z, uWeights.w));
  float transition = (1.0 - peak) * 2.0;
  pos += normalize(pos + vec3(0.0001)) * transition * (0.3 + aRandom) * 0.9;

  // Gentle idle drift.
  float t = uTime * 0.6 + aRandom * 6.2831;
  pos += vec3(sin(t), cos(t * 1.3), sin(t * 0.7)) * 0.03 * uMotion;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float twinkle = mix(1.0, 0.65 + 0.35 * sin(uTime * 2.5 + aRandom * 50.0), uMotion);
  gl_PointSize = uSize * uPixelRatio * (0.4 + aRandom) * twinkle / -mvPosition.z;

  vRandom = aRandom;
}
