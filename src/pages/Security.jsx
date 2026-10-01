import { useState, useEffect, useCallback } from 'react';
import { security } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import './Security.css';

const SIGNAL_LABELS = {
  denied: 'Acessos negados',
  scraping: 'Varredura de rotas',
  velocity: 'Velocidade',
  credential_stuffing: 'Tentativa de contas',
};

const EVENT_LABELS = {
  rate_limited: 'Limite excedido',
  blocked: 'Bloqueado',
  auto_blocked: 'Bloqueio automático',
  manual_block: 'Bloqueio manual',
  manual_unblock: 'Desbloqueio',
  login_failed: 'Login falhou',
  login_ok: 'Login ok',
};

const WINDOWS = [
  { label: '24h', value: 24 },
  { label: '7 dias', value: 168 },
  { label: '30 dias', value: 720 },
];

function scoreColor(score) {
  if (score >= 70) return '#ef4444';
  if (score >= 50) return '#f59e0b';
  return '#eab308';
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Security() {
  const [overview, setOverview] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [logs, setLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyMsg, setPolicyMsg] = useState('');
  const [newBlockIP, setNewBlockIP] = useState('');
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [logMethod, setLogMethod] = useState('');
  const [logPath, setLogPath] = useState('');
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    try {
      const data = await security.overview(hours);
      setOverview(data);
      setBlocks(data.recent_blocks || []);
      if (!policy) setPolicy(data.policy);
    } catch (err) {
      setError('Não foi possível carregar os dados de segurança. Confira se você é super admin.');
    } finally {
      setLoading(false);
    }
  }, [hours, policy]);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const loadLogs = useCallback(async () => {
    try {
      const data = await security.accessLogs({
        errors: onlyErrors || undefined,
        method: logMethod || undefined,
        path: logPath || undefined,
        limit: 200,
      });
      setLogs(data.logs || []);
    } catch { /* ignore */ }
  }, [onlyErrors, logMethod, logPath]);

  const loadEvents = useCallback(async () => {
    try {
      const data = await security.events({ limit: 150 });
      setEvents(data.events || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (tab === 'logs') loadLogs();
    if (tab === 'events') loadEvents();
  }, [tab, loadLogs, loadEvents]);

  const handleBlock = async (ip) => {
    if (!ip) return;
    try {
      await security.createBlock({ ip, reason: 'Bloqueio manual pelo painel', minutes: 0 });
      setNewBlockIP('');
      await loadOverview();
      const data = await security.listBlocks();
      setBlocks(data.blocks || []);
    } catch (err) {
      alert(err?.message || 'Falha ao bloquear IP');
    }
  };

  const handleUnblock = async (ip) => {
    try {
      await security.deleteBlock(ip);
      await loadOverview();
      const data = await security.listBlocks();
      setBlocks(data.blocks || []);
    } catch (err) {
      alert(err?.message || 'Falha ao desbloquear');
    }
  };

  const savePolicy = async () => {
    setSavingPolicy(true);
    setPolicyMsg('');
    try {
      const payload = {
        ...policy,
        allowlist: typeof policy.allowlist === 'string'
          ? policy.allowlist.split(/[\s,]+/).filter(Boolean)
          : (policy.allowlist || []),
      };
      const saved = await security.updatePolicy(payload);
      setPolicy(saved);
      setPolicyMsg('Política salva. Vale em alguns segundos.');
    } catch (err) {
      setPolicyMsg(err?.message || 'Falha ao salvar política.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const setP = (key, value) => setPolicy((p) => ({ ...p, [key]: value }));

  if (loading) {
    return (
      <AdminLayout>
        <div className="sec-loading">Carregando segurança…</div>
      </AdminLayout>
    );
  }

  const allowlistValue = Array.isArray(policy?.allowlist) ? policy.allowlist.join(', ') : (policy?.allowlist || '');

  return (
    <AdminLayout>
      <div className="sec-page">
        <div className="sec-header">
          <div>
            <h1>Segurança</h1>
            <p className="sec-sub">Proteção contra abuso e visibilidade de tráfego. Visível só para super admin.</p>
          </div>
          <div className="sec-window">
            {WINDOWS.map((w) => (
              <button
                key={w.value}
                className={hours === w.value ? 'active' : ''}
                onClick={() => setHours(w.value)}
              >{w.label}</button>
            ))}
          </div>
        </div>

        {error && <div className="sec-error">{error}</div>}

        <div className="sec-tabs">
          {['overview', 'blocks', 'policy', 'logs', 'events'].map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {{ overview: 'Visão geral', blocks: 'Bloqueios', policy: 'Proteção', logs: 'Acessos', events: 'Eventos' }[t]}
            </button>
          ))}
        </div>

        {tab === 'overview' && overview && (
          <>
            <div className="sec-stats">
              <div className="sec-stat"><span className="sec-stat-num">{overview.total_requests?.toLocaleString('pt-BR')}</span><span className="sec-stat-label">Requisições</span></div>
              <div className="sec-stat"><span className="sec-stat-num">{overview.unique_ips?.toLocaleString('pt-BR')}</span><span className="sec-stat-label">IPs únicos</span></div>
              <div className="sec-stat"><span className="sec-stat-num">{overview.rate_limited?.toLocaleString('pt-BR')}</span><span className="sec-stat-label">Limites excedidos</span></div>
              <div className="sec-stat"><span className="sec-stat-num">{overview.active_blocks?.toLocaleString('pt-BR')}</span><span className="sec-stat-label">IPs bloqueados</span></div>
            </div>

            <div className="sec-card">
              <h2>Clientes de risco</h2>
              <p className="sec-card-sub">IPs pontuados de 0 a 100 pelo comportamento recente. É recomendação — nada é bloqueado sozinho por aqui.</p>
              {(!overview.risk_clients || overview.risk_clients.length === 0) ? (
                <div className="sec-empty">Nenhum cliente de risco na janela. 👌</div>
              ) : (
                <table className="sec-table">
                  <thead><tr><th>IP</th><th>Score</th><th>Requisições</th><th>Sinais</th><th></th></tr></thead>
                  <tbody>
                    {overview.risk_clients.map((c) => (
                      <tr key={c.ip}>
                        <td className="sec-mono">{c.ip}</td>
                        <td><span className="sec-score" style={{ background: scoreColor(c.score) }}>{c.score}</span></td>
                        <td>{c.requests?.toLocaleString('pt-BR')}</td>
                        <td>
                          {(c.signals || []).map((s) => (
                            <span key={s.code} className="sec-signal">{SIGNAL_LABELS[s.code] || s.code}: {s.value}</span>
                          ))}
                        </td>
                        <td>
                          {c.blocked
                            ? <span className="sec-badge-blocked">Bloqueado</span>
                            : <button className="sec-btn-danger" onClick={() => handleBlock(c.ip)}>Bloquear</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {tab === 'blocks' && (
          <div className="sec-card">
            <h2>Bloqueios de IP</h2>
            <div className="sec-block-add">
              <input
                type="text"
                placeholder="Ex.: 203.0.113.45"
                value={newBlockIP}
                onChange={(e) => setNewBlockIP(e.target.value)}
              />
              <button className="sec-btn-danger" onClick={() => handleBlock(newBlockIP.trim())}>Bloquear IP</button>
            </div>
            {blocks.length === 0 ? (
              <div className="sec-empty">Nenhum IP bloqueado.</div>
            ) : (
              <table className="sec-table">
                <thead><tr><th>IP</th><th>Origem</th><th>Motivo</th><th>Expira</th><th></th></tr></thead>
                <tbody>
                  {blocks.map((b) => (
                    <tr key={b.value}>
                      <td className="sec-mono">{b.value}</td>
                      <td>{b.auto ? 'Automático' : 'Manual'}</td>
                      <td>{b.reason || '—'}</td>
                      <td>{b.expires_at && !b.expires_at.startsWith('0001') ? formatDate(b.expires_at) : 'Permanente'}</td>
                      <td><button className="sec-btn-ghost" onClick={() => handleUnblock(b.value)}>Desbloquear</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'policy' && policy && (
          <div className="sec-card">
            <h2>Proteção</h2>
            <p className="sec-card-sub">Limites por IP e bloqueio automático de reincidentes. Zero desliga a regra. Vale sem reiniciar.</p>
            <div className="sec-form">
              <label>
                <span>Requisições por minuto (API toda)</span>
                <input type="number" min="0" value={policy.global_per_min} onChange={(e) => setP('global_per_min', parseInt(e.target.value || '0', 10))} />
              </label>
              <label>
                <span>Tentativas de login por 15 min</span>
                <input type="number" min="0" value={policy.auth_per_15min} onChange={(e) => setP('auth_per_15min', parseInt(e.target.value || '0', 10))} />
              </label>
              <label className="sec-check">
                <input type="checkbox" checked={!!policy.auto_block_enabled} onChange={(e) => setP('auto_block_enabled', e.target.checked)} />
                <span>Bloquear automaticamente reincidentes</span>
              </label>
              <label>
                <span>Violações até bloquear</span>
                <input type="number" min="1" value={policy.auto_block_hits} onChange={(e) => setP('auto_block_hits', parseInt(e.target.value || '1', 10))} />
              </label>
              <label>
                <span>Duração do bloqueio (min)</span>
                <input type="number" min="1" value={policy.auto_block_minutes} onChange={(e) => setP('auto_block_minutes', parseInt(e.target.value || '1', 10))} />
              </label>
              <label className="sec-full">
                <span>Lista de confiança (IPs nunca limitados/bloqueados — separe por vírgula)</span>
                <input type="text" value={allowlistValue} onChange={(e) => setP('allowlist', e.target.value)} placeholder="Ex.: 200.100.50.1, 203.0.113.9" />
              </label>
            </div>
            <div className="sec-form-actions">
              <button className="sec-btn-primary" disabled={savingPolicy} onClick={savePolicy}>{savingPolicy ? 'Salvando…' : 'Salvar proteção'}</button>
              {policyMsg && <span className="sec-msg">{policyMsg}</span>}
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="sec-card">
            <div className="sec-card-head">
              <h2>Acessos recentes</h2>
              <label className="sec-check sec-inline">
                <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} />
                <span>Só erros (4xx/5xx)</span>
              </label>
            </div>
            <div className="sec-log-filters">
              <select value={logMethod} onChange={(e) => setLogMethod(e.target.value)}>
                <option value="">Todos os métodos</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                placeholder="Filtrar por rota (ex.: /blog/posts)"
                value={logPath}
                onChange={(e) => setLogPath(e.target.value)}
              />
              <button
                className="sec-btn-ghost"
                onClick={() => { setLogMethod('POST'); setLogPath('/blog/posts'); }}
              >Ver criação de posts</button>
              {(logMethod || logPath) && (
                <button className="sec-btn-ghost" onClick={() => { setLogMethod(''); setLogPath(''); }}>Limpar</button>
              )}
            </div>
            <p className="sec-card-sub">Dica: filtre <code>POST</code> + <code>/blog/posts</code> para ver quem está publicando — a coluna Conta mostra a organização que fez a requisição.</p>
            {logs.length === 0 ? (
              <div className="sec-empty">Sem registros para esse filtro.</div>
            ) : (
              <table className="sec-table">
                <thead><tr><th>Quando</th><th>IP</th><th>Método</th><th>Rota</th><th>Conta (org)</th><th>Status</th><th>ms</th></tr></thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={i}>
                      <td>{formatDate(l.created_at)}</td>
                      <td className="sec-mono">{l.ip}</td>
                      <td>{l.method}</td>
                      <td className="sec-path">{l.path}</td>
                      <td className="sec-mono">{l.org_id ? l.org_id.slice(-6) : '—'}</td>
                      <td><span className={`sec-status s${Math.floor(l.status / 100)}`}>{l.status}</span></td>
                      <td>{l.duration_ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'events' && (
          <div className="sec-card">
            <h2>Eventos de segurança</h2>
            {events.length === 0 ? (
              <div className="sec-empty">Sem eventos.</div>
            ) : (
              <table className="sec-table">
                <thead><tr><th>Quando</th><th>Tipo</th><th>IP</th><th>Detalhe</th></tr></thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={i}>
                      <td>{formatDate(e.created_at)}</td>
                      <td><span className="sec-signal">{EVENT_LABELS[e.type] || e.type}</span></td>
                      <td className="sec-mono">{e.ip}</td>
                      <td>{e.detail || e.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
