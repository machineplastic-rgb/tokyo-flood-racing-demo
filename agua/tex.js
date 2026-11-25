import { crearCielo } from './cielo.js';
// Modo texturizado (?tex=1) del tramo del puente: texturas pixel 64 px (nearest) en las cajas + TARJETAS de sprites pixel (un atlas, una llamada de dibujo).
// Plano: along = x (a lo largo del canal) -> Z del mundo; across = y (a traves) -> X del mundo.
const BASE = './assets_pixel/';
const NOMBRES_UNI = ['azulejo_109', 'hormigon_oxido', 'azulejo_gris_grieta', 'cristal_roto', 'persiana_oxidada', 'asfalto_hierba', 'asfalto_cebra', 'asfalto_linea_amarilla', 'acera_hierba', 'pilar_franjas', 'chapa_verde', 'cieno_orilla', 'panel_plateado', 'mosaico_verde_gris', 'ladrillo_gris_oscuro', 'azulejo_marron', 'cristal_azul', 'hormigon_encofrado', 'andamio_cristal', 'panel_blanco_sucio', 'piedra_gris_paneles', 'ladrillo_rojo_viejo', 'lamas_aluminio', 'adoquin_gris'];
const NOMBRES_TEX = ['asfalto', 'asfalto_linea', 'adoquin', 'ladrillo_rojo', 'ladrillo_gris', 'azulejo_beige', 'azulejo_blanco', 'teja_azul', 'madera_oscura', 'laca_roja', 'azulejo_verde', 'hormigon', 'agua', 'persiana', 'tenji_amarillo', 'adoquin_musgo'];
const IDS = {
  edificios: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11a', '11b', '12', '13', '14', '15', 'N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'H109'],
  plantas: Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, '0')),
  maquinas: Array.from({ length: 35 }, (_, i) => String(i + 1).padStart(2, '0')),
};
// altura REAL de cada sprite en metros (el ancho sale de la proporcion); los edificios se agrandan un poco (mundo ~1,4x)
const ALTO = {
  edificios: { '01': 16, '02': 13, '03': 15, '04': 30, '05': 42, '06': 18, '07': 9, '08': 9, '09': 20, '10': 15, '11a': 14, '11b': 7, '12': 7, '13': 20, '14': 9, '15': 5, N1: 20, N2: 26, N3: 20, N4: 18, N5: 19, N6: 15, N7: 20, N8: 10, H109: 44 },
  plantas: { '01': 9, '02': 4.5, '03': 6, '04': 8, '05': 4, '06': 2.6, '07': 2.4, '08': 2.2, '09': 1.8, '10': 2.6, '11': 2.6, '12': 1.4, '13': 1.1, '14': 1.2, '15': .9, '16': 1, '17': .6, '18': 4, '19': 4, '20': 4, '21': 1.2, '22': 1.1, '23': .9, '24': 1, '25': .4 },
  maquinas: { '01': 1.9, '02': 1.9, '03': 1.9, '04': 1.9, '05': 1.9, '06': 1.9, '07': 1.9, '08': 1.1, '09': .45, '10': .45, '11': .5, '12': .5, '13': .4, '14': 1.8, '15': 1.2, '16': 2.4, '17': 1.1, '18': 1, '19': 7.5, '20': 4.5, '21': .7, '22': .7, '23': 2.4, '24': 2.4, '25': 2.4, '26': 3.2, '27': .5, '28': .5, '29': .7, '30': .7, '31': .7, '32': 1.1, '33': 1.5, '34': .9, '35': .1 },
};
const HORAS = {   // cielo (arriba, medio, horizonte), niebla, luz hemisferica, sol, tinte de las tarjetas
  dia: { s: [-.45, .85, .25], cielo: ['#1f9bf0', '#3fb2f6', '#7fd0fa'], niebla: '#b4e0f8', hemi: ['#ffffff', '#b9c9a8', 2.2], sol: ['#fff0cf', 2.6], tinte: '#ffffff' },
  manana: { s: [.80, .42, .30], cielo: ['#5a9be0', '#a9d3ee', '#fbe7c2'], niebla: '#f0e6d2', hemi: ['#fff4e0', '#b9c9a8', 2.0], sol: ['#ffe2a8', 2.2], tinte: '#fff1dc' },
  tarde: { s: [-.85, .33, .35], cielo: ['#4a78c2', '#f0b07a', '#ffd9a0'], niebla: '#f5cfa0', hemi: ['#ffe2c4', '#a89478', 1.8], sol: ['#ffb871', 2.4], tinte: '#ffe0bc' },
  noche: { s: [.20, .55, .10], cielo: ['#0a1030', '#1f3466', '#3b5a8f'], niebla: '#27406b', hemi: ['#6f86c8', '#1d2a44', 1.1], sol: ['#8fa6ff', .5], tinte: '#7d93d0' },
};

