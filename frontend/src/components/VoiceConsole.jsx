import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/axios';

// ─── Voice Command Registry ─────────────────────────────────────────────────
const COMMANDS = [
  {
    category: 'NAVIGATION',
    icon: '🧭',
    items: [
      { phrase: ['go home', 'home', 'homepage', 'main page'], label: 'Go Home', action: 'NAV_HOME' },
      { phrase: ['go to studio', 'open studio', 'social studio', 'studio'], label: 'Social Studio', action: 'NAV_STUDIO' },
      { phrase: ['search', 'open search', 'find news'], label: 'Open Search', action: 'NAV_SEARCH' },
      { phrase: ['about', 'go to about', 'about page'], label: 'About Page', action: 'NAV_ABOUT' },
    ],
  },
  {
    category: 'NEWS SECTORS',
    icon: '📡',
    items: [
      { phrase: ['open ai', 'ai news', 'artificial intelligence'], label: 'AI News', action: 'NAV_SECTOR_AI' },
      { phrase: ['tech news', 'technology', 'open tech'], label: 'Tech News', action: 'NAV_SECTOR_Tech' },
      { phrase: ['finance', 'markets', 'financial news'], label: 'Finance', action: 'NAV_SECTOR_Finance' },
      { phrase: ['crypto', 'cryptocurrency', 'bitcoin', 'blockchain'], label: 'Crypto', action: 'NAV_SECTOR_Crypto' },
      { phrase: ['space', 'space news', 'nasa', 'astronomy'], label: 'Space', action: 'NAV_SECTOR_Space' },
      { phrase: ['health', 'health news', 'medical'], label: 'Health', action: 'NAV_SECTOR_Health' },
      { phrase: ['science', 'science news', 'research'], label: 'Science', action: 'NAV_SECTOR_Science' },
      { phrase: ['sports', 'sports news', 'athletics'], label: 'Sports', action: 'NAV_SECTOR_Sports' },
      { phrase: ['geopolitics', 'world news', 'politics'], label: 'Geopolitics', action: 'NAV_SECTOR_Geopolitics' },
      { phrase: ['startups', 'startup news', 'venture'], label: 'Startups', action: 'NAV_SECTOR_Startups' },
      { phrase: ['environment', 'climate', 'climate news'], label: 'Environment', action: 'NAV_SECTOR_Environment' },
      { phrase: ['entertainment', 'entertainment news', 'culture'], label: 'Entertainment', action: 'NAV_SECTOR_Entertainment' },
      { phrase: ['defense', 'military', 'defense news'], label: 'Defense', action: 'NAV_SECTOR_Defense' },
      { phrase: ['automotive', 'cars', 'electric vehicles', 'ev news'], label: 'Automotive', action: 'NAV_SECTOR_Automotive' },
    ],
  },
  {
    category: 'SOCIAL BROADCAST',
    icon: '📤',
    items: [
      { phrase: ['post to fb', 'post to facebook', 'broadcast now', 'broadcast to facebook', 'post now', 'publish'], label: 'Post to Facebook', action: 'BROADCAST_POST' },
      { phrase: ['trigger scrape', 'fetch news', 'scrape news', 'get latest news'], label: 'Trigger News Scrape', action: 'BROADCAST_SCRAPE' },
      { phrase: ['toggle auto', 'toggle robot mode', 'auto mode', 'autonomous mode'], label: 'Toggle Auto Mode', action: 'BROADCAST_TOGGLE_AUTO' },
    ],
  },
  {
    category: 'PAGE CONTROL',
    icon: '⚙️',
    items: [
      { phrase: ['scroll up', 'go up', 'top of page'], label: 'Scroll Up', action: 'PAGE_SCROLL_UP' },
      { phrase: ['scroll down', 'go down'], label: 'Scroll Down', action: 'PAGE_SCROLL_DOWN' },
      { phrase: ['scroll to top', 'back to top'], label: 'Back to Top', action: 'PAGE_TOP' },
      { phrase: ['refresh', 'reload page'], label: 'Reload Page', action: 'PAGE_RELOAD' },
      { phrase: ['close console', 'close', 'hide console', 'exit'], label: 'Close Console', action: 'CONSOLE_CLOSE' },
    ],
  },
];

