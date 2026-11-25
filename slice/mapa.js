// Horneado del mapa del mundo (una sola vez al cargar): vista cenital de las alturas de los edificios -> sombras del sol y distancia a los muros.
// Resultado: una textura RGBA8 (R = sombra, G = distancia al muro/3,5 m, B = altura/64). El agua la lee con UNA muestra por píxel.
export function hornear(THREE, renderer, scene, box, sol) {
  const W = 1536, Hh = Math.round(W * box.sz / box.sx);
  const base = { format: THREE.RGBAFormat, type: THREE.UnsignedByteType };
  const rtH = new THREE.WebGLRenderTarget(W, Hh, { ...base, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true });
  const rtS = new THREE.WebGLRenderTarget(W, Hh, { ...base, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
  // paso A: alturas (solo la ciudad opaca) vistas desde arriba; la altura (0-64 m) se codifica en dos canales
  const cx = box.x0 + box.sx / 2, cz = box.z0 + box.sz / 2;
  const cam = new THREE.OrthographicCamera(-box.sx / 2, box.sx / 2, box.sz / 2, -box.sz / 2, 1, 400);
  cam.position.set(cx, 200, cz); cam.up.set(0, 0, -1); cam.lookAt(cx, 0, cz);
  const matH = new THREE.ShaderMaterial({ side: THREE.DoubleSide,
    vertexShader: 'varying float vY; void main(){ vY = (modelMatrix * vec4(position, 1.)).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'varying float vY; void main(){ float v = clamp(vY / 64., 0., .9999); float hi = floor(v * 255.) / 255.; gl_FragColor = vec4(hi, fract(v * 255.), 0., 1.); }' });
  const vis = []; scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine || o.isSprite) { vis.push([o, o.visible]); if (!o.userData.ciudad) o.visible = false; } });
  const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null; scene.overrideMaterial = matH;
  const antes = renderer.getRenderTarget(); renderer.setRenderTarget(rtH); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, cam);
  scene.overrideMaterial = null; scene.background = bg; scene.fog = fog; for (const [o, v] of vis) o.visible = v;
  // paso B: sombra del sol (rayo hacia el sol sobre el mapa de alturas) y distancia al muro más cercano
  const s = sol.clone().normalize();
  const matS = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
    uniforms: { tH: { value: rtH.texture }, uBox: { value: new THREE.Vector4(box.x0, box.z0, box.sx, box.sz) }, uSun: { value: s } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `varying vec2 vUv; uniform sampler2D tH; uniform vec4 uBox; uniform vec3 uSun;
      float Hg(vec2 uv){ vec4 c = texture2D(tH, uv); return (c.r + c.g / 255.) * 64.; }
      vec2 w2uv(vec2 p){ return vec2((p.x - uBox.x) / uBox.z, 1. - (p.y - uBox.y) / uBox.w); }
      void main(){
        vec2 p = vec2(uBox.x + vUv.x * uBox.z, uBox.y + (1. - vUv.y) * uBox.w); float h0 = Hg(vUv);
        float sh = 0., wd = 3.5;
        if (h0 < .6) {
          vec2 hd = normalize(uSun.xz); float hl = length(uSun.xz);
          for (int i = 1; i <= 38; i++){ float t = float(i) * .8; if (Hg(w2uv(p + hd * t)) > t * uSun.y / hl + .15) { sh = 1.; break; } }
          for (int k = 1; k <= 8; k++){ float r = float(k) * .42; for (int a = 0; a < 8; a++){ float an = float(a) * .7854; if (Hg(w2uv(p + vec2(cos(an), sin(an)) * r)) > .5) { wd = min(wd, r); } } }
        }
        gl_FragColor = vec4(sh, wd / 3.5, h0 / 64., 1.);
      }` });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matS), esc = new THREE.Scene(); esc.add(quad);
  renderer.setRenderTarget(rtS); renderer.render(esc, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)); renderer.setRenderTarget(antes);
  rtH.dispose(); matS.dispose(); matH.dispose();
  const Wp = rtS.width, Hp = rtS.height, buf = new Uint8Array(Wp * Hp * 4); renderer.readRenderTargetPixels(rtS, 0, 0, Wp, Hp, buf);
  const altura = (x, z) => { const cx = Math.floor((x - box.x0) / box.sx * Wp), cr = Math.floor((1 - (z - box.z0) / box.sz) * Hp); if (cx < 0 || cx >= Wp || cr < 0 || cr >= Hp) return 0; return buf[(cr * Wp + cx) * 4 + 2] / 255 * 64; };
  return { altura, rt: rtS, tex: rtS.texture, box: new THREE.Vector4(box.x0, box.z0, box.sx, box.sz) };
}
