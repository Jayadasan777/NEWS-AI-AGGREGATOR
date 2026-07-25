import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../api/axios';
import { FlagshipCard, BentoCard } from '../components/BentoCard';
import { useHUD } from '../context/HUDContext';

/* ─── Loading State ─── */
const LoadingState = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border border-[#F59E0B]/40 animate-ping" />
      <div className="absolute inset-0 rounded-full border border-[#F59E0B]/20 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-[#F59E0B] animate-pulse" />
      </div>
    </div>
    <div className="font-mono text-xs text-[#F59E0B] tracking-[0.3em] uppercase animate-pulse font-bold">
      // ACQUIRING MULTI-SOURCE FEED SIGNAL...
    </div>
  </div>
);

/* ─── Error State ─── */
const ErrorState = ({ message }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <div className="glass-panel rounded-3xl p-10 max-w-md text-center border border-[#F59E0B]/40 shadow-2xl">
      <div className="font-mono text-xs text-[#F59E0B] tracking-[0.28em] uppercase mb-2 font-bold">// SIGNAL ERROR</div>
      <p className="text-paper font-semibold mb-3">{message}</p>
      <p className="text-muted/70 text-xs font-mono">Verify backend server is running on localhost:5000.</p>
    </div>
  </div>
);

/* ─── Animated Number Counter ─── */
function AnimCounter({ to, duration = 1.5 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (now) => {
          const p = Math.min((now - t0) / (duration * 1000), 1);
          setVal(Math.floor(p * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{val}</span>;
}

/* ─── Section Header (Editorial Styling) ─── */
const SectionHead = ({ tag, title, right }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className="flex items-end justify-between mb-10 pb-5 border-b border-white/15"
  >
    <div>
      <span className="font-mono text-[10px] text-[#F59E0B] tracking-[0.3em] uppercase block mb-1.5 font-bold">{tag}</span>
      <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-paper tracking-tight">{title}</h2>
    </div>
    {right && <div className="font-mono text-xs text-muted tracking-[0.2em] uppercase hidden sm:block font-bold">{right}</div>}
  </motion.div>
);

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const { triggerGlitch, sectors } = useHUD();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [artRes, evtRes] = await Promise.all([
          axios.get('/articles'),
          axios.get('/events'),
        ]);
        setArticles(Array.isArray(artRes.data) ? artRes.data : artRes.data?.data || []);
        setEvents(Array.isArray(evtRes.data)   ? evtRes.data : evtRes.data?.data   || []);
      } catch {
        setError('Failed to synchronize global intelligence feed.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const flagship      = events[0] || articles[0];
  const isFlagEvent   = !!events[0];
  const bentoEvents   = events.slice(1, 4);
  const bentoArticles = articles.slice(0, 6);

  return (
    <div className="space-y-24">

      {/* ════ 1. TOP EDITORIAL HERO HEADER ════ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-8"
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B] font-mono text-[10px] uppercase tracking-[0.28em] mb-6 font-extrabold shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span>AUTONOMOUS FEED SYNTHESIS // ONLINE</span>
        </div>

        {/* Playfair Display Serif Hero Title */}
        <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-paper tracking-tight max-w-4xl leading-[1.04] mb-6">
          GLOBAL WIRE <span className="gradient-text-gold">// INTELLIGENCE</span>
        </h1>

        <p className="text-paper-dim text-base sm:text-lg max-w-2xl leading-relaxed font-sans font-light">
          Real-time curation across 14 global domains. Incoming dispatches are algorithmically deduplicated, clustered via Jaccard similarity, and synthesized into executive briefs by Llama 3 neural fusion.
        </p>
      </motion.div>

      {/* ════ 2. REAL-TIME TELEMETRY STATS BAR ════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {[
          { v: 14,              s: '',  l: 'Active Domains',  sub: 'MULTI-SOURCE RSS',      color: '#0EA5E9' },
          { v: articles.length, s: '+', l: 'Live Dispatches', sub: 'REAL-TIME WIRE',        color: '#F59E0B' },
          { v: events.length,   s: '+', l: 'Neural Clusters', sub: 'LLAMA 3 FUSED',         color: '#10B981' },
          { v: 92,              s: '%', l: 'Avg Confidence',  sub: 'VERIFICATION SCORE',    color: '#8B5CF6' },
        ].map(({ v, s, l, sub, color }, i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-panel rounded-3xl p-6 hover:border-white/25 transition-all group"
          >
            <div className="font-mono text-[10px] text-muted/60 tracking-[0.25em] uppercase mb-1.5 font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span>{sub}</span>
            </div>
            <div className="font-display font-extrabold text-4xl sm:text-5xl text-paper mb-1 tracking-tight">
              <AnimCounter to={v} />{s}
            </div>
            <div className="font-mono text-xs uppercase tracking-widest font-extrabold" style={{ color }}>{l}</div>
          </motion.div>
        ))}
      </div>

      {/* ════ 3. LEAD PRIORITY MAGAZINE COVER STORY ════ */}
      {flagship && (
        <div>
          <SectionHead
            tag="// PRIORITY COVER STORY"
            title="Lead Intelligence Report"
            right="FUSION STATUS: VERIFIED MULTI-SOURCE"
          />
          <FlagshipCard article={flagship} isEvent={isFlagEvent} />
        </div>
      )}

      {/* ════ 4. LATEST SYNTHESIZED EVENT CLUSTERS ════ */}
      {bentoEvents.length > 0 && (
        <div>
          <SectionHead
            tag="// AI NEURAL CLUSTERING"
            title="Synthesized Events"
            right={
              <Link
                to="/search"
                onClick={() => triggerGlitch(200)}
                className="hover:text-[#F59E0B] transition-colors flex items-center gap-1.5 font-bold text-[#10B981]"
              >
                VIEW ALL CLUSTERS →
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {bentoEvents.map((ev, i) => (
              <BentoCard key={ev._id} article={ev} isEvent delay={i * 0.1} />
            ))}
          </div>
        </div>
      )}

      {/* ════ 5. LIVE EDITORIAL DISPATCHES ════ */}
      {bentoArticles.length > 0 && (
        <div>
          <SectionHead
            tag="// CONTINUOUS WIRE STREAM"
            title="Live Editorial Dispatches"
            right="100% ORIGINAL AI REWRITTEN COPY"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-min">
            <div className="md:col-span-2">
              {bentoArticles[0] && <BentoCard article={bentoArticles[0]} delay={0} className="h-full" />}
            </div>
            <div className="md:row-span-2">
              {bentoArticles[1] && <BentoCard article={bentoArticles[1]} delay={0.1} className="h-full" />}
            </div>
            {[bentoArticles[2], bentoArticles[3]].map((a, i) =>
              a ? <div key={a._id}><BentoCard article={a} delay={i * 0.1 + 0.2} className="h-full" /></div> : null
            )}
            {[bentoArticles[4], bentoArticles[5]].map((a, i) =>
              a ? <div key={a._id}><BentoCard article={a} delay={i * 0.1 + 0.3} className="h-full" /></div> : null
            )}
          </div>
        </div>
      )}

      {/* ════ 6. DOMAIN MATRIX EXPLORER ════ */}
      <div className="pt-8">
        <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden border border-white/15 shadow-2xl">
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[#0EA5E9]/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-[0.3em] mb-3 font-extrabold">// DOMAIN NAVIGATION MATRIX</div>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-paper mb-4 tracking-tight">
              Explore All <span className="gradient-text-gold">14 Intelligence Domains</span>
            </h2>
            <p className="text-paper-dim text-sm sm:text-base max-w-xl mx-auto mb-10 font-sans font-light">
              Select a domain below or from the pinned left HUD sidebar to trigger instant neural feed filtering and a real-time 3D background scene transition.
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {sectors.map((s) => (
                <Link
                  key={s.name}
                  to={`/sector/${s.name}`}
                  onClick={() => triggerGlitch(300)}
                  className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 text-paper font-mono text-xs uppercase tracking-widest transition-all hover:scale-105 flex items-center gap-2.5 shadow-lg group"
                >
                  <span className="w-2 h-2 rounded-full group-hover:scale-125 transition-transform shadow-sm" style={{ backgroundColor: s.color }} />
                  <span className="font-bold">{s.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}