import React from 'react';

const SECTOR_STYLES = {
  Tech:          { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
  Finance:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Geopolitics:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  Sports:        { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
  AI:            { bg: 'bg-pink-500/10',    text: 'text-pink-400',    border: 'border-pink-500/20' },
  Startups:      { bg: 'bg-rose-500/10',    text: 'text-rose-400',    border: 'border-rose-500/20' },
  Crypto:        { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/20' },
  Health:        { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
  Science:       { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20' },
  Entertainment: { bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  Environment:   { bg: 'bg-lime-500/10',    text: 'text-lime-400',    border: 'border-lime-500/20' },
  Automotive:    { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20' },
  Defense:       { bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-500/20' },
  Space:         { bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  border: 'border-indigo-500/20' },
};

const DEFAULT = { bg: 'bg-ink-800', text: 'text-paper', border: 'border-ink-700' };

const SectorBadge = ({ sector = '', size = 'md' }) => {
  const styles = SECTOR_STYLES[sector] || DEFAULT;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[0.7rem]' : 'px-2.5 py-1 text-[0.75rem]';
  
  return (
    <span className={`inline-block rounded-md font-semibold tracking-wide border backdrop-blur-sm ${styles.bg} ${styles.text} ${styles.border} ${padding}`}>
      {sector}
    </span>
  );
};

export default SectorBadge;
