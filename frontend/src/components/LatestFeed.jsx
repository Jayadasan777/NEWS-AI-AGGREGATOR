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
  // Combine events and articles into one unified latest stream
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
    <div className="mb-8">
      {/* Section Label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse shadow-[0_0_8px_#DC2626]" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[#DC2626]">
          BREAKING / LATEST WIRE
        </span>
        <div className="flex-1 h-px bg-[#2A2A2A]" />
        <span className="font-mono text-[10px] text-[#606060] tracking-[0.2em] uppercase">
          Auto-updated every 4h
        </span>
      </div>

      {/* Horizontal Scrollable Strip */}
      <div className="flex gap-3.5 overflow-x-auto pb-3 scrollbar-none -mx-2 px-2">
        {combined.map((item, i) => {
          const _isNew = isNew(item.timestamp);
          return (
            <motion.div
              key={`${item.type}-${item.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="flex-shrink-0 w-72 sm:w-80"
            >
              <Link
                to={item.link}
                className="group flex flex-col justify-between h-full gap-2.5 p-4 rounded-xl border border-[#2A2A2A] bg-[#111111] hover:bg-[#181818] hover:border-[#3A3A3A] transition-all"
              >
                <div>
                  {/* Top row: sector + NEW badge + time ago */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#F5F5F5] font-bold bg-[#2A2A2A] px-1.5 py-0.5 rounded">
                        {item.sector}
                      </span>
                      <span className="font-mono text-[8px] text-[#A0A0A0] uppercase tracking-wider border border-[#2A2A2A] px-1.5 py-0.5 rounded">
                        {item.type}
                      </span>
                      {_isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-[#DC2626] text-white font-mono">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-[#A0A0A0] font-bold">
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>

                  {/* Headline */}
                  <p className="font-display font-semibold text-[14px] text-[#F5F5F5] leading-snug line-clamp-2 group-hover:text-white transition-colors">
                    {item.title}
                  </p>
                </div>

                {/* Bottom row: Full Day, Date & Time */}
                <div className="pt-2.5 border-t border-[#1F1F1F] flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[#C8C8C8] font-medium tracking-wide">
                    📅 {formatFullDateTime(item.timestamp)}
                  </span>
                  {item.type === 'CLUSTER' && (
                    <span className="font-mono text-[9px] text-[#606060] uppercase">
                      {item.count} src
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

