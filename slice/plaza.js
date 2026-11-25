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

export function vestir(THREE, scene, P) {
  let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647; void R;
  { const ld2 = new THREE.TextureLoader(); const bm = ['pajaros_01','pajaros_02','pajaros_03'].map(n => { const t = ld2.load('art/' + n + '.png'); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .4, side: THREE.DoubleSide, fog: false }); });
    const pj = []; for (let k = 0; k < 7; k++) { const p = P[132 + k * 5], m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4), bm[k % 3]); m.userData.b = { p, k }; scene.add(m); pj.push(m); }
    scene.userData.pajaros = (t, cam) => { for (const m of pj) { const { p, k } = m.userData.b; const a = t * .35 + k * 1.7; m.position.set(p.x + p.nx * (8 * Math.sin(a) + (k % 2 ? 10 : -10)), 28 + 6 * Math.sin(a * 1.3 + k) + k * 2, p.z + p.nz * (8 * Math.sin(a)) + Math.cos(a) * 14); m.lookAt(cam.position.x, m.position.y, cam.position.z); } }; }
}
