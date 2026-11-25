// Agua propia (shader): pixelada, translúcida, con cáusticas, espuma en muros/islote y estela de la moto.
// Todo en el shader: sin texturas ni vídeo. Coordenadas locales: x = a través, z = a lo largo del canal (LEN = 218 m, en bucle).
export function crearAgua(THREE, { LEN, huecosN, huecosS, W0, W1 }) {
  const hN = huecosN.map(([a, b]) => new THREE.Vector2(a, b)), hS = huecosS.map(([a, b]) => new THREE.Vector2(a, b));
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uT: { value: 0 }, uSolX: { value: -.45 }, uTinte: { value: new THREE.Color('#ffffff') },
    uMoto: { value: new THREE.Vector4(0, 0, 0, 1) }, uVel: { value: 0 },
    uHN: { value: hN }, uHS: { value: hS },
    cHondo: { value: new THREE.Color('#12b6d2') }, cMedio: { value: new THREE.Color('#3dd3de') }, cClaro: { value: new THREE.Color('#a6f5ee') }, cBlanco: { value: new THREE.Color('#f4fffb') },
  }]);
  const mat = new THREE.ShaderMaterial({
    uniforms: u, fog: true, transparent: true, depthWrite: false,
    vertexShader: `#include <fog_pars_vertex>
      varying vec3 vL, vW;
      void main(){ vL = position; vW = (modelMatrix * vec4(position,1.)).xyz; vec4 mvPosition = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `#include <fog_pars_fragment>
      varying vec3 vL, vW;
      uniform float uT, uVel, uSolX; uniform vec3 uTinte, cHondo, cMedio, cClaro, cBlanco; uniform vec4 uMoto; uniform vec2 uHN[${hN.length}], uHS[${hS.length}];
      const float LEN = ${LEN.toFixed(1)}, A = ${W0.toFixed(1)}, B = ${W1.toFixed(1)};
      float hw(float z){ z = mod(z, LEN); if (z < 142.) return A; if (z < 156.) return A + (B-A)*smoothstep(0.,1.,(z-142.)/14.); if (z < 180.) return B; if (z < 194.) return B - (B-A)*smoothstep(0.,1.,(z-180.)/14.); return A; }
      float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      // cáustica: líneas finas donde un campo de senos deformado cruza por cero (dos capas)
      float caust(vec2 p, float t){
        vec2 w = p + .55*vec2(sin(p.y*1.1 + t), cos(p.x*.9 - t*.8)); w += .35*vec2(sin(w.y*2.3 - t*1.2 + 1.), cos(w.x*2.1 + t));
        float f1 = sin(w.x*1.5 + w.y*.8) + sin(w.y*1.7 - w.x*.6 + t*.5);
        float f2 = sin(w.x*.9 - w.y*1.4 - t*.4) + sin(w.y*1.1 + w.x*1.3);
        float m = min(abs(f1), abs(f2)); return 1. - smoothstep(0., .5, m);
      }
      bool enHueco(float z, float side){ for (int k = 0; k < ${hN.length}; k++) if (side < 0. && z > uHN[k].x - 1. && z < uHN[k].y + 1.) return true;
        for (int k = 0; k < ${hS.length}; k++) if (side > 0. && z > uHS[k].x - 1. && z < uHS[k].y + 1.) return true; return false; }
      void main(){
        float t = floor(uT*5.)/5. * .30;                 // agua tranquila: 5 pasos por segundo y a un tercio de velocidad
        vec2 q = floor(vL.xz/.1)*.1;                      // píxel de agua = 10 cm
        float tl = floor(uT*2.)/2. * .35;
        float z0 = vL.z, x0 = vL.x;
        // sombra de los edificios del lado del sol: banda de borde escalonado que se adentra en el canal
        float xq = floor(x0/.25)*.25; float ds = uSolX < 0. ? xq + hw(z0) : hw(z0) - xq;       // distancia al muro que tapa el sol (depende de la hora)
        float sw = (1.2 + 9.*abs(uSolX)) * (.85 + .18*sin(floor(z0/.5)*.5*.13) + .12*step(.55, h21(vec2(floor(z0/3.), 7.))));
        bool sombra = ds < sw && ds > -.5;
        float bl = sin(q.x*.40 + tl*.5 + sin(q.y*.55 - tl*.4)*1.7) * sin(q.y*.32 + tl*.35 + sin(q.x*.5 + tl*.3)*1.5);
        float cs = caust(q*.6, t);
        vec3 col = cHondo; float a = .60;
        if (bl > -.15) { col = cMedio; a = .54; }
        if (bl > .45) { col = mix(cMedio, cClaro, .5); a = .48; }
        if (sombra) { col *= vec3(.55, .70, .78); a += .26; cs *= .55; }       // en sombra: más oscura y casi opaca (no se ve el fondo), cáusticas apagadas
        if (cs > .80) { col = sombra ? cMedio : cClaro; a = sombra ? .5 : .30; }
        if (cs > .975) { col = cBlanco; a = .62; }
        // espuma: contra las fachadas (no en los callejones abiertos), alrededor del islote y en la estela de la moto
        float z = vL.z, x = vL.x, foam = 0., wet = 0.;
        float d = hw(z) - abs(x); bool abierto = enHueco(z, sign(x));
        if (!abierto && d > -.2) {
          float n = h21(floor(vec2(z*5., x*5.)) + floor(t*3.));
          float onda = .5 + .5*sin(t*2.2 + z*.85 + sin(z*.31 + t)*2.);
          float w1 = .45 + .55*onda;                      // franja pegada al muro que va y viene
          foam += step(d, w1);
          float w2 = 1.5 + .45*sin(t*1.5 + z*.5 + 1.3);     // segunda línea rota que se desprende
          foam += step(abs(d - w2), .13) * step(.42, n);
          foam += step(abs(d - (w2 + .7)), .07) * step(.72, h21(floor(vec2(z*4., x*4.)) + floor(t*2.)));
          wet = smoothstep(2.4, 0., d);
        }
        float di = length(vec2(x - 1., z - 168.)) - 4.8;      // islote
        if (di < 2.5) { float n = h21(floor(vec2(z*5., x*5.)) + floor(t*3.)); float onda = .5 + .5*sin(t*2. + atan(z-168., x-1.)*6.);
          foam += step(di, .25 + .3*onda) + step(abs(di - (1. + .3*onda)), .09) * step(.4, n); wet = max(wet, smoothstep(2.5, 0., di)); }
        // estela: V que sale de la moto hacia atrás, rota en píxeles
        vec2 dm = vec2(x - uMoto.x, mod(z - uMoto.y + LEN*.5, LEN) - LEN*.5);
        vec2 fw = uMoto.zw; vec2 lat = vec2(-fw.y, fw.x);   // (fw = dirección de la moto en x,z)
        float atras = -dot(dm, fw), lado = abs(dot(dm, lat)); float v = clamp(uVel/18., 0., 1.);
        if (atras > .8 && atras < 13. && v > .05) { float ab = .45 + atras*.2; float borde = abs(lado - ab);
          float n = h21(floor(vec2(z*5., x*5.)) + floor(uT*8.));
          foam += step(borde, .13 + .05*v) * step(.30 + atras*.03, n) * step(atras, 4. + 9.*v) + step(lado, .38) * step(atras, 2.5 + 3.*v) * step(.4, n); }
        col = mix(col, cClaro, wet*.45*step(.5, 1.-foam));
        { vec3 V = normalize(cameraPosition - vW); float fr = pow(1. - clamp(V.y, 0., 1.), 3.);   // a ras de agua refleja el cielo: lejos más clara y opaca
          col = mix(col, vec3(.62, .86, .98), fr*.65); a += fr*.35; }
        if (foam > .5) { col = cBlanco; a = .97; }
        col *= uTinte; a = clamp(a, 0., 1.);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  return { mat, u };
}

// Espuma que sube por la fachada en la línea de flotación (una tira de 0,9 m a cada lado del canal) con chorreos. Sin huecos de callejón.
export function crearEspumaMuro(THREE, { LEN, hw, huecosN, huecosS }) {
  const pos = [], uv = [], idx = []; let n = 0; const H0 = -.35, H1 = .75;
  const en = (z, lista) => lista.some(([a, b]) => z > a - 1 && z < b + 1);
  for (const s of [-1, 1]) for (let z = 0; z < LEN; z += 1) {
    if (en(z + .5, s < 0 ? huecosN : huecosS)) continue;
    const a = hw(z) - .03, b = hw(z + 1) - .03;
    pos.push(s * a, H0, z, s * b, H0, z + 1, s * b, H1, z + 1, s * a, H1, z); uv.push(z, 0, z + 1, 0, z + 1, 1, z, 1); idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uT: { value: 0 }, uHit: { value: new THREE.Vector3(0, -100, 0) }, uTinte: { value: new THREE.Color('#ffffff') }, cEsp: { value: new THREE.Color('#f4fffb') }, cSom: { value: new THREE.Color('#8fe0dc') } }]);
  const mat = new THREE.ShaderMaterial({ uniforms: u, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `#include <fog_pars_vertex>
      varying vec2 vU; varying float vS;
      void main(){ vU = uv; vS = sign(position.x); vec4 mvPosition = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `#include <fog_pars_fragment>
      varying vec2 vU; varying float vS; uniform float uT; uniform vec3 uTinte, cEsp, cSom, uHit;
      float h(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
      void main(){
        float t = floor(uT*5.)/5. * .30; vec2 q = vec2(floor(vU.x*8.)/8., floor(vU.y*10.)/10.);       // píxeles de 12 cm x 11 cm
        float onda = .5 + .5*sin(t*2.2 + q.x*.85 + sin(q.x*.31 + t)*2.);
        float dz = mod(q.x - uHit.x + 109., 218.) - 109.; float bo = (vS * uHit.z > 0. ? 1. : 0.) * exp(-dz*dz/9.) * max(0., 1. - (uT - uHit.y)/1.4);   // golpe de la moto: la espuma salta
        float top = .42 + .22*onda + bo*.55;                                                              // altura de la lengua de espuma (0..1)
        float gota = step(.80, h(vec2(floor(q.x*1.5), 3.))) * (.35 + .5*h(vec2(floor(q.x*1.5), floor(t*2.)))) + bo*.5;   // chorreos que cuelgan
        float f = step(q.y, top) + step(q.y, top + gota) * step(top, q.y);
        float punta = step(.55, h(q*7. + floor(t*3.))) * step(q.y, top + .22) * step(top, q.y);  // salpicaduras sueltas arriba
        float onda2 = step(abs(q.y - (top*.5)), .05) * step(.35, h(q*5. + floor(t*2.)));         // veta interior
        if (f + punta < .5) discard;
        vec3 col = cEsp; if (onda2 > .5 || q.y < .08) col = cSom;
        gl_FragColor = vec4(col*uTinte, .96);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  return { mesh: new THREE.Mesh(g, mat), u };
}
