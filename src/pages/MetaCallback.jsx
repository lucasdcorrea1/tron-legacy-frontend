import { useEffect, useState } from 'react';
import { metaOAuth } from '../services/api';

export default function MetaCallback() {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state'); // org_id
    const errorParam = params.get('error');

    if (errorParam) {
      setStatus('error');
      setError(params.get('error_description') || 'Autorizacao negada');
      notifyParent({ success: false, error: 'Autorizacao negada' });
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setError('Parametros invalidos');
      notifyParent({ success: false, error: 'Parametros invalidos' });
      return;
    }

    metaOAuth.exchangeCode(code, state)
      .then((data) => {
        setStatus('success');
        notifyParent({ success: true, ...data });
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message || 'Erro ao conectar');
        notifyParent({ success: false, error: err.message });
      });
  }, []);

  function notifyParent(data) {
    if (window.opener) {
      window.opener.postMessage({ type: 'META_OAUTH_RESULT', ...data }, '*');
      setTimeout(() => window.close(), 1500);
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#e4e4e7',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
        {status === 'processing' && (
          <>
            <div style={{
              width: 40, height: 40, margin: '0 auto 16px',
              border: '3px solid #27272a', borderTopColor: '#a78bfa',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p>Conectando com Facebook...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#10003;</div>
            <p style={{ color: '#4ade80' }}>Conectado com sucesso!</p>
            <p style={{ color: '#71717a', fontSize: 14 }}>Esta janela vai fechar automaticamente...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#10007;</div>
            <p style={{ color: '#f87171' }}>Falha na conexao</p>
            <p style={{ color: '#71717a', fontSize: 14 }}>{error}</p>
            <button
              onClick={() => window.close()}
              style={{
                marginTop: 16, padding: '8px 24px',
                background: '#27272a', color: '#e4e4e7',
                border: '1px solid #3f3f46', borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
