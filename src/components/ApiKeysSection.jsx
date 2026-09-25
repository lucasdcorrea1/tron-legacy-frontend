import { useCallback, useEffect, useState } from 'react';
import { useToast } from './Toast';
import { apiKeys } from '../services/api';

const IconPlug = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 01-12 0V8zM12 18v4" />
  </svg>
);

function formatDate(value) {
  if (!value) return 'nunca';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Org API keys: let another system (e.g. an online store) upload images and
 * schedule Instagram posts through the X-Api-Key header.
 */
export default function ApiKeysSection() {
  const toast = useToast();
  const [keys, setKeys] = useState([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState('');

  const load = useCallback(async () => {
    try {
      setKeys((await apiKeys.list()) || []);
    } catch {
      // Members without owner/admin role cannot list keys: hide silently.
      setKeys(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await apiKeys.create(name.trim());
      setNewKey(res.key);
      setName('');
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao criar chave');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id) {
    try {
      await apiKeys.revoke(id);
      toast.success('Chave revogada');
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao revogar chave');
    }
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(newKey);
      toast.success('Chave copiada');
    } catch {
      toast.error('Nao foi possivel copiar; selecione e copie manualmente');
    }
  }

  if (keys === null) return null;

  return (
    <div className="igcfg-section">
      <div className="igcfg-section-header">
        <div className="igcfg-section-icon igcfg-section-icon--purple">
          <IconPlug />
        </div>
        <div>
          <h3 className="igcfg-section-title">Chaves de API (integracoes)</h3>
          <p className="igcfg-section-sub">
            Permite que outro sistema, como sua loja online, envie imagens e agende posts neste Instagram.
          </p>
        </div>
      </div>

      {newKey && (
        <div className="igcfg-info-box" style={{ borderColor: '#166534', background: 'rgba(34, 197, 94, 0.06)', marginBottom: 12 }}>
          <p style={{ color: '#4ade80', margin: '0 0 8px', fontWeight: 600 }}>
            Copie a chave agora: ela nao sera mostrada de novo.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input readOnly value={newKey} onFocus={(e) => e.target.select()} style={{ flex: 1, minWidth: 0, fontFamily: 'monospace' }} />
            <button type="button" className="igcfg-action-btn igcfg-action-btn--primary" onClick={copyKey}>Copiar</button>
            <button type="button" className="igcfg-action-btn" onClick={() => setNewKey('')}>Fechar</button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (ex.: Loja online)"
          maxLength={60}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="submit" className="igcfg-action-btn igcfg-action-btn--primary" disabled={creating || !name.trim()}>
          {creating ? 'Criando...' : 'Gerar chave'}
        </button>
      </form>

      {keys.length === 0 ? (
        <p style={{ color: '#71717a', fontSize: 13, margin: 0 }}>Nenhuma chave ativa.</p>
      ) : (
        <div className="igcfg-detail-grid">
          {keys.map((k) => (
            <div key={k.id} className="igcfg-detail-card">
              <span className="igcfg-detail-label">{k.name}</span>
              <span className="igcfg-detail-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>{k.prefix}…</span>
              <span style={{ color: '#71717a', fontSize: 12 }}>
                Criada {formatDate(k.created_at)} · Ultimo uso {formatDate(k.last_used_at)}
              </span>
              <button
                type="button"
                className="igcfg-action-btn"
                style={{ marginTop: 8, color: '#f87171' }}
                onClick={() => handleRevoke(k.id)}
              >
                Revogar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
