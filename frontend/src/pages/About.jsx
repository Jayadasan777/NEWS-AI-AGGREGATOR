import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useHUD } from '../context/HUDContext';

export default function About() {
  const { triggerGlitch } = useHUD();

  const pipelineSteps = [
    {
      num: '01',
      title: 'Multi-Source RSS Ingestion',
      desc: '2× daily cron engine ingests live XML/RSS feeds across 14 dedicated geopolitical, financial, and scientific domains.',
      tag: '42 GLOBAL WIRE SERVICES',
    },
    {
      num: '02',
      title: 'Algorithmic Deduplication',
      desc: 'Title similarity normalization and URL hashing eliminate syndicated duplicate dispatches before database storage.',
      tag: 'ZERO NOISE REDUNDANCY',
    },
    {
      num: '03',
      title: 'Llama 3 Neural Rewrite',
      desc: 'Each raw dispatch is autonomously processed by Llama 3.1 70B to generate concise, objective, 100% original editorial summaries.',
      tag: 'AUTONOMOUS JOURNALISM',
    },
    {
      num: '04',
      title: 'Generative Visual Synthesis',
      desc: 'Title and content semantics trigger real-time neural image generation via Pollinations AI, producing custom editorial visuals.',
      tag: 'POLLINATIONS AI ENGINE',
    },
    {
      num: '05',
      title: 'Jaccard Similarity Clustering',
      desc: 'Continuous cron jobs compute keyword Intersection-over-Union (IoU), merging related dispatches into unified multi-source clusters.',
      tag: 'MATHEMATICAL FUSION',
    },
    {
      num: '06',
      title: 'Multi-Source Intelligence Synthesis',
      desc: 'When a cluster exceeds threshold similarity, Llama 3 synthesizes all contributing articles into a comprehensive intelligence briefing.',
      tag: 'CONFIDENCE VERIFIED',
    },
    {
      num: '07',
      title: 'Autonomous Social Media Broadcast',
      desc: 'Synthesized articles, custom AI images, and viral hashtags are dispatched 24/7 via real-time webhooks (Make.com/Zapier) directly to Facebook and Instagram channels.',
      tag: '24/7 AUTONOMOUS MEDIA HOUSE',
    },
  ];

  return (
    <div className="space-y-20 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="pt-6 pb-12"
      >
        <Link
          to="/"
          onClick={() => triggerGlitch(200)}
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest mb-8 group font-bold transition-colors"
          style={{ color: 'var(--color-muted)' }}
        >
          <span className="group-hover:-translate-x-1 transition-transform inline-block text-white">←</span>
          <span className="group-hover:text-white transition-colors">CORE WIRE DIRECTORY</span>
        </Link>

        <div className="font-mono text-xs uppercase tracking-widest mb-4 font-bold flex items-center gap-2"
             style={{ color: 'var(--color-paper-dim)' }}>
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          <span>AUTONOMOUS MEDIA HOUSE & NEURAL ARCHITECTURE v3.0</span>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.04] mb-6"
            style={{ color: 'var(--color-paper)' }}>
          SYSTEM{' '}
          <span className="text-gradient">// ARCHITECTURE</span>
        </h1>

        <p className="text-lg sm:text-xl leading-relaxed font-sans max-w-3xl" style={{ color: 'var(--color-paper-dim)' }}>
          NEWSAI is an autonomous, end-to-end situational awareness platform. By fusing
          real-time multi-source RSS ingestion with mathematical Jaccard clustering and
          Llama 3 generative synthesis, we deliver zero-noise executive news intelligence.
        </p>
      </motion.div>

      {/* ── Core Philosophy Box ── */}
      <div className="glass-card p-10 sm:p-14 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="font-mono text-xs uppercase tracking-widest font-bold text-white">
              // MISSION STATEMENT
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight" style={{ color: 'var(--color-paper)' }}>
              Precision Journalism via{' '}
              <span className="text-gradient">Mathematical Consensus</span>
            </h2>
            <p className="leading-relaxed text-sm sm:text-base font-sans" style={{ color: 'var(--color-paper-dim)' }}>
              Traditional news aggregation relies on simple keyword search and static feeds.
              NEWSAI treats news as a real-time signal processing problem — identifying signal
              consensus across multiple global wire services to eliminate bias and redundant reporting.
            </p>
          </div>

          {/* Spec table */}
          <div className="md:col-span-5 flex flex-col gap-0 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 font-mono text-xs tracking-widest uppercase">
            {[
              { label: 'LLM INFERENCING',  value: 'LLAMA 3.1 70B & 8B',  highlight: false },
              { label: 'CLUSTERING ALGO',  value: 'JACCARD IoU (0.35)',  highlight: false },
              { label: 'DATABASE ENGINE',  value: 'MONGODB CLUSTER',     highlight: false },
              { label: 'SCHEDULE',         value: 'EVERY 4 HOURS / CRON', highlight: false },
              { label: 'SOCIAL BROADCAST', value: 'MAKE.COM / ZAPIER',   highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex justify-between py-3 border-b border-white/10 last:border-b-0">
                <span style={{ color: 'var(--color-muted)' }}>{label}:</span>
                <span className={`font-bold ${highlight ? 'px-2 py-0.5 rounded border' : ''}`}
                      style={highlight ? { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.35)', color: '#ffffff' } : { color: 'var(--color-paper)' }}>
                  {value}
                </span>
              </div>
            ))}
            {/* Live status */}
            <div className="flex justify-between py-3 mt-1">
              <span style={{ color: 'var(--color-muted)' }}>RSS INGESTION:</span>
              <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--color-paper)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-white" />
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6-Stage Pipeline ── */}
      <div className="space-y-10">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] tracking-widest uppercase block mb-1 font-bold text-white">
                Processing Pipeline
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl" style={{ color: 'var(--color-paper)' }}>
                7-Stage Autonomous Media Engine
              </h2>
            </div>
            <span className="badge badge-verified hidden sm:inline-flex">
              CRON SCHEDULED
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pipelineSteps.map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="glass-card rounded-2xl p-7 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5 font-mono">
                  <span className="text-3xl font-black font-display transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    {step.num}
                  </span>
                  <span className="badge">
                    {step.tag}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg sm:text-xl mb-3 group-hover:text-gradient transition-all" style={{ color: 'var(--color-paper)' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed font-sans" style={{ color: 'var(--color-paper-dim)' }}>
                  {step.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest"
                   style={{ color: 'var(--color-muted)' }}>
                <span>PIPELINE STAGE {step.num} // ACTIVE</span>
                <span className="live-dot" style={{ width: 5, height: 5 }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div className="glass-card rounded-2xl p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
             style={{ background: 'linear-gradient(90deg, #ffffff, #666666, #ffffff)' }} />

        <h2 className="font-display font-bold text-2xl sm:text-4xl mb-4" style={{ color: 'var(--color-paper)' }}>
          Ready to Explore the Wire?
        </h2>
        <p className="max-w-xl mx-auto mb-8 text-sm sm:text-base font-sans" style={{ color: 'var(--color-paper-dim)' }}>
          Experience real-time news intelligence across all 14 global domains with
          instant AI executive takeaways and multi-source verified briefings.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            onClick={() => triggerGlitch(300)}
            className="btn-primary"
          >
            ENTER THE CORE WIRE →
          </Link>
          <Link
            to="/studio"
            onClick={() => triggerGlitch(300)}
            className="btn-ghost"
          >
            GO TO SOCIAL STUDIO →
          </Link>
        </div>
      </div>

    </div>
  );
}