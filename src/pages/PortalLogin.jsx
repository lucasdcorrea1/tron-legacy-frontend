import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portal } from '../services/api';

export default function PortalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (portal.getToken()) navigate('/portal/dashboard', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const auth = await portal.login(email, password);
      portal.saveSession(auth);
      if (auth.end_client?.has_conta_azul) {
        navigate('/portal/dashboard', { replace: true });
      } else {
        navigate('/portal/conectar', { replace: true });
      }
    } catch (e) {
      setErr(e.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={shell}>
      <form onSubmit={handleSubmit} style={card}>
        <h1 style={{ marginBottom: 4 }}>Portal do Cliente</h1>
        <p style={{ color: '#6b7280', marginBottom: 24, marginTop: 0 }}>
          Acesse seu painel financeiro Conta Azul
        </p>

        {err && <div style={errBox}>{err}</div>}

        <label style={lbl}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          style={input}
          placeholder="seu@email.com"
        />

        <label style={lbl}>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={input}
          placeholder="••••••••"
        />

        <button type="submit" disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

const shell = {
  minHeight: '100vh',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
  padding: 20,
};
const card = {
  background: '#fff', padding: 36, borderRadius: 16, width: 420, maxWidth: '100%',
  boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
};
const lbl = { display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, marginTop: 12, color: '#374151' };
const input = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #d1d5db',
  fontSize: 15, boxSizing: 'border-box',
};
const btn = {
  width: '100%', marginTop: 24, padding: '14px', borderRadius: 10, border: 'none',
  background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
};
const errBox = {
  background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 8,
  fontSize: 13, marginBottom: 12, border: '1px solid #fecaca',
};
