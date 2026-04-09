import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { subscription } from '../services/api';
import Header from '../components/Header';
import './CheckoutSuccess.css';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | active | pending
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const checkStatus = async () => {
      try {
        const data = await subscription.get();
        if (data.status === 'active') {
          setStatus('active');
          return;
        }
      } catch {
        // ignore
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus('pending');
      } else {
        setTimeout(checkStatus, 3000);
      }
    };

    checkStatus();
  }, [isAuthenticated, navigate]);

  return (
    <div className="checkout-success-page">
      <Helmet>
        <title>Pagamento - Whodo</title>
      </Helmet>
      <Header />

      <div className="checkout-success-container">
        {status === 'checking' && (
          <div className="checkout-success-card">
            <div className="checkout-success-spinner-wrap">
              <div className="checkout-success-spinner" />
            </div>
            <h1>Verificando pagamento...</h1>
            <p>Estamos confirmando seu pagamento. Isso pode levar alguns segundos.</p>
          </div>
        )}

        {status === 'active' && (
          <div className="checkout-success-card">
            <div className="checkout-success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1>Pagamento confirmado!</h1>
            <p>Sua assinatura está ativa. Você já pode usar todos os recursos do seu plano.</p>
            <Link to="/admin" className="checkout-success-btn primary">
              Ir para o painel
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        )}

        {status === 'pending' && (
          <div className="checkout-success-card">
            <div className="checkout-success-icon pending">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1>Aguardando pagamento</h1>
            <p>
              Sua conta foi criada com sucesso! O pagamento ainda está sendo processado.
              Assim que for confirmado, seu plano será ativado automaticamente.
            </p>
            <div className="checkout-success-actions">
              <Link to="/admin" className="checkout-success-btn primary">
                Ir para o painel
              </Link>
              <Link to="/" className="checkout-success-btn secondary">
                Voltar para Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
