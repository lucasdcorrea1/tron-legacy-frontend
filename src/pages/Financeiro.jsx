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
  PAYMENT_UPDATED: 'Pagamento atualizado',
  SUBSCRIPTION_CREATED: 'Assinatura criada',
  SUBSCRIPTION_UPDATED: 'Assinatura atualizada',
  SUBSCRIPTION_DELETED: 'Assinatura cancelada',
  SUBSCRIPTION_INACTIVATED: 'Assinatura inativada',
  AUTO_DOWNGRADE: 'Rebaixamento automático',
};

const RESULT_COLORS = {
  ok: '#22c55e',
  error: '#ef4444',
  duplicate: '#71717a',
  ignored: '#f59e0b',
};

const STATUS_LABELS = {
  active: 'Ativo',
  pending: 'Pendente',
  past_due: 'Inadimplente',
  canceled: 'Cancelado',
};

export default function Financeiro() {
  const { profile } = useAuth();
  const isSuperuser = profile?.role === 'superuser' || profile?.role === 'superadmin';

  const [tab, setTab] = useState('subscriptions');
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

  // Overdue state
  const [overdueData, setOverdueData] = useState(null);
  const [overdueLoading, setOverdueLoading] = useState(true);
  const [graceInput, setGraceInput] = useState({});
  const [expandedPayments, setExpandedPayments] = useState({});
  const [orgPayments, setOrgPayments] = useState({});

  // Revenue state
  const [revenueMetrics, setRevenueMetrics] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [triggeringJob, setTriggeringJob] = useState(null);

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

  // ── Fetch functions ──────────────────────────────────────────

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

  const fetchOverdue = useCallback(async () => {
    setOverdueLoading(true);
    try {
      const data = await platform.overdueSubscriptions();
      setOverdueData(data);
    } catch { /* ignore */ }
    finally { setOverdueLoading(false); }
  }, []);

  const fetchRevenue = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const data = await platform.revenueMetrics();
      setRevenueMetrics(data);
    } catch { /* ignore */ }
    finally { setRevenueLoading(false); }
  }, []);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const data = await platform.listJobs();
      setJobs(data.jobs || []);
    } catch { /* ignore */ }
    finally { setJobsLoading(false); }
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

  // ── Effects ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isSuperuser) return;
    fetchBalance();
    fetchSubscriptions();
    fetchWebhookStats();
    fetchRevenue();
  }, [isSuperuser, fetchBalance, fetchSubscriptions, fetchWebhookStats, fetchRevenue]);

  useEffect(() => {
    if (!isSuperuser) return;
    if (tab === 'webhooks') fetchWebhookLogs();
    if (tab === 'overdue') fetchOverdue();
    if (tab === 'jobs') fetchJobs();
  }, [isSuperuser, tab, fetchWebhookLogs, fetchOverdue, fetchJobs]);

  // ── Handlers ─────────────────────────────────────────────────

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

  const handleTriggerJob = async (jobId) => {
    setTriggeringJob(jobId);
    try {
      await platform.triggerJob(jobId);
      // Poll for updated status after a short delay
      setTimeout(() => fetchJobs(), 1500);
    } catch { /* ignore */ }
    finally { setTriggeringJob(null); }
  };

  const handleExtendGrace = async (orgId) => {
    const days = parseInt(graceInput[orgId]);
    if (!days || days < 1) return;
    setActionLoading(orgId + '-grace');
    try {
      await platform.extendGracePeriod(orgId, days);
      await fetchOverdue();
      setGraceInput(prev => ({ ...prev, [orgId]: '' }));
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const handleSyncOrg = async (orgId) => {
    setActionLoading(orgId + '-sync');
    try {
      await platform.syncOrgBilling(orgId);
      await fetchOverdue();
      await fetchSubscriptions();
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  const handleTogglePayments = async (orgId) => {
    if (expandedPayments[orgId]) {
      setExpandedPayments(prev => ({ ...prev, [orgId]: false }));
      return;
    }
    setActionLoading(orgId + '-payments');
    try {
      const data = await platform.getOrgPayments(orgId);
      setOrgPayments(prev => ({ ...prev, [orgId]: data.payments || [] }));
      setExpandedPayments(prev => ({ ...prev, [orgId]: true }));
    } catch { /* ignore */ }
    finally { setActionLoading(null); }
  };

  // ── Formatters ───────────────────────────────────────────────

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (d.getFullYear() < 2000) return '-';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
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

  const refreshAll = () => {
    fetchBalance();
    fetchSubscriptions();
    fetchWebhookStats();
    fetchRevenue();
    if (tab === 'webhooks') fetchWebhookLogs();
    if (tab === 'overdue') fetchOverdue();
    if (tab === 'jobs') fetchJobs();
  };

  // ── Access check ─────────────────────────────────────────────

  if (!isSuperuser) {
    return (
      <AdminLayout>
        <div className="fin-page">
          <div className="fin-denied">Acesso restrito a Super Administradores.</div>
        </div>
      </AdminLayout>
    );
  }

  // ── Derived data ─────────────────────────────────────────────

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
    active: subscriptions.filter(s => s.subscription?.status === 'active' && s.subscription?.plan_id !== 'free').length,
    overdueCount: overdueData?.total || subscriptions.filter(s => s.subscription?.status === 'past_due').length,
  };

  // ── Render ───────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="fin-page">
        <div className="fin-header">
          <h1>Financeiro</h1>
          <button className="fin-refresh" onClick={refreshAll} disabled={loading}>
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

          <div className="fin-card fin-card-mrr">
            <div className="fin-card-label">MRR</div>
            {revenueMetrics ? (
              <>
                <div className="fin-card-value" style={{ color: '#3b82f6' }}>
                  {formatCurrency(revenueMetrics.mrr || 0)}
                </div>
                <div className="fin-card-source">{revenueMetrics.active_paid || 0} assinantes pagos</div>
              </>
            ) : (
              <div className="fin-card-loading"><div className="fin-spinner" /></div>
            )}
          </div>

          <div className={`fin-card ${stats.overdueCount > 0 ? 'fin-card-danger' : ''}`}>
            <div className="fin-card-label">Inadimplentes</div>
            <div className="fin-card-value" style={{ color: stats.overdueCount > 0 ? '#ef4444' : '#22c55e', fontSize: '2rem' }}>
              {stats.overdueCount}
            </div>
            <div className="fin-card-source">
              {overdueData?.imminent_count > 0 ? `${overdueData.imminent_count} rebaixamento(s) iminente(s)` : 'Nenhum rebaixamento iminente'}
            </div>
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
            Assinaturas ({subscriptions.length})
          </button>
          <button className={`fin-tab ${tab === 'overdue' ? 'active' : ''}`} onClick={() => setTab('overdue')}>
            Inadimplentes
            {stats.overdueCount > 0 && <span className="fin-tab-badge fin-tab-badge-danger">{stats.overdueCount}</span>}
          </button>
          <button className={`fin-tab ${tab === 'revenue' ? 'active' : ''}`} onClick={() => setTab('revenue')}>
            Receita
          </button>
          <button className={`fin-tab ${tab === 'webhooks' ? 'active' : ''}`} onClick={() => setTab('webhooks')}>
            Webhook Logs {webhookStats?.errors > 0 && <span className="fin-tab-badge">{webhookStats.errors}</span>}
          </button>
          <button className={`fin-tab ${tab === 'jobs' ? 'active' : ''}`} onClick={() => setTab('jobs')}>
            Jobs
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
                <option value="past_due">Inadimplente</option>
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
                      <th>Ciclo</th>
                      <th>Próx. cobrança</th>
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
                          <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>
                            {sub?.billing_cycle === 'yearly' ? 'Anual' : sub?.billing_cycle === 'monthly' ? 'Mensal' : '-'}
                          </td>
                          <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {formatShortDate(sub?.next_due_date)}
                          </td>
                          <td>
                            <span className={`fin-status-badge ${status}`}>
                              {STATUS_LABELS[status] || status}
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

        {/* ── Overdue Tab ──────────────────────────────────────── */}
        {tab === 'overdue' && (
          <div className="fin-subs-section">
            {overdueLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}><div className="fin-spinner" style={{ margin: '0 auto' }} /></div>
            ) : !overdueData || overdueData.total === 0 ? (
              <div className="fin-overdue-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" width="40" height="40"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <p>Nenhuma assinatura inadimplente. Tudo em dia!</p>
              </div>
            ) : (
              <>
                {overdueData.imminent_count > 0 && (
                  <div className="fin-overdue-alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    <span>
                      <strong>{overdueData.total}</strong> assinatura(s) inadimplente(s) &mdash;{' '}
                      <strong>{overdueData.imminent_count}</strong> será(ão) rebaixada(s) nas próximas 24h
                    </span>
                  </div>
                )}

                <div className="fin-subs-table-wrap">
                  <table className="fin-subs-table">
                    <thead>
                      <tr>
                        <th>Empresa</th>
                        <th>Proprietário</th>
                        <th>Plano</th>
                        <th>Dias inadimplente</th>
                        <th>Graça restante</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueData.overdue.map(item => (
                        <>
                          <tr key={item.org_id} className={item.grace_days_left <= 1 ? 'fin-row-urgent' : ''}>
                            <td>
                              <div className="fin-org-name">{item.org_name}</div>
                            </td>
                            <td>
                              <div className="fin-owner-name">{item.owner_name}</div>
                              <div className="fin-owner-email">{item.owner_email}</div>
                            </td>
                            <td>
                              <span style={{ color: PLAN_COLORS[item.plan_id], fontWeight: 600, fontSize: '0.85rem' }}>
                                {item.plan_id?.charAt(0).toUpperCase() + item.plan_id?.slice(1)}
                              </span>
                            </td>
                            <td className="fin-center">
                              <span className="fin-overdue-days">{item.days_overdue}d</span>
                            </td>
                            <td className="fin-center">
                              <span className={`fin-grace-left ${item.grace_days_left <= 1 ? 'urgent' : item.grace_days_left <= 2 ? 'warning' : ''}`}>
                                {item.grace_days_left}d
                              </span>
                            </td>
                            <td>
                              <div className="fin-overdue-actions">
                                <div className="fin-grace-extend">
                                  <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    placeholder="dias"
                                    className="fin-grace-input"
                                    value={graceInput[item.org_id] || ''}
                                    onChange={e => setGraceInput(prev => ({ ...prev, [item.org_id]: e.target.value }))}
                                  />
                                  <button
                                    className="fin-action-btn success"
                                    onClick={() => handleExtendGrace(item.org_id)}
                                    disabled={actionLoading === item.org_id + '-grace' || !graceInput[item.org_id]}
                                    title="Estender período de graça"
                                  >
                                    {actionLoading === item.org_id + '-grace' ? '...' : 'Estender'}
                                  </button>
                                </div>
                                <button
                                  className="fin-action-btn sync"
                                  onClick={() => handleSyncOrg(item.org_id)}
                                  disabled={actionLoading === item.org_id + '-sync'}
                                  title="Sincronizar com Asaas"
                                >
                                  {actionLoading === item.org_id + '-sync' ? '...' : 'Sync'}
                                </button>
                                <button
                                  className="fin-action-btn neutral"
                                  onClick={() => handleTogglePayments(item.org_id)}
                                  disabled={actionLoading === item.org_id + '-payments'}
                                  title="Ver histórico de pagamentos"
                                >
                                  {actionLoading === item.org_id + '-payments' ? '...' : expandedPayments[item.org_id] ? 'Ocultar' : 'Pagamentos'}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedPayments[item.org_id] && orgPayments[item.org_id] && (
                            <tr key={item.org_id + '-payments'} className="fin-detail-row">
                              <td colSpan={6}>
                                <div className="fin-payments-list">
                                  <strong style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>Histórico de pagamentos (Asaas)</strong>
                                  {orgPayments[item.org_id].length === 0 ? (
                                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>Nenhum pagamento encontrado.</p>
                                  ) : (
                                    <table className="fin-payments-table">
                                      <thead>
                                        <tr>
                                          <th>ID</th>
                                          <th>Status</th>
                                          <th>Valor</th>
                                          <th>Método</th>
                                          <th>Link</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {orgPayments[item.org_id].map(p => (
                                          <tr key={p.id}>
                                            <td style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)' }}>{p.id}</td>
                                            <td>
                                              <span className={`fin-payment-status ${p.status?.toLowerCase()}`}>{p.status}</span>
                                            </td>
                                            <td>{formatCurrency(p.value)}</td>
                                            <td style={{ fontSize: '0.78rem' }}>{p.billingType}</td>
                                            <td>
                                              {p.invoiceUrl ? (
                                                <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer" className="fin-payment-link">Fatura</a>
                                              ) : '-'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Revenue Tab ──────────────────────────────────────── */}
        {tab === 'revenue' && (
          <div className="fin-subs-section">
            {revenueLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}><div className="fin-spinner" style={{ margin: '0 auto' }} /></div>
            ) : !revenueMetrics ? (
              <div className="fin-subs-empty">Erro ao carregar métricas de receita.</div>
            ) : (
              <>
                <div className="fin-revenue-grid">
                  <div className="fin-metric-card">
                    <div className="fin-metric-label">MRR</div>
                    <div className="fin-metric-value" style={{ color: '#3b82f6' }}>{formatCurrency(revenueMetrics.mrr)}</div>
                    <div className="fin-metric-sub">Receita mensal recorrente</div>
                  </div>
                  <div className="fin-metric-card">
                    <div className="fin-metric-label">ARR</div>
                    <div className="fin-metric-value" style={{ color: '#8b5cf6' }}>{formatCurrency(revenueMetrics.arr)}</div>
                    <div className="fin-metric-sub">Receita anual recorrente</div>
                  </div>
                  <div className="fin-metric-card">
                    <div className="fin-metric-label">Assinantes pagos</div>
                    <div className="fin-metric-value" style={{ color: '#22c55e' }}>{revenueMetrics.active_paid}</div>
                    <div className="fin-metric-sub">Planos ativos (excl. free)</div>
                  </div>
                  <div className="fin-metric-card">
                    <div className="fin-metric-label">Taxa de churn</div>
                    <div className="fin-metric-value" style={{ color: revenueMetrics.churn_rate > 5 ? '#ef4444' : '#f59e0b' }}>
                      {revenueMetrics.churn_rate}%
                    </div>
                    <div className="fin-metric-sub">{revenueMetrics.churn_last_30d} cancelamento(s) nos últimos 30 dias</div>
                  </div>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--admin-text-heading)', margin: '2rem 0 1rem' }}>
                  Receita por plano
                </h3>
                <div className="fin-subs-table-wrap">
                  <table className="fin-subs-table">
                    <thead>
                      <tr>
                        <th>Plano</th>
                        <th>Assinantes</th>
                        <th>Receita mensal</th>
                        <th>% do MRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['starter', 'pro', 'enterprise'].map(plan => {
                        const data = revenueMetrics.by_plan?.[plan];
                        const count = data?.count || data?.Count || 0;
                        const revenue = data?.revenue || data?.Revenue || 0;
                        const pct = revenueMetrics.mrr > 0 ? ((revenue / revenueMetrics.mrr) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={plan}>
                            <td>
                              <span style={{ color: PLAN_COLORS[plan], fontWeight: 600 }}>
                                {plan.charAt(0).toUpperCase() + plan.slice(1)}
                              </span>
                            </td>
                            <td className="fin-center">{count}</td>
                            <td>{formatCurrency(revenue)}</td>
                            <td>
                              <div className="fin-pct-bar">
                                <div className="fin-pct-fill" style={{ width: `${pct}%`, backgroundColor: PLAN_COLORS[plan] }} />
                                <span>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="fin-wh-stat">
                    <span style={{ color: '#ef4444' }}>{revenueMetrics.overdue_count}</span> Inadimplentes
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Webhook Logs Tab ─────────────────────────────────── */}
        {tab === 'webhooks' && (
          <div className="fin-subs-section">
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
                              <span className={`fin-event-label ${log.event === 'AUTO_DOWNGRADE' ? 'fin-event-downgrade' : ''}`}>
                                {EVENT_LABELS[log.event] || log.event}
                              </span>
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

        {/* ── Jobs Tab ─────────────────────────────────────────── */}
        {tab === 'jobs' && (
          <div className="fin-subs-section">
            {jobsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}><div className="fin-spinner" style={{ margin: '0 auto' }} /></div>
            ) : jobs.length === 0 ? (
              <div className="fin-subs-empty">Nenhum job registrado.</div>
            ) : (
              <div className="fin-subs-table-wrap">
                <table className="fin-subs-table">
                  <thead>
                    <tr>
                      <th>Serviço</th>
                      <th>Descrição</th>
                      <th>Intervalo</th>
                      <th>Última execução</th>
                      <th>Execuções</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.sort((a, b) => a.name.localeCompare(b.name)).map(job => (
                      <tr key={job.id}>
                        <td>
                          <div className="fin-org-name">{job.name}</div>
                          <div className="fin-org-slug">{job.id}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', maxWidth: '280px' }}>
                          {job.description}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--admin-text-muted)' }}>
                          {job.interval}
                        </td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                          {job.last_run_at && new Date(job.last_run_at).getFullYear() > 2000
                            ? timeAgo(job.last_run_at)
                            : <span style={{ color: 'var(--admin-text-muted)' }}>nunca</span>
                          }
                        </td>
                        <td className="fin-center" style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
                          {job.run_count}
                        </td>
                        <td>
                          <span className={`fin-job-status ${job.last_status}`}>
                            {job.running ? 'Executando...' : job.last_status === 'ok' ? 'OK' : job.last_status === 'error' ? 'Erro' : job.last_status === 'idle' ? 'Aguardando' : job.last_status}
                          </span>
                          {job.last_error && (
                            <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '2px' }}>{job.last_error}</div>
                          )}
                        </td>
                        <td>
                          <button
                            className="fin-action-btn sync"
                            onClick={() => handleTriggerJob(job.id)}
                            disabled={triggeringJob === job.id || job.running}
                            title="Executar agora"
                          >
                            {triggeringJob === job.id ? (
                              <span className="fin-spinner-inline" />
                            ) : (
                              <>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: '4px' }}>
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                Executar
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
