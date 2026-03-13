import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './CartDrawer.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

export default function CartDrawer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    items, itemCount, total,
    updateQuantity, removeItem,
    isDrawerOpen, closeDrawer,
    lastAddedId, clearLastAdded,
  } = useCart();
  const drawerRef = useRef(null);
  const prevOpen = useRef(false);

  // Only render on /3d routes
  const is3D = location.pathname.startsWith('/3d');

  // Close on route change
  useEffect(() => {
    if (isDrawerOpen) closeDrawer();
  }, [location.pathname]);

  // Body scroll lock
  useEffect(() => {
    if (isDrawerOpen && is3D) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen, is3D]);

  // Escape key
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isDrawerOpen, closeDrawer]);

  // Clear highlight after animation
  useEffect(() => {
    if (!lastAddedId) return;
    const timer = setTimeout(clearLastAdded, 1600);
    return () => clearTimeout(timer);
  }, [lastAddedId, clearLastAdded]);

  // Track open state for CSS transitions
  useEffect(() => {
    prevOpen.current = isDrawerOpen;
  }, [isDrawerOpen]);

  if (!is3D) return null;
  if (!isDrawerOpen && !prevOpen.current) return null;

  const handleCheckout = () => {
    closeDrawer();
    navigate(isAuthenticated ? '/3d/checkout' : '/login');
  };

  return (
    <>
      <div
        className={`cart-drawer-backdrop ${isDrawerOpen ? 'visible' : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        className={`cart-drawer ${isDrawerOpen ? 'open' : ''}`}
        role="dialog"
        aria-label="Carrinho de compras"
        aria-modal="true"
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">
            Carrinho <span>({itemCount})</span>
          </h2>
          <button className="cart-drawer-close" onClick={closeDrawer} aria-label="Fechar carrinho">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="cart-drawer-items">
          {items.length === 0 ? (
            <div className="cart-drawer-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p>Seu carrinho esta vazio</p>
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.product_id}
                className={`cart-drawer-item ${lastAddedId === item.product_id ? 'just-added' : ''}`}
              >
                <div className="cart-drawer-item-image">
                  {item.image && <img src={item.image} alt={item.name} />}
                </div>
                <div className="cart-drawer-item-info">
                  <Link
                    to={`/3d/produto/${item.slug}`}
                    className="cart-drawer-item-name"
                    onClick={closeDrawer}
                  >
                    {item.name}
                  </Link>
                  <span className="cart-drawer-item-price">{formatPrice(item.price)}</span>
                  <div className="cart-drawer-item-controls">
                    <div className="cart-drawer-qty">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Diminuir quantidade"
                      >-</button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label="Aumentar quantidade"
                      >+</button>
                    </div>
                    <button
                      className="cart-drawer-item-remove"
                      onClick={() => removeItem(item.product_id)}
                      aria-label={`Remover ${item.name}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/>
                        <path d="M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-drawer-subtotal">
              <span className="cart-drawer-subtotal-label">Subtotal</span>
              <span className="cart-drawer-subtotal-value">{formatPrice(total)}</span>
            </div>
            <button className="cart-drawer-checkout" onClick={handleCheckout}>
              Finalizar Compra
            </button>
            <button className="cart-drawer-continue" onClick={closeDrawer}>
              Continuar Comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
