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
    <footer className="relative mt-28 border-t border-[#2A2A2A] pt-16 pb-14 text-[#606060] font-sans">
      {/* ── 1. Daily Intelligence Briefing Subscription Card ── */}
      <div className="mb-16 glass-panel rounded-2xl p-8 sm:p-12 border border-[#2A2A2A] relative overflow-hidden shadow-2xl bg-[#111111]">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="font-mono text-[10px] text-[#F5F5F5] uppercase tracking-[0.28em] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              <span>AUTONOMOUS MORNING DISPATCH</span>
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#F5F5F5] tracking-tight mb-3">
              Receive the Llama-3 <span className="text-white underline decoration-1 underline-offset-4">Executive Summary</span> Daily.
            </h3>
            <p className="text-sm sm:text-base text-[#C8C8C8] leading-relaxed font-light">
              Zero-noise intelligence curation. We synthesize top geopolitical, financial, and tech dispatches into a 3-minute read delivered to your inbox every morning at 06:00 UTC.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 shrink-0">
            {subscribed ? (
              <div className="px-6 py-4 rounded-xl bg-[#F5F5F5] text-[#0A0A0A] font-mono text-xs uppercase tracking-widest flex items-center gap-2 font-bold shadow-lg">
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
                  className="bg-[#0A0A0A] text-[#F5F5F5] font-mono text-xs tracking-wider uppercase px-5 py-4 rounded-xl border border-[#2A2A2A] focus:outline-none focus:border-[#F5F5F5] transition-all min-w-[260px] shadow-inner"
                />
                <button
                  type="submit"
                  className="px-6 py-4 rounded-xl bg-[#F5F5F5] hover:bg-transparent hover:text-[#F5F5F5] text-[#0A0A0A] border border-[#F5F5F5] font-mono text-xs uppercase tracking-[0.18em] font-extrabold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <span>SUBSCRIBE →</span>
                </button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* ── 2. Domain Explorer Matrix & Brand Description ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-[#2A2A2A]">
        <div className="lg:col-span-5 space-y-4">
          <div className="font-display font-extrabold text-2xl text-[#F5F5F5] tracking-tight">
            NEWSAI <span className="text-[#A0A0A0] text-xs font-mono tracking-[0.22em] font-normal">// INTEL ENGINE v2.5</span>
          </div>
          <p className="text-sm text-[#C8C8C8] max-w-sm leading-relaxed font-light">
            Autonomous situational awareness platform. Multi-source AI clustering, deduplication, and real-time news synthesis powered by Llama 3 neural fusion and Jaccard similarity indexing.
          </p>
          <div className="pt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-[#606060]">
            <span className="flex items-center gap-1.5 text-[#F5F5F5]">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
              <span>NEURAL FUSION ONLINE</span>
            </span>
            <span>•</span>
            <span>4-HOUR CRON INGESTION</span>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="font-mono text-[10px] text-[#606060] uppercase tracking-[0.25em] mb-4">
            EXPLORE ALL 14 DOMAINS
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {sectors.map((s) => (
              <Link
                key={s.name}
                to={`/sector/${s.name}`}
                onClick={() => triggerGlitch(250)}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111111] hover:bg-[#181818] border border-[#2A2A2A] hover:border-[#3A3A3A] transition-all text-xs font-mono uppercase tracking-wider text-[#A0A0A0] hover:text-[#F5F5F5]"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. System Telemetry Bar & Copyright ── */}
      <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-[10px] uppercase tracking-[0.2em] text-[#606060]">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
          <span className="text-[#F5F5F5]">LLAMA 3.1 70B</span>
          <span>•</span>
          <span>JACCARD SIMILARITY</span>
          <span>•</span>
          <span>LATENCY: 12ms</span>
          <span>•</span>
          <span className="text-[#F5F5F5]">MONGODB CLUSTER ONLINE</span>
        </div>
        <div className="text-center md:text-right">
          © {new Date().getFullYear()} NEWSAI // AUTONOMOUS SITUATIONAL AWARENESS
        </div>
      </div>
    </footer>
  );
}