/**
 * ShowcaseScene.jsx
 * ─────────────────────────────────────────────────────────────────────────
 * Full-viewport 3D hero. Matches the reference screenshots:
 *  • Iridescent double-ring with emblem (Scene 1 & 4)
 *  • Floating glass monolith panels with 3D text (Scene 2)
 *  • TorusKnot with glitch burst (Scene 3)
 *  • Glitch / RGB-split / noise transition between scenes
 *  • Reflective ground plane, rising particles, mouse parallax camera
 *  • HUD overlay: top-right nav, left vertical menu, bottom-left search,
 *    bottom-center scroll indicator
 * ─────────────────────────────────────────────────────────────────────────
 */
import React, {
  useRef, useState, useEffect, useCallback, useMemo, Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Text,
  Float,
  MeshReflectorMaterial,
  Sparkles,
  Environment,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Glitch,
  ChromaticAberration,
  Noise,
} from '@react-three/postprocessing';
import { GlitchMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

/* ────────────────────────────────────────────────────────────
   SCENE DEFINITIONS — uses real NewsAI page/sector names
   ──────────────────────────────────────────────────────────── */
const SCENES = [
  {
    id: 'live-intel',
    title: 'LIVE INTEL',
    subtitle: 'AI-Synthesized Wire',
    type: 'ring',
    accentColor: new THREE.Color('#a855f7'),
    lightColor: '#7C5CFF',
  },
  {
    id: 'ai-synthesis',
    title: 'AI SYNTHESIS',
    subtitle: 'Multi-Source Fusion',
    type: 'panels',
    accentColor: new THREE.Color('#06b6d4'),
    lightColor: '#33E1E1',
  },
  {
    id: 'global-wire',
    title: 'GLOBAL WIRE',
    subtitle: '14 Sectors — Real-Time',
    type: 'torusknot',
    accentColor: new THREE.Color('#f43f5e'),
    lightColor: '#FF5CA0',
  },
];

const NAV_SECTORS = [
  { label: 'Wire',        href: '/' },
  { label: 'AI',          href: '/sector/AI' },
  { label: 'Tech',        href: '/sector/Tech' },
  { label: 'Geopolitics', href: '/sector/Geopolitics' },
  { label: 'Finance',     href: '/sector/Finance' },
  { label: 'Science',     href: '/sector/Science' },
];

/* ────────────────────────────────────────────────────────────
   IRIDESCENT MATERIAL FACTORY
   ──────────────────────────────────────────────────────────── */
function IridescentMaterial({ color = '#888888', transmission = 0, roughness = 0.1 }) {
  return (
    <meshPhysicalMaterial
      color={color}
      metalness={0.4}
      roughness={roughness}
      transmission={transmission}
      ior={1.35}
      thickness={1.5}
      clearcoat={1}
      clearcoatRoughness={0.05}
      iridescence={1}
      iridescenceIOR={1.3}
      iridescenceThicknessRange={[100, 400]}
      side={THREE.DoubleSide}
      toneMapped={false}
    />
  );
}

/* ────────────────────────────────────────────────────────────
   SCENE 1 — Double iridescent ring + emblem (reference screenshot 2)
   ──────────────────────────────────────────────────────────── */
function RingScene({ accentColor }) {
  const groupRef = useRef();
  const innerRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.z += delta * 0.6;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {/* Horizontal ring */}
      <mesh>
        <torusGeometry args={[1.6, 0.045, 20, 120]} />
        <IridescentMaterial color="#aaaaaa" roughness={0.06} />
      </mesh>
      {/* Vertical ring (crossed) */}
      <mesh rotation={[Math.PI / 2, 0.4, 0]}>
        <torusGeometry args={[1.6, 0.045, 20, 120]} />
        <IridescentMaterial color="#aaaaaa" roughness={0.06} />
      </mesh>
      {/* Center emblem glow disc */}
      <mesh>
        <circleGeometry args={[0.28, 48]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={3}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Spinning inner ring emblem */}
      <mesh ref={innerRef}>
        <torusGeometry args={[0.22, 0.012, 8, 48]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={4}
          toneMapped={false}
        />
      </mesh>
      {/* "N" emblem text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.22}
        color="#F5F5F7"
        anchorX="center"
        anchorY="middle"
        font="https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gozuPTPggo4Cv.woff2"
      >
        N
        <meshStandardMaterial color="#F5F5F7" emissive="#F5F5F7" emissiveIntensity={2} toneMapped={false} />
      </Text>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────
   SCENE 2 — Glass monolith panels + 3D title text
             (reference screenshot 1 & 4)
   ──────────────────────────────────────────────────────────── */
function PanelsScene({ title, accentColor }) {
  const panelMat = useMemo(() => (
    <meshPhysicalMaterial
      color="#050820"
      transmission={0.88}
      metalness={0.05}
      roughness={0.04}
      ior={1.5}
      thickness={2.5}
      clearcoat={1}
      side={THREE.DoubleSide}
    />
  ), []);

  return (
    <group>
      {/* Main center panel */}
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.3} position={[0, 0, -0.5]}>
        <mesh rotation={[0, 0.08, 0]}>
          <boxGeometry args={[5.5, 3.8, 0.07]} />
          {panelMat}
        </mesh>
        {/* 3D scene title text ON the panel */}
        <Text
          position={[0, 0.35, 0.1]}
          fontSize={0.75}
          color={`#${accentColor.getHexString()}`}
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gozuPTPggo4Cv.woff2"
          letterSpacing={0.08}
        >
          {title}
          <meshStandardMaterial
            color={`#${accentColor.getHexString()}`}
            emissive={`#${accentColor.getHexString()}`}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </Text>
        <Text
          position={[0, -0.35, 0.1]}
          fontSize={0.17}
          color="#9CA3AF"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2"
          letterSpacing={0.12}
        >
          AI SYNTHESIZED INTELLIGENCE
          <meshStandardMaterial color="#9CA3AF" emissive="#9CA3AF" emissiveIntensity={0.5} toneMapped={false} />
        </Text>
      </Float>
      {/* Left side panel */}
      <Float speed={1.6} rotationIntensity={0.6} floatIntensity={0.5} position={[-4, -0.3, -2.5]}>
        <mesh rotation={[0.05, 0.5, 0.03]}>
          <boxGeometry args={[2.2, 4.5, 0.06]} />
          <meshPhysicalMaterial
            color="#020510"
            transmission={0.92}
            metalness={0.0}
            roughness={0.03}
            ior={1.5}
            thickness={1.5}
            clearcoat={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Float>
      {/* Right side panel */}
      <Float speed={1.9} rotationIntensity={0.5} floatIntensity={0.4} position={[4, 0.2, -1.5]}>
        <mesh rotation={[-0.05, -0.45, 0.02]}>
          <boxGeometry args={[2.8, 3.5, 0.06]} />
          <meshPhysicalMaterial
            color="#020510"
            transmission={0.92}
            metalness={0.0}
            roughness={0.03}
            ior={1.5}
            thickness={1.5}
            clearcoat={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Float>
    </group>
  );
}

/* ────────────────────────────────────────────────────────────
   SCENE 3 — Iridescent TorusKnot
             (reference screenshot 3 — colorful donut glitch)
   ──────────────────────────────────────────────────────────── */
function TorusKnotScene({ accentColor }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15;
      meshRef.current.rotation.y += delta * 0.22;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.4}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1.1, 0.38, 180, 20, 2, 3]} />
        <IridescentMaterial color="#999999" roughness={0.08} transmission={0.1} />
      </mesh>
    </Float>
  );
}

/* ────────────────────────────────────────────────────────────
   SCENE ROUTER — picks the right geometry per scene type
   ──────────────────────────────────────────────────────────── */
function SceneObject({ scene }) {
  switch (scene.type) {
    case 'ring':      return <RingScene      accentColor={scene.accentColor} />;
    case 'panels':    return <PanelsScene    title={scene.title} accentColor={scene.accentColor} />;
    case 'torusknot': return <TorusKnotScene accentColor={scene.accentColor} />;
    default:          return null;
  }
}

/* ────────────────────────────────────────────────────────────
   CAMERA — lerps toward mouse position (parallax)
   ──────────────────────────────────────────────────────────── */
function CameraController({ mouseRef }) {
  const { camera } = useThree();
  const BASE = useMemo(() => new THREE.Vector3(0, 1.2, 7), []);

  useFrame(() => {
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    camera.position.x += (BASE.x + mx * 0.6 - camera.position.x) * 0.03;
    camera.position.y += (BASE.y - my * 0.4 - camera.position.y) * 0.03;
    camera.position.z += (BASE.z - camera.position.z) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ────────────────────────────────────────────────────────────
   DYNAMIC LIGHTS — change color per scene
   ──────────────────────────────────────────────────────────── */
function SceneLights({ scene }) {
  const keyRef   = useRef();
  const rimRef   = useRef();
  const fillRef  = useRef();
  const targetKey  = useMemo(() => new THREE.Color(scene.lightColor),   [scene.lightColor]);
  const targetRim  = useMemo(() => new THREE.Color('#33E1E1'), []);
  const targetFill = useMemo(() => new THREE.Color('#FF5CA0'), []);

  useFrame((_, delta) => {
    if (keyRef.current)  keyRef.current.color.lerp(targetKey,  delta * 1.5);
    if (rimRef.current)  rimRef.current.color.lerp(targetRim,  delta * 1.5);
    if (fillRef.current) fillRef.current.color.lerp(targetFill, delta * 1.5);
  });

  return (
    <>
      <ambientLight intensity={0.12} />
      <pointLight ref={keyRef}  position={[3,   5, 3]}   intensity={8}  color={scene.lightColor} />
      <pointLight ref={rimRef}  position={[-4, -2, -3]}  intensity={5}  color="#33E1E1" />
      <pointLight ref={fillRef} position={[0,  -3, 4]}   intensity={3}  color="#FF5CA0" />
      <directionalLight position={[0, 10, 0]} intensity={0.5} color="#ffffff" />
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   POST-PROCESSING — glitch spikes on transition
   ──────────────────────────────────────────────────────────── */
function PostFX({ glitching, isMobile }) {
  const caOffset = useMemo(
    () => new THREE.Vector2(glitching ? 0.055 : 0.001, glitching ? 0.055 : 0.001),
    [glitching],
  );

  return (
    <EffectComposer disableNormalPass>
      <Bloom
        luminanceThreshold={0.18}
        luminanceSmoothing={0.9}
        intensity={isMobile ? 0.7 : 1.1}
        mipmapBlur
        radius={0.5}
      />
      {!isMobile && (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={caOffset}
        />
      )}
      {glitching && (
        <Glitch
          delay={[0, 0]}
          duration={[0.15, 0.4]}
          strength={[0.25, 0.75]}
          mode={GlitchMode.SPORADIC}
          active
          ratio={0.85}
        />
      )}
      {glitching && (
        <Noise blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.4} />
      )}
    </EffectComposer>
  );
}

/* ────────────────────────────────────────────────────────────
   MAIN 3D CANVAS SCENE
   ──────────────────────────────────────────────────────────── */
function ThreeScene({ sceneIdx, glitching, mouseRef, isMobile }) {
  const scene   = SCENES[sceneIdx];
  const pCount  = isMobile ? 150 : 420;
  const prefReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      <CameraController mouseRef={mouseRef} />
      <SceneLights scene={scene} />
      <fogExp2 attach="fog" color="#05070a" density={0.06} />

      <Suspense fallback={null}>
        <SceneObject scene={scene} />

        {/* Reflective floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.8, 0]}>
          <planeGeometry args={[80, 80]} />
          <MeshReflectorMaterial
            blur={[300, 80]}
            resolution={256}
            mixBlur={0.9}
            mixStrength={60}
            roughness={0.3}
            depthScale={1.0}
            minDepthThreshold={0.5}
            maxDepthThreshold={1.5}
            color="#05070a"
            metalness={0.7}
          />
        </mesh>

        {/* Rising particle field — dense near base */}
        {!prefReduced && (
          <Sparkles
            count={pCount}
            scale={[10, 6, 10]}
            size={isMobile ? 1.2 : 1.8}
            speed={0.28}
            opacity={0.65}
            color={`#${scene.accentColor.getHexString()}`}
            noise={0.4}
          />
        )}
        {/* Extra dense cluster near object base */}
        {!prefReduced && (
          <Sparkles
            count={Math.floor(pCount / 3)}
            scale={[4, 2, 4]}
            position={[0, -1.5, 0]}
            size={isMobile ? 1.0 : 1.4}
            speed={0.15}
            opacity={0.8}
            color={`#${scene.accentColor.getHexString()}`}
            noise={0.2}
          />
        )}

        <PostFX glitching={glitching} isMobile={isMobile} />
      </Suspense>
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   HUD OVERLAY — all HTML/CSS positioned over the canvas
   ──────────────────────────────────────────────────────────── */
function HUDOverlay({ scene, sceneIdx, onSearch, searchVal, setSearchVal, navigate }) {
  const accentHex = `#${scene.accentColor.getHexString()}`;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none">

      {/* ── Top-right: minimal nav ── */}
      <div className="absolute top-7 right-8 pointer-events-auto hidden md:flex items-center gap-0">
        <Link
          to="/sector/AI"
          className="showcase-nav-link"
          style={{ mixBlendMode: 'difference' }}
        >
          WORK
        </Link>
        <div className="showcase-nav-divider" />
        <Link
          to="/about"
          className="showcase-nav-link"
          style={{ mixBlendMode: 'difference' }}
        >
          CONTACT
        </Link>
      </div>

      {/* ── Left vertical menu ── */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 pointer-events-auto hidden lg:flex flex-col gap-[18px]">
        <div className="showcase-hud-label mb-1">// NAVIGATION</div>
        {NAV_SECTORS.map((item, i) => (
          <Link
            key={item.href}
            to={item.href}
            className="showcase-left-menu-item group"
          >
            <span
              className="showcase-arrow"
              style={{ color: accentHex, opacity: i === sceneIdx % NAV_SECTORS.length ? 1 : 0 }}
            >
              →
            </span>
            <span className={i === sceneIdx % NAV_SECTORS.length ? 'text-white' : 'text-white/50 group-hover:text-white/80'}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Bottom-left: search input ── */}
      <form
        onSubmit={onSearch}
        className="absolute bottom-10 left-8 pointer-events-auto hidden md:block"
      >
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          placeholder="Search intelligence..."
          className="showcase-search-input"
        />
      </form>

      {/* ── Bottom-center: scroll indicator ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="showcase-hud-label">SCROLL</span>
        <div className="w-px h-12 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
      </div>

      {/* ── Scene title (bottom of canvas) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-10 right-8 text-right hidden md:block"
        >
          <div className="showcase-hud-label">{scene.subtitle}</div>
          <div
            className="font-display font-bold text-lg tracking-[0.06em] uppercase"
            style={{ color: accentHex }}
          >
            {scene.title}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Corner HUD labels ── */}
      <div className="absolute top-5 left-7 showcase-hud-label">// NEWSAI ENGINE v1.0</div>
      <div className="absolute bottom-5 left-8 showcase-hud-label">SYS:ONLINE — {new Date().toISOString().slice(0,10)}</div>
      <div className="absolute bottom-5 right-8 showcase-hud-label">14 SECTORS // AI VERIFIED</div>

      {/* ── Scene progress dots ── */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-2">
        {SCENES.map((s, i) => (
          <div
            key={s.id}
            className="w-1 rounded-full transition-all duration-500"
            style={{
              height: i === sceneIdx ? '20px' : '6px',
              background: i === sceneIdx ? accentHex : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ROOT EXPORT — wires everything together
   ──────────────────────────────────────────────────────────── */
export default function ShowcaseScene() {
  const [sceneIdx,    setSceneIdx]    = useState(0);
  const [glitching,   setGlitching]   = useState(false);
  const [searchVal,   setSearchVal]   = useState('');
  const mouseRef = useRef({ x: 0, y: 0 });
  const navigate = useNavigate();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  /* Mouse tracking */
  const onMouseMove = useCallback((e) => {
    mouseRef.current.x = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [onMouseMove]);

  /* Scene cycling with glitch transition */
  useEffect(() => {
    const prefReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefReduced) return;

    const hold = setTimeout(() => {
      // Glitch burst
      setGlitching(true);
      // 400ms later: switch scene
      const switchTimer = setTimeout(() => {
        setSceneIdx((i) => (i + 1) % SCENES.length);
        // 200ms later: end glitch
        const endTimer = setTimeout(() => setGlitching(false), 200);
        return () => clearTimeout(endTimer);
      }, 400);
      return () => clearTimeout(switchTimer);
    }, 4500);

    return () => clearTimeout(hold);
  }, [sceneIdx]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
    }
  }, [searchVal, navigate]);

  const scene = SCENES[sceneIdx];

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#05070a' }}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.2, 7], fov: 50 }}
        dpr={[1, isMobile ? 1 : 1.5]}
        performance={{ min: 0.5 }}
        gl={{ antialias: !isMobile, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <color attach="background" args={['#05070a']} />
        <ThreeScene
          sceneIdx={sceneIdx}
          glitching={glitching}
          mouseRef={mouseRef}
          isMobile={isMobile}
        />
      </Canvas>

      {/* Cinematic radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(5,7,10,0.85) 100%)',
        }}
      />

      {/* HUD Overlay */}
      <HUDOverlay
        scene={scene}
        sceneIdx={sceneIdx}
        onSearch={handleSearch}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        navigate={navigate}
      />
    </div>
  );
}
