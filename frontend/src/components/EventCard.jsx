import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SignalMeter from './SignalMeter';
import SectorBadge from './SectorBadge';

const FALLBACKS = {
  Tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  Finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  Geopolitics: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
  Default: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
};

function formatFullDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const dayDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dayDate} • ${time}`;
}

function getTakeaways(summary = '') {
  const sentences = summary.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 15);
  return sentences.slice(0, 3).map((s) => s + '.');
}

export default function EventCard({ event }) {
  const [imgError, setImgError] = useState(false);
  const [showTakeaways, setShowTakeaways] = useState(false);

  const fallback = FALLBACKS[event.sector] || FALLBACKS.Default;
  const imgSrc = imgError || !event.image_url ? fallback : event.image_url;
  const srcCount = event.source_articles?.length || 1;
  const takeaways = getTakeaways(event.fused_summary);
  const timestampStr = event.last_updated || event.first_reported;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4 }}
      className="group glass-card flex flex-col h-full overflow-hidden transition-all duration-300 hover:border-white/35 hover:-translate-y-1"
    >
      <Link to={`/event/${event._id}`} className="flex flex-col h-full">
        {/* Image Header */}
        <div className="relative h-44 w-full overflow-hidden flex-shrink-0 rounded-t-[20px]">
          <img
            src={imgSrc}
            alt={event.event_title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-65 group-hover:opacity-80"
          />
          <div className="absolute inset-0"
               style={{ background: 'linear-gradient(to top, rgba(3,7,17,0.95) 0%, rgba(3,7,17,0.5) 50%, transparent 100%)' }} />

          <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded-xl font-mono text-xs"
               style={{ background: 'rgba(3,7,17,0.7)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <SignalMeter score={event.confidence_score} size="sm" />
          </div>

          <div className="absolute top-3 left-3 z-10">
            <SectorBadge sector={event.sector} size="sm" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col flex-grow justify-between relative z-10">
          <div>
            <div className="flex items-center justify-between mb-2.5 font-mono text-[10px] uppercase tracking-widest">
              <span className="text-white font-bold flex items-center gap-1.5">
                <span className="live-dot" style={{ width: 5, height: 5 }} />
                <span>AI Cluster</span>
              </span>
              <span className="badge badge-ai">
                {srcCount} SRC{srcCount > 1 ? 'S' : ''}
              </span>
            </div>

            <h3 className="font-bold text-base leading-snug group-hover:text-gradient transition-all duration-300 line-clamp-2 mb-3"
                style={{ color: 'var(--color-paper)' }}>
              {event.event_title}
            </h3>

            {/* Takeaways Toggle */}
            <div className="mb-4">
              <AnimatePresence mode="wait">
                {showTakeaways ? (
                  <motion.div
                    key="takeaways"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="space-y-2 p-3.5 rounded-xl border-l-2 border-white bg-white/5"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)', borderBottom: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white font-bold flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <span>Llama 3 Neural Takeaways</span>
                    </div>
                    {takeaways.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-[var(--color-paper)]">
                        <span className="mt-0.5 shrink-0 font-bold text-white">▸</span>
                        <span className="line-clamp-2">{point}</span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.p
                    key="summary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs leading-relaxed line-clamp-3"
                    style={{ color: 'var(--color-paper-dim)' }}
                  >
                    {event.fused_summary}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Timestamp */}
          {timestampStr && (
            <div className="font-mono text-[10px] mb-3 flex items-center gap-1.5 font-medium tracking-wide"
                 style={{ color: 'var(--color-muted)' }}>
              <span>📅</span>
              <span>{formatFullDateTime(timestampStr)}</span>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest"
               style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTakeaways(!showTakeaways);
              }}
              className="px-2.5 py-1 rounded-lg transition-all font-bold"
              style={{
                background: showTakeaways ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showTakeaways ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.09)'}`,
                color: showTakeaways ? 'var(--color-paper)' : 'var(--color-paper-dim)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span>{showTakeaways ? 'Summary' : 'AI Brief'}</span>
            </button>
            <span className="text-xs font-bold font-mono flex items-center gap-1 group-hover:gap-2 transition-all text-gradient">
              Report →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}