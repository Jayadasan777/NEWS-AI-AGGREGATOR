import React, { useRef, useEffect } from 'react';
import SceneEngine from './SceneEngine';
import { useHUD } from '../context/HUDContext';

export default function BackgroundScene() {
  const { displaySector, glitching } = useHUD();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#03050a]">
      <SceneEngine
        activeSector={displaySector}
        glitching={glitching}
        mouseRef={mouseRef}
      />
      {/* Subtle vignette / dark gradient overlay for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(3, 5, 10, 0.8) 100%)',
        }}
      />
    </div>
  );
}
