import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import EventCard from '../components/EventCard';
import { BentoCard } from '../components/BentoCard';
import { useHUD } from '../context/HUDContext';
import { getSector } from '../data/sectors';

export default function Sector() {
  const { sectorName } = useParams();
  const { setActiveSector, triggerGlitch } = useHUD();
  const [events, setEvents] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all | events | articles

  const formattedSector = sectorName?.charAt(0).toUpperCase() + sectorName?.slice(1);
  const sectorMeta = getSector(formattedSector);

  useEffect(() => {
    setActiveSector(formattedSector);
  }, [formattedSector, setActiveSector]);

  useEffect(() => {
    const fetchSectorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [evtRes, artRes] = await Promise.all([
          API.get(`/events?sector=${formattedSector}`),
          API.get(`/articles?sector=${formattedSector}`),
        ]);
        setEvents(evtRes.data.data || []);
        setArticles(artRes.data.data || []);
      } catch (err) {
        setError('Failed to synchronize domain intelligence.');
      } finally {
        setLoading(false);
      }
    };
    fetchSectorData();
    window.scrollTo(0, 0);
  }, [formattedSector]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: sectorMeta.color, borderTopColor: 'transparent' }} />
        <div className="font-mono text-xs tracking-[0.28em] uppercase animate-pulse font-bold" style={{ color: sectorMeta.color }}>
          // SYNTHESIZING {formattedSector.toUpperCase()} DOMAIN WIRE...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel rounded-3xl p-10 max-w-md text-center border border-white/20 shadow-2xl">
          <div className="font-mono text-xs text-[#F59E0B] tracking-[0.25em] uppercase mb-2 font-bold">// DOMAIN ERROR</div>
          <p className="text-paper font-semibold mb-6">{error}</p>
          <Link to="/" className="px-6 py-3 rounded-full bg-[#F59E0B] text-[#080B11] font-mono font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 inline-block">
            ← RETURN TO CORE WIRE
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* ── Domain Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6 border-b border-white/15 pb-12"
      >
        <Link
          to="/"
          onClick={() => triggerGlitch(200)}
          className="inline-flex items-center gap-2.5 text-muted hover:text-paper font-mono text-xs uppercase tracking-[0.25em] mb-8 group font-bold"
        >
          <span className="group-hover:-translate-x-1.5 transition-transform text-[#F59E0B]">←</span> CORE WIRE DIRECTORY
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] mb-3 font-bold">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm" style={{ backgroundColor: sectorMeta.color }} />
              <span style={{ color: sectorMeta.color }}>// DOMAIN ACTIVE // {sectorMeta.tag}</span>
              <span className="text-muted/40">•</span>
              <span className="text-muted/70">{events.length} CLUSTERS / {articles.length} RAW DISPATCHES</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-paper tracking-tight leading-none">
              {formattedSector} <span className="text-muted/40 font-light">// WIRE</span>
            </h1>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 glass-nav p-1.5 rounded-2xl border border-white/10 font-mono text-xs uppercase tracking-widest shadow-xl">
            {[
              { id: 'all',      label: `ALL (${events.length + articles.length})` },
              { id: 'events',   label: `CLUSTERS (${events.length})` },
              { id: 'articles', label: `DISPATCHES (${articles.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-xl transition-all font-bold ${
                  activeTab === t.id
                    ? 'bg-[#F59E0B] text-[#080B11] shadow-lg'
                    : 'text-muted/80 hover:text-paper hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Content Grid ── */}
      {events.length === 0 && articles.length === 0 ? (
        <div className="glass-panel border border-white/15 rounded-3xl p-20 text-center shadow-2xl max-w-2xl mx-auto">
          <div className="font-mono text-xs text-muted/60 uppercase tracking-[0.3em] mb-3 font-bold">// NO INTEL ACQUIRED YET</div>
          <p className="text-paper text-2xl font-display font-bold mb-3">No active signals in the {formattedSector} domain.</p>
          <p className="text-muted/80 text-sm font-sans font-light">The RSS ingestion engine polls continuously. Try exploring another sector from the left sidebar.</p>
        </div>
      ) : (
        <div className="space-y-20">
          {/* Synthesized Clusters */}
          {(activeTab === 'all' || activeTab === 'events') && events.length > 0 && (
            <div>
              <div className="font-mono text-xs text-[#F59E0B] uppercase tracking-[0.28em] mb-8 flex items-center gap-3 font-extrabold">
                <span>// SYNTHESIZED EVENT CLUSTERS</span>
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-muted/60 font-normal">LLAMA 3.1 VERIFIED</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((ev) => (
                  <EventCard key={ev._id} event={ev} />
                ))}
              </div>
            </div>
          )}

          {/* Raw Dispatches */}
          {(activeTab === 'all' || activeTab === 'articles') && articles.length > 0 && (
            <div>
              <div className="font-mono text-xs text-[#0EA5E9] uppercase tracking-[0.28em] mb-8 flex items-center gap-3 font-extrabold">
                <span>// RAW FEED DISPATCHES</span>
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-muted/60 font-normal">100% ORIGINAL AI COPY</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((art, i) => (
                  <BentoCard key={art._id} article={art} delay={i * 0.05} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}