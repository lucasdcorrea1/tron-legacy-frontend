import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { portal } from '../services/api';

export default function PortalConnectCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState('processing'); // processing | error | success
  const [err, setErr] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const oauthErr = params.get('error');

    if (oauthErr) {
      setStatus('error');
      setErr(params.get('error_description') || oauthErr);
      return;
    }
    if (!code || !state) {
      setStatus('error');
      setErr('Resposta inválida da Conta Azul (faltam code/state).');
      return;
    }
    if (!portal.getToken()) {
      navigate('/portal/login', { replace: true });
      return;
    }

    portal.contaAzulCallback(code, state)
      .then(() => {
        setStatus('success');
        setTimeout(() => navigate('/portal/dashboard', { replace: true }), 1200);
      })
      .catch((e) => {
        setStatus('error');
        setErr(e.message || 'Falha ao concluir a conexão');
      });
  }, [params, navigate]);

  return (
    <div style={shell}>
      <div style={card}>
        {status === 'processing' && (
          <>
            <div style={spinner} />
            <h2 style={{ marginTop: 16 }}>Finalizando conexão…</h2>
            <p style={muted}>Trocando o código de autorização por tokens seguros.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={check}>✓</div>
            <h2 style={{ marginTop: 16 }}>Conta Azul conectada!</h2>
            <p style={muted}>Redirecionando para o painel…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={cross}>✗</div>
            <h2 style={{ marginTop: 16, color: '#b91c1c' }}>Falha na conexão</h2>
            <p style={muted}>{err}</p>
            <button onClick={() => navigate('/portal/conectar', { replace: true })} style={btn}>
              Tentar novamente
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const shell = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: 20,
};
const card = {
  background: '#fff', padding: 36, borderRadius: 16, width: 420, maxWidth: '100%',
  textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
};
const muted = { color: '#6b7280', marginTop: 4 };
const btn = {
  marginTop: 20, padding: '12px 22px', borderRadius: 10, border: 'none',
  background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer',
};
const spinner = {
  margin: '0 auto', width: 48, height: 48, borderRadius: '50%',
  border: '4px solid #e5e7eb', borderTopColor: '#2563eb',
  animation: 'portal-spin 0.8s linear infinite',
};
const check = {
  margin: '0 auto', width: 56, height: 56, borderRadius: '50%',
  background: '#10b981', color: '#fff', fontSize: 32, lineHeight: '56px', fontWeight: 800,
};
const cross = {
  margin: '0 auto', width: 56, height: 56, borderRadius: '50%',
  background: '#ef4444', color: '#fff', fontSize: 32, lineHeight: '56px', fontWeight: 800,
};

// Spinner keyframes (injected once)
if (typeof document !== 'undefined' && !document.getElementById('portal-spin-kf')) {
  const s = document.createElement('style');
  s.id = 'portal-spin-kf';
  s.textContent = '@keyframes portal-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}
