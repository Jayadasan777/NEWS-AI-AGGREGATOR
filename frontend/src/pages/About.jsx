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
          className="inline-flex items-center gap-2 text-[#606060] hover:text-[#F5F5F5] font-mono text-[11px] uppercase tracking-[0.25em] mb-8 group font-bold transition-colors"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          CORE WIRE DIRECTORY
        </Link>

        {/* Double rule — newspaper style */}
        <div className="border-t-[3px] border-[#F5F5F5] mb-1" />
        <div className="border-t border-[#3A3A3A] mb-6" />

        <div className="font-mono text-[11px] text-[#606060] uppercase tracking-[0.3em] mb-4 font-extrabold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
          <span>AUTONOMOUS NEURAL ARCHITECTURE v2.5</span>
        </div>

        <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl text-[#F5F5F5] tracking-tight leading-[1.04] mb-6">
          SYSTEM{' '}
          <span className="text-white">// ARCHITECTURE</span>
        </h1>

        <p className="text-[#A0A0A0] text-lg sm:text-xl leading-relaxed font-sans max-w-3xl">
          NEWSAI is an autonomous, end-to-end situational awareness platform. By fusing
          real-time multi-source RSS ingestion with mathematical Jaccard clustering and
          Llama 3 generative synthesis, we deliver zero-noise executive news intelligence.
        </p>
      </motion.div>

      {/* ── Core Philosophy Box ── */}
      <div className="glass-panel p-10 sm:p-14 rounded-2xl border border-[#2A2A2A]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="font-mono text-[10px] text-[#606060] uppercase tracking-[0.28em] font-extrabold">
              // MISSION STATEMENT
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F5F5F5] tracking-tight">
              Precision Journalism via{' '}
              <span className="text-white">Mathematical Consensus</span>
            </h2>
            <p className="text-[#A0A0A0] leading-relaxed text-sm sm:text-base font-sans">
              Traditional news aggregation relies on simple keyword search and static feeds.
              NEWSAI treats news as a real-time signal processing problem — identifying signal
              consensus across multiple global wire services to eliminate bias and redundant reporting.
            </p>
          </div>

          {/* Spec table */}
          <div className="md:col-span-5 flex flex-col gap-0 border-t md:border-t-0 md:border-l border-[#2A2A2A] pt-6 md:pt-0 md:pl-8 font-mono text-[11px] tracking-widest uppercase">
            {[
              { label: 'LLM INFERENCING',  value: 'LLAMA 3.1 70B',      highlight: false },
              { label: 'CLUSTERING ALGO',  value: 'JACCARD IoU (0.35)',  highlight: false },
              { label: 'DATABASE ENGINE',  value: 'MONGODB CLUSTER',     highlight: false },
              { label: 'SCHEDULE',         value: '8 AM & 8 PM IST',     highlight: false },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-3 border-b border-[#1A1A1A] last:border-b-0">
                <span className="text-[#606060]">{label}:</span>
                <span className="text-[#F5F5F5] font-bold">{value}</span>
              </div>
            ))}
            {/* Live status */}
            <div className="flex justify-between py-3 mt-1">
              <span className="text-[#606060]">RSS INGESTION:</span>
              <span className="text-[#22C55E] font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6-Stage Pipeline ── */}
      <div className="space-y-10">
        {/* Section header — double rule */}
        <div>
          <div className="border-t-[3px] border-[#F5F5F5] mb-1" />
          <div className="border-t border-[#3A3A3A] mb-4" />
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[9px] text-[#606060] tracking-[0.3em] uppercase block mb-1 font-bold">
                Processing Pipeline
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#F5F5F5]">
                6-Stage Autonomous Engine
              </h2>
            </div>
            <span className="font-mono text-[10px] text-[#606060] tracking-[0.2em] uppercase hidden sm:block font-bold">
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
              className="glass-panel rounded-2xl p-7 border border-[#2A2A2A] hover:border-[#3A3A3A] transition-all group"
            >
              <div className="flex items-center justify-between mb-5 font-mono">
                <span className="text-3xl font-black font-display text-[#2A2A2A] group-hover:text-[#3A3A3A] transition-colors">
                  {step.num}
                </span>
                <span className="px-2.5 py-1 rounded text-[9px] uppercase tracking-widest font-extrabold border border-[#2A2A2A] text-[#606060]">
                  {step.tag}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-[#F5F5F5] mb-3 group-hover:text-white transition-colors">
                {step.title}
              </h3>
              <p className="text-[#A0A0A0] text-sm leading-relaxed font-sans">
                {step.desc}
              </p>
              <div className="mt-6 pt-4 border-t border-[#1A1A1A] flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-[#404040]">
                <span>PIPELINE STAGE {step.num} // ACTIVE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Footer CTA ── */}
      <div className="glass-panel rounded-2xl p-12 text-center border border-[#2A2A2A]">
        {/* Double rule */}
        <div className="border-t-[3px] border-[#F5F5F5] mb-1 max-w-xs mx-auto" />
        <div className="border-t border-[#3A3A3A] mb-8 max-w-xs mx-auto" />

        <h2 className="font-display font-bold text-2xl sm:text-4xl text-[#F5F5F5] mb-4">
          Ready to Explore the Wire?
        </h2>
        <p className="text-[#A0A0A0] max-w-xl mx-auto mb-8 text-sm sm:text-base font-sans">
          Experience real-time news intelligence across all 14 global domains with
          instant AI executive takeaways and multi-source verified briefings.
        </p>
        <Link
          to="/"
          onClick={() => triggerGlitch(300)}
          className="px-8 py-4 rounded-full border border-[#F5F5F5] bg-[#F5F5F5] text-[#0A0A0A] font-mono font-extrabold text-xs uppercase tracking-[0.25em] transition-all hover:bg-transparent hover:text-[#F5F5F5] inline-block"
        >
          ENTER THE CORE WIRE →
        </Link>
      </div>

    </div>
  );
}