import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

/* ─── Mouse-reactive particle field ───────────────────────── */
function NebulaParticles({ count = 3500, mouse }) {
  const mesh = useRef();

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const palette = [
      new THREE.Color('#f43f5e'), // signal red/pink
      new THREE.Color('#a855f7'), // purple
      new THREE.Color('#3b82f6'), // blue
      new THREE.Color('#06b6d4'), // cyan
      new THREE.Color('#10b981'), // teal
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 8;

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    mesh.current.rotation.y = t * 0.04 + mouse.current.x * 0.3;
    mesh.current.rotation.x = t * 0.02 + mouse.current.y * 0.15;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color"    array={colors}    count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Slow morphing icosphere core ─────────────────────────── */
function NebulaMesh({ mouse }) {
  const mesh = useRef();
  const geo  = useRef();

  const originalPositions = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1.4, 5);
    return new Float32Array(g.attributes.position.array);
  }, []);

  useFrame((state) => {
    if (!mesh.current || !geo.current) return;
    const t = state.clock.elapsedTime;
    const pos = geo.current.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const ox = originalPositions[i * 3];
      const oy = originalPositions[i * 3 + 1];
      const oz = originalPositions[i * 3 + 2];
      const noise = Math.sin(ox * 2.2 + t * 0.5) * Math.cos(oy * 1.8 + t * 0.4) * Math.sin(oz * 2 + t * 0.6);
      pos.setXYZ(i, ox + noise * 0.25, oy + noise * 0.25, oz + noise * 0.25);
    }
    pos.needsUpdate = true;
    geo.current.computeVertexNormals();

    mesh.current.rotation.y = t * 0.08 + mouse.current.x * 0.5;
    mesh.current.rotation.x = t * 0.05 + mouse.current.y * 0.3;
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry ref={geo} args={[1.4, 5]} />
      <meshStandardMaterial
        color="#a855f7"
        emissive="#7c3aed"
        emissiveIntensity={0.6}
        wireframe
        transparent
        opacity={0.22}
      />
    </mesh>
  );
}

/* ─── Floating ambient orbs ────────────────────────────────── */
function Orb({ position, color, radius, speed }) {
  const mesh = useRef();
  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime * speed;
    mesh.current.position.y = position[1] + Math.sin(t) * 0.4;
    mesh.current.position.x = position[0] + Math.cos(t * 0.7) * 0.2;
  });
  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.18} />
    </mesh>
  );
}

/* ─── Post-processing ──────────────────────────────────────── */
function Effects() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return null;
  return (
    <EffectComposer disableNormalPass>
      <Bloom luminanceThreshold={0.05} mipmapBlur intensity={0.9} radius={0.6} />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0015, 0.0015]}
      />
    </EffectComposer>
  );
}

/* ─── Scene root ──────────────────────────────────────────── */
function Scene({ mouse }) {
  return (
    <>
      <color attach="background" args={['#030305']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[4, 4, 4]} intensity={2} color="#f43f5e" />
      <pointLight position={[-4, -4, -4]} intensity={1.5} color="#3b82f6" />
      <pointLight position={[0, 5, -3]} intensity={1} color="#a855f7" />

      <Suspense fallback={null}>
        <NebulaParticles mouse={mouse} />
        <NebulaMesh mouse={mouse} />
        <Orb position={[-3.5, 1, -2]} color="#f43f5e" radius={0.55} speed={0.6} />
        <Orb position={[3.5, -1, -2]} color="#3b82f6" radius={0.4}  speed={0.8} />
        <Orb position={[0, 3, -4]}    color="#a855f7" radius={0.7}  speed={0.5} />
        <Effects />
      </Suspense>
    </>
  );
}

/* ─── Public export ──────────────────────────────────────── */
export default function Hero3DCanvas({ mouse }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 55 }}
      dpr={[1, 1.5]}
      performance={{ min: 0.5 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Scene mouse={mouse} />
    </Canvas>
  );
}
