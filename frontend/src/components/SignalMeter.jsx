import React from 'react';
import { motion } from 'framer-motion';

const SignalMeter = ({ score = 0, segments = 10, size = 'md', className = '' }) => {
  const filled = Math.max(0, Math.min(segments, Math.round((score / 100) * segments)));
  const isHigh = score >= 90;
  const isMid = score >= 60 && score < 90;

  const barColor = isHigh ? 'bg-confirm' : isMid ? 'bg-signal' : 'bg-accent-purple';
  const textColor = isHigh ? 'text-confirm' : isMid ? 'text-signal' : 'text-accent-purple';
  
  const barW = size === 'sm' ? 'w-[2px]' : 'w-[3px]';
  const barH = size === 'sm' ? (i) => `${6 + i * 1.5}px` : (i) => `${8 + i * 2}px`;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} title={`Confidence: ${score}%`}>
      <div className="flex items-end gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: barH(i),
              opacity: i < filled ? 1 : 0.2
            }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
            className={`rounded-full ${barW} ${i < filled ? barColor : 'bg-ink-700'}`}
          />
        ))}
      </div>

      {size !== 'sm' && (
        <div className="flex flex-col leading-none">
          <span className={`text-[0.65rem] font-bold uppercase tracking-wider ${textColor}`}>
            {isHigh ? 'High' : isMid ? 'Medium' : 'Low'}
          </span>
          <span className="text-[10px] font-mono text-muted mt-0.5">{score}% Match</span>
        </div>
      )}
    </div>
  );
};

export default SignalMeter;