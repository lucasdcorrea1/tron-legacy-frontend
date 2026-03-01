import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Login.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  // If no token, show "forgot password" form
  if (!token) {
    return <ForgotPasswordForm />;
  }

  return <ResetPasswordForm token={token} navigate={navigate} />;
}

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    try {
      const data = await api.post('/api/v1/auth/forgot-password', { email: email.trim() });
      setStatus('success');
      setMessage(data.message || 'Verifique seu email para o link de recuperação.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Erro ao enviar email.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/login" className="login-back">&larr; Voltar ao login</Link>
        <h1>Whodo</h1>
        <p className="login-subtitle">Recuperar senha</p>

        {status === 'success' ? (
          <div className="login-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, display: 'inline', verticalAlign: 'middle', marginRight: 8 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {status === 'error' && <div className="login-error">{message}</div>}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="login-button" disabled={status === 'loading'}>
              {status === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function ResetPasswordForm({ token, navigate }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'loading') return;

    if (password.length < 6) {
      setStatus('error');
      setMessage('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('As senhas não coincidem');
      return;
    }

    setStatus('loading');
    try {
      const data = await api.post('/api/v1/auth/reset-password', {
        token,
        new_password: password,
      });
      setStatus('success');
      setMessage(data.message || 'Senha atualizada com sucesso!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Erro ao redefinir senha.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/login" className="login-back">&larr; Voltar ao login</Link>
        <h1>Whodo</h1>
        <p className="login-subtitle">Criar nova senha</p>

        {status === 'success' ? (
          <div className="login-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, display: 'inline', verticalAlign: 'middle', marginRight: 8 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {message}
            <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '0.75rem' }}>
              Redirecionando para o login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            {status === 'error' && <div className="login-error">{message}</div>}

            <div className="form-group">
              <label htmlFor="password">Nova senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar nova senha</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="login-button" disabled={status === 'loading'}>
              {status === 'loading' ? 'Atualizando...' : 'Redefinir senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
