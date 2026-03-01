import { useState } from 'react';
import { api } from '../services/api';
import './NewsletterForm.css';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const data = await api.post('/api/v1/newsletter/subscribe', { email: email.trim() });
      setStatus('success');
      setMessage(data.message || 'Inscrição realizada com sucesso!');
      setEmail('');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Erro ao realizar inscrição. Tente novamente.');
    }
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-container">
        <div className="newsletter-text">
          <h3 className="newsletter-title">Receba novos artigos no seu email</h3>
          <p className="newsletter-description">
            Sem spam. Apenas conteúdo relevante sobre tecnologia.
          </p>
        </div>

        {status === 'success' ? (
          <div className="newsletter-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="newsletter-success-icon">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-form">
            <div className="newsletter-input-group">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="seu@email.com"
                required
                disabled={status === 'loading'}
                className="newsletter-input"
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="newsletter-btn"
              >
                {status === 'loading' ? 'Enviando...' : 'Inscrever-se'}
              </button>
            </div>
            {status === 'error' && (
              <p className="newsletter-error">{message}</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
