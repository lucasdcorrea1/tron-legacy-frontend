import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orders3d } from '../services/api3d';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Store3D.css';
import './OrderHistory3D.css';

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  printing: 'Imprimindo',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

const PAYMENT_LABELS = {
  pending: 'Pag. Pendente',
  paid: 'Pago',
  refunded: 'Reembolsado',
  failed: 'Pag. Falhou',
};

export default function OrderHistory3D() {
  const pageRef = useRef(null);
  useHorizontalPageSwipe(pageRef);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    orders3d.list({ page, limit })
      .then(data => {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [page]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="store3d-page" ref={pageRef}>
      <Helmet>
        <title>Meus Pedidos | 3D Store - Whodo</title>
      </Helmet>
      <Header />

      <main className="oh3d-main">
        <div className="oh3d-container">
          <h1 className="oh3d-title">Meus Pedidos</h1>

          {loading ? (
            <div className="oh3d-loading">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="oh3d-card-skeleton">
                  <div className="skeleton-text" style={{ width: '30%', height: 16 }} />
                  <div className="skeleton-text" style={{ width: '60%', height: 14, marginTop: 8 }} />
                  <div className="skeleton-text" style={{ width: '40%', height: 14, marginTop: 8 }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="store3d-error">{error}</div>
          ) : orders.length === 0 ? (
            <div className="oh3d-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="56" height="56">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
              <p>Voce ainda nao fez nenhum pedido</p>
              <Link to="/3d" className="oh3d-shop-btn">Ir para a loja</Link>
            </div>
          ) : (
            <>
              <div className="oh3d-list">
                {orders.map(order => (
                  <Link key={order.id} to={`/3d/meus-pedidos/${order.id}`} className="oh3d-card">
                    <div className="oh3d-card-header">
                      <span className="oh3d-card-id">#{order.id?.slice(-8)}</span>
                      <span className="oh3d-card-date">{formatDate(order.created_at)}</span>
                    </div>
                    <div className="oh3d-card-badges">
                      <span className={`oh3d-badge oh3d-status-${order.status}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                      <span className={`oh3d-badge oh3d-payment-${order.payment_status}`}>
                        {PAYMENT_LABELS[order.payment_status] || order.payment_status}
                      </span>
                    </div>
                    <div className="oh3d-card-items">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <span key={i} className="oh3d-card-item-name">
                          {item.product_name || item.name}
                          {item.quantity > 1 && ` (x${item.quantity})`}
                        </span>
                      ))}
                      {order.items?.length > 3 && (
                        <span className="oh3d-card-more">+{order.items.length - 3} mais</span>
                      )}
                    </div>
                    <div className="oh3d-card-footer">
                      <span className="oh3d-card-total">{formatPrice(order.total)}</span>
                      <span className="oh3d-card-link">Ver detalhes</span>
                    </div>
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
