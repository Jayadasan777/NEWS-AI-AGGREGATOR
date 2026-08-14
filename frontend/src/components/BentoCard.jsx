import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SectorBadge from './SectorBadge';
import SignalMeter from './SignalMeter';

const FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getTakeaways(summary = '') {
  return summary.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15).slice(0, 3).map(s => s + '.');
}

/* ── Article / Event Card ── */
export function BentoCard({ article, className = '', delay = 0, isEvent = false }) {
  const [showTakeaways, setShowTakeaways] = useState(false);

  const data = isEvent ? {
    title:      article.event_title,
    summary:    article.fused_summary,
    image:      article.image_url,
    sector:     article.sector,
    href:       `/event/${article._id}`,
    confidence: article.confidence_score,
    tag:        'AI Cluster',
    sources:    article.source_articles?.length || 1,
    timestamp:  article.last_updated || article.first_reported,
    type:       'event',
  } : {
    title:      article.title,
    summary:    article.unique_summary,
    image:      article.image_url,
    sector:     article.sector,
    href:       `/article/${article._id}`,
    confidence: null,
    tag:        'Live',
    sources:    null,
    timestamp:  article.timestamp,
    type:       'article',
  };

  const takeaways = getTakeaways(data.summary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`group glass-card flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-white/35 hover:-translate-y-1 ${className}`}
    >
      <Link to={data.href} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative flex-shrink-0 h-44 overflow-hidden rounded-t-[20px]">
          <img src={data.image || FALLBACK} alt={data.title} onError={e => { e.target.src = FALLBACK; }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-65 group-hover:opacity-80"
          />
          {/* Glassmorphism gradient fade */}
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to top, rgba(3,7,17,0.95) 0%, rgba(3,7,17,0.5) 50%, transparent 100%)' }} />

          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <SectorBadge sector={data.sector} size="sm" />
            {data.type === 'event'
              ? <span className="badge badge-ai">AI Cluster</span>
              : <span className="badge badge-live">Live</span>}
          </div>

          {data.confidence != null && (
            <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-xl font-mono text-xs"
                 style={{ background: 'rgba(3,7,17,0.7)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              <SignalMeter score={data.confidence} size="sm" />
            </div>
          )}

          {data.timestamp && (
            <div className="absolute bottom-3 right-3 z-10 font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg"
                 style={{ color: 'var(--color-paper-dim)', background: 'rgba(3,7,17,0.65)', backdropFilter: 'blur(8px)' }}>
              {timeAgo(data.timestamp)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base leading-snug line-clamp-2 mb-3 transition-all group-hover:text-gradient"
                style={{ color: 'var(--color-paper)' }}>
              {data.title}
            </h3>

            <AnimatePresence mode="wait">
              {showTakeaways ? (
                <motion.div key="tk" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-2 p-3.5 rounded-xl border-l-2 border-white bg-white/5"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>Llama 3.3 Neural Takeaways</span>
                  </p>
                  {takeaways.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-[var(--color-paper)]">
                      <span className="mt-0.5 shrink-0 font-bold text-white">▸</span>
                      <span className="line-clamp-2">{pt}</span>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.p key="sum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs leading-relaxed line-clamp-3"
                  style={{ color: 'var(--color-paper-dim)' }}>
                  {data.summary}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between"
               style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); setShowTakeaways(!showTakeaways); }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
              style={{
                background: showTakeaways ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showTakeaways ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.09)'}`,
                color: showTakeaways ? 'var(--color-paper)' : 'var(--color-paper-dim)',
                backdropFilter: 'blur(8px)',
              }}>
              {showTakeaways ? 'Summary' : 'AI Brief'}
            </button>
            <span className="text-xs font-bold font-mono flex items-center gap-1 group-hover:gap-2 transition-all text-gradient">
              Read →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Flagship Card ── */
export function FlagshipCard({ article, isEvent = false }) {
  const data = isEvent ? {
    title:      article.event_title,
    summary:    article.fused_summary,
    image:      article.image_url,
    sector:     article.sector,
    href:       `/event/${article._id}`,
    confidence: article.confidence_score,
    tag:        'Priority Cluster',
    sources:    article.source_articles?.length || 1,
  } : {
    title:      article.title,
    summary:    article.unique_summary,
    image:      article.image_url,
    sector:     article.sector,
    href:       `/article/${article._id}`,
    confidence: null,
    tag:        'Top Story',
    sources:    null,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1"
      style={{
        minHeight: 520, borderRadius: 28,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        boxShadow: '0 12px 64px rgba(0,0,0,0.7), 0 0 24px rgba(255,255,255,0.05)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
        e.currentTarget.style.boxShadow = '0 16px 80px rgba(0,0,0,0.9), 0 0 32px rgba(255,255,255,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
        e.currentTarget.style.boxShadow = '0 12px 64px rgba(0,0,0,0.7), 0 0 24px rgba(255,255,255,0.05)';
      }}
    >
      <Link to={data.href} className="block w-full h-full">
        <div className="absolute inset-0 overflow-hidden rounded-[28px]">
          <img src={data.image || FALLBACK} alt={data.title}
            onError={e => { e.target.src = FALLBACK; }}
            className="w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700"
          />
        </div>

        {/* Gradient layers */}
        <div className="absolute inset-0 rounded-[28px]"
             style={{ background: 'linear-gradient(to top, rgba(3,7,17,0.98) 0%, rgba(3,7,17,0.7) 45%, rgba(3,7,17,0.2) 100%)' }} />
        <div className="absolute inset-0 rounded-[28px]"
             style={{ background: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.18) 0%, transparent 70%)' }} />

        {/* Badges */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between flex-wrap gap-3 z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono font-black uppercase tracking-widest text-white"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(10px)' }}>
              <span className="live-dot" style={{ width: 5, height: 5, background: '#ffffff', boxShadow: '0 0 6px rgba(255,255,255,0.8)' }} />
              {data.tag}
            </span>
            <SectorBadge sector={data.sector} />
          </div>
          {data.confidence != null && (
            <div className="px-3 py-1.5 rounded-xl font-mono text-xs"
                 style={{ background: 'rgba(3,7,17,0.7)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
              <SignalMeter score={data.confidence} size="sm" />
            </div>
          )}
        </div>

        {/* Bottom glass panel */}
        <div className="absolute inset-x-5 bottom-5 sm:inset-x-8 sm:bottom-8 z-10">
          <div className="p-6 sm:p-8 rounded-2xl"
               style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(32px) saturate(200%)', boxShadow: '0 8px 48px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center gap-2.5 mb-4 font-mono text-[10px] uppercase tracking-widest font-black text-white">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> PRIORITY INTELLIGENCE</span>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span style={{ color: 'var(--color-paper-dim)' }}>Llama 3.3 Neural Synthesis</span>
              {data.sources > 1 && <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-white/30 bg-white/10 text-white ml-auto">{data.sources} Sources</span>}
            </div>

            <h2 className="font-black text-2xl sm:text-3xl md:text-4xl leading-tight mb-3 text-white group-hover:text-gradient transition-all">
              {data.title}
            </h2>

            <p className="text-sm leading-relaxed line-clamp-2 mb-5" style={{ color: 'var(--color-paper-dim)' }}>
              {data.summary}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                Multi-Source Neural Verified
              </span>
              <span className="font-mono text-xs font-black text-white flex items-center gap-1.5 group-hover:gap-3 transition-all">
                Open Executive Brief →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
