import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// High-quality dark editorial fallbacks in case an AI image fails
const UNSPLASH_FALLBACKS = {
  Tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  Finance: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
  Geopolitics: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
  Default: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
};

const ConfidenceBadge = ({ score }) => {
  let colorClass = 'bg-red-500/20 text-red-400 border-red-500/30';
  let label = 'Low confidence';

  if (score >= 90) {
    colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    label = 'High confidence';
  } else if (score >= 60) {
    colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    label = 'Medium confidence';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {score}% · {label}
    </span>
  );
};

const EventCard = ({ event }) => {
  const [imgError, setImgError] = useState(false);

  const fallbackSrc = UNSPLASH_FALLBACKS[event.sector] || UNSPLASH_FALLBACKS.Default;
  const displayImgSrc = imgError || !event.image_url ? fallbackSrc : event.image_url;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition duration-300 flex flex-col h-full shadow-lg">
      <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
        <img
          src={displayImgSrc}
          alt={event.event_title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <ConfidenceBadge score={event.confidence_score} />
        </div>
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-semibold text-sky-400 uppercase tracking-wider border border-slate-800">
          {event.sector}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/event/${event._id}`}>
          <h3 className="text-lg font-bold text-slate-100 hover:text-sky-400 transition line-clamp-2 mb-3">
            {event.event_title}
          </h3>
        </Link>

        <p className="text-slate-400 text-sm line-clamp-3 mb-4 flex-grow">
          {event.fused_summary}
        </p>

        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>{event.source_articles?.length || 1} {event.source_articles?.length === 1 ? 'source' : 'sources'}</span>
          <Link to={`/event/${event._id}`} className="text-sky-400 hover:underline font-medium">
            Read Synthesis &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;