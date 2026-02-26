import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blog, API_URL } from '../services/api';
import './Blog.css';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
};

export default function Blog() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
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
    <div className="blog-page">
      {/* Header */}
      <header className="blog-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <span className="logo-icon">W</span>
            <span className="logo-text">whodo</span>
          </Link>
          <nav className="header-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/blog" className="nav-link active">Blog</Link>
          </nav>
          <div className="header-actions">
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="btn-ghost">Painel</Link>
                <button onClick={handleLogout} className="btn-ghost">Sair</button>
              </>
            ) : (
              <Link to="/login" className="btn-primary-sm">Entrar</Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="blog-hero">
        <div className="blog-hero-content">
          <span className="blog-badge">Blog</span>
          <h1>Tron Legacy</h1>
          <p>Artigos, tutoriais e novidades sobre tecnologia</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="blog-main">
        <div className="blog-container">
          {/* Category Filters */}
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

          {error && <div className="blog-error">{error}</div>}

          {loading ? (
            <div className="blog-loading">Carregando posts...</div>
          ) : posts.length === 0 ? (
            <div className="blog-empty">
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
                          <span>{post.title.charAt(0)}</span>
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
                      <div className="post-card-stats">
                        <span className="post-stat">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          {post.view_count || 0}
                        </span>
                        <span className="post-stat">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          {post.like_count || 0}
                        </span>
                        <span className="post-stat">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          {post.comment_count || 0}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="blog-pagination">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="pagination-btn"
                  >
                    Anterior
                  </button>
                  <span className="pagination-info">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                    className="pagination-btn"
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="blog-footer">
        <div className="footer-container">
          <div className="footer-content">
            <Link to="/" className="logo">
              <span className="logo-icon">W</span>
              <span className="logo-text">whodo</span>
            </Link>
            <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer" className="footer-whatsapp">WhatsApp</a>
            <p>&copy; {new Date().getFullYear()} Whodo Group LTDA - CNPJ 59.704.711/0001-90</p>
            <p className="footer-rights">Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
