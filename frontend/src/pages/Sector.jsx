import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import EventCard from '../components/EventCard';
import { BentoCard } from '../components/BentoCard';
import { useHUD } from '../context/HUDContext';
import { getSector } from '../data/sectors';

const TABS = [
  { id: 'all',      getLabel: (e, a) => `All (${e + a})` },
  { id: 'events',   getLabel: (e)    => `Clusters (${e})` },
  { id: 'articles', getLabel: (_, a) => `Dispatches (${a})` },
];

export default function Sector() {
  const { sectorName } = useParams();
  const { setActiveSector } = useHUD();
  const [events,    setEvents]    = useState([]);
  const [articles,  setArticles]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const sector = sectorName?.charAt(0).toUpperCase() + sectorName?.slice(1);
  const meta   = getSector(sector);

  useEffect(() => { setActiveSector(sector); }, [sector, setActiveSector]);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const [evtRes, artRes] = await Promise.all([
          API.get(`/events?sector=${sector}`),
          API.get(`/articles?sector=${sector}`),
        ]);
        setEvents(evtRes.data.data || []);
        setArticles(artRes.data.data || []);
      } catch { setError('Failed to synchronize domain intelligence.'); }
      finally { setLoading(false); }
    })();
  }, [sector]);

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full animate-spin"
             style={{ border: '2px solid transparent', borderTop: '2px solid var(--color-paper)', borderRight: '2px solid var(--color-paper-dim)' }} />
      </div>
      <p className="section-label animate-pulse" style={{ color: 'var(--color-paper)' }}>
        Synthesizing {sector.toUpperCase()} domain…
      </p>
    </div>
  );

  if (error) return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="glass-card p-10 max-w-md w-full text-center" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
        <p className="section-label mb-3" style={{ color: 'var(--color-paper)' }}>Domain Error</p>
        <p className="font-semibold mb-6" style={{ color: 'var(--color-paper)' }}>{error}</p>
        <Link to="/" className="btn-primary">← Return to Core Wire</Link>
      </div>
    </div>
  );

  const total = events.length + articles.length;

  return (
    <div className="space-y-14">

      {/* ── Domain Hero ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* Breadcrumb */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8 text-xs font-mono font-bold uppercase tracking-widest transition-colors group"
              style={{ color: 'var(--color-muted)' }}>
          <span className="group-hover:-translate-x-1 transition-transform inline-block" style={{ color: 'var(--color-paper)' }}>←</span>
          Core Wire
        </Link>

        {/* Hero block */}
        <div className="glass-card rounded-2xl p-8 sm:p-10 mb-8 relative overflow-hidden"
             style={{ borderColor: 'var(--color-border)' }}>
          {/* Color accent top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-white" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <span style={{ color: 'var(--color-paper)' }}>DOMAIN ACTIVE</span>
                <span style={{ color: 'var(--color-subtle)' }}>·</span>
                <span style={{ color: 'var(--color-muted)' }}>{meta.tag}</span>
                <span style={{ color: 'var(--color-subtle)' }}>·</span>
                <span style={{ color: 'var(--color-paper-dim)' }}>{total} signals</span>
              </div>

              <h1 className="font-black text-5xl sm:text-7xl tracking-tight leading-none">
                <span style={{ color: 'var(--color-paper)' }}>{sector}</span>
                <span className="ml-3 text-3xl sm:text-5xl font-light" style={{ color: 'var(--color-subtle)' }}>// wire</span>
              </h1>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl shrink-0"
                 style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)' }}>
              {TABS.map(({ id, getLabel }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className="px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all"
                  style={{
                    background: activeTab === id ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: activeTab === id ? '1px solid rgba(255,255,255,0.35)' : '1px solid transparent',
                    color: activeTab === id ? 'var(--color-paper)' : 'var(--color-muted)',
                  }}
                >
                  {id === 'all'      ? getLabel(events.length, articles.length)
                   : id === 'events' ? getLabel(events.length)
                   :                   getLabel(null, articles.length)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Content ── */}
      {total === 0 ? (
        <div className="glass-card p-16 text-center rounded-2xl">
          <div className="text-5xl mb-4">📡</div>
          <p className="section-label mb-2" style={{ color: 'var(--color-muted)' }}>No Intel Acquired Yet</p>
          <p className="font-bold text-xl mb-2" style={{ color: 'var(--color-paper)' }}>No active signals in {sector}.</p>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>RSS ingestion runs every 6h. Try another sector.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* Clusters */}
          {(activeTab === 'all' || activeTab === 'events') && events.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-7 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="live-dot" />
                <span style={{ color: 'var(--color-paper)' }}>Synthesized Clusters</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--color-border), transparent)' }} />
                <span className="badge badge-ai">Llama 3.1 Verified</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((ev) => <EventCard key={ev._id} event={ev} />)}
              </div>
            </div>
          )}

          {/* Dispatches */}
          {(activeTab === 'all' || activeTab === 'articles') && articles.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-7 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span style={{ color: 'var(--color-paper)' }}>Raw Feed Dispatches</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--color-border), transparent)' }} />
                <span className="badge badge-ai">100% AI Original</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map((art, i) => <BentoCard key={art._id} article={art} delay={i * 0.04} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}