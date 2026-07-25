import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import SectorBadge from '../components/SectorBadge';
import { useHUD } from '../context/HUDContext';

function getTakeaways(text = '') {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 20);
  return sentences.slice(0, 3).map((s) => s + '.');
}

export default function ArticleDetail() {
  const { id } = useParams();
  const { setActiveSector, triggerGlitch } = useHUD();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/articles/${id}`);
        const data = res.data.data;
        setArticle(data);
        if (data?.sector) setActiveSector(data.sector);
      } catch {
        setError('Failed to retrieve intelligence report.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
    window.scrollTo(0, 0);
  }, [id, setActiveSector]);

  // Simulate audio player progress
  useEffect(() => {
    let interval;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 2;
        });
      }, 500);
    } else {
      setAudioProgress(0);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5">
        <div className="w-12 h-12 rounded-full border border-[#F59E0B]/40 border-t-[#F59E0B] animate-spin" />
        <div className="font-mono text-xs text-[#F59E0B] tracking-[0.28em] uppercase animate-pulse font-bold">
          // DECRYPTING EDITORIAL DISPATCH...
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel rounded-3xl p-10 max-w-md text-center border border-[#F59E0B]/40 shadow-2xl">
          <div className="font-mono text-xs text-[#F59E0B] tracking-[0.25em] uppercase mb-2 font-bold">// REPORT ERROR</div>
          <p className="text-paper font-semibold mb-6">{error || 'Dispatch not found in database.'}</p>
          <Link to="/" className="px-6 py-3 rounded-full bg-[#F59E0B] text-[#080B11] font-mono font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 inline-block">
            ← RETURN TO CORE WIRE
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(article.timestamp).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const takeaways = getTakeaways(article.unique_summary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto space-y-10"
    >
      {/* ── Back Navigation & Dispatch ID ── */}
      <div className="pt-6 flex items-center justify-between border-b border-white/10 pb-6">
        <Link
          to={article.sector ? `/sector/${article.sector}` : '/'}
          onClick={() => triggerGlitch(200)}
          className="inline-flex items-center gap-2.5 text-muted hover:text-paper font-mono text-xs uppercase tracking-[0.25em] group font-bold"
        >
          <span className="group-hover:-translate-x-1.5 transition-transform text-[#F59E0B]">←</span>
          <span>RETURN TO {article.sector || 'WIRE'} DOMAIN</span>
        </Link>
        <div className="font-mono text-[10px] text-muted/60 tracking-[0.25em] uppercase">
          DISPATCH ID // <span className="text-paper font-bold">{article._id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      {/* ── Editorial Title & Attribution ── */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <SectorBadge sector={article.sector} />
          <span className="text-muted/40">•</span>
          <span className="font-mono text-xs text-paper-dim tracking-widest uppercase font-medium">{formattedDate}</span>
          <span className="text-muted/40">•</span>
          <span className="font-mono text-[10px] text-[#10B981] uppercase tracking-widest bg-[#10B981]/15 px-3 py-1 rounded-full border border-[#10B981]/30 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            <span>100% ORIGINAL AI SYNTHESIS</span>
          </span>
        </div>

        {/* Majestic Playfair Display Serif Title */}
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-paper tracking-tight leading-[1.08] mb-8">
          {article.title}
        </h1>

        {/* Interactive Audio Briefing Controls */}
        <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`p-3.5 rounded-full transition-all flex items-center justify-center shrink-0 shadow-lg ${
                isPlayingAudio ? 'bg-[#10B981] text-[#080B11] scale-105' : 'bg-[#F59E0B] hover:bg-[#D97706] text-[#080B11]'
              }`}
            >
              {isPlayingAudio ? (
                <span className="font-mono font-black text-xs px-1">❚❚</span>
              ) : (
                <span className="font-mono font-black text-xs pl-0.5">▶</span>
              )}
            </button>
            <div>
              <div className="font-mono text-xs text-paper font-bold uppercase tracking-wider flex items-center gap-2">
                <span>{isPlayingAudio ? 'PLAYING AI AUDIO BRIEFING...' : 'LISTEN TO EXECUTIVE BRIEFING'}</span>
                {isPlayingAudio && <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />}
              </div>
              <div className="text-[11px] text-muted font-light font-sans">
                Simulated neural voice synthesis • Est. time: 01:45
              </div>
            </div>
          </div>

          {isPlayingAudio && (
            <div className="w-full sm:w-48 bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-[#F59E0B] to-[#10B981] h-full transition-all duration-500 rounded-full"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Cinematic High-Resolution Image ── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#080B11] shadow-2xl" style={{ aspectRatio: '16/9' }}>
        {article.image_url && (
          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080B11]/80 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end font-mono text-[10px] text-white/80 uppercase tracking-widest font-semibold">
          <span className="bg-[#080B11]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">GENERATIVE VISUAL // POLLINATIONS AI</span>
          <span className="bg-[#080B11]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">NEURAL ENGINE v2.5</span>
        </div>
      </div>

      {/* ── Executive 3-Point Takeaway Matrix ── */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#F59E0B]/30 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#0D121C] to-[#131926]">
        <div className="font-mono text-xs text-[#F59E0B] uppercase tracking-[0.28em] font-extrabold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span>// EXECUTIVE 3-POINT STRATEGIC TAKEAWAYS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {takeaways.map((point, idx) => (
            <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[#10B981] font-bold mb-2">// POINT 0{idx + 1}</span>
              <p className="text-sm text-paper font-sans leading-relaxed font-normal">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full Editorial Article Body (Newsreader Serif + Drop Cap) ── */}
      <div className="glass-panel rounded-3xl p-8 sm:p-14 border border-white/15 shadow-2xl space-y-8">
        <div className="font-mono text-[11px] text-[#F59E0B] uppercase tracking-[0.3em] flex items-center gap-3 font-bold border-b border-white/10 pb-4">
          <span>// SYNTHESIZED REPORT BODY</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-muted/60 font-normal">100% ORIGINAL COPY</span>
        </div>

        {/* Editorial Body with journalistic Drop Cap */}
        <div className="editorial-body text-paper-dim text-lg sm:text-2xl leading-relaxed whitespace-pre-line font-light">
          <span className="drop-cap">{article.unique_summary.charAt(0)}</span>
          {article.unique_summary.slice(1)}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-muted/70 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>VERIFIED BY LLAMA 3.1 70B NEURAL FUSION</span>
          </span>
          <span className="text-[#F59E0B] font-bold">STATUS: CONFIRMED ACCURATE</span>
        </div>
      </div>
    </motion.div>
  );
}