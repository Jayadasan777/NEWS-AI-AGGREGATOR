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

function isNew(dateStr) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < 3 * 60 * 60 * 1000;
}

export default function LatestFeed({ events }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Section Label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse shadow-[0_0_8px_#DC2626]" />
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[#DC2626]">
          BREAKING / LATEST
        </span>
        <div className="flex-1 h-px bg-[#2A2A2A]" />
        <span className="font-mono text-[10px] text-[#606060] tracking-[0.2em] uppercase">
          Auto-updated every 12h
        </span>
      </div>

      {/* Horizontal Scrollable Strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
        {events.map((event, i) => {
          const timestamp = event.last_updated || event.first_reported;
          const _isNew = isNew(timestamp);
          return (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="flex-shrink-0 w-64 sm:w-72"
            >
              <Link
                to={`/event/${event._id}`}
                className="group flex flex-col gap-2 p-3.5 rounded-xl border border-[#2A2A2A] bg-[#111111] hover:bg-[#181818] hover:border-[#3A3A3A] transition-all"
              >
                {/* Top row: sector + NEW badge + time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A0A0A0] font-bold">
                      {event.sector}
                    </span>
                    {_isNew && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-[#DC2626] text-white font-mono">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[9px] text-[#606060] tracking-wide">
                    {timeAgo(timestamp)}
                  </span>
                </div>

                {/* Headline */}
                <p className="font-display font-semibold text-[13px] text-[#F5F5F5] leading-snug line-clamp-2 group-hover:text-white transition-colors">
                  {event.event_title}
                </p>

                {/* Source count */}
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] text-[#606060] uppercase tracking-wider">
                    {event.source_articles?.length || 1} source{(event.source_articles?.length || 1) > 1 ? 's' : ''} fused
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
