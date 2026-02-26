import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blog, API_URL } from '../services/api';
import './Home.css';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
};

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, profile, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const limit = 9;

  useEffect(() => {
    fetchPosts();
  }, [page, category]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await blog.list({ page, limit, category: category || undefined });
      setPosts(data.posts || []);
      setTotal(data.total || 0);

      if (categories.length === 0 && data.posts) {
        const cats = [...new Set(data.posts.map(p => p.category).filter(Boolean))];
        setCategories(cats);
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-container">
          <Link to="/" className="home-logo">Tron Legacy</Link>
          <nav className="header-nav">
            {isAuthenticated ? (
              <>
                <Link to="/admin">Admin</Link>
                <span className="user-name">{profile?.name}</span>
                <button onClick={handleLogout} className="logout-btn">Sair</button>
              </>
            ) : (
              <Link to="/login" className="login-link">Entrar</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="home-main">
        <div className="home-hero">
          <h1>Tron Legacy Blog</h1>
          <p>Artigos, tutoriais e novidades sobre tecnologia</p>
        </div>

        {categories.length > 0 && (
          <div className="category-filters">
            <button
              className={`category-chip ${category === '' ? 'active' : ''}`}
              onClick={() => { setCategory(''); setPage(1); }}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-chip ${category === cat ? 'active' : ''}`}
                onClick={() => { setCategory(cat); setPage(1); }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {error && <div className="home-error">{error}</div>}

        {loading ? (
          <div className="home-loading">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="home-empty">
            <p>Nenhum post publicado ainda.</p>
          </div>
        ) : (
          <>
            <div className="posts-grid">
              {posts.map(post => (
                <article
                  key={post.id}
                  className="post-card"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <div className="post-card-image">
                    {post.cover_image ? (
                      <img src={getImageUrl(post.cover_image)} alt={post.title} />
                    ) : (
                      <div className="post-card-placeholder">
                        {post.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="post-card-content">
                    {post.category && (
                      <span className="post-card-category">{post.category}</span>
                    )}
                    <h2 className="post-card-title">{post.title}</h2>
                    {post.excerpt && (
                      <p className="post-card-excerpt">{post.excerpt}</p>
                    )}
                    <div className="post-card-meta">
                      <div className="post-card-author">
                        {post.author_avatar ? (
                          <img src={getImageUrl(post.author_avatar)} alt={post.author_name} />
                        ) : (
                          <div className="author-placeholder">
                            {post.author_name?.charAt(0) || 'A'}
                          </div>
                        )}
                        <span>{post.author_name || 'Autor'}</span>
                      </div>
                      <span className="post-card-date">
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                      {post.reading_time && (
                        <span className="post-card-reading">{post.reading_time} min</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="home-pagination">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="pagination-button"
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="pagination-button"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="home-footer">
        <p>Tron Legacy Blog</p>
      </footer>
    </div>
  );
}