const cargaImg = (u) => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = u; });

export async function texturas(THREE) {
  const m = {};
  await Promise.all(NOMBRES_UNI.map(async n => {
    const t = new THREE.TextureLoader().load(BASE + 'texturas_universo/px64/' + n + '.png');
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; m[n] = t;
  }));
  await Promise.all(NOMBRES_TEX.map(async n => {
    const t = new THREE.TextureLoader().load(BASE + 'texturas/px64/' + n + '.png');
    t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; m[n] = t;
  }));
  return m;
}

// farolillo rojo y nube pixel hechos por codigo (PROVISIONALES: sustituir por hoja de Flow)
function farolillo() {
  const c = document.createElement('canvas'); c.width = 12; c.height = 16; const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  px(4, 0, 4, 1, '#2a1a14'); px(2, 1, 8, 1, '#2a1a14'); px(1, 2, 10, 10, '#d23a2c'); px(2, 12, 8, 1, '#2a1a14'); px(1, 4, 10, 1, '#8f2218'); px(1, 8, 10, 1, '#8f2218'); px(3, 3, 2, 8, '#ee6a4a'); px(9, 3, 2, 8, '#a82a1e');
  px(5, 13, 2, 3, '#e8c25a'); return c;
}
function nube() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 26; const g = c.getContext('2d');
  const blob = (cx, cy, r, col) => { g.fillStyle = col; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) g.fillRect(cx + x, cy + y, 1, 1); };
  const B = [[14, 17, 8], [26, 12, 11], [40, 13, 10], [52, 18, 7], [32, 19, 9]];
  for (const [x, y, r] of B) blob(x, y + 2, r, '#c4d6ec'); for (const [x, y, r] of B) blob(x, y, r, '#ffffff'); for (const [x, y, r] of B) blob(x - 2, y - 2, Math.max(2, r - 4), '#f4f9ff');
  g.clearRect(0, 22, 64, 4); return c;
}

