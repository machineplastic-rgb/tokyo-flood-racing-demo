// Agua del tramo: red de celdas cian, sombras del mapa horneado, espuma pegada a los muros (distancia del mapa), estela y sombra de la moto, reflejo del cielo.
export function crearAguaMapa(THREE) {
  const u = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uT: { value: 0 }, uVel: { value: 0 }, uTinte: { value: new THREE.Color('#ffffff') }, uMoto: { value: new THREE.Vector4(0, 0, 0, 1) },
    uSh: { value: null }, uBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uSol: { value: new THREE.Vector3(-.36, .89, .28).normalize() },
    cHondo: { value: new THREE.Color('#30c4ee') }, cMedio: { value: new THREE.Color('#4cd4f0') }, cClaro: { value: new THREE.Color('#8af3fe') }, cBlanco: { value: new THREE.Color('#eafdff') },
  }]);
  const mat = new THREE.ShaderMaterial({ uniforms: u, fog: true, transparent: true, depthWrite: false,
    vertexShader: `#include <fog_pars_vertex>
      varying vec3 vW;
      void main(){ vW = (modelMatrix * vec4(position,1.)).xyz; vec4 mvPosition = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
      }`,
    fragmentShader: `#include <fog_pars_fragment>
      varying vec3 vW; uniform sampler2D uSh; uniform vec4 uBox, uMoto; uniform vec3 uSol, uTinte, cHondo, cMedio, cClaro, cBlanco; uniform float uT, uVel;
      float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      float vor(vec2 p, float ph){ vec2 ip = floor(p), fp = fract(p); float d1 = 8., d2 = 8.;
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){ vec2 g = vec2(float(i), float(j)); vec2 o = vec2(h21(ip + g), h21(ip + g + 17.3)); o = .5 + .40*sin(ph + 6.2831*o); vec2 r = g + o - fp; float d = dot(r, r); if (d < d1){ d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
        return sqrt(d2) - sqrt(d1); }
      void main(){
        float t = floor(uT*5.)/5. * .30; vec2 q = floor(vW.xz/.09)*.09; float tl = floor(uT*2.)/2. * .35;
        vec4 m = texture2D(uSh, vec2((q.x - uBox.x)/uBox.z, 1. - (q.y - uBox.y)/uBox.w));
        bool sombra = m.r > .5; float wd = m.g * 3.5;
        float bl = sin(q.x*.90 + tl*.5 + sin(q.y*1.2 - tl*.4)*1.7) * sin(q.y*.70 + tl*.35 + sin(q.x*1.1 + tl*.3)*1.5);
        vec2 dr = vec2(.05, .13) * .3 * floor(uT*5.)/5.;
        float e1 = vor(q*.55 + dr, t*.5), e2 = vor(q*1.15 + dr*1.7 + 11., t*.7 + 2.);
        float cs = 1. - smoothstep(0., .26, e1), cs2 = 1. - smoothstep(0., .17, e2);
        float dist = length(cameraPosition - vW); float fd = 1. - smoothstep(35., 85., dist); cs *= fd; cs2 *= fd;
        vec3 col = cHondo; float a = .80;
        if (bl > -.15) { col = cMedio; a = .76; }
        if (bl > .45) { col = mix(cMedio, cClaro, .4); a = .72; }
        if (sombra) { col = mix(col, vec3(.005, .13, .07)*(.85 + .25*bl), .97); a = max(a + .30, .95); cs *= .85; cs2 *= .6; } else { col *= 1.10; }
        if (cs2 > .55 && !sombra) col = mix(col, cClaro, .30);
        if (cs > .40) { col = sombra ? vec3(.03, .36, .30) : cClaro; a = sombra ? .95 : .70; }
        if (cs > .86) { col = sombra ? vec3(.05, .48, .40) : mix(cClaro, cBlanco, .35); a = sombra ? .95 : .85; }
        // espuma pegada a los muros (distancia horneada)
        float foam = 0., wet = 0.;
        if (wd < 3.4) { float n = h21(floor(q*11.) + floor(t*3.)); float onda = .5 + .5*sin(t*2.2 + q.y*.85 + q.x*.3 + sin(q.y*.31 + t)*2.);
          foam += step(wd, .45 + .55*onda); float w2 = 1.5 + .45*sin(t*1.5 + q.y*.5 + q.x*.4 + 1.3);
          foam += step(abs(wd - w2), .13) * step(.42, n); wet = smoothstep(2.4, 0., wd); }
        // estela de la moto
        vec2 dm = q - uMoto.xy; vec2 fw = uMoto.zw; float atras = -dot(dm, fw), lado = abs(dot(dm, vec2(-fw.y, fw.x))); float v = clamp(uVel/18., 0., 1.);
        if (atras > .8 && atras < 13. && v > .05) { float ab = .45 + atras*.2; float n = h21(floor(q*11.) + floor(uT*8.));
          foam += step(abs(lado - ab), .13 + .05*v) * step(.30 + atras*.03, n) * step(atras, 4. + 9.*v) + step(lado, .38) * step(atras, 2.5 + 3.*v) * step(.4, n); }
        col = mix(col, cClaro, wet*.45*step(.5, 1. - foam));
        if (foam > .5) { col = cBlanco; a = .97; }
        // sombra de la moto (velo translúcido)
        if (!sombra) { vec2 sd = -uSol.xz / uSol.y; vec2 mc = uMoto.xy + sd*1.2; vec2 d2 = q - mc; float al = dot(d2, fw), la = dot(d2, vec2(-fw.y, fw.x)); col = mix(col, col*vec3(.46, .66, .78), .9*step(al*al/4.4 + la*la/.8, 1.)); }
        { vec3 V = normalize(cameraPosition - vW); float fr = pow(1. - clamp(V.y, 0., 1.), 3.); col = mix(col, vec3(.62, .86, .98), fr*(sombra ? .22 : .40)); a += fr*.25; }
        col *= uTinte; a = clamp(a, 0., 1.);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }` });
  return { mat, u };
}
