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
  const [activeTab, setActiveTab] = useState('all'); // all | pending | broadcasted
  const [isAutoEnabled, setIsAutoEnabled] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [broadcastingId, setBroadcastingId] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState(null);
  const [liked, setLiked] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [cronSchedule, setCronSchedule] = useState('Every 4 Hours');
  const [lastIngestionTime, setLastIngestionTime] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/social/queue?status=${activeTab === 'all' ? 'all' : activeTab}`);
      const data = res.data.data || [];
      setArticles(data);
      setIsAutoEnabled(Boolean(res.data.autoBroadcastEnabled));
      setWebhookConfigured(Boolean(res.data.webhookConfigured));
      setCronSchedule(res.data.cronSchedule || 'Every 4 Hours');
      setLastIngestionTime(res.data.lastIngestionTime || null);
      if (data.length > 0 && !selectedArticle) {
        setSelectedArticle(data[0]);
      }
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
    triggerGlitch(150);
    try {
      const res = await API.post('/social/toggle-auto', { enabled: !isAutoEnabled });
      if (res.data && typeof res.data.autoBroadcastEnabled === 'boolean') {
        setIsAutoEnabled(res.data.autoBroadcastEnabled);
      }
    } catch {
      alert('Failed to toggle autonomous broadcast setting.');
    }
  };

  const handleTriggerScrape = async () => {
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

  const handleBroadcast = async (articleId) => {
    if (!articleId) return;
    triggerGlitch(300);
    setBroadcastingId(articleId);
    setBroadcastMessage(null);
    try {
      const res = await API.post(`/social/broadcast/${articleId}`);
      if (res.data && res.data.success) {
        setBroadcastMessage({
          type: res.data.simulation ? 'simulation' : 'success',
          text: res.data.message
        });
        // Update local article state
        setArticles((prev) =>
          prev.map((a) => (a._id === articleId ? { ...a, broadcast_status: 'broadcasted' } : a))
        );
        if (selectedArticle && selectedArticle._id === articleId) {
          setSelectedArticle({ ...selectedArticle, broadcast_status: 'broadcasted' });
        }
      }
    } catch (err) {
      setBroadcastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to dispatch broadcast.'
      });
    } finally {
      setBroadcastingId(null);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* ── Studio Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6 border-b border-[#2A2A2A] pb-12 flex flex-col md:flex-row md:items-end justify-between gap-8"
      >
        <div>
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.28em] mb-3 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" />
            <span className="text-[#F5F5F5]">AUTONOMOUS MEDIA HOUSE</span>
            <span className="text-[#404040]">•</span>
            <span className="text-[#A0A0A0]">INSTAGRAM & SOCIAL BROADCAST STUDIO</span>
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-[#F5F5F5] tracking-tight leading-none">
            SOCIAL <span className="text-[#404040] font-light">// STUDIO</span>
          </h1>
        </div>

        {/* Autonomous Toggle & Status Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#111111] p-4 rounded-2xl border border-[#2A2A2A] shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${webhookConfigured ? 'bg-[#F5F5F5]' : 'bg-[#A0A0A0]'}`} />
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#F5F5F5]">
                WEBHOOK: {webhookConfigured ? 'CONFIGURED (LIVE)' : 'SIMULATION MODE'}
              </div>
              <div className="text-[10px] text-[#606060] font-sans">
                {webhookConfigured ? 'Connected to Make.com/Zapier/n8n' : 'Add SOCIAL_WEBHOOK_URL to .env for real posting'}
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-[#2A2A2A] hidden sm:block" />

          <button
            onClick={handleToggleAuto}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-widest font-extrabold transition-all border flex items-center gap-2 shadow-lg ${
              isAutoEnabled
                ? 'bg-[#F5F5F5] text-[#0A0A0A] border-[#F5F5F5]'
                : 'bg-[#181818] text-[#A0A0A0] border-[#3A3A3A] hover:text-[#F5F5F5]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAutoEnabled ? 'bg-[#DC2626] animate-ping' : 'bg-[#606060]'}`} />
            <span>ROBOT MODE: {isAutoEnabled ? 'AUTO-ON' : 'MANUAL'}</span>
          </button>
        </div>
      </motion.div>

      {/* ── System Health & Automation Monitor Bar ── */}
      <div className="bg-[#111111] p-6 rounded-2xl border border-[#2A2A2A] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#606060] font-bold">AUTOMATION CRON SCHEDULE</div>
            <div className="font-mono text-sm font-extrabold text-[#F5F5F5] flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>{cronSchedule}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#2A2A2A] hidden md:block" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#606060] font-bold">LAST NEWS SCRAPE & INGESTION</div>
            <div className="font-mono text-sm font-extrabold text-[#A0A0A0] mt-1">
              {lastIngestionTime ? new Date(lastIngestionTime).toLocaleString() : 'Waiting for initial scrape...'}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleTriggerScrape}
            disabled={scraping}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-mono text-xs uppercase tracking-widest font-extrabold transition-all bg-[#202020] hover:bg-[#303030] text-[#F5F5F5] border border-[#3A3A3A] flex items-center justify-center gap-2 shadow-lg"
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
              ? 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/40'
              : 'bg-[#10B981]/15 text-[#10B981] font-bold border-[#10B981]/40'
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
          <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              {[
                { id: 'all', label: 'ALL DISPATCHES' },
                { id: 'pending', label: 'PENDING QUEUE' },
                { id: 'broadcasted', label: 'BROADCASTED' },
                { id: 'failed', label: 'FAILED DISPATCHES' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); triggerGlitch(100); }}
                  className={`px-4 py-2 rounded-lg transition-all font-bold ${
                    activeTab === t.id
                      ? 'bg-[#F5F5F5] text-[#0A0A0A] shadow-md'
                      : 'text-[#606060] hover:text-[#F5F5F5] hover:bg-[#111111]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchQueue}
              className="text-[#A0A0A0] hover:text-[#F5F5F5] font-mono text-xs uppercase transition-colors"
            >
              [ REFRESH QUEUE ]
            </button>
          </div>

          {/* Queue List */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 bg-[#111111] rounded-2xl border border-[#2A2A2A]">
              <div className="w-8 h-8 rounded-full border border-[#A0A0A0]/40 border-t-[#F5F5F5] animate-spin" />
              <div className="font-mono text-xs text-[#A0A0A0] tracking-[0.25em] uppercase font-bold">
                LOADING SOCIAL DISPATCH QUEUE…
              </div>
            </div>
          ) : error ? (
            <div className="p-8 bg-[#111111] rounded-2xl border border-[#DC2626]/40 text-center">
              <p className="text-[#F5F5F5] font-semibold">{error}</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="p-16 bg-[#111111] rounded-2xl border border-[#2A2A2A] text-center space-y-3">
              <div className="font-mono text-xs text-[#606060] uppercase tracking-[0.3em] font-bold">QUEUE EMPTY</div>
              <p className="text-[#F5F5F5] text-xl font-display font-bold">No dispatches found in this tab.</p>
              <p className="text-[#A0A0A0] text-sm">When the 4-hour cron runs or you manually trigger ingestion, new AI articles will appear here.</p>
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
                    className={`p-6 rounded-2xl transition-all cursor-pointer border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 ${
                      isSelected
                        ? 'bg-[#181818] border-[#F5F5F5] shadow-2xl scale-[1.01]'
                        : 'bg-[#111111] border-[#2A2A2A] hover:border-[#404040] hover:bg-[#151515]'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <img
                        src={art.image_url}
                        alt={art.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#2A2A2A] bg-[#0A0A0A]"
                      />
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <SectorBadge sector={art.sector} size="sm" />
                          <span className="font-mono text-[10px] text-[#606060] uppercase">
                            {new Date(art.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-base text-[#F5F5F5] truncate">
                          {art.title}
                        </h4>
                        <p className="text-xs text-[#A0A0A0] font-light truncate">
                          {art.social_caption ? art.social_caption.split('\n')[0] : art.unique_summary}
                        </p>
                        {isFailed && art.broadcast_error && (
                          <div className="p-2 mt-1 rounded bg-[#DC2626]/15 border border-[#DC2626]/40 text-[#DC2626] font-mono text-[10px]">
                            ⚠️ FAILURE LOG: {art.broadcast_error}
                          </div>
                        )}
                        {isBroadcasted && art.broadcast_time && (
                          <div className="font-mono text-[9px] text-[#10B981] uppercase mt-1">
                            ✓ FB POSTED: {new Date(art.broadcast_time).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2A2A2A]">
                      <span
                        className={`px-2.5 py-1 rounded font-mono text-[9px] font-bold tracking-widest uppercase ${
                          isBroadcasted
                            ? 'bg-[#F5F5F5] text-[#0A0A0A]'
                            : isFailed
                            ? 'bg-[#DC2626] text-white animate-pulse'
                            : 'bg-[#202020] text-[#A0A0A0] border border-[#3A3A3A]'
                        }`}
                      >
                        {isBroadcasted ? '✓ BROADCASTED' : isFailed ? '✕ FAILED' : '⏳ PENDING'}
                      </span>
                      <span className="font-mono text-xs text-[#F5F5F5] font-bold flex items-center gap-1 group">
                        <span>PREVIEW ON IPHONE</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info & Setup Matrix Card */}
          <div className="bg-[#111111] p-8 rounded-2xl border border-[#2A2A2A] space-y-4">
            <div className="font-mono text-xs text-[#F5F5F5] uppercase tracking-[0.25em] font-extrabold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              <span>HOW TO CONNECT INSTAGRAM / WEBHOOKS</span>
            </div>
            <p className="text-sm text-[#C8C8C8] leading-relaxed font-light">
              This studio generates production-ready Instagram content for every article. To automatically publish to real accounts:
            </p>
            <ol className="list-decimal list-inside text-xs text-[#A0A0A0] space-y-2 font-mono">
              <li>Create a free account on <a href="https://www.make.com/" target="_blank" rel="noreferrer" className="text-[#F5F5F5] underline">Make.com</a> or Zapier.</li>
              <li>Create a new Scenario/Zap with a <strong>Custom Webhook</strong> trigger and copy the URL.</li>
              <li>Add the URL to your <code className="bg-[#181818] px-2 py-0.5 rounded text-[#F5F5F5]">.env</code> file as <code className="bg-[#181818] px-2 py-0.5 rounded text-[#F5F5F5]">SOCIAL_WEBHOOK_URL="https://..."</code>.</li>
              <li>Connect your Instagram Business account in Make/Zapier to map the Image URL and Caption.</li>
              <li>Click <strong>"ROBOT MODE: AUTO-ON"</strong> above to let NewsAI broadcast 24/7 without intervention!</li>
            </ol>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive iPhone 15 Pro Studio (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="font-mono text-xs text-[#A0A0A0] uppercase tracking-[0.25em] text-center font-bold">
            LIVE IPHONE 15 PRO // FACEBOOK & SOCIAL PREVIEW
          </div>

          {/* The Phone Container */}
          <div className="w-[340px] sm:w-[360px] mx-auto bg-[#0A0A0A] rounded-[54px] p-4 border-[12px] border-[#222222] shadow-[0_25px_60px_rgba(0,0,0,0.9)] relative select-none">
            {/* Dynamic Island */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 border border-[#2A2A2A]/50 flex items-center justify-between px-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#111111] border border-[#222]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A]" />
            </div>

            {/* iPhone Screen Inner */}
            <div className="bg-black rounded-[40px] overflow-hidden pt-10 pb-6 text-white font-sans text-xs min-h-[580px] flex flex-col justify-between border border-[#1A1A1A]">
              {selectedArticle ? (
                <div className="space-y-3 flex-1 flex flex-col">
                  {/* IG Post Header */}
                  <div className="flex items-center justify-between px-3 pt-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#3A3A3A] flex items-center justify-center font-display font-black text-xs text-[#F5F5F5]">
                        N
                      </div>
                      <div>
                        <div className="font-bold text-[11px] flex items-center gap-1 leading-none text-white">
                          <span>newsai.daily</span>
                          <span className="w-3 h-3 rounded-full bg-[#F5F5F5] text-black font-black text-[8px] flex items-center justify-center">✓</span>
                        </div>
                        <div className="text-[9px] text-[#A0A0A0] leading-none mt-1 uppercase font-mono tracking-wider">
                          {selectedArticle.sector} • SPONSORED DISPATCH
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#A0A0A0] tracking-widest">•••</span>
                  </div>

                  {/* IG Media Display (Square Aspect Ratio) */}
                  <div className="relative aspect-square w-full bg-[#111111] overflow-hidden border-y border-[#1A1A1A]">
                    <img
                      src={selectedArticle.image_url}
                      alt={selectedArticle.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded font-mono text-[8px] text-white/90 uppercase tracking-wider border border-white/10">
                      NEWSAI AI ART
                    </div>
                  </div>

                  {/* IG Action Bar */}
                  <div className="px-3 flex items-center justify-between pt-1">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setLiked(!liked)} className="text-xl transition-transform active:scale-125">
                        {liked ? <span className="text-[#DC2626]">♥</span> : <span>♡</span>}
                      </button>
                      <span className="text-lg">💬</span>
                      <span className="text-lg">✈</span>
                    </div>
                    <span className="text-lg">🔖</span>
                  </div>

                  {/* IG Likes Counter */}
                  <div className="px-3 font-bold text-[11px] text-white">
                    {liked ? '1,429 likes' : '1,428 likes'}
                  </div>

                  {/* IG Caption Area */}
                  <div className="px-3 text-[11px] leading-relaxed text-[#D4D4D4] flex-1 overflow-y-auto max-h-[140px] scrollbar-none">
                    <span className="font-bold text-white mr-2">newsai.daily</span>
                    <span className="whitespace-pre-line">
                      {showFullCaption || !selectedArticle.social_caption
                        ? selectedArticle.social_caption || selectedArticle.unique_summary
                        : `${selectedArticle.social_caption.slice(0, 110)}...`}
                    </span>
                    {selectedArticle.social_caption && selectedArticle.social_caption.length > 110 && !showFullCaption && (
                      <button
                        onClick={() => setShowFullCaption(true)}
                        className="text-[#A0A0A0] hover:text-white ml-1 font-semibold"
                      >
                        more
                      </button>
                    )}

                    {/* Hashtags Strip */}
                    <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px] text-[#A0A0A0]">
                      {(selectedArticle.social_hashtags || [`#${selectedArticle.sector}`, '#NewsAI', '#BreakingNews']).map((tag, idx) => (
                        <span key={idx} className="hover:text-white cursor-pointer">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* IG Timestamp */}
                  <div className="px-3 font-mono text-[8px] text-[#606060] uppercase tracking-widest pb-1 border-t border-[#1A1A1A] pt-2">
                    PUBLISHED ON {new Date(selectedArticle.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-6 font-mono text-xs text-[#606060] uppercase tracking-widest">
                  SELECT A DISPATCH FROM THE LEFT QUEUE TO PREVIEW
                </div>
              )}

              {/* iPhone Home Bar */}
              <div className="w-32 h-1 bg-[#333333] rounded-full mx-auto mt-2" />
            </div>
          </div>

          {/* Broadcast Action Button & Feedback Alert */}
          {selectedArticle && (
            <div className="space-y-3 max-w-[360px] mx-auto">
              {selectedArticle.broadcast_status === 'failed' && (
                <div className="p-3 bg-[#DC2626]/15 border border-[#DC2626]/40 rounded-xl text-[#DC2626] font-mono text-xs text-center">
                  <strong>❌ FB BROADCAST FAILED:</strong> {selectedArticle.broadcast_error || 'Network or Make.com execution error'}
                </div>
              )}

              <button
                onClick={() => handleBroadcast(selectedArticle._id)}
                disabled={broadcastingId === selectedArticle._id}
                className={`w-full py-4 rounded-2xl font-mono text-xs uppercase tracking-[0.2em] font-extrabold transition-all flex items-center justify-center gap-3 shadow-2xl border ${
                  selectedArticle.broadcast_status === 'broadcasted'
                    ? 'bg-[#181818] text-[#A0A0A0] border-[#3A3A3A] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]'
                    : selectedArticle.broadcast_status === 'failed'
                    ? 'bg-[#DC2626] text-white border-[#DC2626] hover:bg-red-700 animate-pulse'
                    : 'bg-[#F5F5F5] text-[#0A0A0A] border-[#F5F5F5] hover:scale-[1.02]'
                }`}
              >
                {broadcastingId === selectedArticle._id ? (
                  <>
                    <span className="w-3 h-3 rounded-full border border-black border-t-transparent animate-spin" />
                    <span>DISPATCHING WEBHOOK...</span>
                  </>
                ) : selectedArticle.broadcast_status === 'broadcasted' ? (
                  <>
                    <span>✓ RE-BROADCAST TO FACEBOOK</span>
                  </>
                ) : selectedArticle.broadcast_status === 'failed' ? (
                  <>
                    <span>🔄 RETRY FACEBOOK BROADCAST NOW</span>
                  </>
                ) : (
                  <>
                    <span>🚀 BROADCAST TO FACEBOOK NOW</span>
                  </>
                )}
              </button>

              {broadcastMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl font-mono text-xs text-center border ${
                    broadcastMessage.type === 'error'
                      ? 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/40'
                      : broadcastMessage.type === 'simulation'
                      ? 'bg-[#181818] text-[#F5F5F5] border-[#404040]'
                      : 'bg-[#F5F5F5] text-[#0A0A0A] font-bold border-[#F5F5F5]'
                  }`}
                >
                  {broadcastMessage.text}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
