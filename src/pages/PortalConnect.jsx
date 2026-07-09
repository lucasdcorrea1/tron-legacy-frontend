import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portal } from '../services/api';

export default function PortalConnect() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loadingURL, setLoadingURL] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!portal.getToken()) {
      navigate('/portal/login', { replace: true });
      return;
    }
    portal.me()
      .then((s) => {
        setSession(s);
        if (s.has_conta_azul) navigate('/portal/dashboard', { replace: true });
      })
      .catch(() => navigate('/portal/login', { replace: true }));
  }, [navigate]);

  const handleConnect = async () => {
    setLoadingURL(true);
    setErr('');
    try {
      const { url } = await portal.contaAzulConnectURL();
      window.location.href = url;
    } catch (e) {
      setErr(e.message || 'Não foi possível gerar a URL de autorização');
      setLoadingURL(false);
    }
  };

  const handleLogout = async () => {
    await portal.logout();
    navigate('/portal/login', { replace: true });
  };

  if (!session) {
    return <div style={shell}><div style={{ color: '#fff' }}>Carregando…</div></div>;
  }

  return (
    <div style={shell}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <strong style={{ color: '#6b7280', fontSize: 13 }}>Olá, {session.name}</strong>
          <button onClick={handleLogout} style={linkBtn}>Sair</button>
        </div>

        <h1 style={{ marginTop: 8, marginBottom: 6 }}>Conecte sua Conta Azul</h1>
        <p style={{ color: '#6b7280', marginBottom: 28, marginTop: 0, lineHeight: 1.5 }}>
          Para acessar seu painel financeiro, autorize o acesso aos seus dados da Conta Azul.
          Você será redirecionado para o site oficial — nós nunca vemos sua senha.
        </p>

        {err && <div style={errBox}>{err}</div>}

        <button onClick={handleConnect} disabled={loadingURL} style={{ ...btn, opacity: loadingURL ? 0.6 : 1 }}>
          {loadingURL ? 'Gerando link seguro…' : 'Conectar minha Conta Azul'}
        </button>

        <ul style={infoList}>
          <li>🔐 OAuth 2.0 — você digita sua senha apenas no site da Conta Azul</li>
          <li>🗝️ Tokens encriptados em repouso (AES-256-GCM)</li>
          <li>↩️ Você pode revogar o acesso a qualquer momento</li>
        </ul>
      </div>
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
  background: '#fff', padding: 36, borderRadius: 16, width: 480, maxWidth: '100%',
  boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
};
const btn = {
  width: '100%', padding: '16px', borderRadius: 10, border: 'none',
  background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
};
const linkBtn = {
  background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};
const errBox = {
  background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 8,
  fontSize: 13, marginBottom: 12, border: '1px solid #fecaca',
};
const infoList = {
  marginTop: 28, paddingLeft: 0, listStyle: 'none', color: '#6b7280', fontSize: 13, lineHeight: 2,
};
