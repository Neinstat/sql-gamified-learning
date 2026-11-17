/**
 * The risograph look for the 3D prototype (GAME_DESIGN.md §14.8): the scene is rendered small
 * (big pixels), then every pixel is mapped to the riso inks with a 4×4 Bayer dither between the
 * two closest inks, ink outlines are drawn where depth jumps, and a red copy of the outline is
 * printed one pixel off — like a riso print whose red layer did not line up.
 *
 * The Data Lens (GAME_DESIGN.md §7) turns the same picture into a teal blueprint on paper with a
 * grid; it dissolves in pixel by pixel (in Bayer order) as `lens` goes from 0 to 1.
 */
import * as THREE from 'three';
import { RISO } from '../art/riso';
import { hexColour } from './colour';

/** Inks the picture may use: the whole riso palette. */
const INKS = Object.values(RISO).map(hexColour);

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  #define INK_COUNT ${INKS.length}
  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform vec2 resolution;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform vec3 inks[INK_COUNT];
  uniform vec3 outlineInk;
  uniform vec3 misprintInk;
  uniform float lens;
  uniform vec3 lensPaper;
  uniform vec3 lensLight;
  uniform vec3 lensDark;
  uniform vec3 lensAccent;
  varying vec2 vUv;

  float viewDepth(vec2 px) {
    float d = texture2D(tDepth, (px + 0.5) / resolution).x;
    // Perspective depth → distance from the camera.
    return (cameraNear * cameraFar) / ((cameraFar - cameraNear) * d - cameraFar) * -1.0;
  }

  bool isEdge(vec2 px) {
    float d = viewDepth(px);
    float r = viewDepth(px + vec2(1.0, 0.0));
    float u = viewDepth(px + vec2(0.0, 1.0));
    float l = viewDepth(px - vec2(1.0, 0.0));
    float b = viewDepth(px - vec2(0.0, 1.0));
    float jump = max(max(abs(d - r), abs(d - u)), max(abs(d - l), abs(d - b)));
    // Only outline the nearer side of a jump, relative to distance (far things get fewer lines).
    return jump > 0.08 * d && d <= min(min(r, u), min(l, b)) + 0.0001 && d < cameraFar * 0.9;
  }

  float bayer(vec2 px) {
    int x = int(mod(px.x, 4.0));
    int y = int(mod(px.y, 4.0));
    int i = x + y * 4;
    // 4×4 Bayer matrix / 16.
    float m[16];
    m[0] = 0.0;  m[1] = 8.0;  m[2] = 2.0;  m[3] = 10.0;
    m[4] = 12.0; m[5] = 4.0;  m[6] = 14.0; m[7] = 6.0;
    m[8] = 3.0;  m[9] = 11.0; m[10] = 1.0; m[11] = 9.0;
    m[12] = 15.0; m[13] = 7.0; m[14] = 13.0; m[15] = 5.0;
    for (int k = 0; k < 16; k++) if (k == i) return (m[k] + 0.5) / 16.0;
    return 0.5;
  }

  float inkDistance(vec3 a, vec3 b) {
    vec3 d = (a - b) * vec3(0.9, 1.2, 0.7);
    return dot(d, d);
  }

  /** The Data Lens look: a teal blueprint on paper, with a grid in the light parts. */
  vec3 blueprint(vec2 px, vec3 c) {
    float l = dot(c, vec3(0.3, 0.59, 0.11));
    bool grid = mod(px.x, 12.0) < 1.0 || mod(px.y, 12.0) < 1.0;
    if (l > 0.72) return grid ? lensLight : lensPaper;
    if (l > 0.42) return bayer(px + vec2(2.0, 1.0)) < (0.72 - l) / 0.3 ? lensLight : (grid ? lensLight : lensPaper);
    return bayer(px + vec2(1.0, 3.0)) < (0.42 - l) / 0.42 ? lensDark : lensLight;
  }

  void main() {
    vec2 px = floor(vUv * resolution);
    // Pixels switch to the lens one by one, in Bayer order, so the world dissolves into data.
    bool data = bayer(px + vec2(3.0, 2.0)) < lens;
    if (isEdge(px)) { gl_FragColor = vec4(data ? lensDark : outlineInk, 1.0); return; }
    if (isEdge(px - vec2(1.0, -1.0))) { gl_FragColor = vec4(data ? lensAccent : misprintInk, 1.0); return; }

    vec3 c = texture2D(tColor, (px + 0.5) / resolution).rgb;
    if (data) { gl_FragColor = vec4(blueprint(px, c), 1.0); return; }
    // The two closest inks, then dither between them.
    float best = 1e9; float second = 1e9;
    vec3 a = inks[0]; vec3 b = inks[0];
    for (int k = 0; k < INK_COUNT; k++) {
      float d = inkDistance(c, inks[k]);
      if (d < best) { second = best; b = a; best = d; a = inks[k]; }
      else if (d < second) { second = d; b = inks[k]; }
    }
    float t = best / max(best + second, 1e-6);
    gl_FragColor = vec4(bayer(px) < t ? b : a, 1.0);
  }
`;

export class RisoPass {
  readonly target: THREE.WebGLRenderTarget;
  private readonly material: THREE.ShaderMaterial;
  private readonly quad: THREE.Mesh;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  constructor() {
    this.target = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthTexture: new THREE.DepthTexture(1, 1),
    });
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tColor: { value: this.target.texture },
        tDepth: { value: this.target.depthTexture },
        resolution: { value: new THREE.Vector2(1, 1) },
        cameraNear: { value: 0.05 },
        cameraFar: { value: 100 },
        inks: { value: INKS },
        outlineInk: { value: hexColour(RISO.ink) },
        misprintInk: { value: hexColour(RISO.red) },
        lens: { value: 0 },
        lensPaper: { value: hexColour(RISO.paper) },
        lensLight: { value: hexColour(RISO.tealLight) },
        lensDark: { value: hexColour(RISO.tealDark) },
        lensAccent: { value: hexColour(RISO.mustard) },
      },
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.scene.add(this.quad);
  }

  /** The low resolution the scene is drawn at (big pixels). */
  setSize(width: number, height: number): void {
    this.target.setSize(width, height);
    this.material.uniforms.resolution.value.set(width, height);
  }

  /** How far the Data Lens has dissolved in: 0 = the normal riso picture, 1 = all data view. */
  setLens(amount: number): void {
    this.material.uniforms.lens.value = Math.min(1, Math.max(0, amount));
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.material.uniforms.cameraNear.value = camera.near;
    this.material.uniforms.cameraFar.value = camera.far;
    renderer.setRenderTarget(this.target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.target.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
