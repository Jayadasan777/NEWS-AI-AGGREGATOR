import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Text, 
  Float, 
  MeshReflectorMaterial, 
  Environment, 
  Sparkles,
  Torus
} from '@react-three/drei';
import { EffectComposer, Bloom, Glitch, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { GlitchMode, BlendFunction } from 'postprocessing';
import * as THREE from 'three';

const PROJECTS = [
  { id: 'live-feed', title: 'LIVE FEED', color: '#ff0055', type: 'panel' },
  { id: 'ai-intel', title: 'AI INTELLIGENCE', color: '#00ffff', type: 'ring' },
  { id: 'global', title: 'GLOBAL DISPATCHES', color: '#00ff44', type: 'panel' },
];

function SceneObject({ project, isTransitioning }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {project.type === 'panel' ? (
        <group>
          {/* Glass Panel */}
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh position={[0, 0, -0.5]}>
              <boxGeometry args={[7, 4, 0.2]} />
              <meshPhysicalMaterial 
                color="#000000"
                transmission={0.9}
                opacity={1}
                metalness={0.5}
                roughness={0.2}
                ior={1.5}
                thickness={2}
                clearcoat={1}
              />
            </mesh>
            <Text
              position={[0, 0, 0]}
              fontSize={0.8}
              color={project.color}
              letterSpacing={0.1}
              textAlign="center"
              anchorX="center"
              anchorY="middle"
            >
              {project.title}
              <meshStandardMaterial emissive={project.color} emissiveIntensity={2.5} toneMapped={false} color={project.color} />
            </Text>
          </Float>
        </group>
      ) : (
        <group>
          {/* Glowing Ring */}
          <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <Torus args={[1.5, 0.05, 32, 100]} rotation={[0, 0, 0]}>
              <meshPhysicalMaterial 
                color="#ffffff"
                transmission={0.95}
                opacity={1}
                metalness={1}
                roughness={0.1}
                ior={1.5}
                thickness={2}
                clearcoat={1}
              />
            </Torus>
            {/* Center Logo/Emblem */}
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.5, 0.5, 0.1]} />
              <meshStandardMaterial emissive={project.color} emissiveIntensity={3} color={project.color} toneMapped={false} />
            </mesh>
          </Float>
        </group>
      )}

      {/* Floating background elements for depth */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={2} position={[-4, 1, -3]}>
        <mesh>
           <boxGeometry args={[2, 3, 0.1]} />
           <meshPhysicalMaterial transmission={0.9} ior={1.5} roughness={0.2} color={project.color} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={2} floatIntensity={2} position={[4, -1, -2]}>
        <mesh>
           <boxGeometry args={[3, 2, 0.1]} />
           <meshPhysicalMaterial transmission={0.9} ior={1.5} roughness={0.2} color="#ffffff" />
        </mesh>
      </Float>
    </group>
  );
}

function Effects({ isTransitioning }) {
  return (
    <EffectComposer disableNormalPass>
      <Bloom 
        luminanceThreshold={0.1} 
        mipmapBlur 
        intensity={1.2} 
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[isTransitioning ? 0.03 : 0.003, isTransitioning ? 0.03 : 0.003]}
      />
      {isTransitioning && (
        <Glitch
          delay={[0, 0]} 
          duration={[0.1, 0.3]} 
          strength={[0.3, 0.8]} 
          mode={GlitchMode.SPORADIC} 
          active
          ratio={0.85}
        />
      )}
      <Noise opacity={isTransitioning ? 0.15 : 0.03} />
    </EffectComposer>
  );
}

export default function Hero3D() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % PROJECTS.length);
        setTimeout(() => setIsTransitioning(false), 200);
      }, 400); 
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const project = PROJECTS[currentIndex];

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-sans">
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#030303']} />
          
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <spotLight position={[0, 5, 5]} intensity={3} penumbra={1} color={project.color} />

          <Environment preset="city" />

          <group position={[0, -0.5, 0]}>
            <SceneObject project={project} isTransitioning={isTransitioning} />

            {/* Reflective Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
              <planeGeometry args={[100, 100]} />
              <MeshReflectorMaterial
                blur={[400, 100]}
                resolution={1024}
                mixBlur={1}
                mixStrength={80}
                roughness={0.15}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#050505"
                metalness={0.8}
              />
            </mesh>
          </group>

          {/* Particles */}
          <Sparkles 
            count={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 150} 
            scale={12} 
            size={1.5} 
            speed={0.3} 
            opacity={0.6} 
            color={project.color} 
          />

          {/* Optional: disable heavy FX if prefers-reduced-motion is on */}
          {!window.matchMedia('(prefers-reduced-motion: reduce)').matches && (
             <Effects isTransitioning={isTransitioning} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
