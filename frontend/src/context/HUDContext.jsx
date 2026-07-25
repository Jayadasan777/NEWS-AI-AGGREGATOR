import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { SECTORS, getSector } from '../data/sectors';

const HUDContext = createContext(null);

export function HUDProvider({ children }) {
  const [activeSector, setActiveSectorState] = useState(SECTORS[0]); // Default to AI
  const [hoverSector, setHoverSectorState] = useState(null);
  const [glitching, setGlitching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const glitchTimeoutRef = useRef(null);

  const triggerGlitch = useCallback((duration = 350) => {
    if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    setGlitching(true);
    glitchTimeoutRef.current = setTimeout(() => {
      setGlitching(false);
    }, duration);
  }, []);

  const setActiveSector = useCallback((sectorName) => {
    const next = getSector(sectorName);
    if (next.name !== activeSector.name) {
      triggerGlitch(400);
      setActiveSectorState(next);
    }
  }, [activeSector.name, triggerGlitch]);

  const setHoverSector = useCallback((sectorName) => {
    if (!sectorName) {
      setHoverSectorState(null);
      return;
    }
    const next = getSector(sectorName);
    if (!hoverSector || next.name !== hoverSector.name) {
      setHoverSectorState(next);
    }
  }, [hoverSector]);

  const value = {
    activeSector,
    setActiveSector,
    hoverSector,
    setHoverSector,
    displaySector: hoverSector || activeSector,
    glitching,
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
