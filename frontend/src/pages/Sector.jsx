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
        <div className="w-12 h-12 rounded-full border-2 border-[#A0A0A0] border-t-transparent animate-spin" />
        <div className="font-mono text-xs tracking-[0.28em] uppercase animate-pulse font-bold text-[#A0A0A0]">
          SYNTHESIZING {formattedSector.toUpperCase()} DOMAIN WIRE…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel rounded-2xl p-10 max-w-md text-center border border-[#DC2626]/30 shadow-2xl">
          <div className="font-mono text-xs text-[#DC2626] tracking-[0.25em] uppercase mb-2 font-bold">DOMAIN ERROR</div>
          <p className="text-[#F5F5F5] font-semibold mb-6">{error}</p>
          <Link to="/" className="px-6 py-3 rounded-full bg-[#F5F5F5] text-[#0A0A0A] font-mono font-bold text-xs uppercase tracking-widest transition-all hover:bg-transparent hover:text-[#F5F5F5] inline-block border border-[#F5F5F5]">
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
        className="pt-6 border-b border-[#2A2A2A] pb-12"
      >
        <Link
          to="/"
          onClick={() => triggerGlitch(200)}
          className="inline-flex items-center gap-2.5 text-[#606060] hover:text-[#F5F5F5] font-mono text-xs uppercase tracking-[0.25em] mb-8 group font-bold transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform text-[#F5F5F5]">←</span> CORE WIRE DIRECTORY
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] mb-3 font-bold">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm bg-[#DC2626]" />
              <span className="text-[#F5F5F5]">DOMAIN ACTIVE // {sectorMeta.tag}</span>
              <span className="text-[#404040]">•</span>
              <span className="text-[#A0A0A0]">{events.length} CLUSTERS / {articles.length} RAW DISPATCHES</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-[#F5F5F5] tracking-tight leading-none">
              {formattedSector} <span className="text-[#404040] font-light">// WIRE</span>
            </h1>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-[#2A2A2A] bg-[#111111] font-mono text-xs uppercase tracking-widest shadow-xl">
            {[
              { id: 'all',      label: `ALL (${events.length + articles.length})` },
              { id: 'events',   label: `CLUSTERS (${events.length})` },
              { id: 'articles', label: `DISPATCHES (${articles.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-lg transition-all font-bold ${
                  activeTab === t.id
                    ? 'bg-[#F5F5F5] text-[#0A0A0A] shadow-lg'
                    : 'text-[#606060] hover:text-[#F5F5F5] hover:bg-white/5'
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
        <div className="glass-panel border border-[#2A2A2A] rounded-2xl p-20 text-center shadow-2xl max-w-2xl mx-auto">
          <div className="font-mono text-xs text-[#606060] uppercase tracking-[0.3em] mb-3 font-bold">NO INTEL ACQUIRED YET</div>
          <p className="text-[#F5F5F5] text-2xl font-display font-bold mb-3">No active signals in the {formattedSector} domain.</p>
          <p className="text-[#A0A0A0] text-sm font-sans font-light">The RSS ingestion engine polls continuously. Try exploring another sector from the left sidebar.</p>
        </div>
      ) : (
        <div className="space-y-20">
          {/* Synthesized Clusters */}
          {(activeTab === 'all' || activeTab === 'events') && events.length > 0 && (
            <div>
              <div className="font-mono text-xs text-[#F5F5F5] uppercase tracking-[0.28em] mb-8 flex items-center gap-3 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                <span>SYNTHESIZED EVENT CLUSTERS</span>
                <span className="h-px flex-1 bg-[#2A2A2A]" />
                <span className="text-[#606060] font-normal">LLAMA 3.1 VERIFIED</span>
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
              <div className="font-mono text-xs text-[#A0A0A0] uppercase tracking-[0.28em] mb-8 flex items-center gap-3 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-[#A0A0A0]" />
                <span>RAW FEED DISPATCHES</span>
                <span className="h-px flex-1 bg-[#2A2A2A]" />
                <span className="text-[#606060] font-normal">100% ORIGINAL AI COPY</span>
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