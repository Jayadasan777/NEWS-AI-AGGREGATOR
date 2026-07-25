import React from 'react';
import { motion } from 'framer-motion';

const NODES = [
  { id: 1, angle: 0, radius: 45, color: '#f43f5e', label: 'AI', delay: 0 },
  { id: 2, angle: 120, radius: 45, color: '#3b82f6', label: 'Tech', delay: 0.2 },
  { id: 3, angle: 240, radius: 45, color: '#a855f7', label: 'Geo', delay: 0.4 },
  { id: 4, angle: 60, radius: 85, color: '#14b8a6', label: 'Finance', delay: 0.1 },
  { id: 5, angle: 180, radius: 85, color: '#f43f5e', label: 'Space', delay: 0.3 },
  { id: 6, angle: 300, radius: 85, color: '#3b82f6', label: 'Health', delay: 0.5 },
];

const OrbitSignal = () => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Abstract Glowing Core */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-24 h-24 rounded-full bg-signal/20 blur-2xl"
      />
      <div className="relative w-4 h-4 rounded-full bg-signal shadow-[0_0_24px_rgba(244,63,94,0.8)]" />

      {/* Orbit Rings */}
      <div className="absolute w-[50%] h-[50%] rounded-full border border-white/5" />
      <div className="absolute w-[90%] h-[90%] rounded-full border border-white/5" />

      {/* Floating Nodes */}
      <div className="absolute inset-0">
        {NODES.map((node) => {
          // Convert polar to cartesian for positioning
          const rad = (node.angle * Math.PI) / 180;
          const x = `calc(50% + ${Math.cos(rad) * node.radius}% - 12px)`;
          const y = `calc(50% + ${Math.sin(rad) * node.radius}% - 12px)`;

          return (
            <motion.div
              key={node.id}
              className="absolute flex items-center gap-2"
              style={{ left: x, top: y }}
              animate={{ 
                y: [0, -10, 0, 10, 0],
                x: [0, 5, 0, -5, 0]
              }}
              transition={{
                duration: 6 + (node.id % 3),
                repeat: Infinity,
                delay: node.delay,
                ease: "easeInOut"
              }}
            >
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ background: node.color, boxShadow: `0 0 12px ${node.color}` }}
              />
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider bg-ink-950/50 backdrop-blur-sm px-1.5 rounded">
                {node.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OrbitSignal;