export async function mundoTex(ctx) {
  const { THREE, B, addG, R, hw, LEN, ALT, huecosN, huecosS, norte, sur, scene, sol, HORA } = ctx;
  const pick = a => a[Math.floor(R() * a.length)];
  // ---------- atlas (un solo material para todas las tarjetas)
  const imgs = [];
  for (const tipo of Object.keys(IDS)) for (const id of IDS[tipo]) imgs.push({ clave: tipo + id, src: BASE + 'sprites_px/' + tipo + '/' + tipo + '_' + id + '.png' });
  for (const g of ['lianas', 'hierba', 'arboles', 'calle', 'rotulos']) for (let i = 1; i <= 12; i++) { const n = String(i).padStart(2, '0'); imgs.push({ clave: 'U' + g + n, src: BASE + 'sprites_universo/px/' + g + '/' + g + '_' + n + '.png' }); }
  const cargadas = await Promise.all(imgs.map(async o => (o.img = await cargaImg(o.src), o)));
  const extra = [{ clave: 'farol', img: farolillo() }, { clave: 'nube', img: nube() }];
  const todas = cargadas.filter(o => o.img).concat(extra);
  const AW = 2048; let cx = 1, cy = 1, fila = 0; const rect = {};
  const cv = document.createElement('canvas'); cv.width = cv.height = AW; const g = cv.getContext('2d');
  todas.sort((a, b) => b.img.height - a.img.height);
  for (const o of todas) { const w = o.img.width, h = o.img.height; if (cx + w + 1 > AW) { cx = 1; cy += fila + 1; fila = 0; } g.drawImage(o.img, cx, cy); rect[o.clave] = { x: cx, y: cy, w, h }; cx += w + 1; fila = Math.max(fila, h); }
  const atlas = new THREE.CanvasTexture(cv); atlas.magFilter = atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = THREE.SRGBColorSpace;
  // ---------- tarjetas fusionadas
  const pos = [], uv = [], col = [], idx = [], sw = []; let nv = 0, tarjetas = 0;     // sw = (amplitud, fase) por vertice: balanceo por el viento
  const tinte = new THREE.Color(HORAS[HORA]?.tinte || '#ffffff');
  const ex = (clave) => rect[clave];
  // tipo: 'edificios'|'plantas'|'maquinas'|'extra'; across/along en plano; base = altura del suelo; cara: E (+X), W (-X), S (-Z), N (+Z)
  function carta(clave, tipoAlto, id, across, along, base, cara, o = {}) {
    const r = ex(clave); if (!r) return null;
    const h = (o.h || ALTO[tipoAlto]?.[id] || 2) * (o.hMul || 1) * (tipoAlto === 'edificios' ? 1.25 : 1);
    const w = (o.w || h * r.w / r.h) * (o.wMul || 1);
    let X = across, Z = along; const hw2 = w / 2; let L, Rr;       // extremos izquierdo y derecho vistos de frente [X, Z]
    if (cara === 'E') { L = [X, Z + hw2]; Rr = [X, Z - hw2]; } else if (cara === 'W') { L = [X, Z - hw2]; Rr = [X, Z + hw2]; }
    else if (cara === 'S') { L = [X + hw2, Z]; Rr = [X - hw2, Z]; } else { L = [X - hw2, Z]; Rr = [X + hw2, Z]; }
    const u0 = r.x / AW, u1 = (r.x + r.w) / AW, v1 = 1 - r.y / AW, v0 = 1 - (r.y + r.h) / AW;      // v0 abajo
    const t = o.tinte ? tinte.clone().multiply(new THREE.Color(o.tinte)) : tinte.clone();
    { const Nx = cara === 'E' ? 1 : cara === 'W' ? -1 : 0, Nz = cara === 'S' ? -1 : cara === 'N' ? 1 : 0, S = (HORAS[HORA] || HORAS.dia).s, lit = Math.max(0, Nx * S[0] + Nz * S[2]), m = Math.min(1, lit * 2.2);
      t.multiplyScalar(1.12 + .32 * lit); t.r *= .93 + .07 * m; t.g *= .98 + .02 * m; t.b *= 1.07 - .07 * m; }   // más luminosos; la fachada que mira al sol se aclara, la de sombra se enfría
    pos.push(L[0], base, L[1], Rr[0], base, Rr[1], Rr[0], base + h, Rr[1], L[0], base + h, L[1]);
    uv.push(u0, v0, u1, v0, u1, v1, u0, v1); for (let i = 0; i < 4; i++) col.push(t.r, t.g, t.b);
    // viento: plantas se mecen por arriba; lianas y hiedras colgantes por abajo; edificios y mobiliario rigidos
    const colg = /^plantas(18|19|20)$/.test(clave), planta = tipoAlto === 'plantas', modo = o.sway ?? (colg ? 'l' : planta ? 'p' : 0), ph = (across * 12.9898 + along * 78.233) % 6.283;
    const aB = modo === 'l' ? .075 * h : 0, aT = modo === 'p' ? .05 * h : modo === 'l' ? .012 * h : 0;
    sw.push(aB, ph, aB, ph, aT, ph, aT, ph);
    idx.push(nv, nv + 1, nv + 2, nv, nv + 2, nv + 3); nv += 4; tarjetas++;
    return { w, h };
  }
  const cruz = (clave, tipoAlto, id, across, along, base, o) => { carta(clave, tipoAlto, id, across, along, base, 'E', o); return carta(clave, tipoAlto, id, across, along, base, 'S', o); };
  const edif = (id, across, along, base, cara, o) => carta('edificios' + id, 'edificios', id, across, along, base, cara, o);
  const BAJOS = ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', '01', '02', '06', '10', '11a', '13', '15', 'N1', 'N4', 'N8', 'N5', 'N3'], ALTOS = ['04', '05', '09', 'N2', 'N7', 'N3', 'N5', '13'];   // Shibuya: edificios modernos de Tokio (Center-Gai, torres de rotulos, cristal, hormigon)
  const aspecto = id => { const r = ex('edificios' + id); return r.w / r.h * (ALTO.edificios[id] * 1.25); };
  const perchas = [];                                          // posaderos de pajaros: [X, Y, Z]
  const tarjL1 = [];                                            // para colgar hiedras y plantas de azotea
  // ---------- fila de edificios: rellena un tramo [a,b] con tarjetas y una caja detras de cada una
  function fila_(a, b, s, frente, prof, lista, o = {}) {
    const len = b - a; let ids = [], suma = 0, intentos = 0;
    while (suma < len * .85 && intentos++ < 60) { const id = pick(lista), w = aspecto(id) * (o.wMul || 1); if (suma + w <= len * 1.18) { ids.push(id); suma += w; } }
    if (!ids.length) ids = [pick(lista)], suma = aspecto(ids[0]);
    const f = len / suma; let x = a, i = 0;
    for (const id of ids) {
      const w = aspecto(id) * (o.wMul || 1) * f, h = (ALTO.edificios[id] * 1.25) * (o.hMul || 1), z = x + w / 2;
      carta('edificios' + id, 'edificios', id, s * (frente - .06), z, ALT, s < 0 ? 'E' : 'W', { w, h: ALTO.edificios[id] * 1.25, hMul: o.hMul || 1, tinte: o.tinte });
      const hb = ALT + h * .94, y0 = s < 0 ? -(frente + prof) : frente, y1 = s < 0 ? -frente : frente + prof;
      B(x, x + w, y0, y1, ALT, hb, o.caja || ['l1a', 'l1b', 'l1c'][i % 3]);
      if (o.guarda) tarjL1.push({ s, x, w, h, frente }); x += w; i++;
    }
  }
  // L1: primera linea con huecos a proposito
  for (const [a, b] of norte) if (a < 146 || a >= 190) fila_(a, b, -1, 9, 12, BAJOS, { guarda: 1 });
  for (const [a, b] of sur) if (a < 146 || a >= 190) fila_(a, b, 1, 9, 12, BAJOS, { guarda: 1 });
  fila_(146, 190, -1, 16, 6, ['N3', 'N7', '02', '13', 'N1', 'N2', 'N5'], { guarda: 1 }); fila_(146, 190, 1, 16, 6, ['N3', 'N7', '02', '13', 'N1', 'N2', 'N5'], { guarda: 1 });   // el Cruce: esquinas curvas y torres de rotulos
  // L2: fachadas de la calle paralela (se ven por los huecos; con bruma)
  for (const s of [-1, 1]) for (const [a, b] of [[0, 89], [101, LEN]]) fila_(a, b, s, 32.5, 12, BAJOS.concat(ALTOS.slice(0, 3)), { tinte: '#dde6ef', caja: 'l2' });
  // L3: telones de rascacielos al fondo, en niebla azul
  for (const s of [-1, 1]) fila_(0, LEN, s, 50, 14, ALTOS, { tinte: '#c0d4ea', hMul: 1.7, wMul: 1.5, caja: 'sky' });
  // ---------- plantas, mobiliario, hiedras y azoteas
  const lado = s => (s < 0 ? 'E' : 'W');
  const pondera = (t) => { const r = R() * t.reduce((a, b) => a + b[1], 0); let c = 0; for (const [v, w] of t) { c += w; if (r < c) return v; } return t[0][0]; };
  const PL = [['02', 6], ['05', 6], ['06', 6], ['07', 8], ['12', 6], ['21', 9], ['22', 9], ['23', 9], ['24', 9], ['13', 4], ['14', 4], ['15', 4], ['16', 4], ['08', 3], ['03', 3]];
  const MQ = [['01', 3], ['02', 3], ['03', 3], ['04', 2], ['05', 2], ['06', 2], ['07', 3], ['08', 2], ['14', 1], ['15', 2], ['17', 2], ['18', 2], ['21', 1], ['22', 1], ['32', 1], ['30', 2], ['31', 2], ['29', 1], ['09', 1], ['10', 1], ['11', 1], ['12', 1], ['16', 1]];
  for (const s of [-1, 1]) {
    for (let x = 1; x < 0; x += 3 + R() * 4.5) {                                   // vegetacion en el muelle
      const id = pondera(PL); const yo = hw(x) + .8 + R() * .9; if (x > 140 && x < 196 && R() < .5) continue;
      cruz('plantas' + id, 'plantas', id, s * yo, x, ALT, { hMul: .9 + R() * .3 });
    }
    for (let x = 4; x < 0; x += 7 + R() * 8) {                                       // mobiliario de calle
      if (x > 86 && x < 104) continue; const id = pondera(MQ); const y = Math.min(hw(x) + 1.4, 8.6);
      carta('maquinas' + id, 'maquinas', id, s * y, x, ALT, lado(s));
    }
    for (let x = 12; x < 0; x += 28 + R() * 14) { const id = R() < .6 ? '19' : '20'; cruz('maquinas' + id, 'maquinas', id, s * (hw(x) + .4), x, ALT); }     // postes y farolas
  }
  for (const t of tarjL1) {                                                          // hiedras colgando y plantas de azotea
    const s = t.s, ey = s * (t.frente - .12);
    if (R() < .7) { const id = pick(['18', '19', '20']); carta('plantas' + id, 'plantas', id, ey, t.x + t.w * (.15 + R() * .7), ALT + t.h - 3.6 * .9, lado(s), { hMul: .9 }); }
    if (R() < .45) { const id = pick(['18', '19', '20']); carta('plantas' + id, 'plantas', id, ey, t.x + t.w * (.1 + R() * .8), ALT + t.h * .45, lado(s), { hMul: 1 }); }
    if (R() < .6) { const id = pick(['07', '12', '04', '02']); cruz('plantas' + id, 'plantas', id, s * (t.frente + 1.5 + R() * 3), t.x + t.w * R(), ALT + t.h * .94, { hMul: .8 + R() * .5 }); }
    if (R() < .35) carta('maquinas' + pick(['21', '22']), 'maquinas', pick(['21', '22']), ey, t.x + t.w * R(), 3 + R() * (t.h * .5), lado(s));   // aires acondicionados
  }
  // ---------- calle de Tokio inundada: semaforos, postes de cables, senales, troncos, coches hundidos, hierba y flores en cada muelle
  for (const s_ of [-1, 1]) {
    for (let x = 9; x < LEN; x += 17 + R() * 12) { const y = s_ * (hw(x) - .8); const k = R() < .5 ? 'Ucalle01' : 'Ucalle02'; cruz(k, 'extra', 'x', y, x, -2.4, { h: 8, sway: 'p' }); perchas.push([y, 4.9, x]); }
    for (let x = 22; x < LEN; x += 26 + R() * 14) cruz('Ucalle03', 'extra', 'x', s_ * (hw(x) - .8), x, -2.4, { h: 10.9, sway: 0 });
    for (let x = 14; x < LEN; x += 30 + R() * 20) cruz(R() < .5 ? 'Ucalle04' : 'Ucalle05', 'extra', 'x', s_ * (hw(x) - 1), x, -2, { h: 4.6, sway: 0 });
    for (let x = 6; x < LEN; x += 4 + R() * 4) { const g = pick(['hierba01', 'hierba02', 'hierba03', 'hierba04', 'hierba06', 'hierba06', 'hierba07', 'hierba10', 'hierba11', 'hierba12', 'arboles02', 'arboles08', 'arboles11', 'arboles12']); cruz('U' + g, 'extra', 'x', s_ * (hw(x) - .3 - R() * 1.3), x, -.4, { h: g.startsWith('arboles') ? 1.6 + R() * 1.8 : .9 + R() * 1.3, sway: 'p' }); }
  }
  for (let i = 0; i < 9; i++) { const z = R() * LEN, l = hw(z) - 1.4, k = R() < .5 ? 'Ucalle06' : 'Ucalle08'; cruz(k, 'extra', 'x', (R() < .5 ? -1 : 1) * l, z, -.1, { h: .9, sway: 0 }); }
  for (const [y, z] of [[-11.5, 150], [11.5, 186], [-12.5, 176], [12, 160]]) cruz('Ucalle10', 'extra', 'x', y, z, -1.15, { h: 1.7, sway: 0 });
  for (let i = 0; i < 0; i++) cruz('Ucalle11', 'extra', 'x', (R() < .5 ? -1 : 1) * (hw(40) + .9), R() * LEN, ALT, { h: .7, sway: 0 });
  // ---------- TOKYO GENSO: la vegetacion SUBE por la fachada desde la base y forma BOSQUES en las azoteas
  const ALT_ARB = { 3: [5, 9], 1: [2.5, 4], 6: [4, 6.5], 7: [6, 9], 4: [3, 5.5], 2: [2, 3.2], 5: [6, 9], 8: [2, 3.2] };
  const arbol = () => { const n = pondera([[3, 4], [1, 5], [6, 3], [7, 2], [4, 3], [2, 3], [5, 2], [8, 2]]), [a, b] = ALT_ARB[n]; return ['Uarboles0' + n, a + R() * (b - a)]; };
  const sube = (ey, xa, w, alto, cara, y0 = ALT) => { let y = y0; while (y < alto - .6) { const hh = Math.min(alto - y, 4 + R() * 3.5), k = pick(['Ulianas05', 'Ulianas05', 'Ulianas06', 'Ulianas10', 'Ulianas12', 'Ulianas07']); carta(k, 'extra', 'x', ey, xa, y, cara, { w: w * (.8 + R() * .4), h: hh, sway: 0 }); y += hh * .88; } };
  for (const t of tarjL1) {
    const s = t.s, hb = ALT + t.h * .94, cara = lado(s), ey = s * (t.frente - .16);
    const nb = 2 + Math.floor(R() * 3);
    for (let b = 0; b < nb; b++) sube(ey, t.x + t.w * (.08 + .84 * R()), 2.4 + R() * 2.6, hb * (.5 + .5 * R()), cara);                      // bandas de enredadera de la base al tejado
    const n = 8 + Math.floor(R() * 8);
    for (let i = 0; i < n; i++) { const [k, hh] = arbol(); cruz(k, 'extra', 'x', s * (t.frente + 1 + R() * 9), t.x + t.w * R(), hb, { h: hh, sway: 'p' }); }   // bosque de azotea
    for (let i = 0; i < 3; i++) { const k = pick(['Ulianas01', 'Ulianas02', 'Ulianas03', 'Ulianas09']), hh = 5 + R() * 6; carta(k, 'extra', 'x', ey - s * .05, t.x + t.w * (.05 + .9 * R()), hb - hh + .6, cara, { h: hh, sway: 'l' }); }   // cortinas desde el borde
  }
  // ---------- farolillos sobre el canal y plaza con islote
  cruz('Uarboles03', 'extra', 'x', 1.4, 168.5, .9, { h: 7, sway: 'p' }); cruz('Uarboles07', 'extra', 'x', -1.6, 166.5, .9, { h: 6.5, sway: 'p' }); cruz('Uarboles01', 'extra', 'x', 2.8, 166.5, .9, { h: 3, sway: 'p' }); for (let i = 0; i < 8; i++) cruz(pick(['Uhierba02', 'Uhierba05', 'Uhierba06', 'Uhierba01', 'Uhierba04']), 'extra', 'x', 1 + (R() - .5) * 7, 168 + (R() - .5) * 6, .9, { h: .8 + R() * 1.2, sway: 'p' });
  // ---------- nubes pixel en el cielo (tarjetas grandes)
  for (let i = 0; i < 0; i++) { const along = R() * LEN, across = (R() * 2 - 1) * 230, h = 55 + R() * 60, w = 70 + R() * 90; carta('nube', 'extra', 'x', across, along, h, 'S', { w, h: w * .4, tinte: '#ffffff' }); }
  // ---------- SHIBUYA: viaducto ferroviario elevado (tren parado, verde Yamanote inventado) sobre la calle inundada
  { const Z0 = 91.5, Z1 = 98.5, H = 7.0;
    B(Z0, Z1, -34, 34, H, H + 1.2, 'puente');                                     // tablero
    B(Z0 - .25, Z0 + .1, -34, 34, H + 1.2, H + 1.9, 'pila'); B(Z1 - .1, Z1 + .25, -34, 34, H + 1.2, H + 1.9, 'pila');   // pretiles
    for (const y of [-9.2, -8.2, 8.2, 9.2]) B(Z0 + .2, Z0 + 1.6, y - .35, y + .35, ALT, H, 'pila');
    B(Z1 - 1.6, Z1 - .2, -9.9, -7.6, ALT, H, 'pila'); B(Z1 - 1.6, Z1 - .2, 7.6, 9.9, ALT, H, 'pila');
    for (const y of [-22, 22, -30, 30]) { B(Z0 + .3, Z1 - .3, y - .6, y + .6, ALT, H, 'pila'); }
    B(92.1, 97.9, -17, 17, H + 1.2, H + 4.4, 'tren'); B(92.05, 97.95, -17, 17, H + 2.1, H + 2.7, 'trenv'); B(92.05, 97.95, -17, 17, H + 3.0, H + 3.7, 'tunel');   // vagon: cuerpo blanco, banda verde, ventanas oscuras
    for (const y of [-6, 6]) { const id = pick(['18', '19', '20']); carta('plantas' + id, 'plantas', id, y, Z0 - .05, H - 3.4, 'S', { hMul: .9 }); } }
  // ---------- SHIBUYA: el Cruce (pasos de cebra pintados bajo el agua, fantasma claro) + senales
  { const ge = [], cebra = (z0, z1) => { for (let y = -12.6; y <= 12.6; y += 1.5) { const g = new THREE.BoxGeometry(.75, .04, z1 - z0); g.translate(y, -3.36, (z0 + z1) / 2); ge.push(g); } };
    cebra(148, 154); cebra(182, 188);
    for (let z = 156; z < 180; z += 2.4) for (const y of [-11.5, 11.5]) { const g = new THREE.BoxGeometry(.5, .04, 1.2); g.translate(y, -3.36, z); ge.push(g); }     // lineas laterales
    const gm = new THREE.BoxGeometry(); const merged = ge.reduce((acc, g) => { acc.push(g); return acc; }, []);
    const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js'); const cg = mergeGeometries(merged.map(g => g.toNonIndexed ? g.toNonIndexed() : g).map(g => { g.deleteAttribute('uv'); g.deleteAttribute('normal'); return g; }));
    ctx.extraObjs = [new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: '#cdd2c4' }))]; }
  for (const [y, z, id, cara] of [[-12.6, 146, '24', 'N'], [12.6, 190, '24', 'S'], [-12.6, 190, '25', 'S'], [12.6, 146, '23', 'N'], [-7.6, 86, '26', 'E'], [7.6, 102, '26', 'W']]) carta('maquinas' + id, 'maquinas', id, y, z, ALT, cara);
  // la 109 (marcador: torre cilindrica) al final del tunel, mirando a la salida
  { const q = carta('edificiosH109', 'edificios', 'H109', 0, 217, ALT, 'S', { w: 48 });
    if (q) { for (let b = 0; b < 2; b++) sube(0, 216.85, 3 + R() * 3, q.h * (.4 + .3 * R()), 'S'); for (let b = 0; b < 3; b++) { const xa = (R() - .5) * q.w * .7; sube(xa, 216.85, 3 + R() * 3, q.h * (.5 + .5 * R()), 'S'); }
      for (let i = 0; i < 0; i++) { const [k, hh] = arbol(); cruz(k, 'extra', 'x', (R() - .5) * q.w * .5, 217 + R() * 3, ALT + q.h * .96, { h: hh, sway: 'p' }); } } }
  // ---------- Shibuya: torres de rotulos verticales, pantallas LED, carteleras, banderolas y toldos en las fachadas
  const RT = n => 'Urotulos' + String(n).padStart(2, '0');       // 1-4 verticales, 5 LED, 6 cartelera, 7 banderola, 8-9 toldos, 10 caja, 11 redondo (casillas ya mapeadas)
  const mapaRT = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 10, 10: 11, 11: 12 };
  const rt = n => RT(mapaRT[n]);
  for (const t of tarjL1) {
    const s = t.s, cara = lado(s), ey = s * (t.frente - .4), hb = ALT + t.h * .94;
    const nv = 2 + Math.floor(R() * 3);
    for (let i = 0; i < nv; i++) carta(rt(1 + Math.floor(R() * 4)), 'extra', 'x', ey, t.x + t.w * (.08 + .84 * R()), 1.5 + R() * Math.max(2, hb - 10.5), cara, { h: 3.8 + R() * 3, sway: 0 });
    if (R() < .45) carta(rt(R() < .5 ? 5 : 6), 'extra', 'x', ey - s * .1, t.x + t.w * (.2 + .6 * R()), 4 + R() * Math.max(2, hb * .5), cara, { h: 5 + R() * 3, sway: 0 });
    if (R() < .5) carta(rt(R() < .5 ? 8 : 9), 'extra', 'x', ey - s * .1, t.x + t.w * (.15 + .7 * R()), .2, cara, { h: 1.7, sway: 0 });
    if (R() < .35) carta(rt(7), 'extra', 'x', ey, t.x + t.w * R(), 3 + R() * 6, cara, { h: 3.5 + R() * 1.5, sway: 'l' });
    if (R() < .4) carta(rt(R() < .5 ? 10 : 11), 'extra', 'x', ey - s * .2, t.x + t.w * R(), 1.2 + R() * 3, cara, { h: 1.1, sway: 0 });
  }
  // ---------- perchas para los pajaros (tejados de primera linea y postes)
  for (const t of tarjL1) if (R() < .6) perchas.push([t.s * (t.frente + 1 + R() * 6), ALT + t.h * .94, t.x + t.w * R()]);
  for (const s of [-1, 1]) for (let x = 14; x < LEN; x += 30 + R() * 14) perchas.push([s * (hw(x) + .4), 7.3, x]);
  let cielo = null;
  // ---------- fondo de la calzada bajo el agua transparente
  { const tl = new THREE.TextureLoader().load(BASE + 'texturas_universo/px64/asfalto_hierba.png'); tl.magFilter = tl.minFilter = THREE.NearestFilter; tl.generateMipmaps = false; tl.wrapS = tl.wrapT = THREE.RepeatWrapping; tl.colorSpace = THREE.SRGBColorSpace; tl.repeat.set(190 / 4, LEN / 4);
    const pl = new THREE.PlaneGeometry(190, LEN); pl.rotateX(-Math.PI / 2); pl.translate(0, -3.4 + .02, LEN / 2); (ctx.extraObjs ||= []).push(new THREE.Mesh(pl, new THREE.MeshBasicMaterial({ map: tl, color: '#c9e3d6' })));
    if (ctx.MAT.agua) { ctx.MAT.agua.transparent = true; ctx.MAT.agua.opacity = .8; ctx.MAT.agua.depthWrite = false; ctx.MAT.agua.needsUpdate = true; } }
  await (await import('./vida.js')).vida({ THREE, scene, camera: ctx.camera, LEN, hw, perchas, R });
  // ---------- ambiente (cielo, niebla, luces)
  const H = HORAS[HORA] || HORAS.dia, cc = document.createElement('canvas'); cc.width = 4; cc.height = 256; const cg = cc.getContext('2d'); const gr = cg.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, H.cielo[0]); gr.addColorStop(.55, H.cielo[1]); gr.addColorStop(1, H.cielo[2]); cg.fillStyle = gr; cg.fillRect(0, 0, 4, 256);
  const ct = new THREE.CanvasTexture(cc); ct.colorSpace = THREE.SRGBColorSpace; sol.position.set(H.s[0] * 150, H.s[1] * 150, H.s[2] * 150); if (ctx.MAT.agua && ctx.MAT.agua.uniforms) ctx.MAT.agua.uniforms.uSolX.value = H.s[0];
  scene.background = null; cielo = crearCielo(THREE, H, sol.position); scene.add(cielo.mesh); scene.fog.color.set(H.niebla);
  if (ctx.MAT.agua) { if (ctx.MAT.agua.uniforms) ctx.MAT.agua.uniforms.uTinte.value.set(H.tinte); else ctx.MAT.agua.color.set(H.tinte); }
  const hemi = scene.children.find(o => o.isHemisphereLight); if (hemi) { hemi.color.set(H.hemi[0]); hemi.groundColor.set(H.hemi[1]); hemi.intensity = H.hemi[2]; } sol.color.set(H.sol[0]); sol.intensity = H.sol[1];
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
  geo.setAttribute('sway', new THREE.Float32BufferAttribute(sw, 2));
  const matC = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: .5, side: THREE.DoubleSide }); let shd = null;
  matC.onBeforeCompile = (sh) => { sh.uniforms.uT = { value: 0 }; shd = sh;
    const viento = `vec3 transformed = vec3(position);
      float g = sin(uT * 1.25 + sway.y + position.z * .09) + .45 * sin(uT * 2.6 + sway.y * 1.7 + position.x * .11);
      transformed.x += g * sway.x; transformed.z += g * sway.x * .55; transformed.y -= abs(g) * sway.x * .12;`;
    sh.vertexShader = 'attribute vec2 sway;\nuniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', viento); };
  const mesh = new THREE.Mesh(geo, matC);
  const aguaMap0 = 0; const aguaMap = ctx.MAT.agua && ctx.MAT.agua.map;                                        // agua: deriva suave de la textura (provisional; el agua transparente con olas va por shader)
  mesh.onBeforeRender = () => { const t = performance.now() / 1000; if (cielo) cielo.update(ctx.camera, t); if (shd) shd.uniforms.uT.value = t; if (aguaMap) { aguaMap.offset.set(t * .012, t * .007); } };
  mesh.frustumCulled = false; window.__TEX = { tarjetas, rect, atlas: [AW] };
  return { objetos: [mesh, ...(ctx.extraObjs || [])] };
}
