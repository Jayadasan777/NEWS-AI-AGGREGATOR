import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHUD } from '../context/HUDContext';

export default function Navbar() {
  const {
    sectors,
    activeSector,
    setActiveSector,
    setHoverSector,
    menuOpen,
    setMenuOpen,
    triggerGlitch,
  } = useHUD();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep activeSector in sync with URL if on a sector page
  useEffect(() => {
    if (location.pathname.startsWith('/sector/')) {
      const sectorParam = decodeURIComponent(location.pathname.split('/')[2]);
      if (sectorParam) {
        setActiveSector(sectorParam);
      }
    }
  }, [location.pathname, setActiveSector]);

  // Focus search input when expanded
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      triggerGlitch(300);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSectorClick = (sectorName) => {
    setActiveSector(sectorName);
    navigate(`/sector/${sectorName}`);
    setMenuOpen(false);
  };

  return (
    <>
      {/* ── TOP-LEFT: Prestigious Brand Wordmark & Live Telemetry ── */}
      <div className="fixed top-6 left-6 md:left-8 z-50 flex items-center gap-4 pointer-events-auto">
        <Link
          to="/"
          onClick={() => {
            triggerGlitch(350);
            setActiveSector('AI');
          }}
          className="group flex items-center gap-3 font-display font-extrabold text-xl md:text-2xl tracking-tight text-[#F5F5F5] hover:text-white transition-colors"
        >
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#DC2626] opacity-75 animate-ping" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#DC2626] shadow-[0_0_8px_#DC2626]" />
          </div>
          <span className="tracking-tighter">NEWSAI</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#2A2A2A] font-mono text-[10px] text-[#606060] tracking-[0.2em] uppercase">
          <span className="text-[#A0A0A0] font-bold">INTEL WIRE</span>
          <span>•</span>
          <span className="text-[#DC2626]">LIVE</span>
        </div>
      </div>

      {/* ── TOP-RIGHT: System Status & Menu Drawer Controls ── */}
      <div className="fixed top-6 right-6 md:right-8 z-50 flex items-center gap-4 font-mono text-xs tracking-[0.2em] pointer-events-auto">
        <div className="hidden xl:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#2A2A2A] text-[10px] text-[#606060] uppercase">
          <span>ENGINE: LLAMA 3.1</span>
          <span>•</span>
          <span className="text-[#A0A0A0]">JACCARD FUSION</span>
        </div>

        <Link
          to="/about"
          onClick={() => triggerGlitch(250)}
          className="px-3 py-1.5 rounded-full bg-[#111111] border border-[#2A2A2A] text-[#A0A0A0] hover:text-[#F5F5F5] hover:border-[#3A3A3A] transition-all uppercase text-[11px]"
        >
          [ ABOUT ]
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 text-[#F5F5F5] hover:text-white transition-all py-1.5 px-4 bg-[#111111] hover:bg-[#181818] rounded-full border border-[#2A2A2A] shadow-lg font-mono text-xs tracking-widest uppercase"
        >
          <span>{menuOpen ? 'CLOSE' : 'MENU'}</span>
          <div className="w-2 h-2 rounded-full bg-[#DC2626] shadow-[0_0_6px_#DC2626] animate-pulse" />
        </button>
      </div>

      {/* ── LEFT EDGE: Pinned Interactive Domain Matrix (Sleek Glass Sidebar) ── */}
      <nav className="fixed left-6 md:left-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-1.5 max-h-[76vh] w-52 overflow-y-auto pr-2 scrollbar-none pointer-events-auto py-5 px-3 bg-[#111111]/90 backdrop-blur-md rounded-2xl shadow-2xl border border-[#2A2A2A]">
        <div className="font-mono text-[9px] text-[#606060] tracking-[0.28em] uppercase px-2 mb-2 flex items-center justify-between">
          <span>// DOMAIN WIRE</span>
          <span className="text-[#DC2626]">● LIVE</span>
        </div>
        {sectors.map((s) => {
          const isActive = activeSector.name === s.name && location.pathname.includes(`/sector/${s.name}`);
          return (
            <button
              key={s.name}
              onClick={() => handleSectorClick(s.name)}
              onMouseEnter={() => setHoverSector(s.name)}
              onMouseLeave={() => setHoverSector(null)}
              className={`group flex items-center justify-between w-full text-left font-mono text-[11px] tracking-[0.18em] uppercase transition-all duration-300 py-2 px-2.5 rounded-xl ${
                isActive
                  ? 'bg-[#181818] text-[#F5F5F5] font-bold translate-x-1.5 shadow-lg border border-[#3A3A3A]'
                  : 'text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-white/5 hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isActive ? 'h-4 bg-[#F5F5F5]' : 'h-3 group-hover:h-4 bg-[#A0A0A0]'
                  }`}
                />
                <span className="truncate">{s.name}</span>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'scale-125 bg-[#F5F5F5]' : 'bg-[#3A3A3A] group-hover:bg-[#606060]'}`} />
            </button>
          );
        })}
      </nav>

      {/* ── BOTTOM-LEFT: Minimal Expandable Intelligence Search Bar ── */}
      <div className="fixed bottom-6 left-6 md:left-8 z-50 pointer-events-auto flex items-center">
        <AnimatePresence mode="wait">
          {!searchOpen ? (
            <motion.button
              key="btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 bg-[#111111] text-[#A0A0A0] hover:text-[#F5F5F5] px-5 py-3 rounded-full border border-[#2A2A2A] hover:border-[#3A3A3A] transition-all font-mono text-xs tracking-[0.2em] uppercase shadow-2xl group"
            >
              <svg className="w-4 h-4 text-[#F5F5F5] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>[ QUERY INTEL WIRE ]</span>
            </motion.button>
          ) : (
            <motion.form
              key="form"
              initial={{ width: 48, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 48, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-[#111111] rounded-full border border-[#F5F5F5] shadow-2xl overflow-hidden"
            >
              <svg className="absolute left-4 w-4 h-4 text-[#F5F5F5] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH ENTITIES, TOPICS..."
                className="w-full bg-transparent text-[#F5F5F5] font-mono text-xs tracking-[0.15em] uppercase pl-11 pr-10 py-3 focus:outline-none placeholder:text-[#606060]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 p-1 rounded-full text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors hover:bg-[#2A2A2A]"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM-RIGHT: Telemetry Indicator ── */}
      <div className="fixed bottom-6 right-6 md:right-8 z-40 hidden sm:flex items-center gap-4 font-mono text-[10px] text-[#606060] tracking-[0.25em] uppercase pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          <span>LIVE</span>
        </span>
        <span>•</span>
        <span>RSS INGESTION ACTIVE</span>
      </div>

      {/* ── TOP-RIGHT DRAWER: Velvet Slide-over Sitemap & Domain Explorer ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-[#080B11]/85 backdrop-blur-md z-[80]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-80 md:w-96 bg-[#0D121C] border-l border-[#2A2A2A] z-[90] flex flex-col p-8 shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-6 border-b border-[#2A2A2A] mb-6">
                <span className="font-display font-extrabold text-xl text-[#F5F5F5] tracking-wide">
                  SYSTEM <span className="text-[#A0A0A0]">// DIRECTORY</span>
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-full bg-[#181818] hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors font-mono text-xs border border-[#2A2A2A]"
                >
                  [✕]
                </button>
              </div>

              <div className="space-y-8 flex-1">
                <div>
                  <div className="font-mono text-[10px] text-[#606060] tracking-[0.28em] uppercase mb-3">
                    // CORE NAVIGATION
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tracking-wider">
                    <Link
                      to="/"
                      onClick={() => { triggerGlitch(300); setMenuOpen(false); }}
                      className="p-3.5 rounded-xl bg-[#111111] hover:bg-[#181818] text-[#F5F5F5] transition-all border border-[#2A2A2A] hover:border-[#3A3A3A] font-bold"
                    >
                      → CORE WIRE
                    </Link>
                    <Link
                      to="/search"
                      onClick={() => { triggerGlitch(300); setMenuOpen(false); }}
                      className="p-3.5 rounded-xl bg-[#111111] hover:bg-[#181818] text-[#F5F5F5] transition-all border border-[#2A2A2A] hover:border-[#3A3A3A] font-bold"
                    >
                      → SEARCH INTEL
                    </Link>
                    <Link
                      to="/about"
                      onClick={() => { triggerGlitch(300); setMenuOpen(false); }}
                      className="p-3.5 rounded-xl bg-[#111111] hover:bg-[#181818] text-[#F5F5F5] transition-all border border-[#2A2A2A] hover:border-[#3A3A3A] col-span-2 font-bold"
                    >
                      → ARCHITECTURE & SYSTEM ABOUT
                    </Link>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-[#A0A0A0] tracking-[0.28em] uppercase mb-3">
                    // ALL 14 NEWS DOMAINS
                  </div>
                  <div className="grid grid-cols-1 gap-2 font-mono text-[11px] uppercase tracking-widest">
                    {sectors.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => handleSectorClick(s.name)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-[#181818] text-left text-[#A0A0A0] hover:text-[#F5F5F5] transition-all border border-transparent hover:border-[#2A2A2A] group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full shadow-sm bg-[#F5F5F5]" />
                          <span className="font-bold group-hover:translate-x-1 transition-transform">{s.name}</span>
                        </div>
                        <span className="text-[9px] text-[#606060] tracking-normal font-sans hidden sm:inline">{s.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-[#2A2A2A] font-mono text-[10px] text-[#606060] uppercase tracking-[0.2em] flex justify-between items-center">
                <span>NEWSAI ENGINE v2.5</span>
                <span className="text-[#DC2626] font-bold">● LIVE</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}