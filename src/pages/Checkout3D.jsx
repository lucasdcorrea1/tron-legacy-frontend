import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { orders3d } from '../services/api3d';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Checkout3D.css';

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

export default function Checkout3D() {
  const pageRef = useRef(null);
  useHorizontalPageSwipe(pageRef);
  const { items, total, clearCart, itemCount } = useCart();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    if (profile?.name) {
      setForm(f => ({ ...f, name: profile.name }));
    }
  }, [profile]);

  if (items.length === 0) {
    return <Navigate to="/3d/carrinho" replace />;
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'cep') {
      value = value.replace(/\D/g, '').slice(0, 8);
      if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5);
    }

    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 11);
      if (value.length > 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      }
    }

    setForm(f => ({ ...f, [name]: value }));
  };

  const isValid = form.name && form.cep.replace(/\D/g, '').length === 8 &&
    form.street && form.number && form.neighborhood && form.city && form.state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        shipping_address: {
          name: form.name,
          zip_code: form.cep.replace(/\D/g, ''),
          street: form.street,
          number: form.number,
          complement: form.complement,
          district: form.neighborhood,
          city: form.city,
          state: form.state,
          phone: form.phone.replace(/\D/g, ''),
        },
        notes: form.notes,
      };

      const order = await orders3d.create(payload);
      clearCart();
      showToast('Pedido realizado com sucesso!', 'success');
      navigate(`/3d/pedido/${order.id}/confirmacao`);
    } catch (err) {
      showToast(err.message || 'Erro ao criar pedido', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="store3d-page" ref={pageRef}>
      <Helmet>
        <title>Checkout | 3D Store - Whodo</title>
      </Helmet>
      <Header />

      <main className="ck3d-main">
        <div className="ck3d-container">
          <h1 className="ck3d-title">Checkout</h1>

          <form className="ck3d-form" onSubmit={handleSubmit}>
            {/* Order Summary */}
            <section className="ck3d-section">
              <div className="ck3d-section-header">
                <h2>Resumo do Pedido</h2>
                <Link to="/3d/carrinho" className="ck3d-edit-link">Editar carrinho</Link>
              </div>
              <div className="ck3d-order-items">
                {items.map(item => (
                  <div key={item.product_id} className="ck3d-order-item">
                    <div className="ck3d-order-item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="ck3d-order-item-ph" />
                      )}
                    </div>
                    <div className="ck3d-order-item-info">
                      <span className="ck3d-order-item-name">{item.name}</span>
                      <span className="ck3d-order-item-qty">Qtd: {item.quantity}</span>
                    </div>
                    <span className="ck3d-order-item-price">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="ck3d-order-total">
                <span>Total ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                <span>{formatPrice(total)}</span>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="ck3d-section">
              <h2>Endereco de Entrega</h2>
              <div className="ck3d-fields">
                <div className="ck3d-field ck3d-field-full">
                  <label>Nome completo *</label>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="ck3d-field">
                  <label>CEP *</label>
                  <input name="cep" value={form.cep} onChange={handleChange} placeholder="00000-000" required />
                </div>
                <div className="ck3d-field">
                  <label>Telefone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="(00) 00000-0000" />
                </div>
                <div className="ck3d-field ck3d-field-full">
                  <label>Rua *</label>
                  <input name="street" value={form.street} onChange={handleChange} required />
                </div>
                <div className="ck3d-field ck3d-field-sm">
                  <label>Numero *</label>
                  <input name="number" value={form.number} onChange={handleChange} required />
                </div>
                <div className="ck3d-field">
                  <label>Complemento</label>
                  <input name="complement" value={form.complement} onChange={handleChange} />
                </div>
                <div className="ck3d-field">
                  <label>Bairro *</label>
                  <input name="neighborhood" value={form.neighborhood} onChange={handleChange} required />
                </div>
                <div className="ck3d-field">
                  <label>Cidade *</label>
                  <input name="city" value={form.city} onChange={handleChange} required />
                </div>
                <div className="ck3d-field ck3d-field-sm">
                  <label>Estado *</label>
                  <select name="state" value={form.state} onChange={handleChange} required>
                    <option value="">UF</option>
                    {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Notes */}
            <section className="ck3d-section">
              <h2>Observacoes</h2>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Alguma observacao sobre o pedido? (opcional)"
                rows={3}
                className="ck3d-textarea"
              />
            </section>

            {/* Payment Placeholder */}
            <section className="ck3d-section">
              <h2>Pagamento</h2>
              <div className="ck3d-payment-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <p>O pagamento sera processado apos a confirmacao do pedido. Voce recebera instrucoes por email.</p>
              </div>
            </section>

            {/* Submit */}
            <button
              type="submit"
              className="ck3d-submit-btn"
              disabled={!isValid || submitting}
            >
              {submitting ? 'Processando...' : 'Confirmar Pedido'}
            </button>
          </form>
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