// ─── Main VoiceConsole Component ─────────────────────────────────────────────
export default function VoiceConsole() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [commandLog, setCommandLog] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);

  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const navigateRef = useRef(navigate);

  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  const addLog = useCallback((text, type = 'success') => {
    setCommandLog(prev => [
      { text, type, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
      ...prev.slice(0, 9),
    ]);
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  const matchCommand = useCallback((rawText) => {
    const text = rawText.toLowerCase().trim();
    for (const category of COMMANDS) {
      for (const cmd of category.items) {
        if (cmd.phrase.some(p => text.includes(p))) {
          return cmd;
        }
      }
    }
    return null;
  }, []);

  const executeCommand = useCallback(async (cmd) => {
    const nav = navigateRef.current;

    if (cmd.action.startsWith('NAV_SECTOR_')) {
      const sector = cmd.action.replace('NAV_SECTOR_', '');
      nav(`/sector/${sector}`);
      addLog(`Navigating to ${sector} sector`, 'success');
    } else if (cmd.action === 'NAV_HOME') {
      nav('/'); addLog('Navigating to Home', 'success');
    } else if (cmd.action === 'NAV_STUDIO') {
      nav('/studio'); addLog('Opening Social Studio', 'success');
    } else if (cmd.action === 'NAV_SEARCH') {
      nav('/search'); addLog('Opening Search', 'success');
    } else if (cmd.action === 'NAV_ABOUT') {
      nav('/about'); addLog('Opening About page', 'success');
    } else if (cmd.action === 'PAGE_SCROLL_UP') {
      window.scrollBy({ top: -400, behavior: 'smooth' }); addLog('Scrolled up', 'info');
    } else if (cmd.action === 'PAGE_SCROLL_DOWN') {
      window.scrollBy({ top: 400, behavior: 'smooth' }); addLog('Scrolled down', 'info');
    } else if (cmd.action === 'PAGE_TOP') {
      window.scrollTo({ top: 0, behavior: 'smooth' }); addLog('Back to top', 'info');
    } else if (cmd.action === 'PAGE_RELOAD') {
      window.location.reload();
    } else if (cmd.action === 'CONSOLE_CLOSE') {
      setIsOpen(false); addLog('Console closed', 'info');
    } else if (cmd.action === 'BROADCAST_POST') {
      addLog('Post command — select article in Studio first', 'info');
      nav('/studio');
    } else if (cmd.action === 'BROADCAST_SCRAPE') {
      try {
        await API.post('/social/trigger-scrape');
        addLog('⚡ 14-feed news scrape triggered!', 'success');
      } catch {
        addLog('Failed to trigger scrape', 'error');
      }
    } else if (cmd.action === 'BROADCAST_TOGGLE_AUTO') {
      try {
        const res = await API.post('/social/toggle-auto');
        const enabled = res.data?.autoBroadcastEnabled;
        addLog(`🤖 Auto-broadcast ${enabled ? 'ENABLED' : 'DISABLED'}`, enabled ? 'success' : 'info');
      } catch {
        addLog('Failed to toggle auto broadcast', 'error');
      }
    }
  }, [addLog]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => { isListeningRef.current = true; setIsListening(true); };
    rec.onend   = () => { isListeningRef.current = false; setIsListening(false); };
    rec.onerror = (e) => {
      if (e.error === 'no-speech') return;
      isListeningRef.current = false;
      setIsListening(false);
      addLog(`Mic error: ${e.error}`, 'error');
    };

    rec.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
        else interimText += event.results[i][0].transcript;
      }
      const spoken = (finalText || interimText).toLowerCase().trim();
      setTranscript(spoken);

      if (finalText) {
        const matched = matchCommand(spoken);
        if (matched) {
          executeCommand(matched);
          rec.stop();
          setTimeout(() => { setTranscript(''); }, 800);
        }
      }
    };

    recognitionRef.current = rec;
    return () => { rec.abort(); isListeningRef.current = false; };
  }, [matchCommand, executeCommand, addLog]);

  const toggleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (isListeningRef.current) {
      rec.stop();
    } else {
      setTranscript('');
      try {
        rec.start();
      } catch (err) {
        if (err.name === 'InvalidStateError') {
          rec.abort();
          setTimeout(() => { try { rec.start(); } catch {} }, 300);
        }
      }
    }
  };

  useEffect(() => {
    if (!isOpen && isListeningRef.current) {
      recognitionRef.current?.stop();
    }
  }, [isOpen]);

  const currentPage = (() => {
    const p = location.pathname;
    if (p === '/') return 'HOME';
    if (p === '/studio') return 'SOCIAL STUDIO';
    if (p === '/search') return 'SEARCH';
    if (p === '/about') return 'ABOUT';
    if (p.startsWith('/sector/')) return `${p.replace('/sector/', '').toUpperCase()} SECTOR`;
    if (p.startsWith('/article/')) return 'ARTICLE DETAIL';
    if (p.startsWith('/event/')) return 'EVENT DETAIL';
    return p.toUpperCase();
  })();

  // ── Global event listener so Navbar or any component can trigger the console ──
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-voice-console', handleOpen);
    return () => window.removeEventListener('open-voice-console', handleOpen);
  }, []);

  return (
    <>
      {/* ── Ultra-Attractive Floating Voice Capsule (Bottom Right) ── */}
      <motion.div
        id="voice-console-trigger-wrapper"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed z-[9000]"
        style={{ bottom: 24, right: 24 }}
      >
        <motion.button
          id="voice-console-trigger"
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer transition-all border shadow-2xl group"
          style={{
            background: isOpen
              ? 'rgba(255,255,255,0.15)'
              : isListening
              ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(10,10,10,0.95))'
              : 'linear-gradient(135deg, rgba(20,20,20,0.95), rgba(5,5,5,0.98))',
            borderColor: isOpen
              ? 'rgba(255,255,255,0.35)'
              : isListening
              ? 'rgba(239,68,68,0.6)'
              : 'rgba(245, 158, 11, 0.45)',
            backdropFilter: 'blur(30px) saturate(180%)',
            boxShadow: isListening
              ? '0 0 30px rgba(239,68,68,0.4), 0 12px 40px rgba(0,0,0,0.85)'
              : '0 0 25px rgba(245,158,11,0.3), 0 12px 40px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.2) inset',
          }}
          title={isOpen ? 'Close Voice Console' : 'Open Voice Console'}
        >
          {/* Animated Glowing Mic Icon Box */}
          <div className="relative w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: isListening
                ? 'rgba(239,68,68,0.3)'
                : 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: isListening
                ? '0 0 15px rgba(239,68,68,0.6)'
                : '0 0 12px rgba(245,158,11,0.5)',
            }}>
            <span className="text-black font-black text-sm">{isOpen ? '✕' : '🎙'}</span>
            
            {/* Pulsing Outer Rings */}
            {isListening ? (
              <span className="absolute inset-[-4px] rounded-full border border-red-500 animate-ping" />
            ) : (
              <span className="absolute inset-[-3px] rounded-full border border-amber-400/40 animate-pulse" />
            )}
          </div>

          {/* Label + Live Tag */}
          <div className="flex flex-col text-left font-mono">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-xs tracking-wider text-white group-hover:text-amber-300 transition-colors">
                VOICE CONTROL
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
            </div>
            <span className="text-[9px] uppercase tracking-widest text-amber-200/90 font-bold mt-1">
              SAY "POST TO FB"
            </span>
          </div>

          {/* Equalizer Soundwave Preview */}
          <div className="flex items-center gap-0.5 h-4 ml-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <span className={`w-0.5 rounded-full bg-amber-400 ${isListening ? 'animate-bounce h-4' : 'h-2'}`} style={{ animationDelay: '0.1s' }} />
            <span className={`w-0.5 rounded-full bg-amber-300 ${isListening ? 'animate-bounce h-3' : 'h-3.5'}`} style={{ animationDelay: '0.25s' }} />
            <span className={`w-0.5 rounded-full bg-white ${isListening ? 'animate-bounce h-4' : 'h-1.5'}`} style={{ animationDelay: '0.15s' }} />
            <span className={`w-0.5 rounded-full bg-amber-400 ${isListening ? 'animate-bounce h-2' : 'h-3'}`} style={{ animationDelay: '0.3s' }} />
          </div>
        </motion.button>
      </motion.div>

      {/* ── Full Console Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="vc-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[9001]"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />

            <motion.div
              key="vc-panel"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.97 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="fixed z-[9002] flex flex-col"
              style={{
                bottom: 96,
                right: 24,
                width: 'min(500px, calc(100vw - 32px))',
                maxHeight: 'min(660px, calc(100vh - 120px))',
                background: 'rgba(5,5,5,0.96)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 22,
                backdropFilter: 'blur(48px) saturate(180%)',
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.05) inset,' +
                  '0 24px 80px rgba(0,0,0,0.95),' +
                  '0 0 80px rgba(255,255,255,0.02)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.07)', flexShrink: 0 }}>
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-amber-500/40 shadow-sm">
                    <img src="/nise-logo.jpg" alt="NISE Logo" className="w-full h-full object-cover" />
                    {isListening && (
                      <span className="absolute inset-[-3px] rounded-xl border border-red-500/50 animate-ping" />
                    )}
                  </div>
                  <div>
                    <div className="font-mono font-extrabold text-[11px] uppercase tracking-[0.18em] flex items-center gap-1.5"
                      style={{ color: '#fff' }}>
                      <span>NISE VOICE CONSOLE</span>
                      <span className="text-[9px] text-amber-400 font-bold">BY DASAN</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-neutral-700'}`} />
                      <span className="font-mono text-[9px] uppercase tracking-wider"
                        style={{ color: isListening ? '#fca5a5' : 'var(--color-muted)' }}>
                        {isListening ? 'LISTENING' : voiceSupported ? 'STANDBY' : 'UNSUPPORTED'}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.1)' }}>│</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider"
                        style={{ color: 'var(--color-muted)' }}>{currentPage}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {voiceSupported && (
                    <button onClick={toggleMic}
                      className="px-3 py-1.5 rounded-xl font-mono text-[9px] uppercase tracking-wider font-extrabold border transition-all cursor-pointer"
                      style={{
                        background: isListening ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.05)',
                        borderColor: isListening ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)',
                        color: isListening ? '#fca5a5' : 'rgba(255,255,255,0.45)',
                      }}>
                      {isListening ? '⏹ STOP' : '🎙 START'}
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/8 text-sm"
                    style={{ color: 'var(--color-muted)' }}>✕</button>
                </div>
              </div>

              {/* Live transcript bar */}
              <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <div className="rounded-xl px-4 py-2.5 font-mono text-xs min-h-[42px] flex items-center transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isListening ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  {isListening ? (
                    transcript
                      ? <span className="italic" style={{ color: '#e5e5e5' }}>"{transcript}"</span>
                      : <span className="animate-pulse" style={{ color: 'var(--color-muted)' }}>Listening — say a command...</span>
                  ) : (
                    <span style={{ color: 'var(--color-muted)' }}>
                      {voiceSupported ? 'Press 🎙 START and speak — or click any command below' : '⚠ Speech recognition not supported in this browser'}
                    </span>
                  )}
                </div>
              </div>

              {/* Command log */}
              <AnimatePresence>
                {commandLog.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    <div className="px-5 py-2.5">
                      <div className="font-mono text-[8px] uppercase tracking-[0.2em] mb-1.5"
                        style={{ color: 'var(--color-muted)' }}>COMMAND LOG</div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {commandLog.map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
                            <span style={{ color: 'var(--color-muted)', flexShrink: 0 }}>{entry.time}</span>
                            <span className="flex-shrink-0" style={{
                              color: entry.type === 'success' ? '#6ee7b7' : entry.type === 'error' ? '#fca5a5' : '#93c5fd'
                            }}>
                              {entry.type === 'success' ? '✓' : entry.type === 'error' ? '✗' : '→'}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{entry.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Category tabs */}
              <div className="flex items-center gap-1 px-5 pt-4 pb-2" style={{ flexShrink: 0 }}>
                {COMMANDS.map((cat, i) => (
                  <button key={i}
                    onClick={() => setActiveCategory(i)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-wider font-bold cursor-pointer transition-all"
                    style={{
                      background: activeCategory === i ? 'rgba(255,255,255,0.09)' : 'transparent',
                      border: `1px solid ${activeCategory === i ? 'rgba(255,255,255,0.18)' : 'transparent'}`,
                      color: activeCategory === i ? '#fff' : 'var(--color-muted)',
                    }}>
                    <span style={{ fontSize: 12 }}>{cat.icon}</span>
                    <span className="hidden sm:inline">{cat.category}</span>
                  </button>
                ))}
              </div>

              {/* Commands grid */}
              <div className="flex-1 overflow-y-auto px-5 pb-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    {COMMANDS[activeCategory].items.map((cmd, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.035 }}
                        onClick={() => executeCommand(cmd)}
                        className="text-left p-3 rounded-xl border cursor-pointer transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
                        whileHover={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.16)', y: -1 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <div className="font-mono font-bold text-[11px]" style={{ color: '#e5e5e5' }}>
                          {cmd.label}
                        </div>
                        <div className="font-mono text-[9px] mt-1 truncate" style={{ color: 'var(--color-muted)' }}>
                          "{cmd.phrase[0]}"
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t flex items-center justify-between"
                style={{ borderColor: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  {COMMANDS.reduce((a, c) => a + c.items.length, 0)} commands • Chrome / Edge
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                  NEWSAI v4.0
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key="vc-toast"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="fixed z-[9003] font-mono text-xs font-bold px-4 py-2.5 rounded-2xl border shadow-2xl pointer-events-none"
            style={{
              bottom: 96,
              right: 28,
              background: feedback.type === 'success'
                ? 'rgba(16,185,129,0.12)' : feedback.type === 'error'
                ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
              borderColor: feedback.type === 'success'
                ? 'rgba(16,185,129,0.3)' : feedback.type === 'error'
                ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)',
              color: feedback.type === 'success'
                ? '#6ee7b7' : feedback.type === 'error'
                ? '#fca5a5' : '#93c5fd',
              backdropFilter: 'blur(16px)',
              maxWidth: 'calc(100vw - 56px)',
            }}
          >
            {feedback.type === 'success' ? '✓ ' : feedback.type === 'error' ? '✗ ' : '→ '}
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
