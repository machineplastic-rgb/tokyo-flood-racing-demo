// Sprites pixel del universo (los mismos de la demo del puente) colocados sobre el MURO REAL de cada calle.
// El muro se mide en el mapa horneado (alturas de edificios), así que nada flota: todo queda pegado a la fachada o apoyado en el agua.
// Una sola malla fusionada + un atlas = 1 llamada de dibujo.
const BASE1 = './spr/px1/', BASE2 = './spr/uni/';
const IDS = { edificios: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11a', '11b', '12', '13', '14', '15', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8'],
  plantas: Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, '0')), maquinas: Array.from({ length: 35 }, (_, i) => String(i + 1).padStart(2, '0')) };
const ALTO = {
  jun: { 1: 15, 2: 14, 3: 7.5, 4: 5, 5: 13, 7: 16, 8: 2.6 },
  fol: { 1: 11, 2: 6, 3: 13, 4: 9, 5: 3.2, 6: 6.5, 7: 12, 8: 2.2 },
  edificios: { '01': 16, '02': 13, '03': 15, '04': 30, '05': 42, '06': 18, '07': 9, '08': 9, '09': 20, '10': 15, '11a': 14, '11b': 7, '12': 7, '13': 20, '14': 9, '15': 5, N1: 20, N2: 26, N3: 20, N4: 18, N5: 19, N6: 15, N7: 20, N8: 10 },
  plantas: { '01': 9, '02': 4.5, '03': 6, '04': 8, '05': 4, '06': 2.6, '07': 2.4, '08': 2.2, '09': 1.8, '10': 2.6, '11': 2.6, '12': 1.4, '13': 1.1, '14': 1.2, '15': .9, '16': 1, '17': .6, '18': 4, '19': 4, '20': 4, '21': 1.2, '22': 1.1, '23': .9, '24': 1, '25': .4 },
  maquinas: { '01': 1.9, '02': 1.9, '03': 1.9, '04': 1.9, '05': 1.9, '06': 1.9, '07': 1.9, '08': 1.1, '09': .45, '10': .45, '11': .5, '12': .5, '13': .4, '14': 1.8, '15': 1.2, '16': 2.4, '17': 1.1, '18': 1, '19': 7.5, '20': 4.5, '21': .7, '22': .7, '23': 2.4, '24': 2.4, '25': 2.4, '26': 3.2, '27': .5, '28': .5, '29': .7, '30': .7, '31': .7, '32': 1.1, '33': 1.5, '34': .9, '35': .1 },
  calle: { '01': 4.6, '02': 6.6, '03': 6, '04': 5.2, '05': 4, '09': 1.8, '10': 2.2, '11': 1.2, '12': 1.6 },
  rotulos: { '01': 4.6, '02': 4.6, '03': 4.6, '04': 5.5, '05': 4.5, '06': 4.5, '07': 3.5, '08': 3.2, '09': 9, '10': 3.2, '11': 3.2, '12': 3.2 },
  lianas: { '01': 12, '02': 11, '03': 9, '04': 6, '05': 10, '06': 9, '07': 8, '08': 8, '09': 7, '10': 7, '11': 6, '12': 6 },
  arboles: { '01': 9, '02': 9, '03': 11, '04': 12, '05': 10, '06': 12, '07': 10, '08': 9 },
};
// Carteles de Shibuya: paneles en blanco de Flow + texto japonés REAL (palabras comunes, sin marcas) compuesto por código y endurecido a pixel.
const FUENTE = '"Yu Gothic","Meiryo","Hiragino Sans","Noto Sans CJK JP","MS Gothic",sans-serif';
const CARTELES = [  // [pieza, orientación, alto en metros, colorTexto, textos]
  ['01', 'v', 10, '#fff2d8', ['居酒屋', 'ラーメン', '焼肉', '薬局', '寿司']],
  ['02', 'v', 10, '#b02a22', ['喫茶店', '不動産', '歯科', '書店', '理容室']],
  ['03', 'v', 10, '#fff2d8', ['カラオケ', '渋谷駅', '両替', '地下鉄', 'ビデオ']],
  ['04', 'v', 11, '#2a2018', ['営業中', '全品', 'ゲーム', '飲み放題', '漫画喫茶']],
  ['05', 'h', 4.2, '#2a2018', ['定食 ラーメン', '営業中', '立ち飲み', 'カラオケ']],
  ['06', 'h', 4.2, '#fff2d8', ['書店', '薬局', '歯科 医院', '渋谷']],
  ['07', 'h', 9, '#b02a22', ['新装開店', '全品 割引', '渋谷']],
  ['09', 'h', 6, '#fff2d8', ['渋谷', '地下鉄 出口', 'カラオケ']],
  ['10', 'l', 4.2, '#fff2d8', ['酒', '宴', '祭']],
];
// Pantallas gigantes (sin contenido real: degradados, franjas y formas abstractas en colores de neón)
function pantallas() {
  const out = [], pal = [['#18d6e8', '#ff3fa8', '#ffe14a'], ['#ff7a2a', '#7a3cff', '#18e6a0'], ['#2a6cff', '#ff4a4a', '#f4f4ff'], ['#ff3fa8', '#18d6e8', '#1a1a3a'], ['#ffe14a', '#2a6cff', '#ff7a2a']];
  pal.forEach((c, i) => { const cv = document.createElement('canvas'); cv.width = 96; cv.height = 40; const g = cv.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 96, 40); gr.addColorStop(0, c[0]); gr.addColorStop(.55, c[1]); gr.addColorStop(1, c[2]); g.fillStyle = gr; g.fillRect(0, 0, 96, 40);
    g.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 6; k++) g.fillRect(k * 18 - 4, 0, 4, 40); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(30 + i * 9, 22, 12 + i * 2, 0, 6.3); g.fill();
    g.fillStyle = '#fff'; g.fillRect(52, 12, 30, 6); g.fillRect(52, 24, 22, 4);
    g.fillStyle = '#20242c'; g.fillRect(0, 0, 96, 2); g.fillRect(0, 38, 96, 2); g.fillRect(0, 0, 2, 40); g.fillRect(94, 0, 2, 40);   // marco
    const d = g.getImageData(0, 0, 96, 40); for (let y = 0; y < 40; y += 2) for (let x = 0; x < 96; x++) { const j = (y * 96 + x) * 4; d.data[j] *= .86; d.data[j + 1] *= .86; d.data[j + 2] *= .86; } g.putImageData(d, 0, 0);   // retícula de píxeles
    out.push({ k: 'scr' + i, img: cv }); }); return out;
}
async function generaCarteles() {
  const out = []; const hs = {};
  for (const [id, ori, alto, col, textos] of CARTELES) {
    const im = await cargaImg('./fach/c_' + id + '.png'); if (!im) continue;
    textos.forEach((tx, ti) => {
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
      const d0 = g.getImageData(0, 0, cv.width, cv.height); let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d0.data[(y * cv.width + x) * 4 + 3] > 200) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 < 0) return;
      // región del panel: la sección ancha del objeto (sin soportes); se inset un 16 %
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1; let px, py, pw, ph;
      if (ori === 'v') { pw = bw * .56; px = x1 - bw * .78; ph = bh * .76; py = y0 + bh * .12; }
      else if (ori === 'l') { pw = bw * .4; px = x0 + bw * .30; ph = bh * .4; py = y0 + bh * .47; }
      else { pw = bw * .8; px = x0 + bw * .1; ph = bh * (id === '07' ? .45 : id === '09' ? .38 : .56); py = y0 + bh * (id === '07' ? .12 : id === '09' ? .14 : .22); }
      const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; const tg = t.getContext('2d'); tg.fillStyle = '#000'; tg.textAlign = 'center'; tg.textBaseline = 'middle';
      const chars = [...tx.replace(' ', '')];
      if (ori === 'v') { const paso = ph / chars.length, fs = Math.min(pw * .9, paso * .92); tg.font = 'bold ' + fs + 'px ' + FUENTE; chars.forEach((c, i) => tg.fillText(c, px + pw / 2, py + paso * (i + .5))); }
      else { const fs = Math.min(ph * .8, pw / (chars.length * 1.05)); tg.font = 'bold ' + fs + 'px ' + FUENTE; tg.fillText(tx, px + pw / 2, py + ph / 2); }
      const td = tg.getImageData(0, 0, cv.width, cv.height), c3 = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
      for (let i = 0; i < td.data.length; i += 4) if (td.data[i + 3] > 110 && d0.data[i + 3] > 200) { d0.data[i] = c3[0]; d0.data[i + 1] = c3[1]; d0.data[i + 2] = c3[2]; }
      g.putImageData(d0, 0, 0); const k = 'sg' + id + '_' + ti; out.push({ k, img: cv }); hs[k] = alto;
    });
  }
  return { out, hs };
}
const cargaImg = (u) => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = u; });

