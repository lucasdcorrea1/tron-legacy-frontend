import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { billing, platform } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import './Financeiro.css';

const PLAN_OPTIONS = ['free', 'starter', 'pro', 'enterprise'];
const PLAN_COLORS = { free: '#71717a', starter: '#3b82f6', pro: '#8b5cf6', enterprise: '#f59e0b' };

const EVENT_LABELS = {
  PAYMENT_CONFIRMED: 'Pagamento confirmado',
  PAYMENT_RECEIVED: 'Pagamento recebido',
  PAYMENT_CREATED: 'Pagamento criado',
  PAYMENT_OVERDUE: 'Pagamento vencido',
  PAYMENT_DELETED: 'Pagamento excluído',
  PAYMENT_REFUNDED: 'Pagamento estornado',
  SUBSCRIPTION_DELETED: 'Assinatura cancelada',
  SUBSCRIPTION_INACTIVATED: 'Assinatura inativada',
};

const RESULT_COLORS = {
  ok: '#22c55e',
  error: '#ef4444',
  duplicate: '#71717a',
  ignored: '#f59e0b',
};

export default function Financeiro() {
  const { profile } = useAuth();
  const isSuperuser = profile?.role === 'superuser' || profile?.role === 'superadmin';

  const [tab, setTab] = useState('subscriptions'); // subscriptions | webhooks
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  // Webhook state
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [webhookStats, setWebhookStats] = useState(null);
  const [whLoading, setWhLoading] = useState(true);
  const [whSearch, setWhSearch] = useState('');
  const [whFilterEvent, setWhFilterEvent] = useState('all');
  const [whFilterResult, setWhFilterResult] = useState('all');
  const [whPage, setWhPage] = useState(1);
  const [whTotal, setWhTotal] = useState(0);
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await billing.getBalance();
      setBalance(data.balance);
    } catch (err) {
      setError(err.message || 'Erro ao buscar saldo');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setSubsLoading(true);
    try {
      const data = await platform.listSubscriptions();
      setSubscriptions(data.subscriptions || []);
    } catch { /* ignore */ }
    finally { setSubsLoading(false); }
  }, []);

  const fetchWebhookLogs = useCallback(async () => {
    setWhLoading(true);
    try {
      const params = { page: whPage, limit: 30 };
      if (whFilterEvent !== 'all') params.event = whFilterEvent;
      if (whFilterResult !== 'all') params.result = whFilterResult;
      if (whSearch) params.search = whSearch;
      const data = await platform.webhookLogs(params);
      setWebhookLogs(data.logs || []);
      setWhTotal(data.total || 0);
    } catch { /* ignore */ }
    finally { setWhLoading(false); }
  }, [whPage, whFilterEvent, whFilterResult, whSearch]);

  const fetchWebhookStats = useCallback(async () => {
    try {
      const data = await platform.webhookStats();
      setWebhookStats(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isSuperuser) return;
    fetchBalance();
    fetchSubscriptions();
    fetchWebhookStats();
  }, [isSuperuser, fetchBalance, fetchSubscriptions, fetchWebhookStats]);

  useEffect(() => {
    if (!isSuperuser || tab !== 'webhooks') return;
    fetchWebhookLogs();
  }, [isSuperuser, tab, fetchWebhookLogs]);

  const handleChangePlan = async (orgId, newPlan) => {
    setActionLoading(orgId + '-plan');
    try {
      await platform.updatePlan(orgId, newPlan);
      setSubscriptions(prev => prev.map(s =>
        s.org_id === orgId ? { ...s, subscription: { ...s.subscription, plan_id: newPlan } } : s
      ));
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const handleToggleStatus = async (orgId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'canceled' : 'active';
    setActionLoading(orgId + '-status');
    try {
      await platform.updateSubscriptionStatus(orgId, newStatus);
      setSubscriptions(prev => prev.map(s => {
        if (s.org_id !== orgId) return s;
        const updatedSub = { ...s.subscription, status: newStatus };
        if (newStatus === 'canceled') updatedSub.plan_id = 'free';
        return { ...s, subscription: updatedSub };
      }));
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'nunca';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    const days = Math.floor(hrs / 24);
    return `${days}d atrás`;
  };

  if (!isSuperuser) {
    return (
      <AdminLayout>
        <div className="fin-page">
          <div className="fin-denied">Acesso restrito a Super Administradores.</div>
        </div>
      </AdminLayout>
    );
  }

  // Filter subscriptions
  const filtered = subscriptions.filter(s => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.org_name?.toLowerCase().includes(q) && !s.owner_email?.toLowerCase().includes(q) && !s.owner_name?.toLowerCase().includes(q)) return false;
    }
    if (filterPlan !== 'all' && s.subscription?.plan_id !== filterPlan) return false;
    if (filterStatus !== 'all' && s.subscription?.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.subscription?.status === 'active').length,
    byPlan: PLAN_OPTIONS.reduce((acc, p) => { acc[p] = subscriptions.filter(s => s.subscription?.plan_id === p).length; return acc; }, {}),
  };

  return (
    <AdminLayout>
      <div className="fin-page">
        <div className="fin-header">
          <h1>Financeiro</h1>
          <button className="fin-refresh" onClick={() => { fetchBalance(); fetchSubscriptions(); fetchWebhookStats(); if (tab === 'webhooks') fetchWebhookLogs(); }} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Atualizar
          </button>
        </div>

        {error && (
          <div className="fin-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        {/* Stats cards */}
        <div className="fin-cards">
          <div className="fin-card fin-card-balance">
            <div className="fin-card-label">Saldo em conta</div>
            {loading ? (
              <div className="fin-card-loading"><div className="fin-spinner" /></div>
            ) : (
              <div className={`fin-card-value ${balance < 0 ? 'negative' : ''}`}>
                {balance !== null ? formatCurrency(balance) : '--'}
              </div>
            )}
            <div className="fin-card-source">Asaas</div>
          </div>
          <div className="fin-card">
            <div className="fin-card-label">Empresas</div>
            <div className="fin-card-value" style={{ fontSize: '2rem', color: '#fafafa' }}>{stats.total}</div>
            <div className="fin-card-source">{stats.active} ativas</div>
          </div>
          <div className="fin-card">
            <div className="fin-card-label">Webhook</div>
            {webhookStats ? (
              <>
                <div className="fin-wh-health">
                  <span className={`fin-wh-dot ${webhookStats.errors > 0 ? 'warn' : 'ok'}`} />
                  <span style={{ color: '#fafafa', fontSize: '0.9rem', fontWeight: 600 }}>
                    {webhookStats.errors > 0 ? `${webhookStats.errors} erros` : 'Saudável'}
                  </span>
                </div>
                <div className="fin-card-source">
                  Último: {timeAgo(webhookStats.last_event_at)} | 24h: {webhookStats.last_24h} eventos
                </div>
              </>
            ) : (
              <div className="fin-card-loading"><div className="fin-spinner" /></div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="fin-tabs">
          <button className={`fin-tab ${tab === 'subscriptions' ? 'active' : ''}`} onClick={() => setTab('subscriptions')}>
            Assinaturas ({stats.total})
          </button>
          <button className={`fin-tab ${tab === 'webhooks' ? 'active' : ''}`} onClick={() => setTab('webhooks')}>
            Webhook Logs {webhookStats?.errors > 0 && <span className="fin-tab-badge">{webhookStats.errors}</span>}
          </button>
        </div>

        {/* ── Subscriptions Tab ────────────────────────────────── */}
        {tab === 'subscriptions' && (
          <div className="fin-subs-section">
            <div className="fin-subs-filters">
              <input type="text" className="fin-search" placeholder="Buscar empresa, email ou nome..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="fin-filter-select" value={filterPlan} onChange={e => setFilterPlan(e.target.value)}>
                <option value="all">Todos os planos</option>
                {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
              <select className="fin-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>

            {subsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}><div className="fin-spinner" style={{ margin: '0 auto' }} /></div>
            ) : filtered.length === 0 ? (
              <div className="fin-subs-empty">Nenhuma assinatura encontrada.</div>
            ) : (
              <div className="fin-subs-table-wrap">
                <table className="fin-subs-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Proprietário</th>
                      <th>Membros</th>
                      <th>Plano</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => {
                      const sub = s.subscription;
                      const planId = sub?.plan_id || 'free';
                      const status = sub?.status || 'active';
                      return (
                        <tr key={s.org_id}>
                          <td>
                            <div className="fin-org-name">{s.org_name}</div>
                            <div className="fin-org-slug">{s.org_slug}</div>
                          </td>
                          <td>
                            <div className="fin-owner-name">{s.owner_name}</div>
                            <div className="fin-owner-email">{s.owner_email}</div>
                          </td>
                          <td className="fin-center">{s.member_count}</td>
                          <td>
                            <select className="fin-plan-select" value={planId} onChange={e => handleChangePlan(s.org_id, e.target.value)} disabled={actionLoading === s.org_id + '-plan'} style={{ borderColor: PLAN_COLORS[planId] }}>
                              {PLAN_OPTIONS.map(p => (<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>))}
                            </select>
                          </td>
                          <td>
                            <span className={`fin-status-badge ${status}`}>
                              {status === 'active' ? 'Ativo' : status === 'pending' ? 'Pendente' : status === 'canceled' ? 'Cancelado' : status}
                            </span>
                          </td>
                          <td>
                            <button className={`fin-action-btn ${status === 'active' ? 'danger' : 'success'}`} onClick={() => handleToggleStatus(s.org_id, status)} disabled={actionLoading === s.org_id + '-status'}>
                              {actionLoading === s.org_id + '-status' ? '...' : status === 'active' ? 'Desativar' : 'Ativar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Webhook Logs Tab ─────────────────────────────────── */}
        {tab === 'webhooks' && (
          <div className="fin-subs-section">
            {/* Webhook stats mini-cards */}
            {webhookStats && (
              <div className="fin-wh-stats-row">
                <div className="fin-wh-stat"><span style={{ color: '#22c55e' }}>{webhookStats.ok}</span> OK</div>
                <div className="fin-wh-stat"><span style={{ color: '#ef4444' }}>{webhookStats.errors}</span> Erros</div>
                <div className="fin-wh-stat"><span style={{ color: '#71717a' }}>{webhookStats.duplicates}</span> Duplicados</div>
                <div className="fin-wh-stat"><span style={{ color: '#f59e0b' }}>{webhookStats.ignored}</span> Ignorados</div>
                <div className="fin-wh-stat"><span style={{ color: '#fafafa' }}>{webhookStats.total}</span> Total</div>
              </div>
            )}

            <div className="fin-subs-filters">
              <input type="text" className="fin-search" placeholder="Buscar por empresa, payment ID..." value={whSearch} onChange={e => { setWhSearch(e.target.value); setWhPage(1); }} />
              <select className="fin-filter-select" value={whFilterEvent} onChange={e => { setWhFilterEvent(e.target.value); setWhPage(1); }}>
                <option value="all">Todos os eventos</option>
                {Object.keys(EVENT_LABELS).map(e => <option key={e} value={e}>{EVENT_LABELS[e]}</option>)}
              </select>
              <select className="fin-filter-select" value={whFilterResult} onChange={e => { setWhFilterResult(e.target.value); setWhPage(1); }}>
                <option value="all">Todos os resultados</option>
                <option value="ok">OK</option>
                <option value="error">Erro</option>
                <option value="duplicate">Duplicado</option>
                <option value="ignored">Ignorado</option>
              </select>
            </div>

            {whLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}><div className="fin-spinner" style={{ margin: '0 auto' }} /></div>
            ) : webhookLogs.length === 0 ? (
              <div className="fin-subs-empty">Nenhum evento de webhook registrado.</div>
            ) : (
              <>
                <div className="fin-subs-table-wrap">
                  <table className="fin-subs-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Evento</th>
                        <th>Empresa</th>
                        <th>Valor</th>
                        <th>Resultado</th>
                        <th>Plano</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhookLogs.map(log => (
                        <>
                          <tr key={log.id} className={expandedLog === log.id ? 'fin-row-expanded' : ''}>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{formatDate(log.created_at)}</td>
                            <td>
                              <span className="fin-event-label">{EVENT_LABELS[log.event] || log.event}</span>
                            </td>
                            <td>
                              <div className="fin-org-name">{log.org_name || '-'}</div>
                            </td>
                            <td style={{ color: '#a1a1aa' }}>{log.value > 0 ? formatCurrency(log.value) : '-'}</td>
                            <td>
                              <span className="fin-wh-result" style={{ color: RESULT_COLORS[log.processing_result] || '#71717a' }}>
                                {log.processing_result}
                              </span>
                            </td>
                            <td>
                              {log.previous_plan && log.new_plan && log.previous_plan !== log.new_plan ? (
                                <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                                  {log.previous_plan} → {log.new_plan}
                                </span>
                              ) : log.previous_plan ? (
                                <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{log.previous_plan}</span>
                              ) : '-'}
                            </td>
                            <td>
                              <button className="fin-expand-btn" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                                {expandedLog === log.id ? '−' : '+'}
                              </button>
                            </td>
                          </tr>
                          {expandedLog === log.id && (
                            <tr key={log.id + '-detail'} className="fin-detail-row">
                              <td colSpan={7}>
                                <div className="fin-detail-grid">
                                  <div><strong>Payment ID:</strong> {log.payment_id || '-'}</div>
                                  <div><strong>Subscription ID:</strong> {log.subscription_id || '-'}</div>
                                  <div><strong>Customer ID:</strong> {log.customer_id || '-'}</div>
                                  <div><strong>Billing Type:</strong> {log.billing_type || '-'}</div>
                                  <div><strong>Payment Status:</strong> {log.payment_status || '-'}</div>
                                  {log.error_message && <div style={{ gridColumn: '1/-1', color: '#f87171' }}><strong>Erro:</strong> {log.error_message}</div>}
                                </div>
                                {log.raw_payload && (
                                  <details className="fin-raw-payload">
                                    <summary>Payload bruto</summary>
                                    <pre>{JSON.stringify(JSON.parse(typeof log.raw_payload === 'string' ? log.raw_payload : JSON.stringify(log.raw_payload)), null, 2)}</pre>
                                  </details>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {whTotal > 30 && (
                  <div className="fin-pagination">
                    <button disabled={whPage <= 1} onClick={() => setWhPage(p => p - 1)}>Anterior</button>
                    <span>Página {whPage} de {Math.ceil(whTotal / 30)}</span>
                    <button disabled={whPage >= Math.ceil(whTotal / 30)} onClick={() => setWhPage(p => p + 1)}>Próxima</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
