import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';
import SectorBadge from '../components/SectorBadge';
import { useHUD } from '../context/HUDContext';

export default function SocialStudio() {
  const { triggerGlitch } = useHUD();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [isAutoEnabled, setIsAutoEnabled] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [broadcastingId, setBroadcastingId] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [cronSchedule, setCronSchedule] = useState('Weekly (Every Monday)');
  const [lastIngestionTime, setLastIngestionTime] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState(null);

  // 🔒 Admin PIN unlock — works on any device/browser
  const ADMIN_PIN = 'Das@2403';
  const ADMIN_SECRET = 'NISE-ADMIN-2026-DASAN-X9K7M2P';
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const [DEMO_MODE, setDemoMode] = useState(() => {
    if (isLocalhost) return false;
    if (typeof window !== 'undefined' && localStorage.getItem('nise_admin_token') === ADMIN_SECRET) {
      return false;
    }
    return true;
  });

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleAdminUnlock = () => {
    if (pinInput.trim() === ADMIN_PIN) {
      localStorage.setItem('nise_admin_token', ADMIN_SECRET);
      setDemoMode(false);
      setPinError(false);
      setPinInput('');
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleAdminLock = () => {
    localStorage.removeItem('nise_admin_token');
    setDemoMode(true);
  };

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/social/queue?status=${activeTab === 'all' ? 'all' : activeTab}`);
      const data = res.data.data || [];
      setArticles(data);
      setIsAutoEnabled(Boolean(res.data.autoBroadcastEnabled));
      setWebhookConfigured(Boolean(res.data.webhookConfigured));
      setCronSchedule(res.data.cronSchedule || 'Weekly (Every Monday)');
      setLastIngestionTime(res.data.lastIngestionTime || null);
      
      setSelectedArticle((prev) => {
        if (!prev) return data.length > 0 ? data[0] : null;
        const exists = data.find((a) => a._id === prev._id);
        return exists ? exists : (data.length > 0 ? data[0] : null);
      });
    } catch (err) {
      setError('Failed to load social broadcast queue from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const handleToggleAuto = async () => {
    if (DEMO_MODE) {
      setBroadcastMessage({ type: 'locked', text: '🔒 Admin access required. Automation controls are restricted to the platform administrator.' });
      return;
    }
    triggerGlitch(150);
    try {
      const res = await API.post('/social/toggle-auto');
      if (res.data && typeof res.data.autoBroadcastEnabled === 'boolean') {
        setIsAutoEnabled(res.data.autoBroadcastEnabled);
      }
    } catch {
      alert('Failed to toggle autonomous broadcast setting.');
    }
  };

  const handleTriggerScrape = async () => {
    if (DEMO_MODE) {
      setScrapeMessage({ type: 'locked', text: '🔒 Admin access required. News scrape is restricted to the platform administrator.' });
      return;
    }
    triggerGlitch(200);
    setScraping(true);
    setScrapeMessage(null);
    try {
      const res = await API.post('/social/trigger-scrape');
      if (res.data && res.data.success) {
        setScrapeMessage({ type: 'success', text: res.data.message });
        setTimeout(() => { fetchQueue(); }, 5000);
      }
    } catch (err) {
      setScrapeMessage({ type: 'error', text: 'Failed to trigger manual scrape.' });
    } finally {
      setScraping(false);
    }
  };

  const handleBroadcast = async (e, articleId) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (DEMO_MODE) {
      setBroadcastMessage({ type: 'locked', text: '🔒 Admin access required. Broadcasting is restricted to the platform administrator.' });
      return;
    }
    const targetId = articleId || selectedArticle?._id;
    if (!targetId) return;
    triggerGlitch(300);
    setBroadcastingId(targetId);
    setBroadcastMessage(null);
    try {
      const res = await API.post(`/social/broadcast/${targetId}`);
      if (res.data && res.data.success) {
        setBroadcastMessage({
          type: res.data.simulation ? 'simulation' : 'success',
          text: res.data.message
        });
        setArticles((prev) =>
          prev.map((a) => (a._id === targetId ? { ...a, broadcast_status: 'broadcasted', broadcast_error: '', broadcast_time: new Date() } : a))
        );
        setSelectedArticle((prev) =>
          prev && prev._id === targetId ? { ...prev, broadcast_status: 'broadcasted', broadcast_error: '', broadcast_time: new Date() } : prev
        );
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to dispatch broadcast.';
      setBroadcastMessage({
        type: 'error',
        text: errorMsg
      });
      setArticles((prev) =>
        prev.map((a) => (a._id === targetId ? { ...a, broadcast_status: 'failed', broadcast_error: errorMsg } : a))
      );
      setSelectedArticle((prev) =>
        prev && prev._id === targetId ? { ...prev, broadcast_status: 'failed', broadcast_error: errorMsg } : prev
      );
    } finally {
      setBroadcastingId(null);
    }
  };

  return (
    <div className="space-y-16 pb-20">

      {/* ── Admin Status Banner + PIN Unlock ── */}
      {DEMO_MODE ? (
        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <span className="font-mono text-xs font-extrabold text-yellow-300 tracking-widest uppercase">🔒 DEMO MODE</span>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="password"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminUnlock()}
              placeholder="Enter admin PIN..."
              className={`flex-1 bg-white/5 border rounded-lg px-3 py-2 font-mono text-xs text-white outline-none transition-all ${
                pinError ? 'border-red-500/60' : 'border-white/20 focus:border-white/50'
              }`}
            />
            <button
              onClick={handleAdminUnlock}
              className="px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
            >
              UNLOCK
            </button>
          </div>
          {pinError && <span className="font-mono text-xs text-red-400">❌ Wrong PIN</span>}
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl font-mono text-xs font-extrabold tracking-widest uppercase bg-green-500/10 text-green-300 border border-green-500/30">
          <span>✅ ADMIN MODE — Full Access Unlocked</span>
          <button
            onClick={handleAdminLock}
            className="text-[10px] px-2 py-0.5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-200 border border-green-500/40 transition-colors cursor-pointer"
          >
            🔒 LOCK DEMO
          </button>
        </div>
      )}

      {/* ── Studio Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6 border-b border-white/10 pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8"
      >
        <div>
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest mb-3 font-bold">
            <span className="live-dot" style={{ width: 6, height: 6 }} />
            <span style={{ color: 'var(--color-paper)' }}>AUTONOMOUS MEDIA HOUSE</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <span style={{ color: 'var(--color-paper-dim)' }}>INSTAGRAM & SOCIAL BROADCAST STUDIO</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl tracking-tight leading-none"
              style={{ color: 'var(--color-paper)' }}>
            SOCIAL <span className="text-gradient">// STUDIO</span>
          </h1>
        </div>

        {/* Autonomous Toggle & Status Bar */}
        <div className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${webhookConfigured ? 'bg-white shadow-[0_0_8px_#ffffff]' : 'bg-neutral-500 shadow-[0_0_8px_#737373]'}`} />
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-paper)' }}>
                WEBHOOK: {webhookConfigured ? 'CONFIGURED (LIVE)' : 'SIMULATION MODE'}
              </div>
              <div className="text-[10px] font-sans" style={{ color: 'var(--color-paper-dim)' }}>
                {webhookConfigured ? 'Connected to Make.com/Zapier/n8n' : 'Add SOCIAL_WEBHOOK_URL to .env for real posting'}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          <button
            onClick={handleToggleAuto}
            className="px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest font-extrabold transition-all border flex items-center gap-2 shadow-lg cursor-pointer"
            style={{
              background: isAutoEnabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
              borderColor: isAutoEnabled ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span className={`w-2 h-2 rounded-full ${isAutoEnabled ? 'bg-white animate-ping' : 'bg-gray-400'}`} />
            <span>ROBOT MODE: {isAutoEnabled ? 'AUTO-ON' : 'MANUAL'}</span>
          </button>
        </div>
      </motion.div>

      {/* ── System Health & Automation Monitor Bar ── */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-muted)' }}>AUTOMATION CRON SCHEDULE</div>
            <div className="font-mono text-sm font-extrabold flex items-center gap-2 mt-1" style={{ color: 'var(--color-paper)' }}>
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] animate-pulse" />
              <span>{cronSchedule}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-muted)' }}>LAST NEWS SCRAPE & INGESTION</div>
            <div className="font-mono text-sm font-extrabold mt-1" style={{ color: 'var(--color-paper-dim)' }}>
              {lastIngestionTime ? new Date(lastIngestionTime).toLocaleString() : 'Waiting for initial scrape...'}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleTriggerScrape}
            disabled={scraping}
            className="w-full sm:w-auto btn-glass justify-center"
          >
            {scraping ? (
              <>
                <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                <span>SCRAPING 14 FEEDS...</span>
              </>
            ) : (
              <>
                <span>⚡ MANUAL OVERRIDE: SCRAPE NOW</span>
              </>
            )}
          </button>
        </div>
      </div>

      {scrapeMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl font-mono text-xs text-center border ${
            scrapeMessage.type === 'error'
              ? 'bg-white/10 text-white border-white/30'
              : scrapeMessage.type === 'locked'
              ? 'bg-yellow-500/10 text-yellow-200 border-yellow-500/40 backdrop-blur-md'
              : 'bg-white/15 text-white font-bold border-white/40'
          }`}
        >
          {scrapeMessage.text}
        </motion.div>
      )}

      {/* ── Studio Content Matrix ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* LEFT COLUMN: Queue & Instructions (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-widest">
              {[
                { id: 'all', label: 'ALL DISPATCHES' },
                { id: 'pending', label: 'PENDING QUEUE' },
                { id: 'broadcasted', label: 'BROADCASTED' },
                { id: 'failed', label: 'FAILED DISPATCHES' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); triggerGlitch(100); }}
                  className="px-4 py-2 rounded-xl transition-all font-bold cursor-pointer"
                  style={{
                    background: activeTab === t.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                    border: activeTab === t.id ? '1px solid rgba(255,255,255,0.35)' : '1px solid transparent',
                    color: activeTab === t.id ? '#ffffff' : 'var(--color-muted)'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchQueue}
              className="font-mono text-xs uppercase transition-colors hover:text-white cursor-pointer"
              style={{ color: 'var(--color-paper-dim)' }}
            >
              [ REFRESH QUEUE ]
            </button>
          </div>

          {/* Queue List */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 glass-card rounded-2xl">
              <div className="w-8 h-8 rounded-full border border-white/20 border-t-white animate-spin" />
              <div className="font-mono text-xs tracking-widest uppercase font-bold" style={{ color: 'var(--color-paper)' }}>
                LOADING SOCIAL DISPATCH QUEUE…
              </div>
            </div>
          ) : error ? (
            <div className="p-8 glass-card rounded-2xl border-white/20 text-center">
              <p className="font-semibold" style={{ color: 'var(--color-paper)' }}>{error}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-16 glass-card rounded-2xl text-center space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--color-muted)' }}>QUEUE EMPTY</div>
              <p className="text-xl font-display font-bold" style={{ color: 'var(--color-paper)' }}>No dispatches found in this tab.</p>
              <p className="text-sm" style={{ color: 'var(--color-paper-dim)' }}>When the cron runs or you manually trigger ingestion, new AI articles will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((art) => {
                const isSelected = selectedArticle && selectedArticle._id === art._id;
                const isBroadcasted = art.broadcast_status === 'broadcasted';
                const isFailed = art.broadcast_status === 'failed';
                return (
                  <div
                    key={art._id}
                    onClick={() => { setSelectedArticle(art); setShowFullCaption(false); setLiked(false); triggerGlitch(150); }}
                    className="p-6 rounded-2xl transition-all cursor-pointer border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                    style={{
                      background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                      borderColor: isSelected ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: isSelected ? '0 8px 32px rgba(255,255,255,0.15)' : 'none',
                      transform: isSelected ? 'scale(1.01)' : 'none'
                    }}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <img
                        src={art.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80'}
                        alt={art.title}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80'; }}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/10 bg-black/50"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <SectorBadge sector={art.sector} size="sm" />
                          <span className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>
                            {new Date(art.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base truncate" style={{ color: 'var(--color-paper)' }}>
                          {art.title}
                        </h4>
                        <p className="text-xs font-light truncate" style={{ color: 'var(--color-paper-dim)' }}>
                          {art.social_caption ? art.social_caption.split('\n')[0] : art.unique_summary}
                        </p>
                        {isFailed && art.broadcast_error && (
                          <div className="p-2 mt-1 rounded bg-white/10 border border-white/20 text-white font-mono text-[10px]">
                            ⚠️ FAILURE LOG: {art.broadcast_error}
                          </div>
                        )}
                        {isBroadcasted && art.broadcast_time && (
                          <div className="font-mono text-[9px] text-white font-bold uppercase mt-1">
                            ✓ DISPATCHED: {new Date(art.broadcast_time).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-1 rounded font-mono text-[9px] font-bold tracking-widest uppercase"
                          style={{
                            background: isBroadcasted ? 'rgba(255,255,255,0.12)' : isFailed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${isBroadcasted ? 'rgba(255,255,255,0.3)' : isFailed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}`,
                            color: isBroadcasted ? 'var(--color-paper)' : isFailed ? 'var(--color-paper)' : 'var(--color-paper-dim)'
                          }}
                        >
                          {isBroadcasted ? '✓ BROADCASTED' : isFailed ? '✕ FAILED' : '⏳ PENDING'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleBroadcast(e, art._id)}
                          disabled={broadcastingId === art._id}
                          className="px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase font-extrabold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border shadow-md shrink-0 hover:scale-105 active:scale-95"
                          style={{
                            background: isBroadcasted ? 'rgba(255,255,255,0.1)' : '#ffffff',
                            borderColor: '#ffffff',
                            color: isBroadcasted ? '#ffffff' : '#000000'
                          }}
                        >
                          {broadcastingId === art._id ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                              <span>POSTING...</span>
                            </>
                          ) : isBroadcasted ? (
                            <>
                              <span>🔄 RE-POST</span>
                            </>
                          ) : isFailed ? (
                            <>
                              <span>⚡ RETRY</span>
                            </>
                          ) : (
                            <>
                              <span>🚀 POST TO FB</span>
                            </>
                          )}
                        </button>

                        <span className="font-mono text-xs font-bold flex items-center gap-1 group text-gradient hidden sm:flex">
                          <span>PREVIEW</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info & Setup Matrix Card */}
          <div className="glass-card p-8 rounded-2xl space-y-4">
            <div className="font-mono text-xs uppercase tracking-widest font-extrabold flex items-center gap-2" style={{ color: 'var(--color-paper)' }}>
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              <span>HOW TO CONNECT INSTAGRAM / WEBHOOKS</span>
            </div>
            <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--color-paper)' }}>
              This studio generates production-ready Instagram content for every article. To automatically publish to real accounts:
            </p>
            <ol className="list-decimal list-inside text-xs space-y-2 font-mono" style={{ color: 'var(--color-paper-dim)' }}>
              <li>Create a free account on <a href="https://www.make.com/" target="_blank" rel="noreferrer" className="text-white underline">Make.com</a> or Zapier.</li>
              <li>Create a new Scenario/Zap with a <strong>Custom Webhook</strong> trigger and copy the URL.</li>
              <li>Add the URL to your <code className="bg-white/10 px-2 py-0.5 rounded text-white">.env</code> file as <code className="bg-white/10 px-2 py-0.5 rounded text-white">SOCIAL_WEBHOOK_URL="https://..."</code>.</li>
              <li>Connect your Instagram Business account in Make/Zapier to map the Image URL and Caption.</li>
              <li>Click <strong>"ROBOT MODE: AUTO-ON"</strong> above to let NewsAI broadcast 24/7 without intervention!</li>
            </ol>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive iPhone 15 Pro Studio (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="font-mono text-xs uppercase tracking-widest text-center font-bold" style={{ color: 'var(--color-paper-dim)' }}>
            LIVE IPHONE 15 PRO // FACEBOOK & SOCIAL PREVIEW
          </div>

          {/* The Phone Container */}
          <div className="w-[340px] sm:w-[360px] mx-auto bg-[#050914] rounded-[54px] p-4 border-[12px] border-[#181c2a] shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative select-none">
            {/* Dynamic Island */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 border border-white/10 flex items-center justify-between px-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a]" />
            </div>

            {/* iPhone Screen Inner */}
            <div className="bg-[#02050c] rounded-[40px] overflow-hidden pt-10 pb-6 text-white font-sans text-xs min-h-[580px] flex flex-col justify-between border border-white/10">
              {selectedArticle ? (
                <div className="space-y-3 flex-1 flex flex-col">
                  {/* IG Post Header */}
                  <div className="flex items-center justify-between px-3 pt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white border border-white/20 flex items-center justify-center font-display font-black text-xs text-black">
                        N
                      </div>
                      <div>
                        <div className="font-bold text-[11px] flex items-center gap-1 leading-none text-white">
                          <span>newsai.daily</span>
                          <span className="w-3 h-3 rounded-full bg-white text-black font-black text-[8px] flex items-center justify-center">✓</span>
                        </div>
                        <div className="text-[9px] text-gray-400 leading-none mt-1 uppercase font-mono tracking-wider">
                          {selectedArticle.sector} • SPONSORED DISPATCH
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-400 tracking-widest">•••</span>
                  </div>

                  {/* IG Media Display (Square Aspect Ratio) */}
                  <div className="relative aspect-square w-full bg-black/60 overflow-hidden border-y border-white/10">
                    <img
                      src={selectedArticle.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80'}
                      alt={selectedArticle.title}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1400&q=80'; }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded font-mono text-[8px] text-white/90 uppercase tracking-wider border border-white/15">
                      NEWSAI PRESS PHOTO
                    </div>
                  </div>

                  {/* IG Action Bar */}
                  <div className="px-3 flex items-center justify-between pt-1">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setLiked(!liked)} className="text-xl transition-transform active:scale-125 cursor-pointer">
                        {liked ? <span className="text-white">♥</span> : <span>♡</span>}
                      </button>
                      <span className="text-lg cursor-pointer">💬</span>
                      <span className="text-lg cursor-pointer">✈</span>
                    </div>
                    <span className="text-lg cursor-pointer">🔖</span>
                  </div>

                  {/* IG Likes Counter */}
                  <div className="px-3 font-bold text-[11px] text-white">
                    {liked ? '1,429 likes' : '1,428 likes'}
                  </div>

                  {/* IG Caption Area */}
                  <div className="px-3 text-[11px] leading-relaxed text-gray-300 flex-1 overflow-y-auto max-h-[140px] scrollbar-none">
                    <span className="font-bold text-white mr-2">newsai.daily</span>
                    <span className="whitespace-pre-line">
                      {showFullCaption || !selectedArticle.social_caption
                        ? selectedArticle.social_caption || selectedArticle.unique_summary
                        : `${selectedArticle.social_caption.slice(0, 110)}...`}
                    </span>
                    {selectedArticle.social_caption && selectedArticle.social_caption.length > 110 && !showFullCaption && (
                      <button
                        onClick={() => setShowFullCaption(true)}
                        className="text-gray-400 hover:text-white ml-1 font-semibold cursor-pointer"
                      >
                        more
                      </button>
                    )}

                    {/* Hashtags Strip */}
                    <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px] text-gray-400">
                      {(selectedArticle.social_hashtags || [`#${selectedArticle.sector}`, '#NewsAI', '#BreakingNews']).map((tag, idx) => (
                        <span key={idx} className="hover:text-white cursor-pointer">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* IG Timestamp */}
                  <div className="px-3 font-mono text-[8px] text-gray-500 uppercase tracking-widest pb-1 border-t border-white/10 pt-2">
                    PUBLISHED ON {new Date(selectedArticle.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-6 font-mono text-xs uppercase tracking-widest text-gray-500">
                  SELECT A DISPATCH FROM THE LEFT QUEUE TO PREVIEW
                </div>
              )}

              {/* iPhone Home Bar */}
              <div className="w-32 h-1 bg-white/20 rounded-full mx-auto mt-2" />
            </div>
          </div>

          {/* Broadcast Action Button & Feedback Alert */}
          {selectedArticle && (
            <div className="space-y-3 max-w-[360px] mx-auto">

              {selectedArticle.broadcast_status === 'failed' && (
                <div className="p-3 bg-white/10 border border-white/30 rounded-xl text-white font-mono text-xs text-center">
                  <strong>❌ FB BROADCAST FAILED:</strong> {selectedArticle.broadcast_error || 'Network or Make.com execution error'}
                </div>
              )}

              <button
                onClick={(e) => handleBroadcast(e, selectedArticle._id)}
                disabled={broadcastingId === selectedArticle._id}
                className="w-full py-4 rounded-2xl font-mono text-xs uppercase tracking-[0.2em] font-extrabold transition-all flex items-center justify-center gap-3 shadow-2xl border cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: '#ffffff',
                  borderColor: '#ffffff',
                  color: '#000000',
                  boxShadow: '0 8px 32px rgba(255,255,255,0.25)'
                }}
              >
                {broadcastingId === selectedArticle._id ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>DISPATCHING WEBHOOK TO MAKE.COM...</span>
                  </>
                ) : selectedArticle.broadcast_status === 'broadcasted' ? (
                  <>
                    <span>🔄 RE-BROADCAST TO FACEBOOK</span>
                  </>
                ) : selectedArticle.broadcast_status === 'failed' ? (
                  <>
                    <span>⚡ RETRY FACEBOOK BROADCAST NOW</span>
                  </>
                ) : (
                  <>
                    <span>🚀 BROADCAST TO FACEBOOK NOW</span>
                  </>
                )}
              </button>

              {broadcastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl font-mono text-xs text-center border shadow-xl ${
                    broadcastMessage.type === 'error'
                      ? 'bg-red-500/20 text-white border-red-500/40 backdrop-blur-md'
                      : broadcastMessage.type === 'simulation'
                      ? 'bg-amber-500/20 text-white border-amber-500/40 backdrop-blur-md'
                      : broadcastMessage.type === 'locked'
                      ? 'bg-yellow-500/10 text-yellow-200 border-yellow-500/40 backdrop-blur-md'
                      : 'bg-emerald-500/20 text-white font-bold border-emerald-500/40 backdrop-blur-md'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1 font-extrabold">
                    {broadcastMessage.type === 'error' ? '❌ DISPATCH FAILED' : broadcastMessage.type === 'simulation' ? '📱 SIMULATION MODE' : broadcastMessage.type === 'locked' ? '🔒 DEMO MODE' : '✅ LIVE DISPATCH SUCCESS'}
                  </div>
                  <div>{broadcastMessage.text}</div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
