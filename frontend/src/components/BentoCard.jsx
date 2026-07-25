import React, { useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import SectorBadge from './SectorBadge';
import SignalMeter from './SignalMeter';
import { useHUD } from '../context/HUDContext';

const FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80';

/**
 * Helper to split summary into 2-3 executive bullet takeaways for instant preview
 */
function getTakeaways(summary = '') {
  const sentences = summary.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 15);
  return sentences.slice(0, 3).map((s) => s + '.');
}

/* ── Anti-gravity 3D tilt card with AI Takeaway Preview ──────────────── */
export function BentoCard({ article, className = '', delay = 0, isEvent = false }) {
  const { triggerGlitch } = useHUD();
  const cardRef = useRef(null);
  const [showTakeaways, setShowTakeaways] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), { stiffness: 200, damping: 25 });
  const rotY = useSpring(useTransform(x, [-0.5, 0.5], [-7, 7]), { stiffness: 200, damping: 25 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top)  / rect.height - 0.5);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const data = isEvent ? {
    id: article._id,
    title: article.event_title,
    summary: article.fused_summary,
    image: article.image_url,
    sector: article.sector,
    href: `/event/${article._id}`,
    confidence: article.confidence_score,
    tag: 'SYNTHESIZED CLUSTER',
    sources: article.source_articles?.length || 1,
  } : {
    id: article._id,
    title: article.title,
    summary: article.unique_summary,
    image: article.image_url,
    sector: article.sector,
    href: `/article/${article._id}`,
    confidence: null,
    tag: 'LIVE DISPATCH',
    sources: null,
  };

  const takeaways = getTakeaways(data.summary);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-3xl overflow-hidden flex flex-col h-full glass-panel-interactive border border-white/10 ${className}`}
    >
      <Link to={data.href} onClick={() => triggerGlitch(200)} className="flex flex-col h-full">
        {/* Image Header */}
        <div className="relative flex-shrink-0 overflow-hidden h-52 border-b border-white/10 bg-[#080B11]">
          <img
            src={data.image || FALLBACK}
            alt={data.title}
            onError={(e) => { e.target.src = FALLBACK; }}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-80 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D121C] via-[#0D121C]/30 to-transparent" />
          
          <div className="absolute top-3.5 left-3.5 z-10">
            <SectorBadge sector={data.sector} size="sm" />
          </div>

          {data.confidence != null ? (
            <div className="absolute top-3.5 right-3.5 bg-[#080B11]/80 backdrop-blur-md rounded-xl px-3 py-1 border border-white/10 flex items-center gap-1.5 shadow-lg">
              <SignalMeter score={data.confidence} size="sm" />
            </div>
          ) : (
            <div className="absolute top-3.5 right-3.5 bg-[#080B11]/80 backdrop-blur-md rounded-xl px-2.5 py-1 border border-white/10 font-mono text-[9px] text-[#10B981] uppercase tracking-widest font-bold">
              100% AI ORIGINAL
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 flex flex-col justify-between z-10 relative">
          <div>
            <div className="flex items-center justify-between mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              <span className="text-[#F59E0B] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                <span>// {data.tag}</span>
              </span>
              {data.sources && (
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-paper font-semibold">
                  {data.sources} SRCS FUSED
                </span>
              )}
            </div>

            {/* Editorial Serif Headline */}
            <h3 className="font-display font-bold text-paper text-lg md:text-xl leading-snug line-clamp-2 group-hover:text-[#F59E0B] transition-colors duration-300">
              {data.title}
            </h3>

            {/* Takeaways / Summary Toggle */}
            <div className="mt-3.5">
              <AnimatePresence mode="wait">
                {showTakeaways ? (
                  <motion.div
                    key="takeaways"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="space-y-1.5 bg-[#080B11]/90 p-3.5 rounded-xl border border-[#F59E0B]/30"
                  >
                    <div className="font-mono text-[9px] text-[#F59E0B] uppercase tracking-widest font-bold mb-1">
                      // AI EXECUTIVE TAKEAWAYS:
                    </div>
                    {takeaways.map((point, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-paper-dim font-sans">
                        <span className="text-[#10B981] font-bold">▸</span>
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
                    {data.summary}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 font-mono text-[10px] uppercase tracking-[0.2em]">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowTakeaways(!showTakeaways);
              }}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[#F59E0B] transition-colors flex items-center gap-1.5 font-bold border border-white/10"
            >
              <span>{showTakeaways ? '✕ VIEW SUMMARY' : '✨ KEY TAKEAWAYS'}</span>
            </button>
            <span className="text-paper group-hover:text-[#F59E0B] transition-colors flex items-center gap-1 font-bold">
              READ INTEL <span className="group-hover:translate-x-1.5 transition-transform inline-block">→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Flagship Lead Story Magazine Cover Card ──────────────── */
export function FlagshipCard({ article, isEvent = false }) {
  const { triggerGlitch } = useHUD();
  const data = isEvent ? {
    title: article.event_title,
    summary: article.fused_summary,
    image: article.image_url,
    sector: article.sector,
    href: `/event/${article._id}`,
    confidence: article.confidence_score,
    tag: 'LEAD SYNTHESIZED CLUSTER',
    sources: article.source_articles?.length || 1,
  } : {
    title: article.title,
    summary: article.unique_summary,
    image: article.image_url,
    sector: article.sector,
    href: `/article/${article._id}`,
    confidence: null,
    tag: 'LEAD EDITORIAL DISPATCH',
    sources: null,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => triggerGlitch(300)}
      className="group relative rounded-3xl overflow-hidden border border-white/15 hover:border-[#F59E0B]/70 bg-[#0D121C]/90 backdrop-blur-2xl transition-all duration-500 shadow-2xl cursor-pointer"
      style={{ minHeight: '520px' }}
    >
      <Link to={data.href} className="block w-full h-full">
        {/* Background Image with Slow Zoom */}
        <div className="absolute inset-0 overflow-hidden bg-[#080B11]">
          <img
            src={data.image || FALLBACK}
            alt={data.title}
            onError={(e) => { e.target.src = FALLBACK; }}
            className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-[6000ms] ease-out opacity-45 group-hover:opacity-65"
          />
        </div>

        {/* Velvet Obsidian Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080B11] via-[#080B11]/75 to-[#080B11]/25" />

        {/* Top Telemetry & Credibility Badges */}
        <div className="absolute top-6 left-6 right-6 flex flex-wrap items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-[0.25em] bg-[#F59E0B] text-[#080B11] shadow-lg shadow-[#F59E0B]/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#080B11] animate-ping" />
              <span>// {data.tag}</span>
            </span>
            <SectorBadge sector={data.sector} />
          </div>

          <div className="bg-[#080B11]/80 backdrop-blur-md rounded-xl px-4 py-1.5 border border-white/15 flex items-center gap-3 font-mono text-xs shadow-lg">
            {data.confidence != null ? (
              <SignalMeter score={data.confidence} size="sm" />
            ) : (
              <span className="text-[#10B981] font-bold text-[10px] tracking-widest">// 100% ORIGINAL AI COPY</span>
            )}
            {data.sources > 1 && (
              <>
                <span className="text-muted/40">•</span>
                <span className="text-[10px] text-paper font-semibold tracking-widest">{data.sources} WIRE SOURCES FUSED</span>
              </>
            )}
          </div>
        </div>

        {/* Bottom Magazine Cover Content Panel */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-10">
          <div className="max-w-3xl bg-[#0D121C]/85 backdrop-blur-xl rounded-2xl p-8 sm:p-10 border border-white/10 group-hover:border-white/25 transition-all shadow-2xl">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#F59E0B] uppercase tracking-[0.3em] mb-3 font-bold">
              <span>[ PRIORITY EXECUTIVE BRIEFING ]</span>
              <span className="text-muted/40">•</span>
              <span className="text-[#10B981]">LLAMA 3.1 SYNTHESIZED</span>
            </div>

            {/* Majestic Cover Story Serif Headline */}
            <h2 className="font-display font-extrabold text-paper text-2xl sm:text-4xl md:text-5xl leading-tight mb-4 group-hover:text-[#F59E0B] transition-colors duration-300">
              {data.title}
            </h2>

            <p className="text-paper-dim text-sm sm:text-base leading-relaxed line-clamp-3 mb-6 font-sans font-light">
              {data.summary}
            </p>

            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.2em] pt-5 border-t border-white/10">
              <span className="text-muted/70 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>MULTI-SOURCE VERIFICATION ONLINE</span>
              </span>
              <span className="text-paper group-hover:text-[#F59E0B] transition-colors font-extrabold flex items-center gap-2">
                OPEN EXECUTIVE BRIEF <span className="group-hover:translate-x-2 transition-transform inline-block">→</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
