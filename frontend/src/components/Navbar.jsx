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
          className="group flex items-center gap-3 font-display font-extrabold text-xl md:text-2xl tracking-tight text-paper hover:text-[#F59E0B] transition-colors"
        >
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#10B981] opacity-75 animate-ping" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981]" />
          </div>
          <span className="tracking-tighter">NEWSAI</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full glass-nav border border-white/10 font-mono text-[10px] text-muted tracking-[0.2em] uppercase">
          <span className="text-[#F59E0B] font-bold">// INTEL WIRE</span>
          <span>•</span>
          <span className="text-[#10B981]">14 DOMAINS LIVE</span>
        </div>
      </div>

      {/* ── TOP-RIGHT: System Status & Menu Drawer Controls ── */}
      <div className="fixed top-6 right-6 md:right-8 z-50 flex items-center gap-4 font-mono text-xs tracking-[0.2em] pointer-events-auto">
        <div className="hidden xl:flex items-center gap-3 px-3.5 py-1.5 rounded-full glass-nav border border-white/10 text-[10px] text-muted/70 uppercase">
          <span>ENGINE: LLAMA 3.1 70B</span>
          <span>•</span>
          <span className="text-paper">JACCARD FUSION</span>
        </div>

        <Link
          to="/about"
          onClick={() => triggerGlitch(250)}
          className="px-3 py-1.5 rounded-full glass-nav border border-white/10 text-muted hover:text-paper hover:border-white/30 transition-all uppercase text-[11px]"
        >
          [ ABOUT ]
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 text-paper hover:text-[#F59E0B] transition-all py-1.5 px-4 glass-nav hover:bg-white/15 rounded-full border border-white/15 shadow-lg font-mono text-xs tracking-widest uppercase"
        >
          <span>{menuOpen ? 'CLOSE' : 'MENU'}</span>
          <div className="w-2 h-2 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] animate-pulse" />
        </button>
      </div>

      {/* ── LEFT EDGE: Pinned Interactive Domain Matrix (Sleek Glass Sidebar) ── */}
      <nav className="fixed left-6 md:left-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-1.5 max-h-[76vh] w-52 overflow-y-auto pr-2 scrollbar-none pointer-events-auto py-5 px-3 glass-nav rounded-2xl shadow-2xl border border-white/10">
        <div className="font-mono text-[9px] text-muted/50 tracking-[0.28em] uppercase px-2 mb-2 flex items-center justify-between">
          <span>// DOMAIN WIRE</span>
          <span className="text-[#10B981]">● LIVE</span>
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
                  ? 'bg-white/15 text-paper font-bold translate-x-1.5 shadow-lg border border-white/20'
                  : 'text-muted/70 hover:text-paper hover:bg-white/5 hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isActive ? 'h-4 shadow-[0_0_10px_currentColor]' : 'h-3 group-hover:h-4'
                  }`}
                  style={{ backgroundColor: s.color, color: s.color }}
                />
                <span className="truncate">{s.name}</span>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'scale-125 bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]' : 'bg-white/10 group-hover:bg-white/40'}`} />
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
              className="flex items-center gap-3 glass-nav text-muted hover:text-paper px-5 py-3 rounded-full border border-white/15 hover:border-[#F59E0B]/60 transition-all font-mono text-xs tracking-[0.2em] uppercase shadow-2xl group"
            >
              <svg className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="relative flex items-center glass-nav rounded-full border border-[#F59E0B]/70 shadow-[0_0_30px_rgba(245,158,11,0.25)] overflow-hidden"
            >
              <svg className="absolute left-4 w-4 h-4 text-[#F59E0B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH ENTITIES, TOPICS..."
                className="w-full bg-transparent text-paper font-mono text-xs tracking-[0.15em] uppercase pl-11 pr-10 py-3 focus:outline-none placeholder:text-muted/50"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 p-1 rounded-full text-muted hover:text-paper transition-colors hover:bg-white/10"
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
      <div className="fixed bottom-6 right-6 md:right-8 z-40 hidden sm:flex items-center gap-4 font-mono text-[10px] text-muted/60 tracking-[0.25em] uppercase pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span>SYS::ONLINE</span>
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
              className="fixed top-0 right-0 bottom-0 w-80 md:w-96 bg-[#0D121C] border-l border-white/10 z-[90] flex flex-col p-8 shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <span className="font-display font-extrabold text-xl text-paper tracking-wide">
                  SYSTEM <span className="text-[#F59E0B]">// DIRECTORY</span>
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-muted hover:text-paper transition-colors font-mono text-xs"
                >
                  [✕]
                </button>
              </div>

              <div className="space-y-8 flex-1">
                <div>
                  <div className="font-mono text-[10px] text-[#F59E0B] tracking-[0.28em] uppercase mb-3">
                    // CORE NAVIGATION
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tracking-wider">
                    <Link
                      to="/"
                      onClick={() => { triggerGlitch(300); setMenuOpen(false); }}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/15 text-paper transition-all border border-white/5 hover:border-white/20 font-bold"
                    >
                      → CORE WIRE
                    </Link>
                    <Link
                      to="/search"
                      onClick={() => { triggerGlitch(300); setMenuOpen(false); }}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/15 text-paper transition-all border border-white/5 hover:border-white/20 font-bold"
                    >
                      → SEARCH INTEL
                    </Link>
                    <Link
                      to="/about"
                      onClick={() => { triggerGlitch(300); setMenuOpen(false); }}
                      className="p-3.5 rounded-xl bg-white/5 hover:bg-white/15 text-paper transition-all border border-white/5 hover:border-white/20 col-span-2 font-bold"
                    >
                      → ARCHITECTURE & SYSTEM ABOUT
                    </Link>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] text-[#10B981] tracking-[0.28em] uppercase mb-3">
                    // ALL 14 NEWS DOMAINS
                  </div>
                  <div className="grid grid-cols-1 gap-2 font-mono text-[11px] uppercase tracking-widest">
                    {sectors.map((s) => (
                      <button
                        key={s.name}
                        onClick={() => handleSectorClick(s.name)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-left text-muted hover:text-paper transition-all border border-transparent hover:border-white/15 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                          <span className="font-bold group-hover:translate-x-1 transition-transform">{s.name}</span>
                        </div>
                        <span className="text-[9px] text-muted/50 tracking-normal font-sans hidden sm:inline">{s.tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 font-mono text-[10px] text-muted/60 uppercase tracking-[0.2em] flex justify-between items-center">
                <span>NEWSAI ENGINE v2.5</span>
                <span className="text-[#10B981] font-bold">● ONLINE</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}