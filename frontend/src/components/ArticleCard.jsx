import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SectorBadge from './SectorBadge';

const FALLBACK = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

const ArticleCard = ({ article, featured = false }) => {
  const handleImageError = (e) => { e.target.src = FALLBACK; };

  const formattedDate = article.timestamp
    ? new Date(article.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group card-hover-border glass-panel rounded-2xl overflow-hidden flex flex-col h-full ${featured ? 'md:col-span-2 lg:col-span-2' : ''}`}
    >
      <Link to={`/article/${article._id}`} className="flex flex-col h-full">
        {/* Image wrapper */}
        <div className={`relative w-full overflow-hidden flex-shrink-0 ${featured ? 'h-72 sm:h-80' : 'h-52'}`}>
          <img
            src={article.image_url || FALLBACK}
            alt={article.title}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-100"
          />
          {/* Subtle overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
          
          <div className="absolute top-4 left-4 z-10">
            <SectorBadge sector={article.sector} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col justify-between relative z-10 bg-ink-900/20">
          <div>
            {formattedDate && (
              <p className="text-xs font-semibold text-muted mb-3 tracking-wide">{formattedDate}</p>
            )}
            <h3 className={`card-title text-paper group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r from-paper to-muted transition-all duration-300 ${featured ? 'text-2xl sm:text-3xl' : 'line-clamp-2'}`}>
              {article.title}
            </h3>
            <p className="body-text text-sm mt-3 line-clamp-3">
              {article.unique_summary}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-confirm opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-confirm"></span>
              </span>
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">AI Rewritten</span>
            </div>
            <span className="text-sm font-semibold text-paper group-hover:text-signal transition-colors flex items-center gap-1">
              Read <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ArticleCard;