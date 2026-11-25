// Vestido de la plaza y las fachadas (pixel + Tokyo Genso): shader de fachada para TODA la ciudad opaca, carteles verticales inventados, semáforos y lianas.
// Sin marcas reales: rótulos genéricos en japonés ("薬", "居酒屋", "渋谷駅" = nombres comunes, sin logotipos).

// ---- 1) fachada procedural en el material de la ciudad (ventanas, juntas de azulejo, musgo, enredaderas, oclusión al pie)
export function fachada(THREE, mat, uSun) {
  // atlas único de fachadas (1 sola unidad de textura): vidrio y panel de Shibuya, tiras altas, tienda y piezas de la hoja 1
  const NOMS = ['g_1','g_2','g_3','g_4','g_5','g_6','t_1','t_2','t_3','t_4','f_balcones','f_ladrillo','f_bandas','f_rotulos','f_azulejo','f_cristal'];
  const AT = 1024, cv = document.createElement('canvas'); cv.width = cv.height = AT; const cg = cv.getContext('2d');
  const atlas = new THREE.CanvasTexture(cv); atlas.flipY = false; atlas.magFilter = atlas.minFilter = THREE.NearestFilter; atlas.generateMipmaps = false; atlas.colorSpace = THREE.SRGBColorSpace;
  const rects = Array.from({ length: 24 }, () => new THREE.Vector4(0, 0, 0, 0));
  Promise.all(NOMS.map(n => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = 'fach/' + n + '.png'; }))).then(ims => {
    let x = 1, y = 1, fila = 0; ims.forEach((im, i) => { if (!im) return; if (x + im.width + 1 > AT) { x = 1; y += fila + 1; fila = 0; } cg.drawImage(im, x, y); rects[i].set(x, y, im.width, im.height); x += im.width + 1; fila = Math.max(fila, im.height); });
    atlas.needsUpdate = true; });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSun = { value: uSun }; sh.uniforms.tA = { value: atlas }; sh.uniforms.uR = { value: rects };
    sh.vertexShader = 'varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'varying vec3 vWP; varying vec3 vWN; uniform vec3 uSun; uniform sampler2D tA; uniform vec4 uR[24];\n' +
      'vec4 sa(int i, vec2 t){ vec4 r = uR[i]; if (r.z < 1.) return vec4(0.); vec2 f = fract(t); vec2 px = vec2(r.x + min(floor(f.x*r.z), r.z-1.), r.y + min(floor((1.-f.y)*r.w), r.w-1.)) + .5; return texture2D(tA, px/1024.); }\n' +
      `float hs(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hs(i), hs(i+vec2(1.,0.)), f.x), mix(hs(i+vec2(0.,1.)), hs(i+vec2(1.,1.)), f.x), f.y); }\n` +
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
        // Shibuya real: sobre todo vidrio y panel moderno (55 %), torres de hormigón/cristal (20 %), tiendas y piezas bajas (25 %); una pieza por bloque
        float fam = hs(floor(vec2(vWP.x/17., vWP.z/17.)) + 3.), v6 = floor(hs(floor(vec2(vWP.x/19., vWP.z/19.)) + 5.)*6.);
        vec4 ft;
        if (fam < .55) { int gi = int(v6); vec2 gu = (gi == 2) ? vec2(u/16., y/14.) : (gi == 5) ? vec2(u/16., y/15.) : vec2(u/14., y/13.); ft = sa(gi, gu); }
        else if (fam < .75) { int ti = 6 + int(floor(hs(floor(vec2(vWP.x/23., vWP.z/23.)) + 9.)*4.)); ft = sa(ti, vec2(u/6.2, y/22.)); }
        else if (fam < .86) ft = sa(14, vec2(u/9., y/9.));
        else if (fam < .93) ft = sa(12, vec2(u/14., y/13.));
        else ft = sa(10, vec2(u/14., y/13.));
        col = mix(col, ft.rgb * 1.08, wall * ft.a * step(.5, y + 3.4));
        float h = 0.; vec2 f = vec2(0.);
        // sombra propia (cara que no mira al sol)
        float sunl = clamp(dot(n, normalize(uSun)), 0., 1.); col *= mix(.62, 1.14, sunl);
        // vegetación en MASA (Tokyo Genso): manchas verdes enormes que cubren 40-60 % de la fachada, con hoja pixel y huecos
        float nz1 = vn2(vec2(u*.11, y*.09) + bid*7.), nz2 = vn2(vec2(u*.42, y*.30) + 3.);
        float dens = nz1*.62 + nz2*.38;
        float umbral = .50 - .10*smoothstep(0., 30., y) + .16*step(.5, hs(floor(vec2(vWP.x/21., vWP.z/21.)) + 2.)) ;   // algunos bloques casi cubiertos, otros menos
        float cub = step(umbral, dens) * smoothstep(-3.4, 1., y);
        float hoja = hs(q*vec2(1.7, 1.9) + 4.);
        vec3 vv = hoja < .30 ? vec3(.10,.42,.13) : hoja < .62 ? vec3(.20,.62,.16) : hoja < .88 ? vec3(.44,.80,.22) : vec3(.72,.92,.35);
        float hueco = step(.90, hs(q*2.3 + 11.));
        col = mix(col, vv, wall * cub * (1. - hueco*.7) * .97);
        // cortinas colgando desde la azotea no se pueden saber aquí; se pone verde extra en la base (musgo húmedo)
        col = mix(col, vec3(.14,.32,.17), wall * smoothstep(1.4, .0, y) * .75);
        col *= 1. - .30*wall*smoothstep(3., .0, y);                             // oclusión al pie
        diffuseColor.rgb = mix(diffuseColor.rgb, col, wall + .0) ;
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.05,1.0,.9)*1.12, 1. - wall);   // azoteas: algo más cálidas
      }`);
  };
  mat.needsUpdate = true; return mat;
}

export function vestir(THREE, scene, P) {
  let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647; void R;
  { const ld2 = new THREE.TextureLoader(); const bm = ['pajaros_01','pajaros_02','pajaros_03'].map(n => { const t = ld2.load('art/' + n + '.png'); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .4, side: THREE.DoubleSide, fog: false }); });
    const pj = []; for (let k = 0; k < 7; k++) { const p = P[132 + k * 5], m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), bm[k % 3]); m.userData.b = { p, k }; scene.add(m); pj.push(m); }
    scene.userData.pajaros = (t, cam) => { for (const m of pj) { const { p, k } = m.userData.b; const a = t * .35 + k * 1.7; m.position.set(p.x + p.nx * (8 * Math.sin(a) + (k % 2 ? 10 : -10)), 28 + 6 * Math.sin(a * 1.3 + k) + k * 2, p.z + p.nz * (8 * Math.sin(a)) + Math.cos(a) * 14); m.lookAt(cam.position.x, m.position.y, cam.position.z); } }; }
}
