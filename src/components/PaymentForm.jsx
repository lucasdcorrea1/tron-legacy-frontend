import { useState, useEffect, useRef, useCallback } from 'react';
import { subscription as subscriptionApi } from '../services/api';
import './PaymentForm.css';

const formatCardNumber = (v) => v.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length >= 3) return d.slice(0, 2) + '/' + d.slice(2);
  return d;
};
const formatPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
};
const formatCep = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length > 5) return d.slice(0, 5) + '-' + d.slice(5);
  return d;
};
const formatCpfCnpj = (v) => {
  const d = v.replace(/\D/g, '');
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export default function PaymentForm({ planId, billingCycle, cpfCnpj: initialCpfCnpj, userEmail: initialEmail, onSuccess }) {
  const [method, setMethod] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState('form'); // form | waiting | success
  const [paymentData, setPaymentData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [needsCpf, setNeedsCpf] = useState(!initialCpfCnpj);
  const [cpfCnpj, setCpfCnpj] = useState(initialCpfCnpj || '');
  const pollRef = useRef(null);

  // Credit card form
  const [card, setCard] = useState({
    number: '', holderName: '', expiry: '', cvv: '',
  });
  const [holder, setHolder] = useState({
    name: '', email: initialEmail || '', cpfCnpj: initialCpfCnpj || '', phone: '', postalCode: '', addressNumber: '',
  });

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPolling = useCallback(() => {
    let attempts = 0;
    const maxAttempts = method === 'credit_card' ? 15 : 120;

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const data = await subscriptionApi.get();
        if (data.status === 'active' && data.plan_id !== 'free') {
          stopPolling();
          setPhase('success');
          setTimeout(() => onSuccess?.(), 2000);
          return;
        }
      } catch { /* ignore */ }

      if (attempts >= maxAttempts) {
        stopPolling();
      }
    }, 3000);
  }, [method, onSuccess, stopPolling]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const body = {
        plan_id: planId,
        billing_cycle: billingCycle,
        billing_type: method,
      };

      // CPF/CNPJ for customer creation
      const rawCpf = (needsCpf ? cpfCnpj : initialCpfCnpj || '').replace(/\D/g, '');
      if (rawCpf) body.cpf_cnpj = rawCpf;

      if (method === 'credit_card') {
        const [rawMonth, rawYear] = card.expiry.split('/');
        const expMonth = (rawMonth || '').padStart(2, '0');
        const expYear = (rawYear || '').length === 2 ? '20' + rawYear : rawYear || '';
        body.credit_card = {
          holderName: card.holderName,
          number: card.number.replace(/\s/g, ''),
          expiryMonth: expMonth,
          expiryYear: expYear,
          ccv: card.cvv,
        };
        body.card_holder = {
          name: holder.name || card.holderName,
          email: holder.email,
          cpfCnpj: holder.cpfCnpj.replace(/\D/g, ''),
          phone: holder.phone.replace(/\D/g, ''),
          postalCode: holder.postalCode.replace(/\D/g, ''),
          addressNumber: holder.addressNumber,
        };
      }

      const data = await subscriptionApi.checkout(body);
      setPaymentData(data);
      setPhase('waiting');
      startPolling();
    } catch (err) {
      setError(err.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (paymentData?.pix_payload) {
      navigator.clipboard.writeText(paymentData.pix_payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  // ── Success state ─────────────────────────────────────
  if (phase === 'success') {
    return (
      <div className="payment-form">
        <div className="payment-success">
          <div className="payment-success-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>Pagamento confirmado!</h3>
          <p>Sua assinatura está ativa. Redirecionando...</p>
        </div>
      </div>
    );
  }

  // ── Waiting state (polling) ───────────────────────────
  if (phase === 'waiting') {
    return (
      <div className="payment-form">
        {/* Show PIX QR code while waiting */}
        {method === 'pix' && paymentData?.pix_qr_code && (
          <div className="payment-pix-result">
            <div className="payment-pix-qr">
              <img src={`data:image/png;base64,${paymentData.pix_qr_code}`} alt="QR Code PIX" />
            </div>
            <div className="payment-pix-copy">
              <label>PIX Copia e Cola</label>
              <div className="payment-pix-copy-row">
                <input type="text" value={paymentData.pix_payload || ''} readOnly />
                <button type="button" onClick={handleCopyPix}>
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show boleto link while waiting */}
        {method === 'boleto' && paymentData?.boleto_url && (
          <div className="payment-boleto-result">
            <p>Boleto gerado com sucesso. Abra o link abaixo para visualizar.</p>
            <a href={paymentData.boleto_url} target="_blank" rel="noopener noreferrer" className="payment-boleto-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Abrir Boleto
            </a>
          </div>
        )}

        <div className="payment-waiting">
          <div className="payment-waiting-spinner" />
          <h3>Aguardando confirmação</h3>
          <p>
            {method === 'pix' && 'Escaneie o QR code ou use o código PIX acima para pagar.'}
            {method === 'credit_card' && 'Processando pagamento no cartão...'}
            {method === 'boleto' && 'Aguardando pagamento do boleto. Pode levar até 3 dias úteis.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────
  return (
    <div className="payment-form">
      {/* Payment method tabs */}
      <div className="payment-tabs">
        <button type="button" className={`payment-tab ${method === 'pix' ? 'active' : ''}`} onClick={() => setMethod('pix')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          PIX
        </button>
        <button type="button" className={`payment-tab ${method === 'credit_card' ? 'active' : ''}`} onClick={() => setMethod('credit_card')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Cartão
        </button>
        <button type="button" className={`payment-tab ${method === 'boleto' ? 'active' : ''}`} onClick={() => setMethod('boleto')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3h2v18H4zM8 3h1v18H8zM12 3h2v18h-2zM17 3h1v18h-1zM20 3h1v18h-1z"/></svg>
          Boleto
        </button>
      </div>

      {error && <div className="payment-error">{error}</div>}

      {/* CPF/CNPJ field (only if not provided) */}
      {needsCpf && method !== 'credit_card' && (
        <div className="payment-cpf-section">
          <div className="payment-field">
            <label>CPF ou CNPJ</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpfCnpj}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '');
                if (d.length <= 14) setCpfCnpj(formatCpfCnpj(e.target.value));
              }}
            />
          </div>
        </div>
      )}

      {/* PIX */}
      {method === 'pix' && (
        <div className="payment-pix-prompt">
          <p>Ao clicar abaixo, vamos gerar um QR Code PIX para pagamento instantâneo.</p>
          <button type="button" className="payment-submit" onClick={handleSubmit} disabled={loading || (needsCpf && cpfCnpj.replace(/\D/g, '').length < 11)}>
            {loading ? <><span className="payment-spinner" /> Gerando PIX...</> : 'Pagar com PIX'}
          </button>
        </div>
      )}

      {/* Credit Card */}
      {method === 'credit_card' && (
        <div className="payment-card-form">
          <div className="payment-field">
            <label>Número do cartão</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={card.number}
              onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
            />
          </div>
          <div className="payment-field">
            <label>Nome no cartão</label>
            <input
              type="text"
              placeholder="Como está no cartão"
              value={card.holderName}
              onChange={(e) => setCard({ ...card, holderName: e.target.value })}
            />
          </div>
          <div className="payment-card-row">
            <div className="payment-field">
              <label>Validade</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM/AA"
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
              />
            </div>
            <div className="payment-field">
              <label>CVV</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="123"
                maxLength={4}
                value={card.cvv}
                onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              />
            </div>
          </div>

          <div className="payment-card-section-title">Dados do titular</div>

          <div className="payment-field">
            <label>CPF / CNPJ do titular</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={holder.cpfCnpj}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, '');
                if (d.length <= 14) setHolder({ ...holder, cpfCnpj: formatCpfCnpj(e.target.value) });
              }}
            />
          </div>
          <div className="payment-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="email@exemplo.com"
              value={holder.email}
              onChange={(e) => setHolder({ ...holder, email: e.target.value })}
            />
          </div>
          <div className="payment-card-row">
            <div className="payment-field">
              <label>Telefone</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="(11) 99999-9999"
                value={holder.phone}
                onChange={(e) => setHolder({ ...holder, phone: formatPhone(e.target.value) })}
              />
            </div>
            <div className="payment-field">
              <label>CEP</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="00000-000"
                value={holder.postalCode}
                onChange={(e) => setHolder({ ...holder, postalCode: formatCep(e.target.value) })}
              />
            </div>
          </div>
          <div className="payment-field">
            <label>Número do endereço</label>
            <input
              type="text"
              placeholder="123"
              value={holder.addressNumber}
              onChange={(e) => setHolder({ ...holder, addressNumber: e.target.value })}
            />
          </div>

          <button type="button" className="payment-submit" onClick={handleSubmit} disabled={loading || !card.number || !card.holderName || !card.expiry || !card.cvv || !holder.cpfCnpj || !holder.email || !holder.phone || !holder.postalCode || !holder.addressNumber}>
            {loading ? <><span className="payment-spinner" /> Processando...</> : 'Pagar com cartão'}
          </button>
        </div>
      )}

      {/* Boleto */}
      {method === 'boleto' && (
        <div className="payment-boleto-prompt">
          <p>Vamos gerar um boleto bancário. O prazo de compensação é de até 3 dias úteis.</p>
          <button type="button" className="payment-submit" onClick={handleSubmit} disabled={loading || (needsCpf && cpfCnpj.replace(/\D/g, '').length < 11)}>
            {loading ? <><span className="payment-spinner" /> Gerando boleto...</> : 'Gerar Boleto'}
          </button>
        </div>
      )}
    </div>
  );
}
