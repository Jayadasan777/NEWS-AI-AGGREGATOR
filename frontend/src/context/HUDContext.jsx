import React, { createContext, useContext, useState, useCallback } from 'react';
import { SECTORS, getSector } from '../data/sectors';

const HUDContext = createContext(null);

export function HUDProvider({ children }) {
  const [activeSector, setActiveSectorState] = useState(SECTORS[0]);
  const [menuOpen, setMenuOpen] = useState(false);

  const setActiveSector = useCallback((sectorName) => {
    const next = getSector(sectorName);
    if (next.name !== activeSector.name) {
      setActiveSectorState(next);
    }
  }, [activeSector.name]);

  // Kept as no-op for backward compat with any remaining call sites
  const triggerGlitch = useCallback(() => {}, []);

  const value = {
    activeSector,
    setActiveSector,
    glitching: false,
    triggerGlitch,
    menuOpen,
    setMenuOpen,
    sectors: SECTORS,
  };

  return <HUDContext.Provider value={value}>{children}</HUDContext.Provider>;
}

export const useHUD = () => {
  const ctx = useContext(HUDContext);
  if (!ctx) throw new Error('useHUD must be used within a HUDProvider');
  return ctx;
};
