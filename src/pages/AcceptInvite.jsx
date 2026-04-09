import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../services/api';
import './Login.css';

export default function AcceptInvite() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Link de convite inválido.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/invitations/accept-token/${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const json = await res.json();
          setData(json);
          setStatus('success');
        } else {
          const text = await res.text();
          let msg;
          try {
            msg = JSON.parse(text).message;
          } catch {
            msg = text;
          }
          setErrorMsg(msg || 'Convite inválido ou expirado.');
          setStatus('error');
        }
      } catch {
        setErrorMsg('Erro de conexão. Tente novamente.');
        setStatus('error');
      }
    })();
  }, [token]);

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 440, textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          <span style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Whodo
          </span>
        </h1>

        {status === 'loading' && (
          <div style={{ padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#a1a1aa' }}>Processando convite...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ padding: '24px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28,
            }}>
              ✓
            </div>

            {data?.status === 'already_accepted' || data?.status === 'already_member' ? (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  Convite já aceito
                </h2>
                <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: 24 }}>
                  Você já faz parte de <strong style={{ color: '#fafafa' }}>{data.org_name}</strong>.
                </p>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                  Convite aceito!
                </h2>
                <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: 24 }}>
                  {data?.status === 'pre_accepted'
                    ? <>Você foi adicionado a <strong style={{ color: '#fafafa' }}>{data.org_name}</strong>. Cadastre-se ou faça login para acessar.</>
                    : <>Você agora faz parte de <strong style={{ color: '#fafafa' }}>{data.org_name}</strong>. Faça login para acessar.</>
                  }
                </p>
              </>
            )}

            <Link
              to="/login"
              style={{
                display: 'inline-block', padding: '12px 32px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#fff', fontWeight: 600, fontSize: 15,
                textDecoration: 'none', borderRadius: 10,
              }}
            >
              Fazer login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '24px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', fontSize: 28, color: '#ef4444',
            }}>
              ✕
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Convite indisponível
            </h2>
            <p style={{ color: '#a1a1aa', lineHeight: 1.6, marginBottom: 24 }}>
              {errorMsg}
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-block', padding: '12px 32px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fafafa', fontWeight: 600, fontSize: 15,
                textDecoration: 'none', borderRadius: 10,
              }}
            >
              Ir para login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
