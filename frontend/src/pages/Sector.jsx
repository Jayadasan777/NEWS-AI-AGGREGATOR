import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api/axios';
import EventCard from '../components/EventCard';

function Sector() {
  const { sectorName } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formattedSector =
    sectorName.charAt(0).toUpperCase() + sectorName.slice(1);

  useEffect(() => {
    const fetchSectorEvents = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/events?sector=${formattedSector}`);
        setEvents(response.data.data);
      } catch (err) {
        setError('Failed to load events for this sector.');
      } finally {
        setLoading(false);
      }
    };

    fetchSectorEvents();
  }, [sectorName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400 text-lg">Loading {formattedSector} news...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-2">{formattedSector}</h1>
        <p className="text-gray-400 mb-10">Latest {formattedSector.toLowerCase()} coverage</p>

        {events.length === 0 ? (
          <p className="text-gray-500">No events in this sector yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sector;