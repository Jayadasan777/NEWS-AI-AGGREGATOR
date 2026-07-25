import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import EventCard from '../components/EventCard';

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllEvents = async () => {
      setLoading(true);
      try {
        const response = await API.get('/events');
        setAllEvents(response.data.data);
      } catch (err) {
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllEvents();
  }, []);

  const filteredResults = allEvents.filter(
    (event) =>
      event.event_title.toLowerCase().includes(query.toLowerCase()) ||
      event.fused_summary.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400 text-lg">Searching...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">
          Search results for "{query}"
        </h1>
        <p className="text-gray-400 mb-10">{filteredResults.length} results found</p>

        {error && <p className="text-red-500">{error}</p>}

        {filteredResults.length === 0 && !error ? (
          <p className="text-gray-500">No matching events found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;