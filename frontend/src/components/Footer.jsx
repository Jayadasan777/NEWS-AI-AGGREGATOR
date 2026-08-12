import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHUD } from '../context/HUDContext';

export default function Footer() {
  const { sectors } = useHUD();
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
    <footer className="relative mt-28" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 60 }}>

      {/* ── Subscribe Card ── */}
      <div className="glass-card rounded-2xl p-8 sm:p-10 mb-16 relative overflow-hidden">
        {/* Gradient top accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
             style={{ background: 'var(--grad-primary)' }} />
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', transform: 'translate(30%,-40%)' }} />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-3 font-mono text-xs font-bold uppercase tracking-widest">
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              <span style={{ color: 'var(--color-paper)' }}>Autonomous Morning Dispatch</span>
            </div>
            <h3 className="font-black text-2xl sm:text-3xl tracking-tight mb-2" style={{ color: 'var(--color-paper)' }}>
              Receive the <span className="text-gradient">Executive Brief</span> daily.
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-paper-dim)' }}>
              Llama 3 synthesized top dispatches across 14 domains — zero-noise, 3-minute read, delivered 06:00 UTC.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            {subscribed ? (
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-widest"
                   style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', color: 'var(--color-paper)' }}>
                ✓ Access Granted
              </div>
            ) : (
              <>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required
                  className="px-5 py-3 rounded-xl text-sm font-mono font-medium focus:outline-none transition-all min-w-[240px]"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                           color: 'var(--color-paper)' }}
                  onFocus={e => e.target.style.borderColor = 'var(--color-paper)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
                <button type="submit" className="btn-primary whitespace-nowrap">Subscribe →</button>
              </>
            )}
          </form>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-14" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {/* Brand */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center gap-3">
            <img src="/nise-logo.jpg" alt="NISE Logo" className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shadow-md" />
            <div>
              <span className="font-black text-xl tracking-tight text-gradient font-display">NISE</span>
              <div className="font-mono text-[9px] uppercase tracking-widest text-amber-400 font-bold">BY DASAN</div>
            </div>
            <span className="font-mono text-xs opacity-40 ml-1" style={{ color: 'var(--color-muted)' }}>// v4.0</span>
          </div>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--color-paper-dim)' }}>
            News Intelligence & Synthesis Engine — autonomous multi-source AI clustering, deduplication, and situational intelligence briefings.
          </p>
          <div className="flex items-center gap-3 font-mono text-xs font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                 style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--color-paper)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Neural Fusion Online
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                 style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--color-paper-dim)' }}>
              6h Cron Cycle
            </div>
          </div>
        </div>

        {/* Domain Explorer */}
        <div className="lg:col-span-8">
          <p className="section-label mb-4">Explore All 14 Domains</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sectors.map(s => (
              <Link key={s.name} to={`/sector/${s.name}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all group"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-paper-dim)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-all group-hover:scale-125" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <span className="truncate group-hover:text-white transition-colors">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="pt-7 pb-6 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs uppercase tracking-widest"
           style={{ color: 'var(--color-subtle)' }}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {['Llama 3.1 8B', 'Jaccard IoU Clustering', 'Pollinations AI', 'MongoDB Atlas', 'Node.js + Vite'].map((t, i, arr) => (
            <React.Fragment key={t}>
              <span style={{ color: i % 2 === 0 ? 'var(--color-muted)' : 'var(--color-subtle)' }}>{t}</span>
              {i < arr.length - 1 && <span>·</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="text-center" style={{ color: 'var(--color-subtle)' }}>
          © {new Date().getFullYear()} NISE — News Intelligence & Synthesis Engine by Dasan
        </div>
      </div>
    </footer>
  );
}