import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { HUDProvider } from './context/HUDContext';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Sector from './pages/Sector';
import ArticleDetail from './pages/ArticleDetail';
import EventDetail from './pages/EventDetail';
import Search from './pages/Search';
import About from './pages/About';
import SocialStudio from './pages/SocialStudio';

/* ── Glassmorphism Cosmic Background ── */
function CosmicBackground() {
  return (
    <div className="cosmic-bg" aria-hidden="true">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />
      <div className="noise-overlay" />
    </div>
  );
}

/* ── Page Transition ── */
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -5 },
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
};

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial" animate="animate" exit="exit"
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: 'opacity, transform' }}
      className="flex-grow flex flex-col w-full"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"                   element={<PageWrapper><Home /></PageWrapper>} />
        <Route path="/sector/:sectorName" element={<PageWrapper><Sector /></PageWrapper>} />
        <Route path="/article/:id"        element={<PageWrapper><ArticleDetail /></PageWrapper>} />
        <Route path="/event/:id"          element={<PageWrapper><EventDetail /></PageWrapper>} />
        <Route path="/search"             element={<PageWrapper><Search /></PageWrapper>} />
        <Route path="/about"              element={<PageWrapper><About /></PageWrapper>} />
        <Route path="/studio"             element={<PageWrapper><SocialStudio /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-x-hidden"
         style={{ color: 'var(--color-paper)' }}>
      <CosmicBackground />
      <CustomCursor />
      <Navbar />
      <main className="relative z-10 flex-grow flex flex-col pt-20 pb-24 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto w-full">
        <AnimatedRoutes />
        <Footer />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <HUDProvider>
        <AppContent />
      </HUDProvider>
    </BrowserRouter>
  );
}