export async function crearSprites(THREE, scene, P, mapa, opciones = {}) {
  const { desde = 30, hasta = 420 } = opciones;
  const imgs = [];
  for (let i = 1; i <= 8; i++) imgs.push({ k: 'fol' + i, src: './art/fol_' + i + '.png' });
  for (let i = 1; i <= 8; i++) imgs.push({ k: 'jun' + i, src: './art/jun_' + i + '.png' });
  for (const tipo of Object.keys(IDS)) for (const id of IDS[tipo]) imgs.push({ k: tipo + id, src: BASE1 + tipo + '/' + tipo + '_' + id + '.png' });
  for (const [g, n] of [['calle', 12], ['rotulos', 12], ['lianas', 12], ['arboles', 8]]) for (let i = 1; i <= n; i++) { const s = String(i).padStart(2, '0'); imgs.push({ k: g + s, src: BASE2 + g + '/' + g + '_' + s + '.png' }); }
  await Promise.all(imgs.map(async o => { o.img = await cargaImg(o.src); }));
  const PANT = pantallas(); for (const o of PANT) imgs.push(o);
  const SG = await generaCarteles(); for (const o of SG.out) imgs.push(o); const SGK = SG.out.map(o => o.k);
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
      for (let n = 0; n < 3 && SGK.length; n++) { if (R() > .8) continue; const k = pick(SGK), rh = SG.hs[k], hor = k.startsWith('sg05') || k.startsWith('sg06') || k.startsWith('sg07') || k.startsWith('sg09'); const yy = hor ? 3 + R() * Math.max(2, h * .5) : 2.5 + R() * Math.max(2, h * .45); carta(k, px - p.nx * sd * .14 + tx * (R() - .5) * w * .75, yy, pz - p.nz * sd * .14 + tz * (R() - .5) * w * .75, tx, tz, rh); }
      // pantallas gigantes en lo alto (35 %) y pantallas medias; casi siempre con una cortina de lianas encima
      if (R() < .55) { const sk = 'scr' + ((R() * 5) | 0), sw = 11 + R() * 10, sy = Math.max(6, h * (.45 + R() * .4)); carta(sk, px - p.nx * sd * .2 + tx * (R() - .5) * w * .4, sy, pz - p.nz * sd * .2 + tz * (R() - .5) * w * .4, tx, tz, sw * .42, { w: sw });
        if (R() < .7) carta('lianas' + pick(['01', '02', '03', '05', '06']), px - p.nx * sd * .26 + tx * (R() - .5) * w * .4, sy - 5, pz - p.nz * sd * .26 + tz * (R() - .5) * w * .4, tx, tz, 12 + R() * 6, { sway: .03 }); }
      // FOLLAJE EN VOLUMEN: masas que sobresalen de la cornisa y la azotea, árboles sobre repisas, ramas que brotan de ventanas, cortinas colgantes y hierba al pie
      const fx = (dx, dz) => [px - p.nx * sd * dz + tx * dx, pz - p.nz * sd * dz + tz * dx];
      for (let n = 0; n < 4; n++) if (R() < .85) { const f = fx((R() - .5) * w * .9, .4 + R() * 2.4), kk = pick([1, 1, 1, 2, 2]), fh = alto('fol', kk) * (.8 + R() * .7); carta('fol' + kk, f[0], h * .94 - fh * .10, f[1], tx, tz, fh * 1.25, { sway: .015 }); }          // corona de azotea: sobresale por encima
      for (let n = 0; n < 3; n++) if (R() < .75) { const f = fx((R() - .5) * w * .9, .3 + R()), fh = alto('fol', 2) * (.9 + R() * .6); carta('fol2', f[0], 5 + R() * Math.max(2, h * .8), f[1], tx, tz, fh, { sway: .015 }); }   // voladizo en cornisas intermedias
      for (let n = 0; n < 2; n++) if (R() < .6) { const f = fx((R() - .5) * w * .85, .3), fh = alto('fol', 3) * (.7 + R() * .5); carta('fol3', f[0], 4 + R() * Math.max(2, h * .6), f[1], tx, tz, fh, { sway: .01 }); }       // árbol sobre repisa
      for (let n = 0; n < 3; n++) if (R() < .7) { const f = fx((R() - .5) * w * .9, .25), fh = alto('fol', 6); carta('fol6', f[0], 3 + R() * Math.max(2, h * .7), f[1], tx, tz, fh, { sway: .02 }); }                           // ramas de ventana
      for (let n = 0; n < 2; n++) if (R() < .7) { const f = fx((R() - .5) * w * .9, .2), fh = alto('fol', 4) * (.9 + R() * .8); carta('fol4', f[0], h * .93 - fh * .8, f[1], tx, tz, fh, { sway: .03 }); }                      // cortina colgante
      for (let n = 0; n < 2; n++) if (R() < .6) { const f = fx((R() - .5) * w * .9, .2), fh = alto('fol', 7) * (.7 + R() * .8); carta('fol7', f[0], -.3, f[1], tx, tz, fh, { sway: .01 }); }                                   // columna de hiedra
      for (let n = 0; n < 4; n++) if (R() < .85) { const f = fx((R() - .5) * w, .1 + R() * .8), kk = pick([5, 5, 8]); carta('fol' + kk, f[0], -.4, f[1], tx, tz, alto('fol', kk) * (.8 + R() * .5), { sway: .012 }); }      // arbustos y hierba al pie
      // SELVA (referencia: palmeras y plantas gigantes al pie y en la azotea, tapando la base)
      for (let n = 0; n < 3; n++) if (R() < .8) { const f = fx((R() - .5) * w * .95, .3 + R() * 1.4), kk = pick([1, 2, 2, 1, 7]), jh = alto('jun', kk) * (.75 + R() * .6); carta('jun' + kk, f[0], -.5, f[1], tx, tz, jh, { sway: .012 }); }          // palmeras y coníferas al pie
      for (let n = 0; n < 4; n++) if (R() < .9) { const f = fx((R() - .5) * w, .2 + R() * 1.2), kk = pick([3, 3, 4, 4]), jh = alto('jun', kk) * (.8 + R() * .8); carta('jun' + kk, f[0], -.5, f[1], tx, tz, jh, { sway: .01 }); }                    // plantas tropicales grandes
      for (let n = 0; n < 2; n++) if (R() < .75) { const f = fx((R() - .5) * w * .9, .5 + R() * 2), kk = pick([1, 2]), jh = alto('jun', kk) * (.55 + R() * .35); carta('jun' + kk, f[0], h * .93, f[1], tx, tz, jh, { sway: .02 }); }                          // palmeras asomando en la azotea
      if (R() < .6) { const f = fx((R() - .5) * w, .2), jh = 9 + R() * 8; carta('jun5', f[0], h * .9 - jh, f[1], tx, tz, jh, { sway: .03 }); }                                                                                              // liana gruesa colgando
      if (R() < .8) { const f = fx((R() - .5) * w, .1), jh = 2.2 + R() * 1.6; carta('jun8', f[0], -.5, f[1], tx, tz, jh, { w: w * .9 }); }                                                                                                      // pradera con flores
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
  // cables eléctricos japoneses convertidos en lianas: festones que cruzan la calle de fachada a fachada, a distintas alturas
  for (let i = desde + 6; i < hasta; i += 17) for (let n = 0; n < 1; n++) { const p = P[i]; if (i > 120 && i < 215) continue; const ww = Math.min(60, (p.w || 26) * (1.0 + R() * .25)); carta('jun6', p.x, 13 + R() * 9, p.z, p.nx, p.nz, ww * 87 / 175 * 1.1, { w: ww }); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setAttribute('sway', new THREE.Float32BufferAttribute(sw, 2)); geo.setIndex(idx);
  const mat = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: .5, side: THREE.DoubleSide, fog: true }); let shd = null;
  mat.onBeforeCompile = (sh) => { sh.uniforms.uT = { value: 0 }; shd = sh;
    sh.vertexShader = 'attribute vec2 sway;\nuniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
      float gg = sin(uT*1.25 + sway.y + position.z*.09) + .45*sin(uT*2.6 + sway.y*1.7 + position.x*.11); transformed.x += gg*sway.x; transformed.z += gg*sway.x*.55;`); };
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.onBeforeRender = () => { if (shd) shd.uniforms.uT.value = performance.now() / 1000; }; scene.add(mesh);
  return { mesh, cartas: nCartas, tris: idx.length / 3 };
}
