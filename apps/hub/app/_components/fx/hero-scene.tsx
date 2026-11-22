"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// THE HERO'S 3D SCENE: the Altair star as a block of refractive glass with a thin gold ring, set on the
// page's own near-white with a few soft pastel shapes behind it (champagne, sky, blush) so the glass has
// something calm to bend. Light and quiet: one transmission material, DPR capped at 1.5, and nothing renders
// while the hero is off screen or the tab is hidden.

const PAGE_BG = "#fbfaf8";

const FIELD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
// Written without tone mapping or colour-space conversion on purpose: the base colour is exactly the page's
// background, so the canvas has no visible edge.
const FIELD_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uAspect;
uniform vec2 uFocus;
float disc(vec2 p, vec2 c, float r, float soft) { float d = length((p - c) * uAspect); return 1.0 - smoothstep(r - soft, r + soft, d); }
void main() {
  vec2 p = vUv;
  vec2 f = uFocus;
  float t = uTime * 0.12;
  vec3 col = vec3(0.984, 0.980, 0.973);
  col = mix(col, vec3(0.937, 0.871, 0.757), 0.92 * disc(p, f + vec2(0.035 + 0.006 * sin(t), 0.035), 0.12, 0.035));
  col = mix(col, vec3(0.812, 0.882, 0.925), 0.95 * disc(p, f + vec2(-0.06, -0.05 + 0.005 * cos(t * 1.3)), 0.07, 0.02));
  col = mix(col, vec3(0.949, 0.851, 0.820), 0.92 * disc(p, f + vec2(0.085, -0.085), 0.042, 0.012));
  col = mix(col, vec3(0.871, 0.776, 0.612), 0.9 * disc(p, f + vec2(-0.03, 0.13), 0.016, 0.005));
  gl_FragColor = vec4(col, 1.0);
}
`;

function LightField({ focus }: { focus: THREE.Vector2 }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uAspect: { value: new THREE.Vector2(1, 1) }, uFocus: { value: new THREE.Vector2(0.5, 0.5) } }), []);
  useFrame((_, dt) => {
    if (!mat.current) return;
    const u = mat.current.uniforms;
    u.uTime!.value += dt;
    u.uAspect!.value.set(Math.max(1, viewport.aspect), Math.max(1, 1 / viewport.aspect));
    u.uFocus!.value.copy(focus);
  });
  return (
    <mesh position={[0, 0, -6]} scale={[viewport.width * 2.4, viewport.height * 2.4, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={mat} vertexShader={FIELD_VERT} fragmentShader={FIELD_FRAG} uniforms={uniforms} depthWrite={false} />
    </mesh>
  );
}

/** The four-point star of the Altair logo (concave sides), extruded and bevelled. */
function useStarGeometry(lite: boolean) {
  return useMemo(() => {
    const r = 1;
    const k = 0.12;
    const s = new THREE.Shape();
    s.moveTo(0, r);
    s.quadraticCurveTo(k, k, r, 0);
    s.quadraticCurveTo(k, -k, 0, -r);
    s.quadraticCurveTo(-k, -k, -r, 0);
    s.quadraticCurveTo(-k, k, 0, r);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.06, bevelSegments: lite ? 6 : 10, curveSegments: lite ? 32 : 56 });
    g.center();
    g.computeVertexNormals();
    return g;
  }, [lite]);
}

function Scene({ lite }: { lite: boolean }) {
  const group = useRef<THREE.Group>(null);
  const star = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const geometry = useStarGeometry(lite);
  const { viewport } = useThree();
  const narrow = viewport.aspect < 1.05;
  const base = narrow ? new THREE.Vector3(0, viewport.height * 0.23, 0) : new THREE.Vector3(viewport.width * 0.3, 0.05, 0);
  const scale = narrow ? Math.min(0.8, viewport.width * 0.24) : Math.min(1.1, viewport.height * 0.215);
  // Where the star sits on the backdrop plane (the plane is 2.4 viewports wide, 2 of them visible).
  const focus = useMemo(() => new THREE.Vector2(0.5 + (base.x / viewport.width) / 1.2, 0.5 + (base.y / viewport.height) / 1.2), [base.x, base.y, viewport.width, viewport.height]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const scroll = Math.min(1.4, window.scrollY / Math.max(1, window.innerHeight));
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.3 + scroll * 1.1, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.18 + scroll * 0.2, 3, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, base.y + scroll * viewport.height * 0.2, 4, dt);
    g.position.x = THREE.MathUtils.damp(g.position.x, base.x, 4, dt);
    if (star.current) star.current.rotation.z += dt * 0.06;
    if (ring.current) ring.current.rotation.z -= dt * 0.1;
  });

  return (
    <>
      <LightField focus={focus} />
      <group ref={group} position={base.toArray()}>
        <Float speed={1.1} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh ref={star} geometry={geometry} scale={scale}>
            <MeshTransmissionMaterial
              samples={lite ? 3 : 5}
              resolution={lite ? 256 : 512}
              backside={false}
              thickness={0.9}
              roughness={0.03}
              transmission={1}
              ior={1.55}
              chromaticAberration={0.12}
              anisotropy={0.15}
              distortion={0.14}
              distortionScale={0.3}
              temporalDistortion={0}
              iridescence={0.6}
              iridescenceIOR={1.25}
              iridescenceThicknessRange={[120, 480]}
              clearcoat={1}
              clearcoatRoughness={0.03}
              envMapIntensity={1.6}
              attenuationDistance={2.4}
              attenuationColor="#f0e2c8"
              color="#fbf7ef"
            />
          </mesh>
          <mesh ref={ring} scale={scale * 1.24} rotation={[1.25, 0.3, 0]}>
            <torusGeometry args={[1, 0.011, 16, lite ? 120 : 180]} />
            <meshStandardMaterial color="#d6b06a" metalness={1} roughness={0.25} envMapIntensity={1.2} />
          </mesh>
        </Float>
        <Float speed={1.3} floatIntensity={0.7} rotationIntensity={0}>
          <mesh position={[-scale * 1.05, -scale * 0.95, 0.4]} scale={scale * 0.2}>
            <sphereGeometry args={[1, 40, 40]} />
            <meshStandardMaterial color="#ead7bd" roughness={0.55} metalness={0} />
          </mesh>
        </Float>
        <Float speed={1.6} floatIntensity={0.9} rotationIntensity={0}>
          <mesh position={[scale * 1.2, scale * 0.95, -0.5]} scale={scale * 0.1}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0} />
          </mesh>
        </Float>
      </group>
      <Environment resolution={lite ? 64 : 128} frames={1}>
        <Lightformer form="rect" intensity={3.2} color="#fff6e6" position={[3, 4, 3]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[-3, 3, 4]} scale={[2, 5, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#dbe9f0" position={[-5, -1, 2]} scale={[3, 6, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#e9c98f" position={[0, 0, -4]} scale={4} />
      </Environment>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.3} color="#fff4e0" />
    </>
  );
}

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [shown, setShown] = useState(true);
  const [lite, setLite] = useState(false);
  useEffect(() => {
    setLite(window.matchMedia("(max-width: 820px), (pointer: coarse)").matches);
    const onVis = () => setShown(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    const el = host.current;
    const io = el ? new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting), { rootMargin: "80px" }) : null;
    if (el && io) io.observe(el);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, []);
  return (
    <div ref={host} className="h-hero3d-canvas" aria-hidden="true">
      <Canvas
        frameloop={onScreen && shown ? "always" : "never"}
        dpr={lite ? [1, 1.25] : [1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 35 }}
        gl={{ antialias: !lite, powerPreference: "high-performance", alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor(PAGE_BG);
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <Scene lite={lite} />
      </Canvas>
    </div>
  );
}
