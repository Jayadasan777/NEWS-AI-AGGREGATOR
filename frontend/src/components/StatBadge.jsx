import React from 'react';

const VARIANT_CLASSES = {
  primary: 'bg-ink-800/80 border-ink-700 text-paper',
  accent:  'bg-signal/10 border-signal/20 text-signal',
};

const StatBadge = ({ label, value, variant = 'primary', dot = false }) => (
  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md text-[0.875rem] font-medium tracking-wide ${VARIANT_CLASSES[variant]}`}>
    {dot && (
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${variant === 'accent' ? 'bg-signal' : 'bg-paper'}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${variant === 'accent' ? 'bg-signal' : 'bg-paper'}`}></span>
      </span>
    )}
    {value && <span className="font-bold">{value}</span>}
    <span className={variant === 'primary' ? 'text-muted' : ''}>{label}</span>
  </div>
);

export default StatBadge;
