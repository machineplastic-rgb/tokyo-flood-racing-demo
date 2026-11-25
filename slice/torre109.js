// Torre 109 (pieza héroe, pixel): cilindro de azulejo agrietado + bandas de ventanas oscuras + remate con parapeto roto + cartel circular inventado
// + cortinas de lianas y árboles en lo alto (tarjetas con alpha). Referencia: imagen canónica 06 (Tokyo Genso). Cartel sin marca real.
export function torre109(THREE, c, R, H) {
  const g = new THREE.Group(), L = new THREE.TextureLoader();
  const tex = (u, rep) => { const t = L.load(u); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
  const circ = 2 * Math.PI * R;
  // cuerpo: azulejos a escala real (4 m por repetición); ligera conicidad
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(R * .97, R, H + 4, 40, 1, false), new THREE.MeshLambertMaterial({ map: tex('art/azulejo_b.png', [Math.round(circ / 3), Math.round(H / 3)]), color: '#ffffff', emissive: '#6d675b' }));
  cuerpo.position.set(c.x, (H - 4) / 2, c.z); cuerpo.userData.ciudad = true; g.add(cuerpo);
  // bandas de ventanas oscuras (huecos) cada ~9 m; una cara más rota que otra
  for (let y = 8; y < H - 6; y += 9) { const b = new THREE.Mesh(new THREE.CylinderGeometry(R * .975 + .03, R * 1.003 + .03, 2.2, 40, 1, true), new THREE.MeshLambertMaterial({ color: '#25343f' })); b.position.set(c.x, y, c.z); b.scale.set(1, 1, 1); b.userData.ciudad = true; g.add(b); }
  // remate: parapeto de hormigón y dos dientes rotos
  const par = new THREE.Mesh(new THREE.CylinderGeometry(R * .99, R * .99, 3.2, 40, 1, true), new THREE.MeshLambertMaterial({ color: '#b8b3a6', side: THREE.DoubleSide })); par.position.set(c.x, H + 1.6, c.z); par.userData.ciudad = true; g.add(par);
  for (const [a, w, h] of [[.5, 6, 3.6], [2.6, 8, 2.4], [4.2, 5, 4.4]]) { const d = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2), new THREE.MeshLambertMaterial({ color: '#b8b3a6' })); d.position.set(c.x + Math.cos(a) * R, H + 3 + h / 2, c.z + Math.sin(a) * R); d.rotation.y = -a + Math.PI / 2; g.add(d); }
  // cartel circular (diseño inventado: anillo y disco rojos) mirando a la salida (+X)
  { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); x.clearRect(0, 0, 64, 64);
    x.fillStyle = '#d93a32'; x.beginPath(); x.arc(32, 32, 30, 0, 6.2832); x.fill(); x.fillStyle = '#f4e6cf'; x.beginPath(); x.arc(32, 32, 22, 0, 6.2832); x.fill(); x.fillStyle = '#d93a32'; x.beginPath(); x.arc(32, 32, 14, 0, 6.2832); x.fill();
    x.fillStyle = '#f4e6cf'; x.font = 'bold 26px monospace'; x.textAlign = 'center'; x.fillText('10', 32, 42); x.strokeStyle = '#8f2a24'; x.lineWidth = 2; x.setLineDash([3, 3]); x.beginPath(); x.arc(52, 36, 6, 0, 6.2832); x.stroke();
    const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .5, side: THREE.DoubleSide })); s.position.set(c.x + R + .25, H - 10, c.z); s.rotation.y = Math.PI / 2; g.add(s); }
  // lianas: cortinas tangentes al cuerpo (lado de la salida) y árboles en la azotea
  const carta = (img, w, h, a, y, rr) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex('art/' + img + '.png'), alphaTest: .5, side: THREE.DoubleSide }));
    m.position.set(c.x + Math.cos(a) * rr, y, c.z + Math.sin(a) * rr); m.rotation.y = Math.PI / 2 - a; g.add(m); };
  const li = ['lianas_01', 'lianas_02', 'lianas_03'];
  for (let k = 0, a = -1.05; a < 1.1; a += .26, k++) { const h = 26 + (k * 7) % 22; carta(li[k % 3], 9, h, a, H - h / 2 + 1, R + .3); }
  for (let k = 0, a = -.9; a < 1; a += .45, k++) carta('lianas_0' + (k % 2 ? 2 : 3), 9, 30, a, 22 + (k % 3) * 6, R + .45);
  for (let k = 0; k < 6; k++) { const a = k * 1.05; const img = ['arboles_01', 'arboles_02', 'arboles_03'][k % 3]; const rr = R * .55 * (k % 2 ? 1 : .6); const w = 15;
    for (const rot of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * .72), new THREE.MeshLambertMaterial({ map: tex('art/' + img + '.png'), alphaTest: .5, side: THREE.DoubleSide })); m.position.set(c.x + Math.cos(a) * rr, H + 4.5, c.z + Math.sin(a) * rr); m.rotation.y = rot; g.add(m); } }
  return g;
}

