import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';

function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/events/${id}`);
        setEvent(response.data.data);
      } catch (err) {
        setError('Event not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-black"><p className="text-gray-400 text-lg">Loading event...</p></div>;
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <p className="text-red-500 text-lg">{error || 'Event not found.'}</p>
        <Link to="/" className="text-blue-500 hover:underline">← Back to Home</Link>
      </div>
    );
  }

  const confidenceColor = event.confidence_score >= 90 ? 'text-green-400' : event.confidence_score >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="text-blue-500 hover:underline text-sm">← Back to Home</Link>

        <div className="flex items-center gap-3 mt-6">
          <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">{event.sector}</span>
          <span className={`text-xs font-bold ${confidenceColor}`}>
            {event.confidence_score}% Confidence
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4 leading-tight">
          {event.event_title}
        </h1>

        <img src={event.image_url} alt={event.event_title} className="w-full rounded-lg mb-8 aspect-video object-cover" />

        <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line mb-10">
          {event.fused_summary}
        </p>

        <div className="border-t border-gray-800 pt-6">
          <h2 className="text-white font-bold mb-4">
            Sources ({event.source_articles.length})
          </h2>
          <div className="space-y-3">
            {event.source_articles.map((article) => (
              <div key={article._id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-gray-200 font-medium">{article.title}</p>
                <p className="text-gray-600 text-xs mt-1">
                  {new Date(article.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetail;