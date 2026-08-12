import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHUD } from '../context/HUDContext';

const NAV_LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/search', label: 'Search' },
  { to: '/studio', label: 'Studio', badge: 'AI' },
  { to: '/about', label: 'About' },
];

const DOMAIN_CATEGORIES = [
  { title: 'Core Technology',       color: '#ffffff', sectors: ['AI', 'Tech', 'Startups', 'Crypto'] },
  { title: 'Industry & Enterprise', color: '#e5e5e5', sectors: ['Finance', 'Defense', 'Automotive', 'Space'] },
  { title: 'Science & World',       color: '#d4d4d4', sectors: ['Science', 'Geo', 'Environment', 'Health'] },
  { title: 'Culture & Lifestyle',   color: '#b8b8b8', sectors: ['Sports', 'Entertain'] },
];

export default function Navbar() {
  const { sectors, activeSector, setActiveSector, menuOpen, setMenuOpen } = useHUD();
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled]       = useState(false);
  const searchRef = useRef(null);
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/sector/')) {
      const name = decodeURIComponent(location.pathname.split('/')[2]);
      if (name) setActiveSector(name);
    }
  }, [location.pathname, setActiveSector]);

  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) { navigate(`/search?q=${encodeURIComponent(q)}`); setSearchOpen(false); setSearchQuery(''); }
  };

  const handleSectorClick = (name) => {
    setActiveSector(name);
    navigate(`/sector/${name}`);
    setMenuOpen(false);
  };

  const isActive = (to, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <>
      {/* ════ GLASS NAV BAR ════ */}
      <header className={`glass-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-[0_8px_40px_rgba(0,0,0,0.5)]' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-3">

          {/* Brand */}
          <Link to="/" onClick={() => setActiveSector('AI')} className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)] group-hover:border-amber-400 transition-all">
              <img src="/nise-logo.jpg" alt="NISE Logo" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-black text-lg tracking-tight leading-none text-gradient font-display">NISE</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-amber-400/90 font-bold mt-0.5">BY DASAN</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(({ to, label, exact, badge }) => (
              <Link key={to} to={to}
                className="relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all duration-200"
                style={{ color: isActive(to, exact) ? '#fff' : 'var(--color-paper-dim)' }}
              >
                {isActive(to, exact) && (
                  <motion.span layoutId="nav-glass"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
                             backdropFilter: 'blur(10px)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
                {badge && <span className="relative z-10 badge badge-ai">{badge}</span>}
              </Link>
            ))}
          </nav>

          <div className="flex-1 lg:flex-none" />

          {/* Live pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-xs font-bold"
               style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span style={{ color: 'var(--color-paper)' }}>LIVE</span>
          </div>

          {/* Search toggle */}
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.form key="open"
                initial={{ width: 36, opacity: 0 }} animate={{ width: 250, opacity: 1 }}
                exit={{ width: 36, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                onSubmit={handleSearch}
                className="relative flex items-center overflow-hidden rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)' }}
              >
                <svg className="absolute left-3 w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-paper)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input ref={searchRef} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search intel…"
                  className="w-full bg-transparent pl-8 pr-7 py-2 text-xs text-white placeholder-[var(--color-muted)] focus:outline-none font-mono" />
                <button type="button" onClick={() => setSearchOpen(false)}
                  className="absolute right-2 p-0.5" style={{ color: 'var(--color-muted)' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.form>
            ) : (
              <motion.button key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-paper-dim)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Sectors button */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all"
            style={{
              background: menuOpen ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${menuOpen ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)'}`,
              color: menuOpen ? 'var(--color-paper)' : 'var(--color-paper-dim)',
              backdropFilter: 'blur(10px)',
            }}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="hidden sm:inline">Sectors</span>
            <span className="font-black text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--color-paper)' }}>14</span>
          </button>
        </div>
      </header>

      {/* ════ GLASS DOMAIN DRAWER ════ */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[80]"
              style={{ background: 'rgba(3,7,17,0.7)', backdropFilter: 'blur(12px)' }}
            />
            <motion.aside
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-[90] w-full sm:w-[420px] flex flex-col"
              style={{ background: 'rgba(10,14,30,0.85)', borderLeft: '1px solid rgba(255,255,255,0.09)',
                       backdropFilter: 'blur(40px) saturate(200%)', overflow: 'hidden' }}
            >
              {/* Gradient top edge */}
              <div className="h-px shrink-0"
                   style={{ background: 'linear-gradient(90deg, #ffffff, #a3a3a3, #525252)' }} />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 shrink-0"
                   style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div>
                  <h2 className="font-black text-xl tracking-tight text-gradient">Domain Directory</h2>
                  <p className="section-label mt-0.5">14 global intelligence sectors</p>
                </div>
                <button onClick={() => setMenuOpen(false)}
                  className="p-2.5 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-paper-dim)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
                {/* Mobile quick links */}
                <div className="lg:hidden">
                  <p className="section-label mb-3">Navigation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {NAV_LINKS.map(({ to, label, badge }) => (
                      <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between p-3 rounded-xl text-xs font-mono font-bold uppercase tracking-widest transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'var(--color-paper-dim)' }}>
                        <span>{label}</span>
                        {badge && <span className="badge badge-ai">{badge}</span>}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sectors */}
                {DOMAIN_CATEGORIES.map((cat) => (
                  <div key={cat.title}>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="w-2 h-2 rounded-full" style={{ background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
                      <p className="section-label" style={{ color: cat.color }}>{cat.title}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {cat.sectors.map((sName) => {
                        const sMeta = sectors.find(s => s.name === sName) || { name: sName, tag: 'Wire Feed' };
                        const active = activeSector?.name === sName && location.pathname.includes(`/sector/${sName}`);
                        return (
                          <button key={sName} onClick={() => handleSectorClick(sName)}
                            className="text-left p-3.5 rounded-xl border transition-all"
                            style={{
                              background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                              borderColor: active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.07)',
                              backdropFilter: 'blur(10px)',
                            }}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                              <span className="font-bold text-sm" style={{ color: 'var(--color-paper)' }}>{sName}</span>
                            </div>
                            <p className="section-label text-[10px]" style={{ color: 'var(--color-muted)' }}>{sMeta.tag}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 shrink-0 flex items-center justify-between"
                   style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="section-label">NEWSAI ENGINE v2.5</span>
                <div className="flex items-center gap-2">
                  <span className="live-dot" style={{ width: 6, height: 6 }} />
                  <span className="section-label" style={{ color: 'var(--color-paper)' }}>ONLINE</span>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}