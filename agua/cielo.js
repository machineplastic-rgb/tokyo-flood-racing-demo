// Cielo propio (shader): degradado de 3 colores, sol con halo en bandas y nubes pixel en 2 capas que derivan y hacen parallax con la moto.
// Una cúpula que sigue a la cámara; coste: 1 llamada de dibujo, sin texturas.
export function crearCielo(THREE, H, solPos) {
  const sd = solPos.clone().normalize();
  const mat = new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false, fog: false, side: THREE.BackSide,
    uniforms: { uT: { value: 0 }, uCam: { value: new THREE.Vector2() }, uSol: { value: sd },
      cTop: { value: new THREE.Color(H.cielo[0]) }, cMid: { value: new THREE.Color(H.cielo[1]) }, cHor: { value: new THREE.Color(H.cielo[2]) }, cNie: { value: new THREE.Color(H.niebla) },
      cSolC: { value: new THREE.Color(H.sol[0]) }, uTinte: { value: new THREE.Color(H.tinte || '#ffffff') } },
    vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position.z = gl_Position.w * .9999; }`,
    fragmentShader: `varying vec3 vD; uniform float uT; uniform vec2 uCam; uniform vec3 uSol, cTop, cMid, cHor, cNie, cSolC, uTinte;
      float h(vec2 p){ p = fract(p*vec2(127.1, 311.7)); p += dot(p, p + 34.5); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a*vn(p); p = p*2.03 + 7.1; a *= .5; } return s; }
      // una capa de nubes: p = coordenadas del plano de nubes, cov = cobertura (más alto = menos nubes)
      vec4 nubes(vec2 p, float cell, float cov, vec2 sdir){
        p = floor(p*cell)/cell;                                     // píxel de nube
        float n = fbm(p);
        if (n < cov) return vec4(0.);
        float edge = n - cov, sh = fbm(p + sdir*.22) - n;           // sombra: densidad hacia el sol
        vec3 c = vec3(.97, 1., 1.);
        if (sh > .018) c = vec3(.78, .88, .96);
        if (sh > .060) c = vec3(.58, .74, .88);
        if (edge < .035 && sh < .02) c = mix(c, vec3(1., .96, .84), .8);   // borde iluminado por el sol
        return vec4(c, 1.);
      }
      void main(){
        vec3 d = normalize(vD); float y = d.y;
        vec3 col = y > .35 ? mix(cMid, cTop, smoothstep(.35, .95, y)) : mix(cHor, cMid, smoothstep(0., .35, y));
        float bandas = floor(y*14.)/14.; col = mix(col, y > .35 ? mix(cMid, cTop, smoothstep(.35, .95, bandas)) : mix(cHor, cMid, smoothstep(0., .35, bandas)), .85);   // degradado "a escalones"
        // sol: disco + dos halos en bandas
        float s = dot(d, uSol);
        col += cSolC * (step(.9905, s)*1.4 + step(.975, s)*.22 + step(.93, s)*.10);
        // nubes: capa lejana (pequeña, lenta) y cercana (grande, rápida); parallax con la posición de la moto
        vec2 sdir = normalize(uSol.xz + vec2(.001));
        if (y > .02) {
          float k = 1./(y + .14);
          vec2 p2 = d.xz*k*6. + vec2(uT*.010, uT*.004) + uCam*.0015;
          vec4 n2 = nubes(p2, 13., .49, sdir);
          col = mix(col, n2.rgb, n2.a*smoothstep(.02, .14, y));
          vec2 p1 = d.xz*k*3.2 + vec2(uT*.022, uT*.007) + vec2(30., 11.) + uCam*.004;
          vec4 n1 = nubes(p1, 9., .52, sdir);
          col = mix(col, n1.rgb, n1.a*smoothstep(.03, .18, y));
        }
        col = mix(col, cNie, smoothstep(.07, -.02, y));            // bruma baja del horizonte
        gl_FragColor = vec4(col*uTinte, 1.);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), mat); mesh.scale.setScalar(600); mesh.renderOrder = -10; mesh.frustumCulled = false;
  return { mesh, update(cam, t) { mesh.position.copy(cam.position); mat.uniforms.uT.value = t; mat.uniforms.uCam.value.set(cam.position.x, cam.position.z); } };
}
