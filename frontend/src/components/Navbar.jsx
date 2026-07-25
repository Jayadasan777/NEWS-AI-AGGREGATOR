import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SECTORS = [
  'Geopolitics',
  'Finance',
  'Tech',
  'Sports',
  'AI',
  'Startups',
  'Crypto',
  'Health',
  'Science',
  'Entertainment',
  'Environment',
  'Automotive',
  'Defense',
  'Space'
];

const Navbar = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="text-xl font-extrabold tracking-wider text-slate-100 flex items-center gap-2">
            <span className="text-sky-400">NEWS</span>AI
          </Link>

          {/* Live Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search breaking news & AI syntheses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 text-sm rounded-lg pl-4 pr-10 py-2 border border-slate-800 focus:outline-none focus:border-sky-500 transition"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-xs font-semibold transition"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Scrollable Sector Navigation Bar */}
        <nav className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/60">
          <Link
            to="/"
            className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-300 hover:bg-sky-500 hover:text-white transition"
          >
            All News
          </Link>

          {SECTORS.map((sector) => (
            <Link
              key={sector}
              to={`/sector/${sector}`}
              className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium text-slate-400 hover:text-sky-400 hover:bg-slate-900 transition"
            >
              {sector}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;