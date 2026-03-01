import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { blog, getImageUrl } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import Header from '../components/Header';
import AdSlot from '../components/AdSlot';
import NewsletterForm from '../components/NewsletterForm';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Blog.css';

export default function Blog() {
  const navigate = useNavigate();
  const blogRef = useRef(null);
  useHorizontalPageSwipe(blogRef);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const limit = 9;
  const [showSidebarAds, setShowSidebarAds] = useState(() => window.innerWidth > 1200);

  useEffect(() => {
    const handleResize = () => setShowSidebarAds(window.innerWidth > 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchPosts();
    if (page > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="blog-page" ref={blogRef}>
      <Helmet>
        <title>Blog Tron Legacy - Artigos sobre Tecnologia | Whodo</title>
        <meta name="description" content="Artigos, tutoriais e novidades sobre tecnologia, programação e desenvolvimento de software. Explorando código, sistemas e o futuro digital." />
        <link rel="canonical" href="https://whodo.com.br/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/blog" />
        <meta property="og:title" content="Blog Tron Legacy - Artigos sobre Tecnologia" />
        <meta property="og:description" content="Artigos, tutoriais e novidades sobre tecnologia, programação e desenvolvimento de software." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog Tron Legacy - Artigos sobre Tecnologia" />
        <meta name="twitter:description" content="Artigos, tutoriais e novidades sobre tecnologia, programação e desenvolvimento de software." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Tron Legacy',
          url: 'https://whodo.com.br/blog',
          description: 'Artigos, tutoriais e novidades sobre tecnologia, programação e desenvolvimento de software.',
          inLanguage: 'pt-BR',
          publisher: {
            '@type': 'Organization',
            name: 'Whodo',
            url: 'https://whodo.com.br',
            logo: { '@type': 'ImageObject', url: 'https://whodo.com.br/favicon.svg' },
          },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://whodo.com.br' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://whodo.com.br/blog' },
          ],
        })}</script>
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="blog-hero">
        <div className="blog-hero-grid" />
        <div className="blog-hero-glow" />
        <div className="blog-hero-content">
          <h1 className="blog-hero-title">
            Tron <span className="neon-text">Legacy</span>
          </h1>
          <p className="blog-hero-subtitle">
            Dentro do grid &mdash; explorando código, sistemas e o futuro digital.
          </p>
          <div className="blog-hero-line" />
        </div>
      </section>

      {/* Main Content */}
      <main className="blog-main">
        <div className="blog-body">
        {showSidebarAds && (
          <aside className="ad-sidebar ad-sidebar-left" />
        )}
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
              <div className="posts-feed">
                {posts.map((post, index) => {
                  const isFeatured = index === 0 && page === 1;
                  return (
                    <article
                      key={post.id}
                      className={isFeatured ? 'post-card-featured' : 'post-card'}
                      onClick={() => navigate(`/blog/${post.slug}`)}
                    >
                      <div className="post-card-image">
                        {(post.cover_images && post.cover_images.length > 0) || post.cover_image ? (
                          <ImageCarousel
                            images={post.cover_images}
                            legacyImage={post.cover_image}
                            size={isFeatured ? 'banner' : 'card'}
                            alt={post.title}
                            showControls={post.cover_images && post.cover_images.length > 1}
                          />
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
                        {post.tags && post.tags.length > 0 && (
                          <div className="post-card-tags">
                            {post.tags.map(tag => (
                              <span key={tag} className="post-tag">{tag}</span>
                            ))}
                          </div>
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
                  );
                })}
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
        {showSidebarAds && (
          <aside className="ad-sidebar ad-sidebar-right">
            <AdSlot
              slot="9257625337"
              format="auto"
              style={{ display: 'inline-block', width: '160px', height: '600px' }}
            />
          </aside>
        )}
        </div>
      </main>

      {/* Newsletter */}
      <div className="blog-container" style={{ padding: '0 1.5rem' }}>
        <NewsletterForm />
      </div>

      {/* Footer */}
      <footer className="blog-footer">
        <div className="footer-container">
          <div className="footer-content">
            <Link to="/" className="footer-brand-link">whodo</Link>
            <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer" className="footer-whatsapp">WhatsApp</a>
            <p>&copy; {new Date().getFullYear()} Whodo Group LTDA - CNPJ 59.704.711/0001-90</p>
            <p className="footer-rights">Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
