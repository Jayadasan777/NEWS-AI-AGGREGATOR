import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import SectorBadge from '../components/SectorBadge';
import SignalMeter from '../components/SignalMeter';
import { useHUD } from '../context/HUDContext';

function getTakeaways(text = '') {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 20);
  return sentences.slice(0, 3).map((s) => s + '.');
}

export default function EventDetail() {
  const { id } = useParams();
  const { setActiveSector, triggerGlitch } = useHUD();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/events/${id}`);
        const data = res.data.data;
        setEvent(data);
        if (data?.sector) setActiveSector(data.sector);
      } catch {
        setError('Failed to load cluster report.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
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
        <div className="w-12 h-12 rounded-full border border-[#F59E0B]/40 border-t-[#F59E0B] animate-spin" />
        <div className="font-mono text-xs text-[#F59E0B] tracking-[0.28em] uppercase animate-pulse font-bold">
          // FUSING NEURAL CLUSTER REPORT...
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-panel rounded-3xl p-10 max-w-md text-center border border-[#F59E0B]/40 shadow-2xl">
          <div className="font-mono text-xs text-[#F59E0B] tracking-[0.25em] uppercase mb-2 font-bold">// CLUSTER ERROR</div>
          <p className="text-paper font-semibold mb-6">{error || 'Event not found in database.'}</p>
          <Link to="/" className="px-6 py-3 rounded-full bg-[#F59E0B] text-[#080B11] font-mono font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 inline-block">
            ← RETURN TO CORE WIRE
          </Link>
        </div>
      </div>
    );
  }

  const takeaways = getTakeaways(event.fused_summary);
  const srcCount = event.source_articles?.length || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto space-y-10"
    >
      {/* ── Top Bar & Cluster ID ── */}
      <div className="pt-6 flex items-center justify-between border-b border-white/10 pb-6">
        <Link
          to={event.sector ? `/sector/${event.sector}` : '/'}
          onClick={() => triggerGlitch(200)}
          className="inline-flex items-center gap-2.5 text-muted hover:text-paper font-mono text-xs uppercase tracking-[0.25em] group font-bold"
        >
          <span className="group-hover:-translate-x-1.5 transition-transform text-[#F59E0B]">←</span>
          <span>RETURN TO {event.sector || 'WIRE'} DOMAIN</span>
        </Link>
        <div className="font-mono text-[10px] text-muted/60 tracking-[0.25em] uppercase">
          CLUSTER ID // <span className="text-paper font-bold">{event._id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      {/* ── Title & Credibility Telemetry ── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <SectorBadge sector={event.sector} />
            <span className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-widest bg-[#F59E0B]/15 px-3 py-1 rounded-full border border-[#F59E0B]/30 font-bold">
              SYNTHESIZED CLUSTER REPORT
            </span>
          </div>
          <div className="bg-[#080B11]/90 backdrop-blur-md rounded-2xl px-5 py-2 border border-white/15 flex items-center gap-4 font-mono text-xs shadow-xl">
            <SignalMeter score={event.confidence_score} />
            <span className="text-muted/40">•</span>
            <span className="text-paper font-bold tracking-wider">{srcCount} SOURCE DISPATCHES FUSED</span>
          </div>
        </div>

        {/* Majestic Playfair Display Serif Title */}
        <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl text-paper tracking-tight leading-[1.08] mb-4">
          {event.event_title}
        </h1>

        {/* Last Updated Timestamp */}
        {event.last_updated && (
          <p className="text-gray-500 text-xs font-mono mb-8">
            Last updated: {new Date(event.last_updated).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        )}


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
                <span>{isPlayingAudio ? 'PLAYING AI CLUSTER BRIEFING...' : 'LISTEN TO EXECUTIVE BRIEFING'}</span>
                {isPlayingAudio && <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />}
              </div>
              <div className="text-[11px] text-muted font-light font-sans">
                Simulated neural voice synthesis • Est. time: 02:10
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
        {event.image_url && (
          <img src={event.image_url} alt={event.event_title} className="w-full h-full object-cover opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080B11]/80 via-[#080B11]/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div className="font-mono text-xs text-[#F59E0B] uppercase tracking-[0.2em] font-bold">
            // MULTI-SOURCE NEURAL SYNTHESIS REPORT
          </div>
          <div className="font-mono text-[10px] text-muted uppercase tracking-widest font-semibold bg-[#080B11]/80 px-3 py-1.5 rounded-lg border border-white/10">
            JACCARD CLUSTERING ENGINE v2.5
          </div>
        </div>
      </div>

      {/* ── Executive 3-Point Strategic Takeaway Matrix ── */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-[#F59E0B]/30 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#0D121C] to-[#131926]">
        <div className="font-mono text-xs text-[#F59E0B] uppercase tracking-[0.28em] font-extrabold mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
          <span>// EXECUTIVE 3-POINT STRATEGIC BRIEFING</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {takeaways.map((point, idx) => (
            <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
              <span className="font-mono text-[10px] text-[#10B981] font-bold mb-2">// STRATEGY 0{idx + 1}</span>
              <p className="text-sm text-paper font-sans leading-relaxed font-normal">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fused Executive Brief Body (Newsreader Serif + Drop Cap) ── */}
      <div className="glass-panel rounded-3xl p-8 sm:p-14 border border-white/15 shadow-2xl space-y-8">
        <div className="font-mono text-[11px] text-[#F59E0B] uppercase tracking-[0.3em] flex items-center gap-3 font-bold border-b border-white/10 pb-4">
          <span>// SYNTHESIZED EXECUTIVE BRIEFING</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[#10B981] font-bold">FUSION VERIFIED</span>
        </div>

        <div className="editorial-body text-paper-dim text-lg sm:text-2xl leading-relaxed whitespace-pre-line font-light">
          <span className="drop-cap">{event.fused_summary.charAt(0)}</span>
          {event.fused_summary.slice(1)}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-muted/70 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>AI VERIFICATION CONFIDENCE: {event.confidence_score || 85}%</span>
          </span>
          <span className="text-[#10B981] font-extrabold">STATUS: STRATEGICALLY CONFIRMED</span>
        </div>
      </div>

      {/* ── Source Dispatches Breakdown ── */}
      <div className="space-y-6 pt-6">
        <div className="font-mono text-xs text-paper uppercase tracking-[0.25em] flex items-center gap-3 font-bold">
          <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
          <span>SOURCE DISPATCHES FUSED IN CLUSTER ({event.source_articles?.length || 0})</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {event.source_articles?.map((art, i) => (
            <Link
              key={art._id || i}
              to={`/article/${art._id}`}
              onClick={() => triggerGlitch(200)}
              className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-[#F59E0B]/60 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3 font-mono text-[10px] text-muted/70 uppercase tracking-widest font-bold">
                  <span>WIRE SOURCE #{i + 1}</span>
                  <SectorBadge sector={art.sector || event.sector} size="sm" />
                </div>
                <h4 className="font-display font-bold text-paper text-base group-hover:text-[#F59E0B] transition-colors line-clamp-2 mb-2">
                  {art.title}
                </h4>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest text-muted/60 group-hover:text-paper flex justify-between items-center font-bold">
                <span>VIEW RAW WIRE REPORT</span>
                <span className="group-hover:translate-x-1 transition-transform text-[#F59E0B]">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  );
}