import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AutomationStatus() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('/articles/stats')
      .then(r => setStats(r.data?.data || null))
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const lastRunAgo = timeAgo(stats.lastRun);
  const hoursAgo = stats.lastRun
    ? (Date.now() - new Date(stats.lastRun).getTime()) / 3600000
    : 999;

  const healthy = hoursAgo < 13;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 rounded-2xl font-mono text-xs mb-8 transition-all duration-300 group"
         style={{
           background: 'linear-gradient(90deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
           border: '1px solid rgba(255,255,255,0.18)',
           backdropFilter: 'blur(20px)',
           boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.05)'
         }}>
      {/* Engine status */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-3 h-3">
          <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-40 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
        </div>
        <span className="font-extrabold tracking-wider uppercase text-white flex items-center gap-2">
          <span>{healthy ? 'SYSTEM ONLINE' : 'INGESTION DELAYED'}</span>
          <span className="text-[10px] px-2 py-0.5 rounded border border-white/20 bg-white/10 text-white font-mono">v3.0 ENGINE</span>
        </span>
      </div>

      <div className="flex items-center gap-4 flex-wrap text-[11px] text-[var(--color-paper-dim)]">
        {/* Last run */}
        <span className="flex items-center gap-1.5">
          <span className="text-white opacity-30">│</span>
          <span>LAST SYNC:</span>
          <span className="text-white font-bold">{lastRunAgo || 'JUST NOW'}</span>
        </span>

        {/* Total articles */}
        <span className="flex items-center gap-1.5">
          <span className="text-white opacity-30">│</span>
          <span>INDEXED NODES:</span>
          <span className="text-white font-bold px-1.5 py-0.5 rounded border border-white/20 bg-white/5">{stats.total}</span>
        </span>

        {/* Schedule */}
        <span className="hidden sm:flex items-center gap-1.5">
          <span className="text-white opacity-30">│</span>
          <span>TELEMETRY:</span>
          <span className="text-white font-semibold">ACTIVE (6H CRON)</span>
        </span>
      </div>
    </div>
  );
}