// ---- versión 2: tres volúmenes (cilindro + dos alas con voladizo) + detalles recortados del sprite héroe de Flow (ventanal, cascada, cartel colgante)
export function torre109v2(THREE, c, R, H) {
  const g = torre109(THREE, c, R, H); g.children.slice().forEach(o => { if (o.geometry && o.geometry.type === 'PlaneGeometry' && o.material.map && o.material.map.image && false) g.remove(o); });
  const L = new THREE.TextureLoader(), img = new Image(); img.src = 'art/h109.png';
  const nt = t => { t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; };
  const tx = (u, rx, ry) => { const t = nt(L.load(u)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
  const crop = (fx0, fy0, fx1, fy1) => { const cv = document.createElement('canvas'), t = nt(new THREE.CanvasTexture(cv)); const dib = () => { const W = img.naturalWidth, Hh = img.naturalHeight, x0 = fx0 * W, y0 = fy0 * Hh, w = (fx1 - fx0) * W, h = (fy1 - fy0) * Hh; cv.width = Math.round(w); cv.height = Math.round(h); cv.getContext('2d').drawImage(img, x0, y0, w, h, 0, 0, cv.width, cv.height); t.needsUpdate = true; t.dispose(); }; if (img.complete && img.naturalWidth) dib(); else img.addEventListener('load', dib); return t; };
  const sol = (map, color) => new THREE.MeshLambertMaterial({ map, color: color || '#ffffff', emissive: '#4a463d' });
  const wing = (s) => {                                      // s = +1 izquierda, -1 derecha (mirando desde la salida)
    const zc = c.z + s * (R + 11), W = 26, D = 24, xf = c.x + R * .55;     // frente del ala a 8 m del eje; fondo 24 m
    const parte = (x0, x1, y0, y1, mat) => { const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, W), mat); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, zc); b.userData.ciudad = true; g.add(b); return b; };
    const hor = sol(tx('art/hormigon_oxido.png', 6, 6), '#ffffff'), azu = sol(tx('art/azulejo_gris_grieta.png', 6, 8), '#ffffff');
    parte(xf - D, xf, -4, 24, azu);                          // cuerpo bajo (planta de ventanal: la cara frontal se cubre con cristal)
    parte(xf - D, xf + 6, 24, 37, hor);                      // voladizo de hormigón (se adelanta 6 m)
    const vt = tx('art/cristal_roto.png', 4, 1); const vid = new THREE.Mesh(new THREE.PlaneGeometry(W - 2, 20), new THREE.MeshLambertMaterial({ map: vt, emissive: '#3a4650', alphaTest: .4 })); vid.position.set(xf + .15, 10, zc); vid.rotation.y = Math.PI / 2; g.add(vid);
    const ala = new THREE.Mesh(new THREE.PlaneGeometry(W, W * 362 / 455 * 1.1), new THREE.MeshLambertMaterial({ map: tx('art/ala_aband.png', 1, 1), emissive: '#4a463d', alphaTest: .4, side: THREE.DoubleSide })); ala.position.set(xf + 6.2, 27, zc); ala.rotation.y = Math.PI / 2; g.add(ala);
    for (const dz of [-W / 2 + 1.5, W / 2 - 1.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 28, 3), azu); p.position.set(xf + .6, 10, zc + dz); p.userData.ciudad = true; g.add(p); }   // pilares laterales
    return zc;
  };
  wing(1); const zr = wing(-1);
  // cascada del voladizo derecho (animada: rayas verticales que bajan) + salpicadura
  { const cv = document.createElement('canvas'); cv.width = 16; cv.height = 64; const x = cv.getContext('2d'); x.fillStyle = '#bfe8f2'; x.fillRect(0, 0, 16, 64); for (let i = 0; i < 40; i++) { x.fillStyle = Math.random() < .5 ? '#ffffff' : '#7fc6dc'; x.fillRect((Math.random() * 16) | 0, (Math.random() * 64) | 0, 2, 6 + ((Math.random() * 10) | 0)); }
    const t = nt(new THREE.CanvasTexture(cv)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 26), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: .9, side: THREE.DoubleSide })); w.position.set(c.x + R + .45, 12, c.z); w.rotation.y = Math.PI / 2; w.onBeforeRender = () => { t.offset.y = -(performance.now() / 1000) * .9; }; g.add(w); }
  for (const y of [26, 38, 50]) { const r = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 7), new THREE.MeshLambertMaterial({ color: '#1f2a33' })); r.position.set(c.x + R + .1, y, c.z); g.add(r); const l = new THREE.Mesh(new THREE.BoxGeometry(2.4, .7, 9), new THREE.MeshLambertMaterial({ color: '#a8a395' })); l.position.set(c.x + R + .6, y - 1.2, c.z); l.userData.ciudad = true; g.add(l); }   // huecos y repisas del cilindro (de donde cae la cascada)
  // cartel colgante desgarrado y marquesina rosa del acceso
  { const b = new THREE.Mesh(new THREE.PlaneGeometry(6, 13), new THREE.MeshLambertMaterial({ map: crop(.45, .355, .55, .605), alphaTest: .4, side: THREE.DoubleSide, emissive: '#4a463d' })); b.position.set(c.x + R + .35, 40, c.z); b.rotation.y = Math.PI / 2; g.add(b); }
  { const m = new THREE.Mesh(new THREE.BoxGeometry(5, .8, 14), new THREE.MeshLambertMaterial({ color: '#c8567c', emissive: '#3a1626' })); m.position.set(c.x + R + 2, 7, c.z); m.userData.ciudad = true; g.add(m);
    for (const dz of [-6.5, 6.5]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.5, 7, .5), new THREE.MeshLambertMaterial({ color: '#b9953a' })); p.position.set(c.x + R + 3.8, 3.5, c.z + dz); g.add(p); } }
  // el "9" caído en la marquesina
  { const cv = document.createElement('canvas'); cv.width = 32; cv.height = 48; const x = cv.getContext('2d'); x.fillStyle = '#d93a32'; x.font = 'bold 44px monospace'; x.textAlign = 'center'; x.fillText('9', 16, 40);
    const t = nt(new THREE.CanvasTexture(cv)); const n = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .4, side: THREE.DoubleSide })); n.position.set(c.x + R + 3.2, 7.5, c.z + 3); n.rotation.set(-1.15, Math.PI / 2, .5); g.add(n); }
  return g;
}
