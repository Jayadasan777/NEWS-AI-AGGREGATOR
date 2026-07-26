import React from 'react';
import { motion } from 'framer-motion';

/**
 * GlowBlob — ambient floating monochrome gradient orb for B&W editorial luxury backgrounds.
 * Uses Framer Motion for continuous, gentle drifting.
 */
const COLORS = {
  purple: 'radial-gradient(circle, rgba(245,245,245,0.06) 0%, transparent 70%)',
  blue:   'radial-gradient(circle, rgba(200,200,200,0.05) 0%, transparent 70%)',
  pink:   'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
  teal:   'radial-gradient(circle, rgba(160,160,160,0.05) 0%, transparent 70%)',
};

const GlowBlob = ({ color = 'purple', size = 'w-[500px] h-[500px]', style = {}, delay = 0 }) => {
  return (
    <motion.div
      aria-hidden="true"
      className={`absolute rounded-full pointer-events-none select-none ${size}`}
      style={{ 
        background: COLORS[color] || COLORS.purple, 
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
