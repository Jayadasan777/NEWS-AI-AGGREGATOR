import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Sector from './pages/Sector';
import ArticleDetail from './pages/ArticleDetail';
import EventDetail from './pages/EventDetail';
import Search from './pages/Search';
import About from './pages/About';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-black">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sector/:sectorName" element={<Sector />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;