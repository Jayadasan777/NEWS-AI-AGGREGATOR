import React from 'react';

const BW_STYLE = { bg: 'bg-[#181818]/90', text: 'text-[#F5F5F5]', border: 'border-[#3A3A3A]' };

const SectorBadge = ({ sector = '', size = 'md' }) => {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[0.65rem]' : 'px-2.5 py-1 text-[0.7rem]';
  
  return (
    <span className={`inline-block rounded-md font-mono font-bold tracking-[0.15em] uppercase border backdrop-blur-md ${BW_STYLE.bg} ${BW_STYLE.text} ${BW_STYLE.border} ${padding}`}>
      {sector || 'GENERAL'}
    </span>
  );
};

export default SectorBadge;
