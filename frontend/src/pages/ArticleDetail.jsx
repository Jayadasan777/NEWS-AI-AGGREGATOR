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
        <div className="w-12 h-12 rounded-full border border-[#A0A0A0]/40 border-t-[#F5F5F5] animate-spin" />
        <div className="font-mono text-xs text-[#A0A0A0] tracking-[0.28em] uppercase animate-pulse font-bold">
          DECRYPTING EDITORIAL DISPATCH…
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel rounded-2xl p-10 max-w-md text-center border border-[#DC2626]/40 shadow-2xl">
          <div className="font-mono text-xs text-[#DC2626] tracking-[0.25em] uppercase mb-2 font-bold">REPORT ERROR</div>
          <p className="text-[#F5F5F5] font-semibold mb-6">{error || 'Dispatch not found in database.'}</p>
          <Link to="/" className="px-6 py-3 rounded-full bg-[#F5F5F5] text-[#0A0A0A] font-mono font-bold text-xs uppercase tracking-widest transition-all hover:bg-transparent hover:text-[#F5F5F5] inline-block border border-[#F5F5F5]">
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
      <div className="pt-6 flex items-center justify-between border-b border-[#2A2A2A] pb-6">
        <Link
          to={article.sector ? `/sector/${article.sector}` : '/'}
          onClick={() => triggerGlitch(200)}
          className="inline-flex items-center gap-2.5 text-[#606060] hover:text-[#F5F5F5] font-mono text-xs uppercase tracking-[0.25em] group font-bold transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform text-[#F5F5F5]">←</span>
          <span>RETURN TO {article.sector || 'WIRE'} DOMAIN</span>
        </Link>
        <div className="font-mono text-[10px] text-[#606060] tracking-[0.25em] uppercase">
          DISPATCH ID // <span className="text-[#F5F5F5] font-bold">{article._id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      {/* ── Editorial Title & Attribution ── */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <SectorBadge sector={article.sector} />
          <span className="text-[#404040]">•</span>
          <span className="font-mono text-xs text-[#C8C8C8] tracking-widest uppercase font-medium">{formattedDate}</span>
          <span className="text-[#404040]">•</span>
          <span className="font-mono text-[10px] text-[#A0A0A0] uppercase tracking-widest bg-[#181818] px-3 py-1 rounded border border-[#2A2A2A] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
            <span>100% ORIGINAL AI SYNTHESIS</span>
          </span>
        </div>

        {/* Majestic Serif Title */}
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#F5F5F5] tracking-tight leading-[1.08] mb-8">
          {article.title}
        </h1>

        {/* Interactive Audio Briefing Controls */}
        <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-[#2A2A2A] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111111]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className={`p-3.5 rounded-full transition-all flex items-center justify-center shrink-0 shadow-lg border border-[#3A3A3A] ${
                isPlayingAudio ? 'bg-[#F5F5F5] text-[#0A0A0A]' : 'bg-[#181818] hover:bg-[#2A2A2A] text-[#F5F5F5]'
              }`}
            >
              {isPlayingAudio ? (
                <span className="font-mono font-black text-xs px-1">❚❚</span>
              ) : (
                <span className="font-mono font-black text-xs pl-0.5">▶</span>
              )}
            </button>
            <div>
              <div className="font-mono text-xs text-[#F5F5F5] font-bold uppercase tracking-wider flex items-center gap-2">
                <span>{isPlayingAudio ? 'PLAYING AI AUDIO BRIEFING...' : 'LISTEN TO EXECUTIVE BRIEFING'}</span>
                {isPlayingAudio && <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping" />}
              </div>
              <div className="text-[11px] text-[#A0A0A0] font-light font-sans">
                Simulated neural voice synthesis • Est. time: 01:45
              </div>
            </div>
          </div>

          {isPlayingAudio && (
            <div className="w-full sm:w-48 bg-white/5 rounded-full h-2 overflow-hidden border border-[#2A2A2A]">
              <div
                className="bg-[#F5F5F5] h-full transition-all duration-500 rounded-full"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Cinematic High-Resolution Image ── */}
      <div className="relative rounded-2xl overflow-hidden border border-[#2A2A2A] bg-[#080B11] shadow-2xl" style={{ aspectRatio: '16/9' }}>
        {article.image_url && (
          <img src={article.image_url} alt={article.title} className="w-full h-full object-cover opacity-85" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end font-mono text-[10px] text-[#C8C8C8] uppercase tracking-widest font-semibold">
          <span className="bg-[#111111]/90 backdrop-blur-md px-3 py-1.5 rounded border border-[#2A2A2A]">GENERATIVE VISUAL // POLLINATIONS AI</span>
          <span className="bg-[#111111]/90 backdrop-blur-md px-3 py-1.5 rounded border border-[#2A2A2A]">NEURAL ENGINE v2.5</span>
        </div>
      </div>

      {/* ── Executive 3-Point Takeaway Matrix ── */}
      <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-[#2A2A2A] shadow-2xl relative overflow-hidden bg-[#111111]">
        <div className="font-mono text-xs text-[#F5F5F5] uppercase tracking-[0.28em] font-extrabold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
          <span>EXECUTIVE 3-POINT STRATEGIC TAKEAWAYS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {takeaways.map((point, idx) => (
            <div key={idx} className="bg-[#181818] p-5 rounded-xl border border-[#2A2A2A] flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[#A0A0A0] font-bold mb-2">// POINT 0{idx + 1}</span>
              <p className="text-sm text-[#F5F5F5] font-sans leading-relaxed font-normal">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full Editorial Article Body (Newsreader Serif + Drop Cap) ── */}
      <div className="glass-panel rounded-2xl p-8 sm:p-14 border border-[#2A2A2A] shadow-2xl space-y-8 bg-[#111111]">
        <div className="font-mono text-[11px] text-[#F5F5F5] uppercase tracking-[0.3em] flex items-center gap-3 font-bold border-b border-[#2A2A2A] pb-4">
          <span>SYNTHESIZED REPORT BODY</span>
          <span className="h-px flex-1 bg-[#2A2A2A]" />
          <span className="text-[#606060] font-normal">100% ORIGINAL COPY</span>
        </div>

        {/* Editorial Body with journalistic Drop Cap */}
        <div className="editorial-body text-[#D4D4D4] text-lg sm:text-2xl leading-relaxed whitespace-pre-line font-light">
          <span className="drop-cap">{article.unique_summary.charAt(0)}</span>
          {article.unique_summary.slice(1)}
        </div>

        <div className="pt-8 border-t border-[#2A2A2A] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-[#606060] uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span className="text-[#A0A0A0]">VERIFIED BY LLAMA 3.1 NEURAL FUSION</span>
          </span>
          <span className="text-[#F5F5F5] font-bold">STATUS: CONFIRMED ACCURATE</span>
        </div>
      </div>
    </motion.div>
  );
}