// Vestido de la plaza y las fachadas (pixel + Tokyo Genso): shader de fachada para TODA la ciudad opaca, carteles verticales inventados, semáforos y lianas.
// Sin marcas reales: rótulos genéricos en japonés ("薬", "居酒屋", "渋谷駅" = nombres comunes, sin logotipos).

// ---- 1) fachada procedural en el material de la ciudad (ventanas, juntas de azulejo, musgo, enredaderas, oclusión al pie)
export function fachada(THREE, mat, uSun) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSun = { value: uSun };
    sh.vertexShader = 'varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'varying vec3 vWP; varying vec3 vWN; uniform vec3 uSun;\n' +
      `float hs(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }\n` +
      sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      {
        vec3 n = normalize(vWN); float wall = 1. - smoothstep(.30, .65, abs(n.y)); float y = vWP.y;
        bool ejeX = abs(n.x) > abs(n.z); float u = ejeX ? vWP.z : vWP.x;
        vec2 q = vec2(floor(u*5.)/5., floor(y*5.)/5.);                       // píxel de fachada = 20 cm
        vec3 col = diffuseColor.rgb; float lum = dot(col, vec3(.333));
        // tono base: hormigón cálido / azulejo, con variación por edificio
        float bid = hs(floor(vec2(vWP.x/13., vWP.z/13.)));
        vec3 tint = mix(vec3(.93,.88,.78), vec3(.80,.88,.86), bid);
        col = vec3(lum) * tint * 1.18 + vec3(.05,.045,.035);
        // juntas de azulejo cada 1 m
        float jx = step(.93, fract(u*1.)), jy = step(.93, fract(y*1.)); col *= 1. - .10*max(jx, jy);
        // ventanas: celdas de 3,2 x 3,4 m
        vec2 cell = vec2(u/3.2, y/3.4), f = fract(cell), id = floor(cell); float h = hs(id + bid*17.);
        float win = step(.16, f.x) * step(f.x, .84) * step(.30, f.y) * step(f.y, .84) * step(.6, y) * step(y, 60.);
        if (win > .5 && h > .12) {
          vec3 gl = mix(vec3(.10,.20,.30), vec3(.52,.72,.86), clamp(f.y*1.1 + h*.4 - .3, 0., 1.));
          if (h > .78) gl = vec3(.05,.09,.13);                                  // hueco roto
          if (fract(f.x*3.2) < .08 || fract(f.y*3.) < .06) gl = col*.55;        // marcos y travesaños
          col = mix(col, gl, wall);
        } else if (win > .5) col *= .78;                                        // persiana
        // repisa bajo cada forjado
        col *= 1. - .22*wall*step(f.y, .08)*step(.6, y);
        // sombra propia (cara que no mira al sol)
        float sunl = clamp(dot(n, normalize(uSun)), 0., 1.); col *= mix(.62, 1.14, sunl);
        // musgo y enredaderas que suben desde el agua en tiras irregulares
        float cid = floor(u*1.6), r = hs(vec2(cid, 3.1)), r2 = hs(vec2(cid, 7.7));
        float alt = (3. + 15.*r*r) * (.6 + .5*hs(floor(vec2(u*5., y*.5)) + 5.));
        float cobertura = step(y, alt) * step(.38, r2) * smoothstep(0., 1.2, y);
        float rugoso = step(.35, hs(q*3.7 + 9.));
        vec3 verde = mix(vec3(.18,.36,.12), vec3(.40,.62,.20), hs(q*2.1));
        col = mix(col, verde, wall * cobertura * rugoso * .92);
        // cortinas colgando desde la azotea no se pueden saber aquí; se pone verde extra en la base (musgo húmedo)
        col = mix(col, vec3(.14,.32,.17), wall * smoothstep(1.4, .0, y) * .75);
        col *= 1. - .30*wall*smoothstep(3., .0, y);                             // oclusión al pie
        diffuseColor.rgb = mix(diffuseColor.rgb, col, wall + .0) ;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.05,1.0,.9)*1.12, 1. - wall);   // azoteas: algo más cálidas
      }`);
  };
  mat.needsUpdate = true; return mat;
}

// ---- 2) carteles verticales inventados (tarjetas con canvas, pixel)
function cartelCanvas(txt, fondo, texto, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = fondo; g.fillRect(0, 0, W, H); g.fillStyle = texto; g.fillRect(2, 2, W - 4, 2); g.fillRect(2, H - 4, W - 4, 2); g.fillRect(2, 2, 2, H - 4); g.fillRect(W - 4, 2, 2, H - 4);
  g.fillStyle = texto; g.textAlign = 'center'; g.textBaseline = 'middle'; const chars = [...txt], paso = (H - 12) / chars.length; g.font = `bold ${Math.min(W - 10, paso * .9) | 0}px "Yu Gothic","MS Gothic","Noto Sans CJK JP",sans-serif`;
  chars.forEach((ch, i) => g.fillText(ch, W / 2, 8 + paso * (i + .5)));
  return c;
}
export function vestir(THREE, scene, P, w, TX) {
  const nt = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; };
  const sign = [['薬', '#d93a32', '#fff4e0'], ['居酒屋', '#1f4f9c', '#ffffff'], ['ビデオ', '#1e5ea8', '#ffe9a8'], ['渋谷駅', '#1c5fa5', '#ffffff'], ['書店', '#2f7d4a', '#ffffff'], ['カラオケ', '#c2358c', '#fff4e0'], ['喫茶', '#b8741f', '#fff4e0'], ['銀行', '#1b3f8a', '#ffd84a']];
  const mats = sign.map(([t, f, c]) => new THREE.MeshBasicMaterial({ map: nt(cartelCanvas(t, f, c, 40, 40 + 22 * [...t].length)), side: THREE.DoubleSide, fog: true }));
  const geo = (n) => new THREE.PlaneGeometry(1.7, (40 + 22 * n) / 40 * 1.7);
  let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // carteles-banderola a los dos lados de la calle (perpendiculares a la fachada: se leen desde la moto)
  for (let i = 40; i < 260; i += 6) { const sd = (i / 6 | 0) % 2 ? 1 : -1, p = P[i], k = (R() * sign.length) | 0, n = [...sign[k][0]].length, h = (40 + 22 * n) / 40 * 1.7;
    const off = sd * (p.w / 2 + .35 + R() * 1.5), x = p.x + p.nx * off, z = p.z + p.nz * off, y = 3 + R() * 6 + h / 2;
    const m = new THREE.Mesh(geo(n), mats[k]); m.position.set(x, y, z); m.rotation.y = Math.atan2(p.nx, p.nz) + Math.PI / 2; scene.add(m); }
  // semáforos en el agua (poste + brazo + caja con tres luces), uno a cada lado de la plaza de salida
  const sem = (i, sd, rojo) => { const p = P[i], off = sd * (p.w / 2 - 2.2), x = p.x + p.nx * off, z = p.z + p.nz * off, yaw = Math.atan2(p.tx, p.tz); const g = new THREE.Group();
    const poste = new THREE.Mesh(new THREE.BoxGeometry(.28, 7.5, .28), new THREE.MeshLambertMaterial({ color: '#2b3a35' })); poste.position.y = 3.2; g.add(poste);
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(.2, .2, 3.2), new THREE.MeshLambertMaterial({ color: '#2b3a35' })); brazo.position.set(0, 7.1, -sd * 1.5); g.add(brazo);
    const caja = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.5, .6), new THREE.MeshLambertMaterial({ color: '#1d2a2c' })); caja.position.set(0, 6.75, -sd * 3.0); g.add(caja);
    for (const [k, c] of [['#ff3b2f', 1], ['#3a3a30', 0], ['#2a5a3a', 0]].map((a, j) => [a[0], j])) { const l = new THREE.Mesh(new THREE.BoxGeometry(.52, .34, .34), new THREE.MeshBasicMaterial({ color: c === (rojo ? 0 : 2) ? ['#ff3b2f', '#3a3a30', '#2fd070'][c] : '#1b1b18' })); l.position.set(0, 7.2 - c * .45, -sd * 3.0 + .3); g.add(l); }
    g.position.set(x, -.4, z); g.rotation.y = yaw; scene.add(g); };
  { const ld3 = new THREE.TextureLoader(); for (const [i, sd, n, h] of [[156, -1, 'arboles_04', 10], [154, 1, 'arboles_06', 11]]) { const t = ld3.load('art/' + n + '.png'); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; const mt2 = new THREE.MeshLambertMaterial({ map: t, alphaTest: .45, side: THREE.DoubleSide, emissive: '#6a8a3a' }); const pp = P[i], off = sd * (pp.w / 2 - .4); for (const rot of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(h * 1.2, h), mt2); m.position.set(pp.x + pp.nx * off, h / 2 - .6, pp.z + pp.nz * off); m.rotation.y = rot + Math.atan2(pp.nx, pp.nz); scene.add(m); } } }
  sem(122, 1, true); sem(126, -1, false);
  // pájaros (gaviotas) cruzando el cielo sobre la plaza
  { const ld2 = new THREE.TextureLoader(); const bm = ['pajaros_01','pajaros_02','pajaros_03'].map(n => { const t = ld2.load('art/' + n + '.png'); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .4, side: THREE.DoubleSide, fog: false }); });
    const pj = []; for (let k = 0; k < 7; k++) { const p = P[132 + k * 5], m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), bm[k % 3]); m.userData.b = { p, k }; scene.add(m); pj.push(m); }
    scene.userData.pajaros = (t, cam) => { for (const m of pj) { const { p, k } = m.userData.b; const a = t * .35 + k * 1.7; m.position.set(p.x + p.nx * (8 * Math.sin(a) + (k % 2 ? 10 : -10)), 28 + 6 * Math.sin(a * 1.3 + k) + k * 2, p.z + p.nz * (8 * Math.sin(a)) + Math.cos(a) * 14); m.lookAt(cam.position.x, m.position.y, cam.position.z); } }; }
  // lianas colgando de las fachadas altas (cortinas de tarjetas con el arte pixel de lianas)
  const ld = new THREE.TextureLoader(), lm = ['lianas_01', 'lianas_02', 'lianas_03', 'lianas_04'].map(n => { const t = ld.load('art/' + n + '.png'); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return new THREE.MeshLambertMaterial({ map: t, alphaTest: .45, side: THREE.DoubleSide, emissive: '#2a3a22' }); });
  for (let i = 30; i < 270; i += 5) { const sd = (i / 5 | 0) % 2 ? 1 : -1, p = P[i], k = (R() * 3) | 0, h = 11 + R() * 9, off = sd * (p.w / 2 + .5);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(h * (k === 0 ? .46 : .6), h), lm[k]); m.position.set(p.x + p.nx * off, 7 + h / 2 + R() * 6, p.z + p.nz * off); m.rotation.y = Math.atan2(p.nx, p.nz); scene.add(m); }
}
