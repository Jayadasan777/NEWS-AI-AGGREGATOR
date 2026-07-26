import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../api/axios';
import { FlagshipCard, BentoCard } from '../components/BentoCard';
import { useHUD } from '../context/HUDContext';
import LatestFeed from '../components/LatestFeed';
import AutomationStatus from '../components/AutomationStatus';

/* ─── Loading State ─── */
const LoadingState = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border border-[#DC2626]/40 animate-ping" />
      <div className="absolute inset-0 rounded-full border border-white/10 flex items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
      </div>
    </div>
    <div className="font-mono text-xs text-[#A0A0A0] tracking-[0.3em] uppercase animate-pulse font-bold">
      ACQUIRING FEED…
    </div>
  </div>
);

/* ─── Error State ─── */
const ErrorState = ({ message }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <div className="glass-panel rounded-2xl p-10 max-w-md text-center border border-[#DC2626]/30">
      <div className="font-mono text-xs text-[#DC2626] tracking-[0.28em] uppercase mb-2 font-bold">SIGNAL ERROR</div>
      <p className="text-[#F5F5F5] font-semibold mb-3">{message}</p>
      <p className="text-[#606060] text-xs font-mono">Verify backend server is running.</p>
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

/* ─── Section Header — clean newspaper rule ─── */
const SectionHead = ({ tag, title, right }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="mb-8"
  >
    {/* Top double rule — classic newspaper style */}
    <div className="border-t-[3px] border-[#F5F5F5] mb-1" />
    <div className="border-t border-[#3A3A3A] mb-4" />

    <div className="flex items-end justify-between">
      <div>
        {tag && (
          <span className="font-mono text-[9px] text-[#606060] tracking-[0.3em] uppercase block mb-1.5 font-bold">
            {tag}
          </span>
        )}
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#F5F5F5] tracking-tight">
          {title}
        </h2>
      </div>
      {right && (
        <div className="font-mono text-[10px] text-[#606060] tracking-[0.2em] uppercase hidden sm:block font-bold">
          {right}
        </div>
      )}
    </div>
  </motion.div>
);

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [events,   setEvents]   = useState([]);
  const [latest,   setLatest]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const { triggerGlitch, sectors } = useHUD();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [artRes, evtRes, latestRes] = await Promise.all([
          axios.get('/articles'),
          axios.get('/events'),
          axios.get('/events/latest?limit=6'),
        ]);
        setArticles(Array.isArray(artRes.data) ? artRes.data : artRes.data?.data || []);
        setEvents(Array.isArray(evtRes.data)   ? evtRes.data : evtRes.data?.data   || []);
        setLatest(latestRes.data?.data || []);
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
    <div className="space-y-20">

      {/* ════ 0. AUTOMATION STATUS BAR ════ */}
      <AutomationStatus />

      {/* ════ 1. MASTHEAD HERO ════ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="pt-4"
      >
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2A2A2A] bg-[#111111] font-mono text-[10px] uppercase tracking-[0.25em] mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse shadow-[0_0_6px_#DC2626]" />
          <span className="text-[#DC2626] font-bold">LIVE</span>
          <span className="text-[#606060]">•</span>
          <span className="text-[#A0A0A0]">Autonomous Feed Synthesis Online</span>
        </div>

        {/* Masthead */}
        <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-[#F5F5F5] tracking-tight max-w-4xl leading-[1.04] mb-5">
          GLOBAL WIRE{' '}
          <span className="text-white">// INTELLIGENCE</span>
        </h1>

        <p className="text-[#A0A0A0] text-base sm:text-lg max-w-2xl leading-relaxed font-sans">
          Real-time curation across 14 global domains. Algorithmically deduplicated,
          clustered via Jaccard similarity, and synthesized into executive briefs by
          Llama 3 neural fusion.
        </p>
      </motion.div>

      {/* ════ 2. STATS BAR ════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { v: 14,              s: '',  l: 'Active Domains',  sub: 'Multi-Source RSS' },
          { v: articles.length, s: '+', l: 'Live Dispatches', sub: 'Real-Time Wire'   },
          { v: events.length,   s: '+', l: 'Neural Clusters', sub: 'Llama 3 Fused'    },
          { v: 92,              s: '%', l: 'Avg Confidence',  sub: 'Verification Score'},
        ].map(({ v, s, l, sub }, i) => (
          <motion.div
            key={l}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass-panel rounded-2xl p-5 border border-[#2A2A2A]"
          >
            <div className="font-mono text-[9px] text-[#606060] tracking-[0.25em] uppercase mb-1.5 font-bold">
              {sub}
            </div>
            <div className="font-display font-extrabold text-4xl sm:text-5xl text-[#F5F5F5] mb-1 tracking-tight">
              <AnimCounter to={v} />{s}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest font-extrabold text-[#A0A0A0]">
              {l}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ════ 3. BREAKING / LATEST STRIP ════ */}
      <LatestFeed events={latest} />

      {/* ════ 4. LEAD PRIORITY STORY ════ */}
      {flagship && (
        <div>
          <SectionHead
            tag="Priority Cover Story"
            title="Lead Intelligence Report"
            right="MULTI-SOURCE VERIFIED"
          />
          <FlagshipCard article={flagship} isEvent={isFlagEvent} />
        </div>
      )}

      {/* ════ 5. SYNTHESIZED EVENT CLUSTERS ════ */}
      {bentoEvents.length > 0 && (
        <div>
          <SectionHead
            tag="AI Neural Clustering"
            title="Synthesized Events"
            right={
              <Link
                to="/search"
                onClick={() => triggerGlitch(200)}
                className="hover:text-[#F5F5F5] transition-colors flex items-center gap-1.5 font-bold"
              >
                VIEW ALL →
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bentoEvents.map((ev, i) => (
              <BentoCard key={ev._id} article={ev} isEvent delay={i * 0.1} />
            ))}
          </div>
        </div>
      )}

      {/* ════ 6. LIVE EDITORIAL DISPATCHES ════ */}
      {bentoArticles.length > 0 && (
        <div>
          <SectionHead
            tag="Continuous Wire Stream"
            title="Live Editorial Dispatches"
            right="100% AI REWRITTEN"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">
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

      {/* ════ 7. DOMAIN MATRIX EXPLORER ════ */}
      <div className="pt-4">
        <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center border border-[#2A2A2A]">
          <div className="font-mono text-[9px] text-[#606060] uppercase tracking-[0.3em] mb-3 font-extrabold">
            DOMAIN NAVIGATION MATRIX
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-[#F5F5F5] mb-4 tracking-tight">
            Explore All{' '}
            <span className="text-white">14 Intelligence Domains</span>
          </h2>
          <p className="text-[#A0A0A0] text-sm sm:text-base max-w-xl mx-auto mb-8 font-sans">
            Select a domain from the left sidebar or below for instant neural feed filtering.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
            {sectors.map((s) => (
              <Link
                key={s.name}
                to={`/sector/${s.name}`}
                onClick={() => triggerGlitch(300)}
                className="px-4 py-2.5 rounded-xl border border-[#2A2A2A] bg-[#111111] hover:bg-[#181818] hover:border-[#3A3A3A] text-[#A0A0A0] hover:text-[#F5F5F5] font-mono text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 group"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="font-bold">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}