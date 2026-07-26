import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import EventCard from '../components/EventCard';
import { BentoCard } from '../components/BentoCard';
import { useHUD } from '../context/HUDContext';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { sectors, setActiveSector, triggerGlitch } = useHUD();

  const [allEvents, setAllEvents]     = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [localQuery, setLocalQuery]   = useState(query);
  const [sectorFilter, setSectorFilter] = useState('');
  const [activeTab, setActiveTab]     = useState('all');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [evtRes, artRes] = await Promise.all([
          API.get('/events'),
          API.get('/articles'),
        ]);
        setAllEvents(evtRes.data.data || []);
        setAllArticles(artRes.data.data || []);
      } catch {
        setError('Failed to query neural intelligence database.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => { setLocalQuery(query); }, [query]);

  const handleInput = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const q = localQuery.toLowerCase().trim();

  const filteredEvents = allEvents.filter((ev) => {
    const matchesQuery = !q || ev.event_title?.toLowerCase().includes(q) || (ev.fused_summary || '').toLowerCase().includes(q);
    const matchesSector = !sectorFilter || ev.sector === sectorFilter;
    return matchesQuery && matchesSector;
  });

  const filteredArticles = allArticles.filter((art) => {
    const matchesQuery = !q || art.title?.toLowerCase().includes(q) || (art.unique_summary || '').toLowerCase().includes(q);
    const matchesSector = !sectorFilter || art.sector === sectorFilter;
    return matchesQuery && matchesSector;
  });

  const handleSectorClick = (sName) => {
    triggerGlitch(200);
    const next = sectorFilter === sName ? '' : sName;
    setSectorFilter(next);
    if (next) setActiveSector(next);
  };

  return (
    <div className="space-y-16">
      {/* ── Search Header ── */}
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
          <span className="group-hover:-translate-x-1.5 transition-transform text-[#F5F5F5]">←</span> CORE WIRE DIRECTORY
        </Link>

        <div className="font-mono text-xs text-[#F5F5F5] uppercase tracking-[0.28em] mb-3 font-extrabold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
          <span>MULTI-SOURCE NEURAL QUERY DATABASE</span>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-[#F5F5F5] tracking-tight mb-10 leading-none">
          {q ? <>QUERY: <span className="text-white">"{localQuery.toUpperCase()}"</span></> : 'INTELLIGENCE SEARCH'}
        </h1>

        {/* Big Search Input */}
        <div className="relative max-w-4xl mb-10">
          <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-[#A0A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="SEARCH TOPICS, DOMAINS, ENTITIES, OR KEYWORDS..."
            value={localQuery}
            onChange={handleInput}
            autoFocus
            className="w-full bg-[#111111] text-[#F5F5F5] text-base md:text-lg font-mono uppercase tracking-[0.15em] rounded-2xl pl-16 pr-12 py-5 border border-[#2A2A2A] focus:outline-none focus:border-[#F5F5F5] transition-all placeholder:text-[#606060] shadow-2xl font-bold"
          />
          {localQuery && (
            <button
              onClick={() => { setLocalQuery(''); setSearchParams({}, { replace: true }); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors font-mono text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Domain Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest">
          <span className="text-[#606060] mr-2 font-bold">FILTER BY DOMAIN:</span>
          <button
            onClick={() => { triggerGlitch(150); setSectorFilter(''); }}
            className={`px-3.5 py-2 rounded-lg transition-all font-bold ${
              !sectorFilter ? 'bg-[#F5F5F5] text-[#0A0A0A] shadow-lg' : 'bg-[#111111] text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#181818] border border-[#2A2A2A]'
            }`}
          >
            ALL SECTORS
          </button>
          {sectors.map((s) => (
            <button
              key={s.name}
              onClick={() => handleSectorClick(s.name)}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 font-bold ${
                sectorFilter === s.name ? 'bg-[#F5F5F5] text-[#0A0A0A] shadow-lg scale-105' : 'bg-[#111111] text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#181818] border border-[#2A2A2A]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Results Display ── */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-5">
          <div className="w-12 h-12 rounded-full border border-[#A0A0A0]/40 border-t-[#F5F5F5] animate-spin" />
          <div className="font-mono text-xs text-[#A0A0A0] tracking-[0.28em] uppercase animate-pulse font-bold">
            QUERYING NEURAL CLUSTERS…
          </div>
        </div>
      ) : error ? (
        <div className="glass-panel rounded-2xl p-10 text-center border border-[#DC2626]/40 max-w-md mx-auto shadow-2xl">
          <p className="text-[#F5F5F5] font-semibold mb-2">{error}</p>
        </div>
      ) : filteredEvents.length === 0 && filteredArticles.length === 0 ? (
        <div className="glass-panel border border-[#2A2A2A] rounded-2xl p-20 text-center max-w-2xl mx-auto shadow-2xl">
          <div className="font-mono text-xs text-[#606060] uppercase tracking-[0.3em] mb-3 font-bold">ZERO SIGNALS MATCHED</div>
          <p className="text-[#F5F5F5] text-2xl font-display font-bold mb-3">No intelligence matched your query parameters.</p>
          <p className="text-[#A0A0A0] text-sm mb-8 font-sans font-light">Try broadening your keywords or resetting the domain filters.</p>
          <button
            onClick={() => { setLocalQuery(''); setSectorFilter(''); setSearchParams({}, { replace: true }); }}
            className="px-6 py-3 rounded-full bg-[#F5F5F5] text-[#0A0A0A] font-mono font-bold text-xs uppercase tracking-widest transition-all hover:bg-transparent hover:text-[#F5F5F5] border border-[#F5F5F5] shadow-lg"
          >
            RESET ALL FILTERS
          </button>
        </div>
      ) : (
        <div className="space-y-20">
          {/* Results Tab Header */}
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest border-b border-[#2A2A2A] pb-5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2.5 rounded-lg transition-all font-bold ${activeTab === 'all' ? 'bg-[#F5F5F5] text-[#0A0A0A] shadow-lg' : 'text-[#606060] hover:text-[#F5F5F5] hover:bg-[#181818]'}`}
            >
              ALL RESULTS ({filteredEvents.length + filteredArticles.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2.5 rounded-lg transition-all font-bold ${activeTab === 'events' ? 'bg-[#F5F5F5] text-[#0A0A0A] shadow-lg' : 'text-[#606060] hover:text-[#F5F5F5] hover:bg-[#181818]'}`}
            >
              CLUSTERS ({filteredEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`px-4 py-2.5 rounded-lg transition-all font-bold ${activeTab === 'articles' ? 'bg-[#F5F5F5] text-[#0A0A0A] shadow-lg' : 'text-[#606060] hover:text-[#F5F5F5] hover:bg-[#181818]'}`}
            >
              DISPATCHES ({filteredArticles.length})
            </button>
          </div>

          {/* Synthesized Clusters */}
          {(activeTab === 'all' || activeTab === 'events') && filteredEvents.length > 0 && (
            <div>
              <div className="font-mono text-xs text-[#F5F5F5] uppercase tracking-[0.28em] mb-8 flex items-center gap-3 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                <span>MATCHED EVENT CLUSTERS</span>
                <span className="h-px flex-1 bg-[#2A2A2A]" />
                <span className="text-[#606060] font-normal">LLAMA 3.1 VERIFIED</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((ev) => (
                  <EventCard key={ev._id} event={ev} />
                ))}
              </div>
            </div>
          )}

          {/* Raw Dispatches */}
          {(activeTab === 'all' || activeTab === 'articles') && filteredArticles.length > 0 && (
            <div>
              <div className="font-mono text-xs text-[#A0A0A0] uppercase tracking-[0.28em] mb-8 flex items-center gap-3 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-[#A0A0A0]" />
                <span>MATCHED RAW DISPATCHES</span>
                <span className="h-px flex-1 bg-[#2A2A2A]" />
                <span className="text-[#606060] font-normal">100% ORIGINAL AI COPY</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArticles.map((art, i) => (
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