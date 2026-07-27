/**
 * SceneEngine.jsx
 * ──────────────────────────────────────────────────────────────
 * Full-viewport WebGL background that persists across all routes.
 * Each sector has its own distinct animated 3D scene.
 * Transition = glitch burst + chromatic aberration spike.
 * ──────────────────────────────────────────────────────────────
 */
import React, {
  useRef, useMemo, useState, useEffect, useCallback, Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, MeshDistortMaterial, Sphere } from '@react-three/drei';
import {
  EffectComposer, Bloom, Glitch, ChromaticAberration, Noise, Vignette,
} from '@react-three/postprocessing';
import { GlitchMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';

/* ── Colour palette per scene type ───────────────────────────── */
const SCENE_CONFIGS = {
  // scene type → lights + objects description
  nebula:      { bg: '#03050a', fog: 0.04 },
  tech:        { bg: '#010812', fog: 0.05 },
  geo:         { bg: '#080500', fog: 0.04 },
  finance:     { bg: '#010a05', fog: 0.05 },
  science:     { bg: '#000a0d', fog: 0.04 },
  space:       { bg: '#030208', fog: 0.03 },
  defense:     { bg: '#050508', fog: 0.06 },
  health:      { bg: '#0a0303', fog: 0.05 },
  startups:    { bg: '#080400', fog: 0.05 },
  crypto:      { bg: '#080700', fog: 0.04 },
  sports:      { bg: '#050008', fog: 0.04 },
  entertain:   { bg: '#080003', fog: 0.05 },
  environment: { bg: '#030802', fog: 0.04 },
  automotive:  { bg: '#000808', fog: 0.05 },
};

/* map sector name → scene type */
const SECTOR_SCENE = {
  AI:            'nebula',
  Tech:          'tech',
  Geopolitics:   'geo',
  Finance:       'finance',
  Science:       'science',
  Space:         'space',
  Defense:       'defense',
  Health:        'health',
  Startups:      'startups',
  Crypto:        'crypto',
  Sports:        'sports',
  Entertainment: 'entertain',
  Environment:   'environment',
  Automotive:    'automotive',
};

/* ── Morphing blob ───────────────────────────────────────────── */
function Blob({ color, position = [0, 0, 0], speed = 1, distort = 0.5, scale = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * speed * 0.3) * 0.5;
      ref.current.rotation.y += 0.003 * speed;
    }
  });
  return (
    <Float speed={speed * 0.7} rotationIntensity={0.3} floatIntensity={0.4} position={position}>
      <mesh ref={ref} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          distort={distort}
          speed={speed * 1.5}
          roughness={0.2}
          metalness={0.3}
          transparent
          opacity={0.75}
        />
      </mesh>
    </Float>
  );
}

/* ── Wireframe torus ring ────────────────────────────────────── */
function WireRing({ color, position = [0, 0, 0], scale = 1, speed = 1 }) {
  const ref = useRef();
  useFrame((s, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.2 * speed;
      ref.current.rotation.y += dt * 0.35 * speed;
    }
  });
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <torusGeometry args={[1.2, 0.04, 16, 80]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} wireframe />
    </mesh>
  );
}

/* ── Icosahedron crystal ─────────────────────────────────────── */
function Crystal({ color, position = [0, 0, 0], scale = 1, speed = 1 }) {
  const ref = useRef();
  useFrame((s, dt) => {
    if (ref.current) {
      ref.current.rotation.x += dt * 0.18 * speed;
      ref.current.rotation.z += dt * 0.22 * speed;
    }
  });
  return (
    <Float speed={speed * 0.5} floatIntensity={0.5} position={position}>
      <mesh ref={ref} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
    </Float>
  );
}

/* ── Floating glass panels ───────────────────────────────────── */
function GlassPanel({ color, position, rotation = [0, 0, 0] }) {
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.3} position={position}>
      <mesh rotation={rotation}>
        <boxGeometry args={[3.5, 2.5, 0.06]} />
        <meshPhysicalMaterial
          color="#060810"
          roughness={0.1}
          metalness={0.6}
          clearcoat={1}
          emissive={color}
          emissiveIntensity={0.08}
          transparent
          opacity={0.3}
        />
      </mesh>
    </Float>
  );
}

