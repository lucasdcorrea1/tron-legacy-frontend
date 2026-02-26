import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blog, getImageUrl } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import './Home.css';

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await blog.list({ page: 1, limit: 3 });
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Erro ao carregar posts:', err);
    } finally {
      setLoadingPosts(false);
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

  return (
    <div className="home">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            <span className="logo-mark">W</span>
            <span className="logo-text">whodo</span>
          </Link>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
          <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/blog" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Painel</Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="nav-link">Sair</button>
              </>
            ) : (
              <Link to="/login" className="btn-outline" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
            )}
          </nav>
          {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="hero-inner">
          <div className="hero-content">
            <p className="hero-tagline">Do conceito à realidade</p>
            <h1 className="hero-title">
              Transforme suas ideias em <span className="text-gradient">soluções digitais</span>
            </h1>
            <p className="hero-description">
              Desenvolvemos tecnologia sob medida para impulsionar seu negócio.
              Websites, apps e sistemas que fazem a diferença.
            </p>
            <div className="hero-actions">
              <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer" className="btn-primary">
                Fale Conosco
              </a>
              <Link to="/blog" className="btn-ghost">
                Ver Blog
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src="/teste-image-home.png"
              alt="Digital Innovation"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="blog-section" id="blog">
        <div className="section-inner">
          <div className="section-header">
            <p className="section-tagline">Blog</p>
            <h2 className="section-title">Tron Legacy</h2>
            <p className="section-description">
              Artigos, tutoriais e novidades sobre tecnologia
            </p>
          </div>

          {loadingPosts ? (
            <div className="loading">Carregando...</div>
          ) : posts.length === 0 ? (
            <div className="empty">Nenhum post ainda.</div>
          ) : (
            <div className="posts-grid">
              {posts.map(post => (
                <Link to={`/blog/${post.slug}`} key={post._id || post.id} className="post-card">
                  <div className="post-image">
                    {(post.cover_images && post.cover_images.length > 0) || post.cover_image ? (
                      <ImageCarousel
                        images={post.cover_images}
                        legacyImage={post.cover_image}
                        size="thumb"
                        alt={post.title}
                        showControls={post.cover_images && post.cover_images.length > 1}
                      />
                    ) : (
                      <div className="post-image-placeholder">
                        {post.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="post-content">
                    {post.category && <span className="post-category">{post.category}</span>}
                    <h3 className="post-title">{post.title}</h3>
                    {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}
                    <div className="post-meta">
                      <span>{formatDate(post.published_at || post.created_at)}</span>
                      {post.reading_time && <span>{post.reading_time} min</span>}
                    </div>
                    <div className="post-stats">
                      <span>{post.view_count || 0} views</span>
                      <span>{post.like_count || 0} likes</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="section-cta">
            <Link to="/blog" className="btn-outline">Ver todos os posts</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Pronto para começar?</h2>
          <p className="cta-description">
            Entre em contato e vamos transformar sua ideia em realidade.
          </p>
          <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer" className="btn-primary btn-lg">
            Iniciar Conversa
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link to="/" className="logo">
              <span className="logo-mark">W</span>
              <span className="logo-text">whodo</span>
            </Link>
            <p className="footer-tagline">Transformando ideias em soluções digitais.</p>
          </div>
          <div className="footer-links">
            <Link to="/blog">Blog</Link>
            <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Whodo Group LTDA - CNPJ 59.704.711/0001-90</p>
        </div>
      </footer>
    </div>
  );
}
