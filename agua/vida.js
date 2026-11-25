// Vida ambiental: pajaros (vuelan, se posan en tejados y postes, huyen de la moto), mariposas/libelulas/abejas y carpas koi bajo el agua.
// Un solo mesh dinamico de carteles (1 llamada de dibujo). Sprites pixel de Flow en assets_pixel/sprites_universo/px.
const BASE = './assets_pixel/sprites_universo/px/';
const cargaImg = (u) => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = u; });
// casilla de la hoja -> archivo (ver assets_pixel/sprites_universo/celdas.json)
const F = {
  cuervo: { vuelo: ['pajaros/pajaros_01', 'pajaros/pajaros_02', 'pajaros/pajaros_04', 'pajaros/pajaros_02'], posado: 'pajaros/pajaros_03', ancho: .95, alto_p: .55 },
  paloma: { vuelo: ['pajaros/pajaros_05', 'pajaros/pajaros_06', 'pajaros/pajaros_08', 'pajaros/pajaros_06'], posado: 'pajaros/pajaros_07', ancho: .62, alto_p: .34 },
  golondrina: { vuelo: ['pajaros/pajaros_09', 'pajaros/pajaros_10', 'pajaros/pajaros_09', 'pajaros/pajaros_10'], posado: 'pajaros/pajaros_11', ancho: .36, alto_p: .22 },
  gorrion: { vuelo: ['pajaros/pajaros_05', 'pajaros/pajaros_06', 'pajaros/pajaros_08', 'pajaros/pajaros_06'], posado: 'pajaros/pajaros_12', ancho: .26, alto_p: .16 },
};
const MARIP = [['insectos/insectos_01', 'insectos/insectos_02'], ['insectos/insectos_04', 'insectos/insectos_03'], ['insectos/insectos_05', 'insectos/insectos_06'], ['insectos/insectos_07', 'insectos/insectos_08']];
const LIBEL = ['insectos/insectos_09', 'insectos/insectos_10'], ABEJA = 'insectos/insectos_11';
const CARPAS = [['carpas/carpas_01', 'carpas/carpas_02', 'carpas/carpas_03'], ['carpas/carpas_04', 'carpas/carpas_05', 'carpas/carpas_06'], ['carpas/carpas_07', 'carpas/carpas_08', 'carpas/carpas_09'], ['carpas/carpas_10', 'carpas/carpas_11', 'carpas/carpas_12']];

