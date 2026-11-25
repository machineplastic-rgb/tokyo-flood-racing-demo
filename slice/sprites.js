// Sprites pixel del universo (los mismos de la demo del puente) colocados sobre el MURO REAL de cada calle.
// El muro se mide en el mapa horneado (alturas de edificios), así que nada flota: todo queda pegado a la fachada o apoyado en el agua.
// Una sola malla fusionada + un atlas = 1 llamada de dibujo.
const BASE1 = './spr/px1/', BASE2 = './spr/uni/';
const IDS = { edificios: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11a', '11b', '12', '13', '14', '15', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8'],
  plantas: Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, '0')), maquinas: Array.from({ length: 35 }, (_, i) => String(i + 1).padStart(2, '0')) };
const ALTO = {
  edificios: { '01': 16, '02': 13, '03': 15, '04': 30, '05': 42, '06': 18, '07': 9, '08': 9, '09': 20, '10': 15, '11a': 14, '11b': 7, '12': 7, '13': 20, '14': 9, '15': 5, N1: 20, N2: 26, N3: 20, N4: 18, N5: 19, N6: 15, N7: 20, N8: 10 },
  plantas: { '01': 9, '02': 4.5, '03': 6, '04': 8, '05': 4, '06': 2.6, '07': 2.4, '08': 2.2, '09': 1.8, '10': 2.6, '11': 2.6, '12': 1.4, '13': 1.1, '14': 1.2, '15': .9, '16': 1, '17': .6, '18': 4, '19': 4, '20': 4, '21': 1.2, '22': 1.1, '23': .9, '24': 1, '25': .4 },
  maquinas: { '01': 1.9, '02': 1.9, '03': 1.9, '04': 1.9, '05': 1.9, '06': 1.9, '07': 1.9, '08': 1.1, '09': .45, '10': .45, '11': .5, '12': .5, '13': .4, '14': 1.8, '15': 1.2, '16': 2.4, '17': 1.1, '18': 1, '19': 7.5, '20': 4.5, '21': .7, '22': .7, '23': 2.4, '24': 2.4, '25': 2.4, '26': 3.2, '27': .5, '28': .5, '29': .7, '30': .7, '31': .7, '32': 1.1, '33': 1.5, '34': .9, '35': .1 },
  calle: { '01': 4.6, '02': 6.6, '03': 11, '04': 5.2, '05': 4, '09': 1.8, '10': 2.2, '11': 1.2, '12': 1.6 },
  rotulos: { '01': 4.6, '02': 4.6, '03': 4.6, '04': 5.5, '05': 4.5, '06': 4.5, '07': 3.5, '08': 3.2, '09': 9, '10': 3.2, '11': 3.2, '12': 3.2 },
  lianas: { '01': 12, '02': 11, '03': 9, '04': 6, '05': 10, '06': 9, '07': 8, '08': 8, '09': 7, '10': 7, '11': 6, '12': 6 },
  arboles: { '01': 9, '02': 9, '03': 11, '04': 12, '05': 10, '06': 12, '07': 10, '08': 9 },
};
const cargaImg = (u) => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = u; });

