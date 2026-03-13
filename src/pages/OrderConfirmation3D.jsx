import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orders3d } from '../services/api3d';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Store3D.css';
import './OrderConfirmation3D.css';

export default function OrderConfirmation3D() {
  const { id } = useParams();
  const pageRef = useRef(null);
  useHorizontalPageSwipe(pageRef);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    orders3d.getById(id)
      .then(setOrder)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  return (
    <div className="store3d-page" ref={pageRef}>
      <Helmet>
        <title>Pedido Realizado | 3D Store - Whodo</title>
      </Helmet>
      <Header />

      <main className="oc3d-main">
        <div className="oc3d-container">
          {loading ? (
            <div className="oc3d-loading">
              <div className="skeleton-text" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto' }} />
              <div className="skeleton-text" style={{ width: '60%', height: 28, margin: '1rem auto 0' }} />
              <div className="skeleton-text" style={{ width: '40%', height: 20, margin: '0.5rem auto 0' }} />
            </div>
          ) : error ? (
            <div className="store3d-error">{error}</div>
          ) : order && (
            <>
              <div className="oc3d-header">
                <div className="oc3d-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="40" height="40">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h1>Pedido Realizado!</h1>
                <p className="oc3d-order-id">Pedido #{order.id?.slice(-8)}</p>
              </div>

              {/* Payment Pending Banner */}
              <div className="oc3d-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <p>Pagamento Pendente — Voce recebera instrucoes de pagamento em breve.</p>
              </div>

              {/* Order Items */}
              <section className="oc3d-section">
                <h2>Itens do Pedido</h2>
                <div className="oc3d-items">
                  {order.items?.map((item, i) => (
                    <div key={i} className="oc3d-item">
                      <span className="oc3d-item-name">{item.product_name || item.name}</span>
                      <span className="oc3d-item-qty">x{item.quantity}</span>
                      <span className="oc3d-item-price">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="oc3d-total">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </section>

              {/* Shipping Address */}
              {order.shipping_address && (
                <section className="oc3d-section">
                  <h2>Endereco de Entrega</h2>
                  <div className="oc3d-address">
                    <p>{order.shipping_address.name}</p>
                    <p>{order.shipping_address.street}, {order.shipping_address.number}
                      {order.shipping_address.complement && ` - ${order.shipping_address.complement}`}
                    </p>
                    <p>{order.shipping_address.neighborhood}</p>
                    <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                    <p>CEP: {order.shipping_address.cep}</p>
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="oc3d-actions">
                <Link to="/3d/meus-pedidos" className="oc3d-btn oc3d-btn-primary">Ver Meus Pedidos</Link>
                <Link to="/3d" className="oc3d-btn oc3d-btn-secondary">Continuar Comprando</Link>
              </div>
            </>
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