/* ── Orbiting dots ───────────────────────────────────────────── */
function OrbitDots({ color, count = 6, radius = 2.5, speed = 1 }) {
  const group = useRef();
  useFrame((s) => {
    if (group.current) group.current.rotation.y = s.clock.elapsedTime * speed * 0.25;
  });
  const dots = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return [Math.cos(angle) * radius, Math.sin(angle * 0.5) * 0.5, Math.sin(angle) * radius];
  }), [count, radius]);
  return (
    <group ref={group}>
      {dots.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Per-sector scene composition ────────────────────────────── */
function SectorScene({ sector, color, glow }) {
  const sceneType = SECTOR_SCENE[sector] || 'nebula';
  const c = color;

  const scenes = {
    nebula: (
      <>
        <Blob color={c} position={[0, 0, -2]} speed={0.8} distort={0.6} scale={1.8} />
        <Blob color={glow} position={[-3.5, 1, -4]} speed={1.3} distort={0.8} scale={1} />
        <Blob color={c} position={[3.5, -1, -5]} speed={0.6} distort={0.4} scale={1.3} />
        <WireRing color={c} position={[0, 0, 0]} scale={1.6} speed={0.7} />
        <OrbitDots color={c} count={8} radius={2.8} speed={0.8} />
        <Sparkles count={160} scale={14} size={2} speed={0.4} opacity={0.7} color={c} />
      </>
    ),
    tech: (
      <>
        <Crystal color={c} position={[0, 0.3, -1]} scale={1.5} speed={0.9} />
        <Crystal color={glow} position={[-3, 1.5, -4]} scale={0.9} speed={1.4} />
        <Crystal color={c} position={[3, -1, -4]} scale={1.1} speed={0.6} />
        <WireRing color={c} position={[0, -0.5, 0]} scale={2} speed={0.5} />
        <WireRing color={glow} position={[0, -0.5, 0]} scale={1.4} speed={-0.8} />
        <GlassPanel color={c} position={[-4, 0, -3]} rotation={[0, 0.4, 0]} />
        <GlassPanel color={c} position={[4, 0, -2]} rotation={[0, -0.4, 0]} />
        <Sparkles count={120} scale={12} size={1.5} speed={0.3} opacity={0.6} color={c} />
      </>
    ),
    geo: (
      <>
        <Blob color={c} position={[0, 0, -3]} speed={0.5} distort={0.3} scale={2.2} />
        <WireRing color={c} position={[0, 0, 0]} scale={2.2} speed={0.4} />
        <WireRing color={glow} position={[0, 0, -1]} scale={1.4} speed={0.9} />
        <OrbitDots color={c} count={10} radius={3.2} speed={0.5} />
        <Sparkles count={140} scale={16} size={1.8} speed={0.25} opacity={0.5} color={c} />
      </>
    ),
    finance: (
      <>
        <Crystal color={c} position={[0, 0, -1.5]} scale={1.8} speed={0.6} />
        <GlassPanel color={c} position={[0, 0, -2]} rotation={[0.05, 0, 0]} />
        <GlassPanel color={c} position={[-4.5, 0.5, -3]} rotation={[0, 0.5, 0]} />
        <GlassPanel color={c} position={[4.5, -0.5, -3]} rotation={[0, -0.5, 0]} />
        <OrbitDots color={c} count={6} radius={2.5} speed={1} />
        <Sparkles count={100} scale={10} size={1.5} speed={0.3} opacity={0.6} color={c} />
      </>
    ),
    science: (
      <>
        <Blob color={c} position={[0, 0, -2]} speed={1.2} distort={0.7} scale={1.6} />
        <WireRing color={c} position={[0, 0, 0]} scale={1.8} speed={1.1} />
        <WireRing color={glow} position={[0, 0, -1]} scale={1.2} speed={-1.4} />
        <Crystal color={c} position={[-3.5, 1, -4]} scale={0.8} speed={1.6} />
        <Crystal color={c} position={[3.5, -1, -4]} scale={1.1} speed={1} />
        <Sparkles count={140} scale={12} size={1.6} speed={0.5} opacity={0.7} color={c} />
      </>
    ),
    space: (
      <>
        <Blob color={c} position={[0, 0, -4]} speed={0.4} distort={0.25} scale={2.8} />
        <OrbitDots color={c} count={12} radius={3.5} speed={0.3} />
        <OrbitDots color={glow} count={8} radius={2.2} speed={-0.5} />
        <WireRing color={c} position={[0, 0, 0]} scale={2.5} speed={0.3} />
        <Sparkles count={180} scale={20} size={2.5} speed={0.15} opacity={0.55} color={c} />
      </>
    ),
    defense: (
      <>
        <Crystal color={c} position={[0, 0, -2]} scale={2} speed={0.4} />
        <GlassPanel color={c} position={[0, 0, -3]} />
        <GlassPanel color={c} position={[-5, 0.5, -4]} rotation={[0, 0.6, 0]} />
        <GlassPanel color={c} position={[5, -0.5, -4]} rotation={[0, -0.6, 0]} />
        <OrbitDots color={c} count={6} radius={2.8} speed={0.6} />
        <Sparkles count={100} scale={12} size={1.2} speed={0.2} opacity={0.5} color={c} />
      </>
    ),
    health: (
      <>
        <Blob color={c} position={[0, 0, -2]} speed={1.0} distort={0.5} scale={1.7} />
        <WireRing color={c} position={[0, 0, 0]} scale={1.6} speed={0.9} />
        <Blob color={glow} position={[-3, 1, -4]} speed={0.7} distort={0.6} scale={1} />
        <Sparkles count={120} scale={11} size={1.6} speed={0.4} opacity={0.65} color={c} />
      </>
    ),
    startups: (
      <>
        <Crystal color={c} position={[0, 0.5, -1]} scale={1.4} speed={1.3} />
        <Crystal color={glow} position={[-2.5, -1, -3]} scale={0.8} speed={1.8} />
        <Crystal color={c} position={[2.5, 1.5, -4]} scale={1.0} speed={0.9} />
        <WireRing color={c} position={[0, 0, 0]} scale={1.8} speed={1.2} />
        <OrbitDots color={c} count={7} radius={2.4} speed={1.2} />
        <Sparkles count={130} scale={12} size={1.8} speed={0.5} opacity={0.7} color={c} />
      </>
    ),
    crypto: (
      <>
        <Crystal color={c} position={[0, 0, -2]} scale={1.6} speed={0.8} />
        <WireRing color={c} position={[0, 0, 0]} scale={2} speed={0.6} />
        <WireRing color={glow} position={[0, 0, -1]} scale={1.3} speed={-1} />
        <OrbitDots color={c} count={8} radius={2.8} speed={0.9} />
        <Sparkles count={140} scale={13} size={2} speed={0.4} opacity={0.65} color={c} />
      </>
    ),
    sports: (
      <>
        <Blob color={c} position={[0, 0, -2]} speed={1.5} distort={0.65} scale={1.5} />
        <WireRing color={c} position={[0, 0, 0]} scale={1.7} speed={1.4} />
        <OrbitDots color={c} count={9} radius={2.6} speed={1.3} />
        <Sparkles count={150} scale={12} size={2} speed={0.6} opacity={0.7} color={c} />
      </>
    ),
    entertain: (
      <>
        <Blob color={c} position={[0, 0, -2]} speed={1.1} distort={0.7} scale={1.6} />
        <Blob color={glow} position={[-3, 1.5, -4]} speed={0.8} distort={0.5} scale={0.9} />
        <Blob color={c} position={[3, -1.5, -5]} speed={0.7} distort={0.4} scale={1.2} />
        <WireRing color={c} position={[0, 0, 0]} scale={1.9} speed={0.8} />
        <Sparkles count={160} scale={14} size={2.2} speed={0.5} opacity={0.7} color={c} />
      </>
    ),
    environment: (
      <>
        <Blob color={c} position={[0, 0, -3]} speed={0.6} distort={0.45} scale={2.2} />
        <WireRing color={c} position={[0, 0, 0]} scale={2.1} speed={0.5} />
        <OrbitDots color={c} count={8} radius={3} speed={0.55} />
        <Sparkles count={140} scale={16} size={1.8} speed={0.3} opacity={0.6} color={c} />
      </>
    ),
    automotive: (
      <>
        <Crystal color={c} position={[0, 0, -1.5]} scale={1.7} speed={0.7} />
        <GlassPanel color={c} position={[0, 0, -3]} rotation={[0.03, 0, 0]} />
        <GlassPanel color={c} position={[-5, 0, -4]} rotation={[0, 0.55, 0]} />
        <WireRing color={c} position={[0, 0, 0]} scale={1.9} speed={0.7} />
        <Sparkles count={110} scale={11} size={1.5} speed={0.35} opacity={0.6} color={c} />
      </>
    ),
  };

  return scenes[sceneType] || scenes.nebula;
}

/* ── Camera mouse parallax ───────────────────────────────────── */
function CamParallax({ mouseRef }) {
  const { camera } = useThree();
  const base = useMemo(() => new THREE.Vector3(0, 0.3, 6.5), []);
  useFrame(() => {
    camera.position.x += (base.x + mouseRef.current.x * 0.5 - camera.position.x) * 0.025;
    camera.position.y += (base.y - mouseRef.current.y * 0.3 - camera.position.y) * 0.025;
    camera.position.z += (base.z - camera.position.z) * 0.015;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ── Post-processing ─────────────────────────────────────────── */
function FX({ glitching, isMobile }) {
  const caOffset = useMemo(
    () => new THREE.Vector2(glitching ? 0.06 : 0.0008, glitching ? 0.06 : 0.0008),
    [glitching],
  );
  return (
    <EffectComposer disableNormalPass>
      <Bloom luminanceThreshold={0.15} intensity={isMobile ? 0.7 : 1.2} mipmapBlur radius={0.55} />
      {!isMobile && <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={caOffset} />}
      {glitching && (
        <>
          <Glitch
            delay={[0, 0]} duration={[0.1, 0.35]}
            strength={[0.3, 0.8]} mode={GlitchMode.SPORADIC} active ratio={0.9}
          />
          <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.45} />
        </>
      )}
      <Vignette eskil={false} offset={0.15} darkness={0.7} />
    </EffectComposer>
  );
}

/* ── Main exported scene canvas ──────────────────────────────── */
export default function SceneEngine({ activeSector, glitching, mouseRef }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const prefReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const { color, glow } = activeSector;
  const sceneType = SECTOR_SCENE[activeSector.name] || 'nebula';
  const cfg = SCENE_CONFIGS[sceneType] || SCENE_CONFIGS.nebula;

  return (
    <Canvas
      camera={{ position: [0, 0.3, 6.5], fov: 55 }}
      dpr={[1, 1.25]}
      performance={{ min: 0.5 }}
      gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={[cfg.bg]} />
      <fogExp2 attach="fog" color={cfg.bg} density={cfg.fog} />

      {!prefReduced && <CamParallax mouseRef={mouseRef} />}

      <ambientLight intensity={0.1} />
      <pointLight position={[4,  5, 3]}  intensity={6} color={color} />
      <pointLight position={[-5, -3, -5]} intensity={4} color={glow} />
      <pointLight position={[0, -2, 4]}  intensity={2} color="#ffffff" />

      <Suspense fallback={null}>
        <SectorScene sector={activeSector.name} color={color} glow={glow} />
        <FX glitching={glitching} isMobile={isMobile} />
      </Suspense>
    </Canvas>
  );
}