export async function crearSprites(THREE, scene, P, mapa, opciones = {}) {
  const { desde = 30, hasta = 420 } = opciones;
  const imgs = [];
  for (const tipo of Object.keys(IDS)) for (const id of IDS[tipo]) imgs.push({ k: tipo + id, src: BASE1 + tipo + '/' + tipo + '_' + id + '.png' });
  for (const [g, n] of [['calle', 12], ['rotulos', 12], ['lianas', 12], ['arboles', 8]]) for (let i = 1; i <= n; i++) { const s = String(i).padStart(2, '0'); imgs.push({ k: g + s, src: BASE2 + g + '/' + g + '_' + s + '.png' }); }
  await Promise.all(imgs.map(async o => { o.img = await cargaImg(o.src); }));
  const ok = imgs.filter(o => o.img); ok.sort((a, b) => b.img.height - a.img.height);
  const AW = 2048, cv = document.createElement('canvas'); cv.width = cv.height = AW; const g = cv.getContext('2d'); let cx = 1, cy = 1, fila = 0; const rect = {};
  for (const o of ok) { const w = o.img.width, h = o.img.height; if (cx + w + 1 > AW) { cx = 1; cy += fila + 1; fila = 0; } g.drawImage(o.img, cx, cy); rect[o.k] = { x: cx, y: cy, w, h }; cx += w + 1; fila = Math.max(fila, h); }
  const atlas = new THREE.CanvasTexture(cv); atlas.magFilter = atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = THREE.SRGBColorSpace;

  let seed = 91; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pick = a => a[(R() * a.length) | 0];
  const pos = [], uv = [], col = [], idx = [], sw = []; let nv = 0;
  const alto = (tipo, id) => ALTO[tipo][id] || 2;
  // carta: base en (x,y,z), mirando a la normal (nx,nz), ancho a lo largo de la tangente (tx,tz)
  function carta(clave, x, y, z, tx, tz, h, o = {}) {
    const r = rect[clave]; if (!r) return 0; const w = (o.w || h * r.w / r.h), a = w / 2;
    const u0 = r.x / AW, u1 = (r.x + r.w) / AW, v1 = 1 - r.y / AW, v0 = 1 - (r.y + r.h) / AW, t = o.tinte || [1, 1, 1];
    const L = [x - tx * a, z - tz * a], Rr = [x + tx * a, z + tz * a];
    pos.push(L[0], y, L[1], Rr[0], y, Rr[1], Rr[0], y + h, Rr[1], L[0], y + h, L[1]); uv.push(u0, v0, u1, v0, u1, v1, u0, v1); for (let i = 0; i < 4; i++) col.push(t[0], t[1], t[2]);
    const am = o.sway || 0, ph = (x * 12.9898 + z * 78.233) % 6.283; sw.push(0, ph, 0, ph, am * h, ph, am * h, ph);   // balanceo por el viento (arriba)
    idx.push(nv, nv + 1, nv + 2, nv, nv + 2, nv + 3); nv += 4; return w;
  }
  // medida del muro real a partir del mapa horneado: devuelve la distancia desde la línea de pista hasta el primer edificio (> 1,5 m)
  const muro = (i, sd) => { const p = P[i]; for (let t = 1; t < 46; t += .5) { if (mapa.altura(p.x + p.nx * sd * t, p.z + p.nz * sd * t) > 1.5) return t; } return null; };
  const BAJOS = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', '01', '02', '06', '10', '11a', '13', '15'], ALTOS = ['04', '05', '09', 'N2', 'N7', 'N3', 'N5', '13'];
  const PLANTAS = ['06', '07', '08', '09', '10', '11', '21', '22', '23', '24'], ARBUSTO = ['02', '03', '05', '12', '13', '14'];
  const sdir = (i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.z - a.z) || 1; return [(b.x - a.x) / l, (b.z - a.z) / l]; };
  const Y0 = -3.4, SOLV = [-.36, .89, .28];
  let nCartas = 0;
  for (const sd of [-1, 1]) {
    let i = desde;
    while (i < hasta) {
      const id = pick(R() < .35 ? ALTOS : BAJOS), h = alto('edificios', id) * 1.25, r = rect['edificios' + id]; if (!r) { i += 6; continue; }
      const w = h * r.w / r.h, ic = Math.min(P.length - 1, Math.round(i + w / 2)), t = muro(ic, sd);
      if (t == null) { i += 8; continue; }
      const p = P[ic], [tx, tz] = sdir(ic), px = p.x + p.nx * sd * (t - .15), pz = p.z + p.nz * sd * (t - .15);
      // los de la cara que mira al sol, más claros; los de sombra, más fríos
      const lit = Math.max(0, -sd * (p.nx * SOLV[0] + p.nz * SOLV[2])), c = .62 + .55 * Math.min(1, lit * 2.4);
      if (opciones.edificios) carta('edificios' + id, px, Y0, pz, tx, tz, h, { tinte: [c * (.94 + .06 * lit), c, c * (1.04 - .06 * lit)] }); nCartas++;   // los sprites de edificio vienen en perspectiva: desactivados (pendiente fachadas planas)
      // detalles en la base del edificio: máquinas, plantas, rótulos y lianas
      const d1 = R();
      if (d1 < .75) carta('plantas' + pick(PLANTAS), px - p.nx * sd * (.5 + R() * .6) + tx * (R() - .5) * w * .7, -.35, pz - p.nz * sd * (.5 + R() * .6) + tz * (R() - .5) * w * .7, tx, tz, alto('plantas', '08') * (.8 + R() * 1.2), { sway: .05 });
      if (R() < .5) { const k = pick(['01', '02', '03', '04', '05', '06', '07', '14', '16', '17']); carta('maquinas' + k, px - p.nx * sd * .25 + tx * (R() - .5) * w * .6, -.25, pz - p.nz * sd * .25 + tz * (R() - .5) * w * .6, tx, tz, alto('maquinas', k)); }
      if (R() < .85) { const k = pick(['01', '02', '03', '04', '05', '06', '07', '08', '10', '11', '12']); const rh = alto('rotulos', k); carta('rotulos' + k, px - p.nx * sd * .12 + tx * (R() - .5) * w * .6, 2.6 + R() * (h * .35), pz - p.nz * sd * .12 + tz * (R() - .5) * w * .6, tx, tz, rh); }
      if (R() < .75) { const k = pick(['01', '02', '03', '05', '06', '08']); const lh = alto('lianas', k) * (.9 + R() * .9); carta('lianas' + k, px - p.nx * sd * .08 + tx * (R() - .5) * w * .8, h * .94 - lh + 1, pz - p.nz * sd * .08 + tz * (R() - .5) * w * .8, tx, tz, lh, { sway: .03 }); }
      i += Math.max(5, w * .92);
    }
  }
  // objetos de calle en el agua (semáforos, postes, señales, bicis, coches, conos, vallas) y árboles: SPRITES, no polígonos
  for (let i = desde + 4; i < hasta; i += 5 + ((R() * 9) | 0)) {
    const sd = R() < .5 ? -1 : 1, t = muro(i, sd); if (t == null || t < 6) continue; const p = P[i], [tx, tz] = sdir(i);
    const off = Math.min(t - 1.4, (P[i].w || 20) / 2 - 1.6) ; const x = p.x + p.nx * sd * off, z = p.z + p.nz * sd * off;
    const k = pick(['01', '02', '03', '04', '05', '09', '10', '11', '12', '03', '01']); carta('calle' + k, x, -.35, z, p.nx, p.nz, alto('calle', k));
    if (R() < .22) { const a = pick(['01', '02', '03', '04', '05', '06', '07', '08']); const hh = alto('arboles', a); carta('arboles' + a, p.x + p.nx * sd * (t - 2.4), -.5, p.z + p.nz * sd * (t - 2.4), tx, tz, hh, { sway: .02 }); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('sway', new THREE.Float32BufferAttribute(sw, 2)); geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: .5, side: THREE.DoubleSide, fog: true }); let shd = null;
  mat.onBeforeCompile = (sh) => { sh.uniforms.uT = { value: 0 }; shd = sh;
    sh.vertexShader = 'attribute vec2 sway;\nuniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
      float gg = sin(uT*1.25 + sway.y + position.z*.09) + .45*sin(uT*2.6 + sway.y*1.7 + position.x*.11); transformed.x += gg*sway.x; transformed.z += gg*sway.x*.55;`); };
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.onBeforeRender = () => { if (shd) shd.uniforms.uT.value = performance.now() / 1000; }; scene.add(mesh);
  return { mesh, cartas: nCartas, tris: idx.length / 3 };
}
