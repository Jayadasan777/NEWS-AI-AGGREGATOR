import React from 'react';
import { motion } from 'framer-motion';

/**
 * GlowBlob — ambient floating gradient orb for premium SaaS backgrounds.
 * Uses Framer Motion for continuous, gentle drifting.
 */
const COLORS = {
  purple: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
  blue:   'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
  pink:   'radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)',
  teal:   'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
};

const GlowBlob = ({ color = 'purple', size = 'w-[500px] h-[500px]', style = {}, delay = 0 }) => {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute rounded-full pointer-events-none select-none ${size}`}
      style={{ 
        background: COLORS[color], 
        filter: 'blur(60px)', 
        ...style 
      }}
      animate={{
        y: [0, -30, 0, 20, 0],
        x: [0, 20, 0, -20, 0],
        scale: [1, 1.05, 1, 0.95, 1],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: delay
      }}
    />
  );
};

export default GlowBlob;
