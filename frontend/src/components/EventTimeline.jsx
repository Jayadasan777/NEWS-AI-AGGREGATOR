import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
  if (hours > 0) return `${hours}h ${mins}m ago`;
  return `${mins}m ago`;
}

function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

// Simple deterministic publisher guess from title patterns
function getPublisherHint(title = '', index = 0) {
  const patterns = [
    /^(Reuters|Bloomberg|BBC|CNN|AP News|CNBC|WSJ|Financial Times|NYT|Guardian|Al Jazeera|TechCrunch|Forbes|Axios)\b/i,
    /[-|]\s*(Reuters|Bloomberg|BBC|CNN|AP News|CNBC)\s*$/i,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) return m[1];
  }
  return `Source #${index + 1}`;
}

export default function EventTimeline({ sourceArticles = [], sector = '' }) {
  if (!sourceArticles || sourceArticles.length === 0) return null;

  // Sort articles by timestamp ascending for chronological view
  const sorted = [...sourceArticles].sort((a, b) => {
    const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tA - tB;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="space-y-5"
    >
      {/* ── Section Header ── */}
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--color-paper)' }}>
        <span className="live-dot" style={{ width: 6, height: 6, background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
        <span>CHRONOLOGICAL EVENT TIMELINE</span>
        <span className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.15), transparent)' }} />
        <span className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>{sorted.length} DISPATCHES</span>
      </div>

      {/* ── Timeline ── */}
      <div className="relative">
        {/* Vertical spine */}
        <div
          className="absolute left-5 top-0 bottom-0 w-px"
          style={{ background: 'linear-gradient(to bottom, rgba(167,139,250,0.4), rgba(167,139,250,0.05))' }}
        />

        <div className="space-y-4 pl-14">
          {sorted.map((art, i) => {
            const isFirst = i === 0;
            const isLast = i === sorted.length - 1;
            const publisher = getPublisherHint(art.title, i);

            return (
              <motion.div
                key={art._id || i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 * i, duration: 0.4 }}
                className="relative"
              >
                {/* Timeline node */}
                <div
                  className="absolute -left-9 top-5 w-3 h-3 rounded-full border-2 flex items-center justify-center"
                  style={{
                    background: isFirst ? '#a78bfa' : isLast ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.15)',
                    borderColor: isFirst ? '#a78bfa' : 'rgba(167,139,250,0.4)',
                    boxShadow: isFirst ? '0 0 12px #a78bfa88' : 'none',
                  }}
                />

                {/* Card */}
                <Link
                  to={`/article/${art._id}`}
                  className="block group rounded-xl p-4 transition-all"
                  style={{
                    background: isFirst ? 'rgba(167,139,250,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isFirst ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {/* Meta row */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {isFirst && (
                        <span
                          className="font-mono text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}
                        >
                          FIRST REPORT
                        </span>
                      )}
                      {isLast && sorted.length > 1 && (
                        <span
                          className="font-mono text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-muted)' }}
                        >
                          LATEST UPDATE
                        </span>
                      )}
                      <span
                        className="font-mono text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: '#a78bfa' }}
                      >
                        {publisher}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[9px] shrink-0" style={{ color: 'var(--color-muted)' }}>
                      <span>{formatTimestamp(art.timestamp)}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                      <span>{formatRelativeTime(art.timestamp)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h4
                    className="font-display font-bold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-gradient transition-colors"
                    style={{ color: 'var(--color-paper)' }}
                  >
                    {art.title}
                  </h4>

                  {/* Sector & action row */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t font-mono text-[9px] uppercase tracking-widest font-bold"
                       style={{ borderColor: 'rgba(255,255,255,0.07)', color: 'var(--color-muted)' }}
                  >
                    <span>{sector}</span>
                    <span className="group-hover:translate-x-0.5 transition-transform inline-block text-white">VIEW DISPATCH →</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
