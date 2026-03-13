import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orders3d } from '../services/api3d';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Store3D.css';
import './OrderDetail3D.css';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pendente' },
  { key: 'confirmed', label: 'Confirmado' },
  { key: 'printing', label: 'Imprimindo' },
  { key: 'shipped', label: 'Enviado' },
  { key: 'delivered', label: 'Entregue' },
];

const PAYMENT_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  refunded: 'Reembolsado',
  failed: 'Falhou',
};

const PAYMENT_COLORS = {
  pending: '#eab308',
  paid: '#4ade80',
  refunded: '#a1a1aa',
  failed: '#ef4444',
};

export default function OrderDetail3D() {
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusIndex = (status) => {
    if (status === 'cancelled') return -1;
    return STATUS_STEPS.findIndex(s => s.key === status);
  };

  return (
    <div className="store3d-page" ref={pageRef}>
      <Helmet>
        <title>Pedido {order?.id?.slice(-8) || ''} | 3D Store - Whodo</title>
      </Helmet>
      <Header />

      <main className="od3d-main">
        <div className="od3d-container">
          <nav className="pd3d-breadcrumb">
            <Link to="/3d/meus-pedidos">Meus Pedidos</Link>
            <span className="pd3d-breadcrumb-sep">/</span>
            <span>#{order?.id?.slice(-8) || '...'}</span>
          </nav>

          {loading ? (
            <div className="od3d-loading">
              <div className="skeleton-text" style={{ width: '40%', height: 28 }} />
              <div className="skeleton-text" style={{ width: '100%', height: 60, marginTop: 16 }} />
              <div className="skeleton-text" style={{ width: '100%', height: 120, marginTop: 16 }} />
            </div>
          ) : error ? (
            <div className="store3d-error">{error}</div>
          ) : order && (
            <>
              <div className="od3d-header">
                <h1>Pedido #{order.id?.slice(-8)}</h1>
                <span className="od3d-header-date">{formatDate(order.created_at)}</span>
              </div>

              {/* Status Timeline */}
              {order.status !== 'cancelled' ? (
                <div className="od3d-timeline">
                  {STATUS_STEPS.map((step, i) => {
                    const current = getStatusIndex(order.status);
                    const isCompleted = i <= current;
                    const isCurrent = i === current;
                    return (
                      <div key={step.key} className={`od3d-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                        <div className="od3d-step-dot" />
                        {i < STATUS_STEPS.length - 1 && <div className="od3d-step-line" />}
                        <span className="od3d-step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="od3d-cancelled-badge">Pedido Cancelado</div>
              )}

              {/* Items */}
              <section className="od3d-section">
                <h2>Itens do Pedido</h2>
                <div className="od3d-items">
                  {order.items?.map((item, i) => (
                    <div key={i} className="od3d-item">
                      <div className="od3d-item-image">
                        {item.image ? (
                          <img src={item.image} alt={item.product_name || item.name} />
                        ) : (
                          <div className="od3d-item-ph" />
                        )}
                      </div>
                      <div className="od3d-item-info">
                        <span className="od3d-item-name">{item.product_name || item.name}</span>
                        <span className="od3d-item-qty">Qtd: {item.quantity} x {formatPrice(item.price)}</span>
                      </div>
                      <span className="od3d-item-subtotal">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="od3d-total">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </section>

              {/* Info Cards Grid */}
              <div className="od3d-cards">
                {/* Shipping Address */}
                {order.shipping_address && (
                  <div className="od3d-card">
                    <h3>Endereco de Entrega</h3>
                    <p>{order.shipping_address.name}</p>
                    <p>{order.shipping_address.street}, {order.shipping_address.number}
                      {order.shipping_address.complement && ` - ${order.shipping_address.complement}`}
                    </p>
                    <p>{order.shipping_address.neighborhood}</p>
                    <p>{order.shipping_address.city} - {order.shipping_address.state}</p>
                    <p>CEP: {order.shipping_address.cep}</p>
                    {order.shipping_address.phone && <p>Tel: {order.shipping_address.phone}</p>}
                  </div>
                )}

                {/* Payment Status */}
                <div className="od3d-card">
                  <h3>Pagamento</h3>
                  <div className="od3d-payment-status" style={{ color: PAYMENT_COLORS[order.payment_status] || '#a1a1aa' }}>
                    {PAYMENT_LABELS[order.payment_status] || order.payment_status}
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="od3d-card">
                    <h3>Observacoes</h3>
                    <p>{order.notes}</p>
                  </div>
                )}

                {/* Dates */}
                <div className="od3d-card">
                  <h3>Datas</h3>
                  <div className="od3d-date-row">
                    <span>Criado em</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  {order.updated_at && order.updated_at !== order.created_at && (
                    <div className="od3d-date-row">
                      <span>Atualizado em</span>
                      <span>{formatDate(order.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="od3d-back">
                <Link to="/3d/meus-pedidos" className="od3d-back-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Voltar para Meus Pedidos
                </Link>
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
