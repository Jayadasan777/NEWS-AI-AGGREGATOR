import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/articles');
        const dataArray = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.articles || response.data?.data || []);
        setArticles(dataArray);
      } catch (err) {
        console.error('❌ Failed to fetch news articles:', err);
        setError('Failed to load intelligence feed. Please ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-purple-400 text-xs tracking-[0.4em] uppercase">Initializing Intelligence Core...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030305] flex items-center justify-center p-4 font-mono">
        <div className="bg-[#09090e] border border-red-500/20 p-8 rounded-3xl max-w-md text-center shadow-2xl">
          <p className="text-red-400 text-xs font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const heroArticle = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-[#030305] text-slate-100 selection:bg-purple-600 selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* 1. CINEMATIC VIGNETTE HERO SECTION */}
      <section className="relative pt-28 pb-20 px-6 sm:px-10 lg:px-16 border-b border-white/10 bg-gradient-to-b from-[#09090e] via-[#030305] to-[#030305]">
        {/* Organic Violet & Nebula Glow Lighting */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-mono tracking-[0.3em] uppercase mb-8 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            NISE Core // Live Multi-Source Synthesis
          </div>
          
          <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-tighter uppercase text-white leading-[0.9] mb-8">
            GLOBAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-500">INTELLIGENCE</span>
          </h1>
          
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            An elite zero-noise situational awareness engine combining Jaccard clustering with Llama 3 generative synthesis for real-time global tracking.
          </p>
        </div>
      </section>

      {/* 2. FLAGSHIP CINEMATIC HERO ARTICLE */}
      {heroArticle && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-16">
          <div className="group relative bg-[#09090e] rounded-[2.5rem] border border-white/10 hover:border-purple-500/50 transition-all duration-700 overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row">
            
            <div className="relative lg:w-3/5 h-80 sm:h-96 lg:h-[520px] overflow-hidden bg-slate-950">
              <img 
                src={heroArticle.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80'} 
                alt={heroArticle.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#09090e] via-transparent to-transparent opacity-90" />
            </div>

            <div className="lg:w-2/5 p-8 sm:p-12 flex flex-col justify-between bg-[#09090e]">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-3.5 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    {heroArticle.sector}
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Flagship Feature
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug group-hover:text-purple-400 transition-colors duration-300">
                  {heroArticle.title}
                </h2>
                <p className="text-slate-400 text-sm sm:text-base mt-4 line-clamp-4 leading-relaxed font-normal">
                  {heroArticle.unique_summary}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">VERIFIED AI SYNTHESIS</span>
                <Link
                  to={`/article/${heroArticle._id}`}
                  className="text-purple-400 font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform duration-300"
                >
                  EXPLORE FEATURE <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* 3. ASYMMETRIC BENTO GRID SHOWCASE */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-20">
        <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-4">
          <h3 className="text-xs font-mono font-bold tracking-[0.3em] text-purple-400 uppercase">
            Curated Intelligence Stream // Bento Grid
          </h3>
          <span className="text-xs font-mono text-slate-500">{gridArticles.length} Active Feeds</span>
        </div>

        {gridArticles.length === 0 ? (
          <div className="text-center py-28 bg-[#09090e] rounded-[2rem] border border-white/10">
            <p className="text-slate-500 text-xs font-mono">NO ADDITIONAL EXHIBITS FOUND IN ARCHIVE.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridArticles.map((article, index) => {
              const isWide = index === 2 || index === 5;
              return (
                <div 
                  key={article._id || index}
                  className={`group relative bg-[#09090e] rounded-[2rem] border border-white/10 hover:border-purple-500/50 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl ${isWide ? 'md:col-span-2 lg:col-span-2' : ''}`}
                >
                  <div className={`relative w-full overflow-hidden bg-slate-950 ${isWide ? 'h-72 sm:h-80' : 'h-60'}`}>
                    <img
                      src={article.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-85 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#09090e] via-transparent to-transparent" />
                    
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-[#09090e]/90 text-purple-400 border border-white/10 backdrop-blur-md">
                        {article.sector}
                      </span>
                    </div>
                  </div>

                  <div className="p-7 flex-1 flex flex-col justify-between bg-[#09090e]">
                    <div>
                      <h4 className={`text-white font-black tracking-tight group-hover:text-purple-400 transition-colors duration-300 ${isWide ? 'text-xl sm:text-2xl leading-tight' : 'text-lg leading-snug line-clamp-2'}`}>
                        {article.title}
                      </h4>
                      <p className="text-slate-400 text-xs sm:text-sm mt-3 line-clamp-3 leading-relaxed font-normal">
                        {article.unique_summary}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">VERIFIED AI</span>
                      <Link
                        to={`/article/${article._id}`}
                        className="text-purple-400 font-bold flex items-center gap-1.5 group-hover:translate-x-1.5 transition-transform duration-300"
                      >
                        EXPLORE <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;