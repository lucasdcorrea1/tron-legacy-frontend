import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { products3d, imageUrl } from '../services/api3d';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './ProductDetail3D.css';

export default function ProductDetail3D() {
  const { slug } = useParams();
  const pageRef = useRef(null);
  useHorizontalPageSwipe(pageRef);
  const { addItem, isInCart, getItemQuantity } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError('');
    products3d.getBySlug(slug)
      .then(data => {
        setProduct(data);
        setSelectedImage(0);
        setQuantity(1);
      })
      .catch(err => setError(err.message || 'Produto nao encontrado'))
      .finally(() => setLoading(false));
  }, [slug]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addItem(product, quantity);
    showToast(`${product.name} adicionado ao carrinho!`, 'success');
  };

  const maxQty = product ? product.stock - getItemQuantity(product.id) : 0;

  return (
    <div className="store3d-page" ref={pageRef}>
      <Helmet>
        <title>{product ? `${product.name} | 3D Store` : '3D Store'} - Whodo</title>
        <meta name="description" content={product?.description || 'Produto impresso em 3D'} />
        {product && (
          <script type="application/ld+json">{JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description,
            image: imageUrl(product.images?.[0], 'full'),
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: 'BRL',
              availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            },
          })}</script>
        )}
      </Helmet>
      <Header />

      <main className="pd3d-main">
        <div className="pd3d-container">
          {/* Breadcrumb */}
          <nav className="pd3d-breadcrumb">
            <Link to="/3d">3D Store</Link>
            <span className="pd3d-breadcrumb-sep">/</span>
            <span>{product?.name || 'Produto'}</span>
          </nav>

          {loading ? (
            <div className="pd3d-skeleton">
              <div className="pd3d-skeleton-image" />
              <div className="pd3d-skeleton-info">
                <div className="skeleton-text" style={{ width: '70%', height: 28 }} />
                <div className="skeleton-text" style={{ width: '30%', height: 36, marginTop: 16 }} />
                <div className="skeleton-text" style={{ width: '100%', height: 80, marginTop: 24 }} />
                <div className="skeleton-text" style={{ width: '50%', height: 48, marginTop: 24 }} />
              </div>
            </div>
          ) : error ? (
            <div className="store3d-error">{error}</div>
          ) : product && (
            <div className="pd3d-layout">
              {/* Image Gallery */}
              <div className="pd3d-gallery">
                <div className="pd3d-image-main">
                  {product.images?.length > 0 ? (
                    <img src={imageUrl(product.images[selectedImage], 'full')} alt={product.name} />
                  ) : (
                    <div className="pd3d-image-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                      </svg>
                    </div>
                  )}
                </div>
                {product.images?.length > 1 && (
                  <div className="pd3d-thumbnails">
                    {product.images.map((groupId, i) => (
                      <button
                        key={i}
                        className={`pd3d-thumb ${i === selectedImage ? 'active' : ''}`}
                        onClick={() => setSelectedImage(i)}
                      >
                        <img src={imageUrl(groupId, 'thumb')} alt={`${product.name} ${i + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="pd3d-info">
                <h1 className="pd3d-name">{product.name}</h1>

                <div className="pd3d-price">{formatPrice(product.price)}</div>

                {product.material && (
                  <span className="pd3d-material">{product.material}</span>
                )}

                {product.description && (
                  <p className="pd3d-description">{product.description}</p>
                )}

                {/* Specs */}
                {(product.dimensions || product.weight || product.print_time) && (
                  <div className="pd3d-specs">
                    <h3 className="pd3d-specs-title">Especificacoes</h3>
                    <div className="pd3d-specs-grid">
                      {product.dimensions && (
                        <div className="pd3d-spec">
                          <span className="pd3d-spec-label">Dimensoes</span>
                          <span className="pd3d-spec-value">{product.dimensions}</span>
                        </div>
                      )}
                      {product.weight && (
                        <div className="pd3d-spec">
                          <span className="pd3d-spec-label">Peso</span>
                          <span className="pd3d-spec-value">{product.weight}</span>
                        </div>
                      )}
                      {product.print_time && (
                        <div className="pd3d-spec">
                          <span className="pd3d-spec-label">Tempo de impressao</span>
                          <span className="pd3d-spec-value">{product.print_time}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stock */}
                <div className="pd3d-stock">
                  {product.stock > 0 ? (
                    <span className="pd3d-stock-available">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {product.stock} em estoque
                    </span>
                  ) : (
                    <span className="pd3d-stock-out">Esgotado</span>
                  )}
                </div>

                {/* Quantity + Add to Cart */}
                {product.stock > 0 && (
                  <div className="pd3d-actions">
                    <div className="pd3d-qty">
                      <button
                        className="pd3d-qty-btn"
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                      >-</button>
                      <span className="pd3d-qty-value">{quantity}</span>
                      <button
                        className="pd3d-qty-btn"
                        onClick={() => setQuantity(q => Math.min(maxQty > 0 ? maxQty : product.stock, q + 1))}
                        disabled={quantity >= (maxQty > 0 ? maxQty : product.stock)}
                      >+</button>
                    </div>
                    <button className="pd3d-add-btn" onClick={handleAddToCart} disabled={maxQty <= 0}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                      </svg>
                      {isInCart(product.id) ? 'Atualizar Carrinho' : 'Adicionar ao Carrinho'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

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
