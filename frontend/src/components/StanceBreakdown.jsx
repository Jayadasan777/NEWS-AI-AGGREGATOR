import React from 'react';
import { motion } from 'framer-motion';

const STANCE_CONFIG = {
  Supporting: {
    color: '#4ade80',   // green
    glow: '0 0 12px rgba(74,222,128,0.45)',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.25)',
    icon: '▲',
    label: 'SUPPORTING',
  },
  Contradicting: {
    color: '#f87171',   // red
    glow: '0 0 12px rgba(248,113,113,0.45)',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.25)',
    icon: '▼',
    label: 'CONTRADICTING',
  },
  Neutral: {
    color: '#facc15',   // yellow
    glow: '0 0 12px rgba(250,204,21,0.35)',
    bg: 'rgba(250,204,21,0.06)',
    border: 'rgba(250,204,21,0.2)',
    icon: '◆',
    label: 'NEUTRAL',
  },
};

function DivergenceMeter({ score }) {
  const color = score >= 40 ? '#f87171' : score >= 15 ? '#facc15' : '#4ade80';
  const label = score >= 40 ? 'HIGH DIVERGENCE' : score >= 15 ? 'MODERATE DIVERGENCE' : 'CONSENSUS';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest font-bold">
        <span style={{ color: 'var(--color-muted)' }}>PUBLISHER DIVERGENCE SCORE</span>
        <span style={{ color }}>{label}</span>
      </div>
      <div
        className="w-full rounded-full h-2 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}55` }}
        />
      </div>
      <div className="flex justify-between font-mono text-[9px]" style={{ color: 'var(--color-muted)' }}>
        <span>0% — UNANIMOUS</span>
        <span className="font-bold" style={{ color }}>{score}%</span>
        <span>100% — TOTAL CONTRADICTION</span>
      </div>
    </div>
  );
}

export default function StanceBreakdown({ stanceAnalysis = [], divergenceScore = 0, factualityVerified = false, reflectionLogs = [] }) {
  if (!stanceAnalysis || stanceAnalysis.length === 0) return null;

  const counts = { Supporting: 0, Contradicting: 0, Neutral: 0 };
  stanceAnalysis.forEach(s => { if (counts[s.stance] !== undefined) counts[s.stance]++; });

  const hasReflectionIssues = reflectionLogs.some(l => !l.passed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1 }}
      className="space-y-6"
    >
      {/* ── Section Header ── */}
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--color-paper)' }}>
        <span className="live-dot" style={{ width: 6, height: 6, background: divergenceScore >= 40 ? '#f87171' : '#4ade80', boxShadow: `0 0 8px ${divergenceScore >= 40 ? '#f87171' : '#4ade80'}` }} />
        <span>PUBLISHER STANCE & DIVERGENCE ANALYSIS</span>
        <span className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.15), transparent)' }} />
      </div>

      {/* ── Divergence Meter ── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
      >
        <DivergenceMeter score={divergenceScore} />

        {/* Stance distribution pills */}
        <div className="flex flex-wrap gap-3 mt-5">
          {Object.entries(counts).map(([stance, count]) => {
            if (count === 0) return null;
            const cfg = STANCE_CONFIG[stance];
            return (
              <div
                key={stance}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
              >
                <span>{cfg.icon}</span>
                <span>{count} {stance}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Per-Source Stance Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stanceAnalysis.map((s, i) => {
          const cfg = STANCE_CONFIG[s.stance] || STANCE_CONFIG.Neutral;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="rounded-xl p-5 space-y-3"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, backdropFilter: 'blur(12px)' }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-lg"
                  style={{ background: `${cfg.color}22`, color: cfg.color, boxShadow: cfg.glow }}
                >
                  {cfg.icon} {cfg.label}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                  SOURCE #{i + 1} — {s.publisher}
                </span>
              </div>

              {s.framing && (
                <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: cfg.color }}>
                  FRAMING: {s.framing}
                </div>
              )}

              {s.rationale && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-paper-dim)' }}>
                  {s.rationale}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Factuality Verification Badge ── */}
      <div
        className="rounded-xl p-4 flex items-center gap-4"
        style={{
          background: factualityVerified ? 'rgba(74,222,128,0.06)' : 'rgba(250,204,21,0.06)',
          border: `1px solid ${factualityVerified ? 'rgba(74,222,128,0.2)' : 'rgba(250,204,21,0.2)'}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
          style={{ background: factualityVerified ? 'rgba(74,222,128,0.2)' : 'rgba(250,204,21,0.15)' }}
        >
          {factualityVerified ? '✓' : '⚠'}
        </div>
        <div className="space-y-1">
          <div className="font-mono text-[10px] font-extrabold uppercase tracking-widest" style={{ color: factualityVerified ? '#4ade80' : '#facc15' }}>
            {factualityVerified ? 'SUMMARY VERIFIED — GROUNDED IN RAW SOURCES' : 'SUMMARY AUTO-CORRECTED VIA REFLECTION LOOP'}
          </div>
          <div className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>
            {factualityVerified
              ? 'Hallucination guardrail check passed: no foreign entities or fabricated facts detected.'
              : `Reflection agent flagged ${reflectionLogs.filter(l => !l.passed).length} issue(s) and triggered self-correcting re-generation.`}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
