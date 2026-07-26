import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HUDProvider } from './context/HUDContext';
import BackgroundScene from './components/BackgroundScene';
import CustomCursor from './components/CustomCursor';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Sector from './pages/Sector';
import ArticleDetail from './pages/ArticleDetail';
import EventDetail from './pages/EventDetail';
import Search from './pages/Search';
import About from './pages/About';
import SocialStudio from './pages/SocialStudio';

/* ScrollToTop component ensures we start at the top on route change */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="route-fade flex-grow flex flex-col w-full">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/sector/:sectorName" element={<Sector />} />
        <Route path="/article/:id" element={<ArticleDetail />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/about" element={<About />} />
        <Route path="/studio" element={<SocialStudio />} />
      </Routes>
    </div>
  );
}

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen bg-[#03050a] font-sans antialiased text-paper relative overflow-x-hidden selection:bg-signal selection:text-white">
      {/* ── Fixed 3D WebGL Background Scene ── */}
      <BackgroundScene />

      {/* ── Custom Ring & Dot Cursor ── */}
      <CustomCursor />

      {/* ── Fixed HUD Navigation (Top, Left Sidebar, Bottom Search) ── */}
      <Navbar />

      {/* ── Central Content Area (Scrolls in center while HUD is pinned) ── */}
      <main className="relative z-10 flex-grow flex flex-col pt-24 pb-28 px-6 md:pl-48 lg:pl-56 md:pr-12 max-w-7xl mx-auto w-full">
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