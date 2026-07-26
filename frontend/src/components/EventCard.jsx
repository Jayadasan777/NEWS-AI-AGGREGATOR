import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SignalMeter from './SignalMeter';
import SectorBadge from './SectorBadge';
import { useHUD } from '../context/HUDContext';

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
  const { triggerGlitch } = useHUD();
  const [imgError, setImgError] = useState(false);
  const [showTakeaways, setShowTakeaways] = useState(false);

  const fallback = FALLBACKS[event.sector] || FALLBACKS.Default;
  const imgSrc = imgError || !event.image_url ? fallback : event.image_url;
  const srcCount = event.source_articles?.length || 1;
  const takeaways = getTakeaways(event.fused_summary);
  const timestampStr = event.last_updated || event.first_reported;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="group relative rounded-3xl overflow-hidden flex flex-col h-full glass-panel-interactive border border-white/10"
    >
      <Link to={`/event/${event._id}`} onClick={() => triggerGlitch(200)} className="flex flex-col h-full">
        {/* Image Header */}
        <div className="relative h-48 w-full overflow-hidden flex-shrink-0 border-b border-white/10 bg-[#080B11]">
          <img
            src={imgSrc}
            alt={event.event_title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-75 group-hover:opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D121C] via-[#0D121C]/30 to-transparent" />

          <div className="absolute top-3.5 right-3.5 bg-[#080B11]/80 backdrop-blur-md rounded-xl px-3 py-1 border border-white/10 shadow-lg">
            <SignalMeter score={event.confidence_score} size="sm" />
          </div>

          <div className="absolute top-3.5 left-3.5">
            <SectorBadge sector={event.sector} size="sm" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col flex-grow justify-between relative z-10">
          <div>
            <div className="flex items-center justify-between mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em]">
              <span className="text-[#A0A0A0] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
                <span>SYNTHESIZED CLUSTER</span>
              </span>
              <span className="px-2 py-0.5 rounded border border-[#2A2A2A] text-[#A0A0A0] font-semibold text-[9px]">
                {srcCount} SRC{srcCount > 1 ? 'S' : ''}
              </span>
            </div>

            {/* Editorial Serif Headline */}
            <h3 className="font-display font-bold text-[#F5F5F5] text-base md:text-lg leading-snug group-hover:text-white transition-colors duration-300 line-clamp-2 mb-3">
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
                    className="space-y-1.5 bg-[#0A0A0A] p-3.5 rounded-xl border border-[#2A2A2A]"
                  >
                    <div className="font-mono text-[9px] text-[#606060] uppercase tracking-widest font-bold mb-1">
                      KEY TAKEAWAYS:
                    </div>
                    {takeaways.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-[#C8C8C8] font-sans">
                        <span className="text-[#A0A0A0] font-bold">▸</span>
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
                    className="text-paper-dim/90 text-xs line-clamp-3 leading-relaxed font-sans font-light"
                  >
                    {event.fused_summary}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Updated Timestamp */}
          {timestampStr && (
            <div className="font-mono text-[10px] text-[#A0A0A0] mb-3 flex items-center gap-1.5 font-medium tracking-wide">
              <span>📅</span>
              <span>{formatFullDateTime(timestampStr)}</span>
            </div>
          )}


          {/* Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTakeaways(!showTakeaways);
              }}
              className="px-2.5 py-1 rounded-lg border border-[#2A2A2A] hover:border-[#3A3A3A] text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors flex items-center gap-1.5 font-bold text-[9px]"
            >
              <span>{showTakeaways ? '✕ SUMMARY' : '≡ TAKEAWAYS'}</span>
            </button>
            <span className="text-[#A0A0A0] group-hover:text-[#F5F5F5] transition-colors font-extrabold flex items-center gap-1">
              OPEN REPORT <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}