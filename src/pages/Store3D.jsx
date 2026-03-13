import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { products3d, categories3d, imageUrl } from '../services/api3d';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Store3D.css';

export default function Store3D() {
  const pageRef = useRef(null);
  useHorizontalPageSwipe(pageRef);
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const limit = 12;

  useEffect(() => {
    categories3d.list()
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
    if (page > 1) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, categoryId]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await products3d.list({
        page,
        limit,
        category_id: categoryId || undefined,
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="store3d-page" ref={pageRef}>
      <Helmet>
        <title>3D Store - Impressos 3D | Whodo</title>
        <meta name="description" content="Loja de itens impressos em 3D. Miniaturas, acessorios, peças customizadas e muito mais. Impressão de alta qualidade." />
        <link rel="canonical" href="https://whodo.com.br/3d" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/3d" />
        <meta property="og:title" content="3D Store - Impressos 3D | Whodo" />
        <meta property="og:description" content="Loja de itens impressos em 3D. Miniaturas, acessorios, peças customizadas e muito mais." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: '3D Store - Whodo',
          url: 'https://whodo.com.br/3d',
          description: 'Loja de itens impressos em 3D.',
          inLanguage: 'pt-BR',
          publisher: {
            '@type': 'Organization',
            name: 'Whodo',
            url: 'https://whodo.com.br',
          },
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://whodo.com.br' },
            { '@type': 'ListItem', position: 2, name: '3D Store', item: 'https://whodo.com.br/3d' },
          ],
        })}</script>
      </Helmet>
      <Header />

      {/* Hero */}
      <section className="store3d-hero">
        <div className="store3d-hero-grid" />
        <div className="store3d-hero-glow" />
        <div className="store3d-hero-content">
          <h1 className="store3d-hero-title">
            3D <span className="store3d-neon">Store</span>
          </h1>
          <p className="store3d-hero-subtitle">
            Itens impressos em 3D com qualidade e precisao.
          </p>
          <div className="store3d-hero-line" />
        </div>
      </section>

      {/* Main Content */}
      <main className="store3d-main">
        <div className="store3d-container">
          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="store3d-filters">
              <button
                className={`store3d-chip ${categoryId === '' ? 'active' : ''}`}
                onClick={() => { setCategoryId(''); setPage(1); }}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`store3d-chip ${categoryId === cat.id ? 'active' : ''}`}
                  onClick={() => { setCategoryId(cat.id); setPage(1); }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {error && <div className="store3d-error">{error}</div>}

          {loading ? (
            <div className="store3d-loading">
              <div className="store3d-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="store3d-card-skeleton">
                    <div className="skeleton-image" />
                    <div className="skeleton-text" />
                    <div className="skeleton-text short" />
                  </div>
                ))}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="store3d-empty">
              <p>Nenhum produto disponivel ainda.</p>
            </div>
          ) : (
            <>
              <div className="store3d-grid">
                {products.map(product => (
                  <Link
                    key={product.id}
                    to={`/3d/produto/${product.slug}`}
                    className="store3d-card-link"
                  >
                    <article className="store3d-card">
                      <div className="store3d-card-image">
                        {product.images && product.images.length > 0 ? (
                          <img src={imageUrl(product.images[0], 'card')} alt={product.name} />
                        ) : (
                          <div className="store3d-card-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                              <line x1="12" y1="22.08" x2="12" y2="12"/>
                            </svg>
                          </div>
                        )}
                        {product.featured && (
                          <span className="store3d-badge">Destaque</span>
                        )}
                      </div>
                      <div className="store3d-card-body">
                        <h3 className="store3d-card-name">{product.name}</h3>
                        {product.material && (
                          <span className="store3d-card-material">{product.material}</span>
                        )}
                        <div className="store3d-card-footer">
                          <span className="store3d-card-price">{formatPrice(product.price)}</span>
                          {product.stock <= 0 ? (
                            <span className="store3d-card-out">Esgotado</span>
                          ) : (
                            <button
                              className="store3d-card-cart-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addItem(product);
                              }}
                              aria-label={`Adicionar ${product.name} ao carrinho`}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="store3d-pagination">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                    className="store3d-pagination-btn"
                  >
                    Anterior
                  </button>
                  <span className="store3d-pagination-info">
                    Pagina {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                    className="store3d-pagination-btn"
                  >
                    Proxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="store3d-footer">
        <div className="store3d-footer-container">
          <div className="store3d-footer-content">
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
