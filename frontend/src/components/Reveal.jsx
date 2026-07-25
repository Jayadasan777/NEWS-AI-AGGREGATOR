import React from 'react';
import { motion } from 'framer-motion';

/**
 * Reveal — scroll-triggered entrance animation powered by Framer Motion.
 * 
 * Props:
 *   direction — 'up' | 'left' | 'right' | 'scale' | 'none' (default: 'up')
 *   delay     — stagger delay in seconds (e.g., 0.2)
 *   className — wrapper classes
 *   duration  — animation duration (default: 0.8)
 */
const Reveal = ({ children, direction = 'up', delay = 0, className = '', duration = 0.8 }) => {
  const getVariants = () => {
    switch (direction) {
      case 'up':    return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
      case 'left':  return { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } };
      case 'right': return { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } };
      case 'scale': return { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };
      case 'none':  return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
      default:      return { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } };
    }
  };

  return (
    <motion.div
      variants={getVariants()}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration, delay, ease: [0.25, 1, 0.5, 1] }} // Custom spring-like easing
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;