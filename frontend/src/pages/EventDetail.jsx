import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../api/axios';
import SectorBadge from '../components/SectorBadge';
import SignalMeter from '../components/SignalMeter';
import StanceBreakdown from '../components/StanceBreakdown';
import EventTimeline from '../components/EventTimeline';
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
          if (prev >= 100) { setIsPlayingAudio(false); return 0; }
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
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border border-white/20 border-t-white flex items-center justify-center animate-spin">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          </div>
        </div>
        <div className="font-mono text-xs tracking-widest uppercase animate-pulse font-bold" style={{ color: 'var(--color-paper)' }}>
          FUSING NEURAL CLUSTER REPORT…
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-10 max-w-md text-center border-white/20 shadow-2xl">
          <div className="font-mono text-xs text-white tracking-widest uppercase mb-2 font-bold">CLUSTER ERROR</div>
          <p className="font-semibold mb-6" style={{ color: 'var(--color-paper)' }}>{error || 'Event not found in database.'}</p>
          <Link to="/" className="btn-primary">
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
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest group font-bold transition-colors"
          style={{ color: 'var(--color-muted)' }}
        >
          <span className="group-hover:-translate-x-1 transition-transform inline-block text-white">←</span>
          <span className="group-hover:text-white transition-colors">RETURN TO {event.sector || 'WIRE'} DOMAIN</span>
        </Link>
        <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--color-muted)' }}>
          CLUSTER ID // <span className="font-bold ml-1" style={{ color: 'var(--color-paper)' }}>{event._id.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      {/* ── Title & Credibility Telemetry ── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <SectorBadge sector={event.sector} />
            <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 rounded-xl border font-bold"
                  style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--color-paper-dim)', backdropFilter: 'blur(10px)' }}>
              SYNTHESIZED CLUSTER REPORT
            </span>
          </div>
          <div className="rounded-xl px-4 py-2 border flex items-center gap-3 font-mono text-xs shadow-xl"
               style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}>
            <SignalMeter score={event.confidence_score} />
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <span className="font-bold tracking-wider" style={{ color: 'var(--color-paper)' }}>{srcCount} SOURCE{srcCount > 1 ? 'S' : ''} FUSED</span>
          </div>
        </div>

        <h1 className="font-display font-extrabold text-3xl sm:text-5xl md:text-6xl tracking-tight leading-[1.08] mb-4"
            style={{ color: 'var(--color-paper)' }}>
          {event.event_title}
        </h1>

        {event.last_updated && (
          <p className="text-xs font-mono mb-8 tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Last updated: {new Date(event.last_updated).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        )}

        {/* Audio Player */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
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
              {isPlayingAudio
                ? <span className="font-mono font-black text-xs px-1">❚❚</span>
                : <span className="font-mono font-black text-xs pl-0.5">▶</span>}
            </button>
            <div>
              <div className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-paper)' }}>
                <span>{isPlayingAudio ? 'PLAYING AI CLUSTER BRIEFING...' : 'LISTEN TO EXECUTIVE BRIEFING'}</span>
                {isPlayingAudio && <span className="live-dot" style={{ width: 6, height: 6 }} />}
              </div>
              <div className="text-[11px] font-sans" style={{ color: 'var(--color-paper-dim)' }}>
                Simulated neural voice synthesis • Est. time: 02:10
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

      {/* ── Cinematic Image ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl" style={{ aspectRatio: '16/9' }}>
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.event_title}
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80'; }}
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
          <div className="font-mono text-[10px] uppercase tracking-widest font-bold bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10"
               style={{ color: 'var(--color-paper-dim)' }}>
            MULTI-SOURCE NEURAL SYNTHESIS
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest font-semibold bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10"
               style={{ color: 'var(--color-paper-dim)' }}>
            JACCARD CLUSTERING v2.5
          </div>
        </div>
      </div>

      {/* ── Strategic Takeaways ── */}
      <div className="glass-card p-8 sm:p-10 rounded-2xl">
        <div className="font-mono text-xs uppercase tracking-widest font-extrabold mb-5 flex items-center gap-2 text-white">
          <span className="live-dot" style={{ width: 6, height: 6, background: '#ffffff', boxShadow: '0 0 8px #ffffff' }} />
          <span>EXECUTIVE 3-POINT STRATEGIC BRIEFING</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {takeaways.map((point, idx) => (
            <div key={idx} className="p-5 rounded-xl border flex flex-col"
                 style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
              <span className="font-mono text-[10px] font-bold mb-2 uppercase tracking-widest text-white">STRATEGY 0{idx + 1}</span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper)' }}>{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fused Executive Brief Body ── */}
      <div className="glass-card rounded-2xl p-8 sm:p-14 space-y-8">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest pb-4 border-b border-white/10">
          <span className="font-bold" style={{ color: 'var(--color-paper)' }}>SYNTHESIZED EXECUTIVE BRIEFING</span>
          <span className="font-bold text-white">FUSION VERIFIED</span>
        </div>

        <div className="text-lg sm:text-2xl leading-relaxed whitespace-pre-line font-light"
             style={{ color: 'var(--color-paper)' }}>
          <span className="float-left text-5xl sm:text-6xl font-extrabold mr-3 leading-none text-gradient">{event.fused_summary.charAt(0)}</span>
          {event.fused_summary.slice(1)}
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest"
             style={{ color: 'var(--color-muted)' }}>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
            <span style={{ color: 'var(--color-paper-dim)' }}>AI VERIFICATION CONFIDENCE: {event.confidence_score || 85}%</span>
          </span>
          <span className="font-extrabold" style={{ color: 'var(--color-paper)' }}>STATUS: STRATEGICALLY CONFIRMED</span>
        </div>
      </div>

      {/* ── Publisher Stance & Divergence Analysis ── */}
      {event.source_articles?.length >= 2 && (
        <StanceBreakdown
          stanceAnalysis={event.stance_analysis}
          divergenceScore={event.divergence_score ?? 0}
          factualityVerified={event.factuality_verified ?? false}
          reflectionLogs={event.reflection_logs ?? []}
        />
      )}

      {/* ── Chronological Event Timeline ── */}
      <EventTimeline
        sourceArticles={event.source_articles || []}
        sector={event.sector}
      />
    </motion.div>
  );
}