export async function vida(ctx) {
  const { THREE, scene, camera, LEN, hw, perchas, R } = ctx;
  const nombres = new Set(); const reg = a => (Array.isArray(a) ? a.forEach(reg) : nombres.add(a));
  Object.values(F).forEach(f => { reg(f.vuelo); reg(f.posado); }); reg(MARIP); reg(LIBEL); reg(ABEJA); reg(CARPAS);
  const imgs = {}; await Promise.all([...nombres].map(async n => { imgs[n] = await cargaImg(BASE + n + '.png'); }));
  const AW = 1024; let cx = 1, cy = 1, fila = 0; const rect = {}; const cv = document.createElement('canvas'); cv.width = cv.height = AW; const g = cv.getContext('2d');
  for (const n of [...nombres].filter(n => imgs[n]).sort((a, b) => imgs[b].height - imgs[a].height)) { const im = imgs[n]; if (cx + im.width + 1 > AW) { cx = 1; cy += fila + 1; fila = 0; } g.drawImage(im, cx, cy); rect[n] = { x: cx, y: cy, w: im.width, h: im.height }; cx += im.width + 1; fila = Math.max(fila, im.height); }
  const atlas = new THREE.CanvasTexture(cv); atlas.magFilter = atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = THREE.SRGBColorSpace;
  const rnd = (a, b) => a + R() * (b - a);
  // ---------- entidades
  const E = [];
  const ave = (esp, o) => E.push({ k: 'ave', esp, estado: 'vuelo', ph: rnd(0, 6.28), f: rnd(6, 9), ...o });
  for (let i = 0; i < 7; i++) ave(['cuervo', 'paloma', 'cuervo', 'paloma', 'golondrina', 'golondrina', 'paloma'][i], { cz: rnd(0, LEN), cx: rnd(-8, 8), r: rnd(12, 32), h: i > 3 ? rnd(4, 9) : rnd(13, 26), w: rnd(.35, .6) * (R() < .5 ? -1 : 1) });
  const pp = perchas.slice().sort(() => R() - .5).slice(0, 22);
  pp.forEach((p, i) => ave(['cuervo', 'paloma', 'gorrion', 'paloma', 'cuervo', 'gorrion'][i % 6], { estado: 'posada', px: p[0], py: p[1], pz: p[2], x: p[0], y: p[1], z: p[2], flip: R() < .5, t0: 0 }));
  for (let i = 0; i < 26; i++) E.push({ k: 'mar', set: MARIP[i % 4], bx: (R() < .5 ? -1 : 1) * (hw(0) + rnd(1, 4)), bz: rnd(0, LEN), h: rnd(.7, 2.6), r: rnd(.8, 2.4), s: rnd(.6, 1.1), ph: rnd(0, 6.28), f: rnd(7, 11), tam: rnd(.22, .3) });
  for (let i = 0; i < 5; i++) E.push({ k: 'lib', bx: rnd(-6, 6), bz: rnd(0, LEN), h: rnd(.6, 1.4), ph: rnd(0, 6.28), tam: .34 });
  for (let i = 0; i < 4; i++) E.push({ k: 'abe', bx: (R() < .5 ? -1 : 1) * (hw(0) + rnd(1, 3)), bz: rnd(0, LEN), h: rnd(.5, 1.6), ph: rnd(0, 6.28), tam: .14 });
  for (let i = 0; i < 22; i++) { const z = rnd(0, LEN), l = hw(z) - 1.6; E.push({ k: 'carpa', set: CARPAS[i % 4], x: rnd(-l, l), z, ang: rnd(0, 6.28), v: rnd(.5, 1.2), ph: rnd(0, 6.28), len: rnd(.55, .95), prof: rnd(.5, 2.2) }); }
  // ---------- malla dinamica
  const N = E.length * 1 + 8, pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), col = new Float32Array(N * 12), idx = new Uint16Array(N * 6);
  for (let i = 0; i < N; i++) { const v = i * 4; idx.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: .5, side: THREE.DoubleSide })); mesh.frustumCulled = false; mesh.renderOrder = 1;
  let nq = 0; const tint = new THREE.Color('#ffffff');
  // quad con vectores a (derecha) y b (arriba) centrados en (x,y,z); anclaje: 'c' centro, 'b' base
  function quad(clave, x, y, z, ax, ay, az, bx, by, bz, w, h, flip, anc, c) {
    const r = rect[clave]; if (!r || nq >= N) return; const hw_ = w / 2, y0 = anc === 'b' ? 0 : -h / 2, y1 = y0 + h, o = nq * 12, u = nq * 8, cc = c || tint;
    const P = [[-hw_, y0], [hw_, y0], [hw_, y1], [-hw_, y1]];
    for (let i = 0; i < 4; i++) { const [px, py] = P[i]; pos[o + i * 3] = x + ax * px + bx * py; pos[o + i * 3 + 1] = y + ay * px + by * py; pos[o + i * 3 + 2] = z + az * px + bz * py; col[o + i * 3] = cc.r; col[o + i * 3 + 1] = cc.g; col[o + i * 3 + 2] = cc.b; }
    const u0 = r.x / AW, u1 = (r.x + r.w) / AW, v1 = 1 - r.y / AW, v0 = 1 - (r.y + r.h) / AW, a = flip ? u1 : u0, b = flip ? u0 : u1;
    uv.set([a, v0, b, v0, b, v1, a, v1], u); nq++;
  }
  const ap = (k, F_) => k[Math.floor(F_) % k.length];
  const azul = new THREE.Color('#9fd0dc');
  let t0 = performance.now() / 1000, ultimo = t0;
  function actualizar() {
    const t = performance.now() / 1000, dt = Math.min(.1, t - ultimo); ultimo = t; nq = 0;
    const m = camera.matrixWorld.elements, rx = m[0], ry = 0, rz = m[2], rl = Math.hypot(rx, rz) || 1, Rx = rx / rl, Rz = rz / rl;       // derecha de la camara en el plano
    const est = (window.__G && window.__G.est) || { x: 0, z: 0 }, camz = est.z;
    const envuelve = z => z + Math.round((camz - z) / LEN) * LEN;
    for (const e of E) {
      if (e.k === 'ave') {
        const f = F[e.esp];
        if (e.estado === 'vuelo') {
          let x, y, z, vx, vz;
          if (e.cz !== undefined) { const a = t * e.w + e.ph; x = e.cx + Math.cos(a) * e.r; z = e.cz + Math.sin(a) * e.r * 1.6; y = e.h + Math.sin(t * .7 + e.ph) * 2; vx = -Math.sin(a) * e.w * Math.sign(e.w); vz = Math.cos(a) * e.w * 1.6 * Math.sign(e.w); }
          else { e.vt += dt; x = e.x + e.vx * dt; y = e.y + e.vy * dt; z = e.z + e.vz * dt; e.x = x; e.y = y; e.z = z; e.vy = Math.min(e.vy + dt * .3, 3.5); vx = e.vx; vz = e.vz; if (e.vt > 7) { e.estado = 'espera'; e.t0 = t; continue; } }
          const zz = e.cz !== undefined ? envuelve(z) : z, flip = (vx * Rx + vz * Rz) > 0;
          quad(ap(f.vuelo, t * e.f + e.ph), x, y, zz, Rx, 0, Rz, 0, 1, 0, f.ancho, f.ancho * .75, flip, 'c');
        } else if (e.estado === 'posada') {
          const zz = envuelve(e.pz), d = Math.hypot(e.px - est.x, zz - est.z);
          if (d < 26 && est.vz > 4) { const dx = e.px - est.x, dz = zz - est.z, l = Math.hypot(dx, dz) || 1; e.estado = 'vuelo'; e.vt = 0; e.f = rnd(8, 12); e.vx = dx / l * 5 + rnd(-2, 2); e.vz = dz / l * 7 + 4; e.vy = 3 + rnd(0, 2); e.x = e.px; e.y = e.py; e.z = zz; continue; }
          quad(f.posado, e.px, e.py, zz, Rx, 0, Rz, 0, 1, 0, f.alto_p * (rect[f.posado] ? rect[f.posado].w / rect[f.posado].h : 1.2), f.alto_p, e.flip, 'b');
        } else if (t - e.t0 > 12) { e.estado = 'posada'; }
      } else if (e.k === 'mar') {
        const a = t * e.s + e.ph, x = e.bx + Math.sin(a) * e.r + Math.sin(a * 2.3) * .4, z = e.bz + Math.cos(a * .8) * e.r * 1.3, y = e.h + Math.sin(a * 1.7) * .5, vx = Math.cos(a) * e.s, vz = -Math.sin(a * .8) * e.s;
        quad(ap(e.set, t * e.f + e.ph), x, y, envuelve(z), Rx, 0, Rz, 0, 1, 0, e.tam, e.tam * .8, (vx * Rx + vz * Rz) > 0, 'c');
      } else if (e.k === 'lib') {
        const a = t * .6 + e.ph, x = e.bx + Math.sin(a * 1.3) * 4, z = e.bz + Math.sin(a) * 6 + Math.sin(a * 3.1) * .8, y = e.h + Math.sin(a * 2) * .2;
        quad(ap(LIBEL, t * 30 + e.ph), x, y, envuelve(z), Rx, 0, Rz, 0, 1, 0, e.tam, e.tam * .9, (Math.cos(a * 1.3) * Rx > 0), 'c');
      } else if (e.k === 'abe') {
        const a = t * 1.7 + e.ph, x = e.bx + Math.sin(a) * .8 + Math.sin(a * 3) * .2, z = e.bz + Math.cos(a * 1.3) * .8, y = e.h + Math.sin(a * 2.1) * .25;
        quad(ABEJA, x, y, envuelve(z), Rx, 0, Rz, 0, 1, 0, e.tam, e.tam * .8, false, 'c');
      } else if (e.k === 'carpa') {
        e.ang += Math.sin(t * .35 + e.ph) * .5 * dt; const l = hw(e.z) - 1.6; e.x += Math.sin(e.ang) * e.v * dt; e.z += Math.cos(e.ang) * e.v * dt;
        if (Math.abs(e.x) > l) { e.x = Math.sign(e.x) * l; e.ang = Math.PI - e.ang + rnd(-.3, .3); } if (e.z > LEN) e.z -= LEN; if (e.z < 0) e.z += LEN;
        const ciclo = Math.floor((t * 1.6 + e.ph) % 4), fr = e.set[ciclo === 1 ? 1 : ciclo === 3 ? 2 : 0], fx = Math.sin(e.ang), fz = Math.cos(e.ang);
        // tumbada en el plano XZ; "arriba" del sprite = direccion de nado; derecha = perpendicular
        quad(fr, e.x, -e.prof, envuelve(e.z), fz, 0, -fx, fx, 0, fz, e.len * .42, e.len, false, 'c', azul);
      }
    }
    geo.attributes.position.needsUpdate = geo.attributes.uv.needsUpdate = geo.attributes.color.needsUpdate = true; geo.setDrawRange(0, nq * 6);
  }
  mesh.onBeforeRender = actualizar;
  window.__VIDA = { E, rect, get nq() { return nq; } };
  scene.add(mesh);
  return { mesh, total: E.length };
}
