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
      color: '#0EA5E9',
    },
    {
      num: '02',
      title: 'Algorithmic Deduplication',
      desc: 'Title similarity normalization and URL hashing eliminate syndicated duplicate dispatches before database storage.',
      tag: 'ZERO NOISE REDUNDANCY',
      color: '#F59E0B',
    },
    {
      num: '03',
      title: 'Llama 3 Neural Rewrite',
      desc: 'Each raw dispatch is autonomously processed by Llama 3.1 70B to generate concise, objective, 100% original editorial summaries.',
      tag: 'AUTONOMOUS JOURNALISM',
      color: '#10B981',
    },
    {
      num: '04',
      title: 'Generative Visual Synthesis',
      desc: 'Title and content semantics trigger real-time neural image generation via Pollinations AI, producing custom editorial visuals.',
      tag: 'POLLINATIONS AI ENGINE',
      color: '#8B5CF6',
    },
    {
      num: '05',
      title: 'Jaccard Similarity Clustering',
      desc: 'Continuous cron jobs compute keyword Intersection-over-Union (IoU), merging related dispatches into unified multi-source clusters.',
      tag: 'MATHEMATICAL FUSION',
      color: '#EC4899',
    },
    {
      num: '06',
      title: 'Multi-Source Intelligence Synthesis',
      desc: 'When a cluster exceeds threshold similarity, Llama 3 synthesizes all contributing articles into a comprehensive intelligence briefing.',
      tag: 'CONFIDENCE VERIFIED',
      color: '#14B8A6',
    },
  ];

  return (
    <div className="space-y-24 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="pt-6 border-b border-white/15 pb-14"
      >
        <Link
          to="/"
          onClick={() => triggerGlitch(200)}
          className="inline-flex items-center gap-2.5 text-muted hover:text-paper font-mono text-xs uppercase tracking-[0.25em] mb-8 group font-bold"
        >
          <span className="group-hover:-translate-x-1.5 transition-transform text-[#F59E0B]">←</span> CORE WIRE DIRECTORY
        </Link>

        <div className="font-mono text-xs text-[#10B981] uppercase tracking-[0.3em] mb-4 font-extrabold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
          <span>// AUTONOMOUS NEURAL ARCHITECTURE v2.5</span>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-paper tracking-tight leading-[1.04] mb-6">
          SYSTEM <span className="gradient-text-gold">// ARCHITECTURE</span>
        </h1>

        <p className="text-paper-dim text-lg sm:text-xl leading-relaxed font-sans font-light max-w-3xl">
          NEWSAI is an autonomous, end-to-end situational awareness platform. By fusing real-time multi-source RSS ingestion with mathematical Jaccard clustering and Llama 3 generative synthesis, we deliver zero-noise executive news intelligence.
        </p>
      </motion.div>

      {/* ── Core Philosophy Box ── */}
      <div className="glass-panel p-10 sm:p-14 rounded-3xl border border-[#F59E0B]/40 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#0D121C] to-[#131926]">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#F59E0B]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="font-mono text-xs text-[#F59E0B] uppercase tracking-[0.28em] font-extrabold">// MISSION STATEMENT</div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-paper tracking-tight">
              Precision Journalism via <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F59E0B] to-[#FDE68A]">Mathematical Consensus</span>
            </h2>
            <p className="text-paper-dim font-light leading-relaxed text-sm sm:text-base">
              Traditional news aggregation relies on simple keyword search and static feeds. NEWSAI treats news as a real-time signal processing problem—identifying signal consensus across multiple global wire services to eliminate bias and redundant reporting.
            </p>
          </div>
          <div className="md:col-span-5 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 font-mono text-xs tracking-widest uppercase">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted">LLM INFERENCING:</span>
              <span className="text-paper font-bold">LLAMA 3.1 70B</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted">CLUSTERING ALGO:</span>
              <span className="text-[#10B981] font-bold">JACCARD IoU (0.35)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-muted">DATABASE ENGINE:</span>
              <span className="text-paper font-bold">MONGODB CLUSTER</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted">3D RENDERER:</span>
              <span className="text-[#F59E0B] font-bold">WEBGL // R3F</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── The 6-Stage Autonomous Pipeline ── */}
      <div className="space-y-12">
        <div className="font-mono text-xs text-muted uppercase tracking-[0.3em] flex items-center gap-4 font-extrabold border-b border-white/15 pb-4">
          <span>// THE 6-STAGE AUTONOMOUS PROCESSING PIPELINE</span>
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-[#10B981] font-bold">CRON SCHEDULED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pipelineSteps.map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-panel rounded-3xl p-8 border border-white/10 hover:border-white/25 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6 font-mono">
                  <span className="text-3xl font-black font-display text-white/20 group-hover:text-paper transition-colors">
                    {step.num}
                  </span>
                  <span
                    className="px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-extrabold bg-white/5 border border-white/10"
                    style={{ color: step.color }}
                  >
                    // {step.tag}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-paper mb-3 group-hover:text-[#F59E0B] transition-colors">
                  {step.title}
                </h3>
                <p className="text-paper-dim text-sm leading-relaxed font-sans font-light">
                  {step.desc}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted/50">
                <span>PIPELINE STAGE {step.num} // ACTIVE</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.color }} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div className="glass-panel rounded-3xl p-12 text-center border border-white/15 shadow-2xl">
        <h2 className="font-display font-bold text-2xl sm:text-4xl text-paper mb-4">
          Ready to Explore the Wire?
        </h2>
        <p className="text-paper-dim max-w-xl mx-auto mb-8 font-light text-sm sm:text-base">
          Experience real-time news intelligence across all 14 global domains with interactive 3D WebGL scenes and instant AI executive takeaways.
        </p>
        <Link
          to="/"
          onClick={() => triggerGlitch(300)}
          className="px-8 py-4 rounded-full bg-[#F59E0B] text-[#080B11] font-mono font-extrabold text-xs uppercase tracking-[0.25em] transition-all hover:scale-105 inline-block shadow-xl shadow-[#F59E0B]/20"
        >
          ENTER THE CORE WIRE →
        </Link>
      </div>
    </div>
  );
}