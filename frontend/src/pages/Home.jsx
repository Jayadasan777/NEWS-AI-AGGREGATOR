import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../api/axios';
import { FlagshipCard, BentoCard } from '../components/BentoCard';
import { useHUD } from '../context/HUDContext';
import LatestFeed from '../components/LatestFeed';
import AutomationStatus from '../components/AutomationStatus';

/* ── Loading ── */
const LoadingState = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-full animate-spin"
           style={{ border: '2px solid transparent', borderTop: '2px solid #ffffff', borderRight: '2px solid #a3a3a3' }} />
      <div className="absolute inset-2 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s',
           border: '1px solid transparent', borderBottom: '1px solid #e5e5e5' }} />
    </div>
    <p className="section-label animate-pulse text-white">Acquiring intelligence feed…</p>
  </div>
);

/* ── Error ── */
const ErrorState = ({ message }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <div className="glass-card p-10 max-w-md w-full text-center"
         style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
      <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
           style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)' }}>
        <span className="text-xl">⚠</span>
      </div>
      <p className="section-label mb-2" style={{ color: 'var(--color-paper)' }}>Signal Error</p>
      <p className="font-semibold mb-2" style={{ color: 'var(--color-paper)' }}>{message}</p>
      <p className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>Verify backend is running on port 5000.</p>
    </div>
  </div>
);

