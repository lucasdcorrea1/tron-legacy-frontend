import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Store3D.css';
import './Cart3D.css';

export default function Cart3D() {
  const pageRef = useRef(null);
  useHorizontalPageSwipe(pageRef);
  const { items, itemCount, total, updateQuantity, removeItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const handleCheckout = () => {
    navigate(isAuthenticated ? '/3d/checkout' : '/login');
  };

  return (
    <div className="store3d-page" ref={pageRef}>
      <Helmet>
        <title>Carrinho | 3D Store - Whodo</title>
      </Helmet>
      <Header />

      <main className="cart3d-main">
        <div className="cart3d-container">
          <h1 className="cart3d-title">Carrinho</h1>

          {items.length === 0 ? (
            <div className="cart3d-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="64" height="64">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p>Seu carrinho esta vazio</p>
              <Link to="/3d" className="cart3d-continue-btn">Continuar comprando</Link>
            </div>
          ) : (
            <div className="cart3d-layout">
              <div className="cart3d-items">
                {items.map(item => (
                  <div key={item.product_id} className="cart3d-item">
                    <Link to={`/3d/produto/${item.slug}`} className="cart3d-item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="cart3d-item-placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div className="cart3d-item-info">
                      <Link to={`/3d/produto/${item.slug}`} className="cart3d-item-name">{item.name}</Link>
                      <span className="cart3d-item-unit-price">{formatPrice(item.price)}</span>
                    </div>
                    <div className="cart3d-item-qty">
                      <button
                        className="cart3d-qty-btn"
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      >-</button>
                      <span>{item.quantity}</span>
                      <button
                        className="cart3d-qty-btn"
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >+</button>
                    </div>
                    <span className="cart3d-item-subtotal">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      className="cart3d-item-remove"
                      onClick={() => removeItem(item.product_id)}
                      aria-label="Remover item"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <aside className="cart3d-summary">
                <h2 className="cart3d-summary-title">Resumo do Pedido</h2>
                <div className="cart3d-summary-row">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="cart3d-summary-row cart3d-summary-shipping">
                  <span>Frete</span>
                  <span className="cart3d-shipping-note">A calcular</span>
                </div>
                <div className="cart3d-summary-row cart3d-summary-total">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <button className="cart3d-checkout-btn" onClick={handleCheckout}>
                  Finalizar Pedido
                </button>
                <Link to="/3d" className="cart3d-keep-shopping">Continuar comprando</Link>
              </aside>
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
