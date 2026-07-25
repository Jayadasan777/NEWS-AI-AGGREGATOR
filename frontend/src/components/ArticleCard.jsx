import React from 'react';
import { Link } from 'react-router-dom';

const ArticleCard = ({ article, featured = false }) => {
  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  };

  return (
    <div className={`group relative bg-slate-950 rounded-3xl border border-slate-800/80 hover:border-sky-500/60 transition-all duration-500 overflow-hidden flex flex-col shadow-2xl ${featured ? 'md:col-span-2 lg:col-span-2' : ''}`}>
      
      {/* Cinematic Image Frame */}
      <div className={`relative w-full overflow-hidden bg-slate-900 flex-shrink-0 ${featured ? 'h-72 sm:h-80' : 'h-52'}`}>
        <img
          src={article.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
          alt={article.title}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        
        {/* Floating Sector Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-slate-950/85 text-sky-400 border border-slate-700/60 backdrop-blur-md">
            {article.sector}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 flex-1 flex flex-col justify-between bg-slate-950">
        <div>
          <h3 className={`text-slate-100 font-black tracking-tight group-hover:text-sky-400 transition-colors duration-300 ${featured ? 'text-xl sm:text-2xl leading-tight' : 'text-base sm:text-lg leading-snug line-clamp-2'}`}>
            {article.title}
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-2.5 line-clamp-3 leading-relaxed font-normal">
            {article.unique_summary}
          </p>
        </div>

        {/* Card Footer */}
        <div className="mt-5 pt-3 border-t border-slate-900 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500">VERIFIED AI</span>
          <Link
            to={`/article/${article._id}`}
            className="text-sky-400 font-bold flex items-center gap-1.5 group-hover:translate-x-1 transition-transform duration-300"
          >
            EXPLORE <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;