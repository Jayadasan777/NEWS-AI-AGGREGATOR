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
  const { sectors, setActiveSector } = useHUD();

  const [allEvents,   setAllEvents]   = useState([]);
  const [allArticles, setAllArticles] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [localQuery,  setLocalQuery]  = useState(query);
  const [sectorFilter, setSector]     = useState('');
  const [activeTab,   setActiveTab]   = useState('all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [evtRes, artRes] = await Promise.all([API.get('/events'), API.get('/articles')]);
        setAllEvents(evtRes.data.data || []);
        setAllArticles(artRes.data.data || []);
      } catch { setError('Failed to query neural intelligence database.'); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { setLocalQuery(query); }, [query]);

  const handleInput = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    val.trim() ? setSearchParams({ q: val.trim() }, { replace: true }) : setSearchParams({}, { replace: true });
  };

  const q = localQuery.toLowerCase().trim();

  const filteredEvents = allEvents.filter(ev => {
    const mq = !q || ev.event_title?.toLowerCase().includes(q) || (ev.fused_summary || '').toLowerCase().includes(q);
    return mq && (!sectorFilter || ev.sector === sectorFilter);
  });

  const filteredArticles = allArticles.filter(art => {
    const mq = !q || art.title?.toLowerCase().includes(q) || (art.unique_summary || '').toLowerCase().includes(q);
    return mq && (!sectorFilter || art.sector === sectorFilter);
  });

  const total = filteredEvents.length + filteredArticles.length;

  return (
    <div className="space-y-12">

      {/* ── Search Header ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <Link to="/" className="inline-flex items-center gap-2 mb-8 text-xs font-mono font-bold uppercase tracking-widest group"
              style={{ color: 'var(--color-muted)' }}>
          <span className="group-hover:-translate-x-1 transition-transform inline-block text-white">←</span>
          Core Wire
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3 mb-3 font-mono text-xs uppercase tracking-widest font-bold">
          <span className="live-dot" style={{ width: 6, height: 6, background: '#ffffff', boxShadow: '0 0 8px #ffffff' }} />
          <span className="text-white">Neural Intelligence Database</span>
          {total > 0 && !loading && (
            <span className="badge badge-ai">{total} results</span>
          )}
        </div>
        <h1 className="font-black text-4xl sm:text-6xl tracking-tight mb-8" style={{ color: 'var(--color-paper)' }}>
          {q ? (
            <>QUERY: <span className="text-gradient">"{localQuery}"</span></>
          ) : (
            <span className="text-gradient">Search Intel</span>
          )}
        </h1>

        {/* Search Input */}
        <div className="relative max-w-3xl mb-8">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search topics, domains, entities, keywords…"
            value={localQuery} onChange={handleInput} autoFocus
            className="w-full text-sm rounded-2xl pl-14 pr-12 py-4 font-mono font-medium transition-all focus:outline-none"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-hi)',
                     color: 'var(--color-paper)', caretColor: 'var(--color-paper)' }}
            onFocus={e => e.target.style.borderColor = 'var(--color-paper)'}
            onBlur={e => e.target.style.borderColor = 'var(--color-border-hi)'}
          />
          {localQuery && (
            <button onClick={() => { setLocalQuery(''); setSearchParams({}, { replace: true }); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all"
              style={{ color: 'var(--color-muted)', background: 'rgba(255,255,255,0.08)' }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sector Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="section-label mr-1">Filter:</span>
          <button onClick={() => setSector('')}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all"
            style={{ background: !sectorFilter ? 'rgba(255,255,255,0.15)' : 'transparent',
                     border: `1px solid ${!sectorFilter ? 'rgba(255,255,255,0.35)' : 'var(--color-border)'}`,
                     color: !sectorFilter ? 'var(--color-paper)' : 'var(--color-muted)' }}>
            All Sectors
          </button>
          {sectors.map(s => (
            <button key={s.name} onClick={() => { setSector(sectorFilter === s.name ? '' : s.name); if (s.name !== sectorFilter) setActiveSector(s.name); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all"
              style={{ background: sectorFilter === s.name ? `${s.color}20` : 'transparent',
                       border: `1px solid ${sectorFilter === s.name ? `${s.color}50` : 'var(--color-border)'}`,
                       color: sectorFilter === s.name ? s.color : 'var(--color-muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Results ── */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-5">
          <div className="w-10 h-10 rounded-full animate-spin"
               style={{ border: '2px solid transparent', borderTop: '2px solid var(--color-paper)', borderRight: '2px solid var(--color-paper-dim)' }} />
          <p className="section-label animate-pulse">Querying neural database…</p>
        </div>
      ) : error ? (
        <div className="glass-card p-10 text-center rounded-2xl">
          <p className="font-semibold" style={{ color: 'var(--color-paper)' }}>{error}</p>
        </div>
      ) : total === 0 ? (
        <div className="glass-card p-16 text-center rounded-2xl">
          <div className="text-5xl mb-4">🔍</div>
          <p className="section-label mb-2" style={{ color: 'var(--color-muted)' }}>Zero Signals Matched</p>
          <p className="font-bold text-xl mb-2" style={{ color: 'var(--color-paper)' }}>No intelligence matched your query.</p>
          <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>Try broader keywords or reset filters.</p>
          <button onClick={() => { setLocalQuery(''); setSector(''); setSearchParams({}, { replace: true }); }}
            className="btn-primary">Reset Filters</button>
        </div>
      ) : (
        <div className="space-y-14">
          {/* Result tabs */}
          <div className="flex items-center gap-2 pb-5 font-mono text-xs uppercase tracking-widest"
               style={{ borderBottom: '1px solid var(--color-border)' }}>
            {[
              { id: 'all', label: `All (${total})` },
              { id: 'events', label: `Clusters (${filteredEvents.length})` },
              { id: 'articles', label: `Dispatches (${filteredArticles.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-4 py-2 rounded-lg font-bold transition-all"
                style={{ background: activeTab === t.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                         border: `1px solid ${activeTab === t.id ? 'rgba(255,255,255,0.35)' : 'transparent'}`,
                         color: activeTab === t.id ? 'var(--color-paper)' : 'var(--color-muted)' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Clusters */}
          {(activeTab === 'all' || activeTab === 'events') && filteredEvents.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="live-dot" style={{ width: 6, height: 6, background: '#ffffff', boxShadow: '0 0 8px #ffffff' }} />
                <span className="text-white">Matched Clusters</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--color-border), transparent)' }} />
                <span className="badge badge-ai">Llama 3.3 Verified</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.map(ev => <EventCard key={ev._id} event={ev} />)}
              </div>
            </div>
          )}

          {/* Articles */}
          {(activeTab === 'all' || activeTab === 'articles') && filteredArticles.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6 font-mono text-xs uppercase tracking-widest font-bold">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                <span className="text-white">Matched Dispatches</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, var(--color-border), transparent)' }} />
                <span className="badge badge-ai">AI Original</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredArticles.map((art, i) => <BentoCard key={art._id} article={art} delay={i * 0.04} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}