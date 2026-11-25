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
      void main(){
        vec3 d = normalize(vD); float y = d.y;
        // cielo limpio: degradado suave sin texturas (azul profundo arriba, más claro hacia el horizonte)
        vec3 col = mix(cHor, cMid, smoothstep(0., .25, y)); col = mix(col, cTop, smoothstep(.25, .85, y));
        // nubes grandes SOLO a los lados (a lo largo del canal se ve cielo limpio): cúmulos de base plana, tope blanco y sombra azul clara
        float az = atan(d.z, d.x);                                   // ángulo horizontal
        float lado = .30 + .70 * smoothstep(.08, .42, abs(d.x) / max(.001, length(d.xz)));    // 0 mirando a lo largo del canal, 1 mirando hacia los lados
        float deriva = uT*.004;
        vec2 u = vec2(az*3. + deriva, y*2.6);
        vec2 up = floor(u*vec2(26., 30.))/vec2(26., 30.);               // píxel de nube
        float nb = fbm(up*vec2(2.2, 3.4) + vec2(3., 0.)), nc = fbm(vec2(up.x*1.1 + deriva*.5, 5.));
        float base = .20, alto = lado * (.34 + .55*nc);               // altura del cúmulo según la columna
        float borde = (nb - .5) * .22;
        float masa = step(base, y) * step(y, base + alto + borde) * step(.05, lado);
        if (y > .01 && masa > .5) {
          float tt = (y - base) / max(.05, alto + borde);               // 0 = base, 1 = tope
          vec3 c = vec3(1.);
          if (tt < .62) c = vec3(.72, .87, .98);
          if (tt < .32) c = vec3(.54, .77, .95);
          float luz = fbm(up*vec2(5., 7.) + vec2(1.7, 4.)) ;
          if (tt > .55 && luz > .62) c = vec3(.80, .92, 1.);            // moteado de sombra dentro de la masa blanca
          if (tt < .14) c = vec3(.44, .69, .92);                        // vientre
          col = c;
        }
        float sd = dot(d, uSol); col += cSolC * (step(.9955, sd)*.9 + step(.975, sd)*.12 + pow(max(sd, 0.), 24.)*.10);   // sol y su halo (según la hora)
        // un par de nubes sueltas y pequeñas, también a los lados
        float suelta = step(.78, fbm(floor(u*vec2(18., 22.))/vec2(18., 22.)*vec2(3., 4.) + 9.)) * lado * step(.50, y) * step(y, .78);
        if (suelta > .5) col = mix(col, vec3(1.), .95);
        col = mix(col, cNie, smoothstep(.07, -.02, y));            // bruma baja del horizonte
        gl_FragColor = vec4(col*uTinte, 1.);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), mat); mesh.scale.setScalar(600); mesh.renderOrder = -10; mesh.frustumCulled = false;
  return { mesh, update(cam, t) { mesh.position.copy(cam.position); mat.uniforms.uT.value = t; mat.uniforms.uCam.value.set(cam.position.x, cam.position.z); } };
}
