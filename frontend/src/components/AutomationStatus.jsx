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

  // Healthy = ran within last 13 hours (covers either the 8 AM or 8 PM slot)
  const healthy = hoursAgo < 13;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 rounded-xl border border-[#2A2A2A] bg-[#111111] font-mono text-[10px] uppercase tracking-[0.2em] mb-6">
      {/* Engine status */}
      <span className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            healthy
              ? 'bg-[#22C55E] shadow-[0_0_6px_#22C55E] animate-pulse'
              : 'bg-[#DC2626] shadow-[0_0_6px_#DC2626] animate-pulse'
          }`}
        />
        <span className={healthy ? 'text-[#22C55E] font-bold' : 'text-[#DC2626] font-bold'}>
          {healthy ? 'AUTOMATION HEALTHY' : 'INGESTION DELAYED'}
        </span>
      </span>

      <span className="text-[#404040]">|</span>

      {/* Last run */}
      <span className="text-[#A0A0A0]">
        Last ingestion:{' '}
        <span className="text-[#F5F5F5] font-bold">{lastRunAgo || '—'}</span>
      </span>

      <span className="text-[#404040]">|</span>

      {/* Total articles */}
      <span className="text-[#A0A0A0]">
        Total articles:{' '}
        <span className="text-[#F5F5F5] font-bold">{stats.total}</span>
      </span>

      {/* Schedule note */}
      <span className="text-[#404040] hidden sm:inline">|</span>
      <span className="text-[#606060] hidden sm:inline">Schedule: 8 AM &amp; 8 PM IST</span>
    </div>
  );
}
