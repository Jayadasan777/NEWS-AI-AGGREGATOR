import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';

function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/articles/${id}`);
        setArticle(response.data.data);
      } catch (err) {
        setError('Article not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400 text-lg">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black gap-4">
        <p className="text-red-500 text-lg">{error || 'Article not found.'}</p>
        <Link to="/" className="text-blue-500 hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="text-blue-500 hover:underline text-sm">
          ← Back to Home
        </Link>

        <span className="block mt-6 text-xs font-semibold text-blue-500 uppercase tracking-wide">
          {article.sector}
        </span>

        <h1 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4 leading-tight">
          {article.title}
        </h1>

        <p className="text-gray-500 text-sm mb-8">
          {new Date(article.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        <img
          src={article.image_url}
          alt={article.title}
          className="w-full rounded-lg mb-8 aspect-video object-cover"
        />

        <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-line">
          {article.unique_summary}
        </p>
      </div>
    </div>
  );
}

export default ArticleDetail;