/* ── Animated Counter ── */
function AnimCounter({ to, suffix = '', duration = 1.6 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / (duration * 1000), 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.floor(ease * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── Section Header ── */
function SectionHead({ tag, title, sub, right }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8"
    >
      <div className="section-rule">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
          <p className="section-label text-white font-bold tracking-widest uppercase">{tag}</p>
        </div>
        {right && <div className="section-label ml-auto mr-0">{right}</div>}
      </div>
      <h2 className="font-black text-2xl sm:text-3xl tracking-tight text-white">
        {title}
      </h2>
      {sub && <p className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>{sub}</p>}
    </motion.div>
  );
}

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [events,   setEvents]   = useState([]);
  const [latest,   setLatest]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const { sectors } = useHUD();

  useEffect(() => {
    (async () => {
      try {
        const [artRes, evtRes, latRes] = await Promise.all([
          axios.get('/articles'),
          axios.get('/events'),
          axios.get('/events/latest?limit=6'),
        ]);
        setArticles(Array.isArray(artRes.data) ? artRes.data : artRes.data?.data || []);
        setEvents(Array.isArray(evtRes.data)   ? evtRes.data : evtRes.data?.data   || []);
        setLatest(latRes.data?.data || []);
      } catch {
        setError('Failed to synchronize global intelligence feed.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const flagship    = events[0] || articles[0];
  const isFlagEvent = !!events[0];
  const clusters    = events.slice(1, 4);
  const dispatches  = articles.slice(0, 6);

  return (
    <div className="space-y-24">

      {/* ═══ AUTOMATION STATUS ═══ */}
      <AutomationStatus />

      {/* ═══ HERO ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative pt-4"
      >
        {/* Live Badge with Logo */}
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full font-mono text-xs font-bold mb-8"
             style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,158,11,0.3)', backdropFilter: 'blur(10px)' }}>
          <img src="/nise-logo.jpg" alt="NISE Logo" className="w-5 h-5 rounded-md object-cover border border-amber-500/40" />
          <span className="text-amber-400 font-extrabold">NISE BY DASAN</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span className="live-dot" />
          <span style={{ color: 'var(--color-paper)' }}>NEURAL SYNTHESIS ONLINE</span>
        </div>

        {/* Main Headline */}
        <h1 className="font-black tracking-tight leading-[0.95] mb-6">
          <span className="block text-5xl sm:text-7xl lg:text-8xl text-white">
            GLOBAL
          </span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl text-gradient">
            INTELLIGENCE
          </span>
          <span className="block text-5xl sm:text-7xl lg:text-8xl text-white/30">
            ENGINE
          </span>
        </h1>

        <p className="text-base sm:text-lg max-w-2xl leading-relaxed mb-8" style={{ color: 'var(--color-paper-dim)' }}>
          Real-time news curation across <strong className="text-white border-b border-white/40 pb-0.5">14 global domains</strong> — algorithmically deduplicated,
          clustered via <strong className="text-white border-b border-white/40 pb-0.5">Jaccard similarity</strong>, and synthesized
          into executive briefs by <strong className="text-white border-b border-white/40 pb-0.5">Llama 3 neural fusion</strong>.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/search" className="btn-primary">
            Search Intelligence →
          </Link>
          <Link to="/about" className="btn-ghost">
            How It Works
          </Link>
        </div>
      </motion.section>

      {/* ═══ STATS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { v: 14,              s: '',  l: 'Active Domains',   sub: 'Global RSS Sources',  color: '#ffffff', icon: '🌐' },
          { v: articles.length, s: '+', l: 'Live Dispatches',  sub: 'AI-Rewritten Briefs', color: '#e5e5e5', icon: '📡' },
          { v: events.length,   s: '+', l: 'Neural Clusters',  sub: 'Jaccard Fused Events', color: '#d4d4d4', icon: '🧠' },
          { v: 92,              s: '%', l: 'Avg Confidence',   sub: 'Verification Score',  color: '#c8c8c8', icon: '✓' },
        ].map(({ v, s, l, sub, color, icon }, i) => (
          <motion.div key={l}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className="glass-card p-5 rounded-2xl group transition-all duration-300 hover:border-white/40"
          >
            <div className="flex items-start justify-between mb-3">
              <p className="section-label">{sub}</p>
              <span className="text-xl group-hover:scale-125 transition-transform">{icon}</span>
            </div>
            <p className="font-black text-4xl sm:text-5xl tracking-tight mb-1" style={{ color }}>
              <AnimCounter to={v} suffix={s} />
            </p>
            <p className="section-label font-bold" style={{ color: 'var(--color-paper-dim)' }}>{l}</p>
            {/* Bottom color accent */}
            <div className="mt-3 h-0.5 rounded-full" style={{ background: `linear-gradient(to right, ${color}, transparent)` }} />
          </motion.div>
        ))}
      </div>

      {/* ═══ LATEST TICKER ═══ */}
      <LatestFeed events={latest} articles={articles} />

      {/* ═══ FLAGSHIP STORY ═══ */}
      {flagship && (
        <section>
          <SectionHead tag="Priority Report" title="Lead Intelligence Brief" accent="blue"
            right={<span className="badge badge-verified">Multi-Source Verified</span>} />
          <FlagshipCard article={flagship} isEvent={isFlagEvent} />
        </section>
      )}

      {/* ═══ AI CLUSTERS ═══ */}
      {clusters.length > 0 && (
        <section>
          <SectionHead tag="Neural Clustering" title="Synthesized Event Clusters" accent="indigo"
            sub="Multi-source events fused by Llama 3.1 · Jaccard similarity indexing"
            right={<Link to="/search" className="section-label hover:text-white transition-colors">All Events →</Link>}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {clusters.map((ev, i) => <BentoCard key={ev._id} article={ev} isEvent delay={i * 0.07} />)}
          </div>
        </section>
      )}

      {/* ═══ DISPATCHES ═══ */}
      {dispatches.length > 0 && (
        <section>
          <SectionHead tag="Live Wire Feed" title="Editorial Dispatches" accent="cyan"
            sub="100% AI-original content — deduplicated, rewritten, and curated in real time" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dispatches.map((a, i) => <BentoCard key={a._id} article={a} delay={i * 0.05} />)}
          </div>
        </section>
      )}

      {/* ═══ DOMAIN EXPLORER MATRIX ═══ */}
      <section>
        <SectionHead tag="Intelligence Matrix" title="14 Global Cyber-Domain Nodes"
          sub="Interactive sector network — click any node to filter real-time telemetry" />
        <div className="glass-card p-8 rounded-3xl border border-white/15 shadow-[0_12px_48px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10 flex-wrap gap-4">
            <div>
              <h3 className="font-mono text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>ACTIVE DOMAIN NETWORK</span>
              </h3>
              <p className="text-xs text-[var(--color-paper-dim)] mt-1">Algorithmically indexing 24/7 global wire feeds</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-white bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
              <span>ALL NODES OPERATIONAL</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {sectors.map((s, idx) => {
              const count = articles.filter(a => a.sector === s.name).length + events.filter(e => e.sector === s.name).length;
              return (
                <Link key={s.name} to={`/sector/${s.name}`}
                  className="group relative flex flex-col justify-between p-4 rounded-2xl transition-all duration-300 overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    backdropFilter: 'blur(20px)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] font-bold text-white/50 group-hover:text-white/80 transition-colors">
                      NODE 0{idx + 1}
                    </span>
                    <span className="w-2 h-2 rounded-full transition-all group-hover:scale-150 bg-white" style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-white tracking-tight group-hover:text-gradient transition-all mb-1">
                      {s.name}
                    </h4>
                    <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-muted)] group-hover:text-[var(--color-paper-dim)] transition-colors line-clamp-1">
                      {s.tag || 'GLOBAL WIRE'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between font-mono text-[10px] border-t border-white/5 group-hover:border-white/15 transition-colors">
                    <span className="text-[var(--color-paper-dim)] font-semibold">
                      {count > 0 ? `${count} DISPATCHES` : 'LIVE FEED'}
                    </span>
                    <span className="font-bold text-white opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}