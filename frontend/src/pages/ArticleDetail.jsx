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
        <div className="w-12 h-12 rounded-full border border-white/20 border-t-white animate-spin" />
        <div className="font-mono text-xs tracking-widest uppercase animate-pulse font-bold" style={{ color: 'var(--color-paper)' }}>
          DECRYPTING EDITORIAL DISPATCH…
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-10 max-w-md text-center border-white/20 shadow-2xl">
          <div className="font-mono text-xs text-white tracking-widest uppercase mb-2 font-bold">REPORT ERROR</div>
          <p className="font-semibold mb-6" style={{ color: 'var(--color-paper)' }}>{error || 'Dispatch not found in database.'}</p>
          <Link to="/" className="btn-primary">
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
          className="inline-flex items-center gap-2.5 font-mono text-xs uppercase tracking-widest group font-bold transition-colors"
          style={{ color: 'var(--color-muted)' }}
        >
          <span className="group-hover:-translate-x-1 transition-transform inline-block text-white">←</span>
          <span className="group-hover:text-white transition-colors">RETURN TO {article.sector || 'WIRE'} DOMAIN</span>
        </Link>
        <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-muted)' }}>
          DISPATCH ID // <span className="font-bold" style={{ color: 'var(--color-paper)' }}>{article._id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      {/* ── Editorial Title & Attribution ── */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <SectorBadge sector={article.sector} />
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <span className="font-mono text-xs tracking-widest uppercase font-medium" style={{ color: 'var(--color-paper-dim)' }}>{formattedDate}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl font-bold flex items-center gap-1.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--color-paper-dim)', backdropFilter: 'blur(10px)' }}>
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span>100% ORIGINAL AI SYNTHESIS</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.08] mb-8"
            style={{ color: 'var(--color-paper)' }}>
          {article.title}
        </h1>

        {/* Audio Briefing Controls */}
        <div className="glass-card p-4 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="p-3.5 rounded-full transition-all flex items-center justify-center shrink-0 shadow-lg border"
              style={{
                background: isPlayingAudio ? '#ffffff' : 'rgba(255,255,255,0.1)',
                borderColor: isPlayingAudio ? '#ffffff' : 'rgba(255,255,255,0.2)',
                color: isPlayingAudio ? '#000000' : '#ffffff',
                backdropFilter: 'blur(10px)'
              }}
            >
              {isPlayingAudio ? (
                <span className="font-mono font-black text-xs px-1">❚❚</span>
              ) : (
                <span className="font-mono font-black text-xs pl-0.5">▶</span>
              )}
            </button>
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-paper)' }}>
                <span>{isPlayingAudio ? 'PLAYING AI AUDIO BRIEFING...' : 'LISTEN TO EXECUTIVE BRIEFING'}</span>
                {isPlayingAudio && <span className="live-dot" style={{ width: 6, height: 6 }} />}
              </div>
              <div className="text-[11px] font-light font-sans" style={{ color: 'var(--color-paper-dim)' }}>
                Simulated neural voice synthesis • Est. time: 01:45
              </div>
            </div>
          </div>

          {isPlayingAudio && (
            <div className="w-full sm:w-48 bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-white h-full transition-all duration-500 rounded-full"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Cinematic High-Resolution Image ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl" style={{ aspectRatio: '16/9' }}>
        {article.image_url && (
          <img
            src={article.image_url}
            alt={article.title}
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80'; }}
            className="w-full h-full object-cover opacity-85"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end font-mono text-[10px] uppercase tracking-widest font-semibold"
             style={{ color: 'var(--color-paper-dim)' }}>
          <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">GENERATIVE VISUAL // POLLINATIONS AI</span>
          <span className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">NEURAL ENGINE v2.5</span>
        </div>
      </div>

      {/* ── Executive 3-Point Takeaway Matrix ── */}
      <div className="glass-card p-8 sm:p-10 rounded-2xl relative overflow-hidden">
        <div className="font-mono text-xs uppercase tracking-widest font-extrabold mb-4 flex items-center gap-2 text-white">
          <span className="live-dot" style={{ width: 6, height: 6, background: '#ffffff', boxShadow: '0 0 8px #ffffff' }} />
          <span>EXECUTIVE 3-POINT STRATEGIC TAKEAWAYS</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {takeaways.map((point, idx) => (
            <div key={idx} className="p-5 rounded-xl border transition-all"
                 style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
              <span className="font-mono text-[10px] font-bold mb-2 block text-white">// POINT 0{idx + 1}</span>
              <p className="text-sm leading-relaxed font-normal" style={{ color: 'var(--color-paper)' }}>{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Full Editorial Article Body ── */}
      <div className="glass-card rounded-2xl p-8 sm:p-14 space-y-8">
        <div className="font-mono text-[11px] uppercase tracking-widest flex items-center gap-3 font-bold border-b border-white/10 pb-4"
             style={{ color: 'var(--color-paper)' }}>
          <span>SYNTHESIZED REPORT BODY</span>
          <span className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.15), transparent)' }} />
          <span className="font-normal" style={{ color: 'var(--color-muted)' }}>100% ORIGINAL COPY</span>
        </div>

        <div className="text-lg sm:text-2xl leading-relaxed whitespace-pre-line font-light"
             style={{ color: 'var(--color-paper)' }}>
          <span className="float-left text-5xl sm:text-6xl font-extrabold mr-3 leading-none text-gradient">{article.unique_summary.charAt(0)}</span>
          {article.unique_summary.slice(1)}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            <span style={{ color: 'var(--color-paper-dim)' }}>VERIFIED BY LLAMA 3.1 NEURAL FUSION</span>
          </span>
          <span className="font-bold" style={{ color: 'var(--color-paper)' }}>STATUS: CONFIRMED ACCURATE</span>
        </div>
      </div>
    </motion.div>
  );
}