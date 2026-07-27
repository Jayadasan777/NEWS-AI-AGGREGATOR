import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatFullDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const dayDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dayDate} • ${time}`;
}

function isNew(dateStr) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 4 * 60 * 60 * 1000;
}

export default function LatestFeed({ events = [], articles = [] }) {
  const combined = [
    ...events.map(ev => ({
      id: ev._id,
      title: ev.event_title,
      sector: ev.sector,
      timestamp: ev.last_updated || ev.first_reported,
      type: 'CLUSTER',
      link: `/event/${ev._id}`,
      count: ev.source_articles?.length || 1
    })),
    ...articles.map(art => ({
      id: art._id,
      title: art.title,
      sector: art.sector,
      timestamp: art.timestamp,
      type: 'DISPATCH',
      link: `/article/${art._id}`,
      count: 1
    }))
  ]
  .filter(item => item.timestamp)
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  .slice(0, 10);

  if (combined.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="live-dot" style={{ width: 6, height: 6, background: '#ffffff', boxShadow: '0 0 8px #ffffff' }} />
          <span className="font-mono text-xs font-black uppercase tracking-widest text-white">
            Live Intelligence Wire Feed
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded border border-white/20 bg-white/10 text-white font-mono">REAL-TIME</span>
        </div>
        <span className="section-label text-[11px]">
          Algorithmically Deduplicated · 6H Pulse
        </span>
      </div>

      {/* Horizontal Scrollable Strip */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none -mx-2 px-2">
        {combined.map((item, i) => {
          const _isNew = isNew(item.timestamp);
          return (
            <motion.div
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="flex-shrink-0 w-72 sm:w-80"
            >
              <Link
                to={item.link}
                className="group flex flex-col justify-between h-full gap-3 p-4 rounded-2xl transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="badge">
                        {item.sector}
                      </span>
                      <span className="badge badge-ai">
                        {item.type}
                      </span>
                      {_isNew && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-white bg-white text-black animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--color-paper)' }}>
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>

                  <p className="font-bold text-sm leading-snug line-clamp-2 transition-all group-hover:text-gradient"
                     style={{ color: 'var(--color-paper)' }}>
                    {item.title}
                  </p>
                </div>

                <div className="pt-2.5 flex items-center justify-between font-mono text-[10px]"
                     style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: 'var(--color-muted)' }}>
                    📅 {formatFullDateTime(item.timestamp)}
                  </span>
                  {item.type === 'CLUSTER' && (
                    <span className="font-bold px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
                      {item.count} NODES
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
