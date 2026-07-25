import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHUD } from '../context/HUDContext';

export default function Footer() {
  const { sectors, triggerGlitch } = useHUD();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
      setEmail('');
    }
  };

  return (
    <footer className="relative mt-28 border-t border-white/10 pt-16 pb-14 text-muted/80 font-sans">
      {/* ── 1. Daily Intelligence Briefing Subscription Card ── */}
      <div className="mb-16 glass-panel rounded-3xl p-8 sm:p-12 border border-white/15 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[#10B981]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="font-mono text-[10px] text-[#F59E0B] uppercase tracking-[0.28em] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
              <span>// AUTONOMOUS MORNING DISPATCH</span>
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-paper tracking-tight mb-3">
              Receive the Llama-3 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#FDE68A]">Executive Summary</span> Daily.
            </h3>
            <p className="text-sm sm:text-base text-paper-dim leading-relaxed font-light">
              Zero-noise intelligence curation. We synthesize top geopolitical, financial, and tech dispatches into a 3-minute read delivered to your inbox every morning at 06:00 UTC.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
            {subscribed ? (
              <div className="px-6 py-4 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981] font-mono text-xs uppercase tracking-widest flex items-center gap-2 font-bold shadow-lg">
                <span>✓ BRIEFING ACCESS GRANTED</span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER EXECUTIVE EMAIL..."
                  required
                  className="bg-[#080B11]/90 text-paper font-mono text-xs tracking-wider uppercase px-5 py-4 rounded-2xl border border-white/15 focus:outline-none focus:border-[#F59E0B] transition-all min-w-[260px] shadow-inner"
                />
                <button
                  type="submit"
                  className="px-6 py-4 rounded-2xl bg-[#F59E0B] hover:bg-[#D97706] text-[#080B11] font-mono text-xs uppercase tracking-[0.18em] font-extrabold transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
                >
                  <span>SUBSCRIBE →</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* ── 2. Domain Explorer Matrix & Brand Description ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-white/10">
        <div className="lg:col-span-5 space-y-4">
          <div className="font-display font-extrabold text-2xl text-paper tracking-tight">
            NEWSAI <span className="text-[#F59E0B] text-xs font-mono tracking-[0.22em] font-normal">// INTEL ENGINE v2.5</span>
          </div>
          <p className="text-sm text-paper-dim max-w-sm leading-relaxed font-light">
            Autonomous situational awareness platform. Multi-source AI clustering, deduplication, and real-time news synthesis powered by Llama 3 neural fusion and Jaccard similarity indexing.
          </p>
          <div className="pt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted">
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>NEURAL FUSION ONLINE</span>
            </span>
            <span>•</span>
            <span>2× DAILY CRON INGESTION</span>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="font-mono text-[10px] text-muted/50 uppercase tracking-[0.25em] mb-4">
            // EXPLORE ALL 14 DOMAINS
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {sectors.map((s) => (
              <Link
                key={s.name}
                to={`/sector/${s.name}`}
                onClick={() => triggerGlitch(250)}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-xs font-mono uppercase tracking-wider text-paper-dim hover:text-paper"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. System Telemetry Bar & Copyright ── */}
      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted/60">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
          <span className="text-paper">LLAMA 3.1 70B</span>
          <span>•</span>
          <span>JACCARD SIMILARITY</span>
          <span>•</span>
          <span>LATENCY: 12ms</span>
          <span>•</span>
          <span className="text-[#10B981]">MONGODB CLUSTER ONLINE</span>
        </div>
        <div className="text-center md:text-right">
          © {new Date().getFullYear()} NEWSAI // AUTONOMOUS SITUATIONAL AWARENESS
        </div>
      </div>
    </footer>
  );
}