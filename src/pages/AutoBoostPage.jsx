import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import { autoBoost } from '../services/api';
import './AutoBoostPage.css';

const METRIC_OPTIONS = [
  { value: 'likes', label: 'Likes' },
  { value: 'comments', label: 'Comentarios' },
  { value: 'engagement_rate', label: 'Taxa de Engajamento (%)' },
];

const OBJECTIVE_OPTIONS = [
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento' },
  { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento' },
  { value: 'OUTCOME_TRAFFIC', label: 'Trafego' },
];

const DEFAULT_FORM = {
  name: '',
  metric: 'likes',
  threshold: '',
  daily_budget: '',
  duration_days: 3,
  objective: 'OUTCOME_ENGAGEMENT',
  optimization_goal: 'POST_ENGAGEMENT',
  billing_event: 'IMPRESSIONS',
  cooldown_hours: 72,
  max_post_age_hours: 48,
  targeting: {
    geo_locations: { countries: ['BR'] },
    age_min: 18,
    age_max: 65,
  },
  call_to_action: '',
  link_url: '',
};

export function AutoBoostContent() {
  const toast = useToast();
  const [tab, setTab] = useState('rules');

  // Rules state
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [logRuleFilter, setLogRuleFilter] = useState('');

  // Load rules
  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const data = await autoBoost.listRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRulesLoading(false);
    }
  }, [toast]);

  // Load logs
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await autoBoost.listLogs({
        status: logStatusFilter || undefined,
        rule_id: logRuleFilter || undefined,
        limit: 100,
      });
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLogsLoading(false);
    }
  }, [toast, logStatusFilter, logRuleFilter]);

  useEffect(() => { loadRules(); }, [loadRules]);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab, loadLogs]);

  // Toggle rule
  const handleToggle = async (rule) => {
    try {
      const data = await autoBoost.toggleRule(rule.id, !rule.active);
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, active: data.active } : r));
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Delete rule
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await autoBoost.deleteRule(deleteConfirm);
      setRules(prev => prev.filter(r => r.id !== deleteConfirm));
      toast.success('Regra removida');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // Open form
  const openNewForm = () => {
    setEditingRule(null);
    setForm({ ...DEFAULT_FORM });
    setShowForm(true);
  };

  const openEditForm = (rule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      metric: rule.metric,
      threshold: rule.threshold,
      daily_budget: rule.daily_budget / 100, // centavos -> reais
      duration_days: rule.duration_days,
      objective: rule.objective,
      optimization_goal: rule.optimization_goal,
      billing_event: rule.billing_event,
      cooldown_hours: rule.cooldown_hours,
      max_post_age_hours: rule.max_post_age_hours,
      targeting: rule.targeting || DEFAULT_FORM.targeting,
      call_to_action: rule.call_to_action || '',
      link_url: rule.link_url || '',
    });
    setShowForm(true);
  };

  // Save rule
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.threshold || !form.daily_budget) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        threshold: Number(form.threshold),
        daily_budget: Math.round(Number(form.daily_budget) * 100), // reais -> centavos
        duration_days: Number(form.duration_days),
        cooldown_hours: Number(form.cooldown_hours),
        max_post_age_hours: Number(form.max_post_age_hours),
      };

      if (editingRule) {
        await autoBoost.updateRule(editingRule.id, payload);
        toast.success('Regra atualizada');
      } else {
        await autoBoost.createRule(payload);
        toast.success('Regra criada');
      }
      setShowForm(false);
      loadRules();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Helpers
  const metricLabel = (m) => METRIC_OPTIONS.find(o => o.value === m)?.label || m;
  const objectiveLabel = (o) => OBJECTIVE_OPTIONS.find(opt => opt.value === o)?.label || o;

  const formatBudget = (centavos) => {
    return `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;
  };

  const statusBadge = (status) => {
    const map = {
      success: { label: 'Sucesso', cls: 'ab-status-success' },
      failed: { label: 'Falha', cls: 'ab-status-failed' },
      skipped_cooldown: { label: 'Cooldown', cls: 'ab-status-cooldown' },
    };
    const s = map[status] || { label: status, cls: '' };
    return <span className={`ab-status-badge ${s.cls}`}>{s.label}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
      <div className="ab-page">

        {/* Tabs */}
        <div className="ar-tabs">
          <button
            className={`ar-tab ${tab === 'rules' ? 'active' : ''}`}
            onClick={() => setTab('rules')}
          >
            Regras
            {rules.length > 0 && <span className="ar-tab-count">{rules.length}</span>}
          </button>
          <button
            className={`ar-tab ${tab === 'logs' ? 'active' : ''}`}
            onClick={() => setTab('logs')}
          >
            Historico
          </button>
        </div>

        {/* Rules tab */}
        {tab === 'rules' && (
          <div className="ab-rules-section">
            <div className="ab-rules-header">
              <span className="ab-rules-count">
                {rules.filter(r => r.active).length} regra(s) ativa(s)
              </span>
              <button className="ab-btn-primary" onClick={openNewForm}>
                + Nova Regra
              </button>
            </div>

            {rulesLoading ? (
              <LoadingSkeleton variant="list" />
            ) : rules.length === 0 ? (
              <div className="ab-empty">
                <p>Nenhuma regra criada.</p>
                <p>Crie sua primeira regra para comecar a impulsionar posts automaticamente.</p>
              </div>
            ) : (
              <div className="ab-rules-grid">
                {rules.map(rule => (
                  <div key={rule.id} className={`ab-rule-card ${rule.active ? '' : 'inactive'}`}>
                    <div className="ab-rule-header">
                      <h3>{rule.name}</h3>
                      <label className="ab-toggle">
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={() => handleToggle(rule)}
                        />
                        <span className="ab-toggle-slider" />
                      </label>
                    </div>
                    <div className="ab-rule-meta">
                      <div className="ab-rule-tag">{metricLabel(rule.metric)}</div>
                      <div className="ab-rule-tag">&ge; {rule.metric === 'engagement_rate' ? `${rule.threshold}%` : rule.threshold}</div>
                    </div>
                    <div className="ab-rule-details">
                      <div><span>Orcamento:</span> {formatBudget(rule.daily_budget)}/dia</div>
                      <div><span>Duracao:</span> {rule.duration_days} dias</div>
                      <div><span>Objetivo:</span> {objectiveLabel(rule.objective)}</div>
                      <div><span>Cooldown:</span> {rule.cooldown_hours}h</div>
                    </div>
                    <div className="ab-rule-actions">
                      <button className="ab-btn-ghost" onClick={() => openEditForm(rule)}>Editar</button>
                      <button className="ab-btn-danger" onClick={() => setDeleteConfirm(rule.id)}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Logs tab */}
        {tab === 'logs' && (
          <div className="ab-logs-section">
            <div className="ab-logs-filters">
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="ab-select"
              >
                <option value="">Todos os status</option>
                <option value="success">Sucesso</option>
                <option value="failed">Falha</option>
                <option value="skipped_cooldown">Cooldown</option>
              </select>
              <select
                value={logRuleFilter}
                onChange={(e) => setLogRuleFilter(e.target.value)}
                className="ab-select"
              >
                <option value="">Todas as regras</option>
                {rules.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {logsLoading ? (
              <LoadingSkeleton variant="list" />
            ) : logs.length === 0 ? (
              <div className="ab-empty">
                <p>Nenhum registro de auto-boost encontrado.</p>
              </div>
            ) : (
              <div className="ab-logs-table-wrap">
                <table className="ab-logs-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Regra</th>
                      <th>Post</th>
                      <th>Metrica</th>
                      <th>Valor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td className="ab-log-date">{formatDate(log.created_at)}</td>
                        <td>{log.rule_name}</td>
                        <td>
                          {log.ig_permalink ? (
                            <a href={log.ig_permalink} target="_blank" rel="noopener noreferrer" className="ab-link">
                              Ver post
                            </a>
                          ) : (
                            <span className="ab-muted">{log.ig_media_id?.slice(-8)}</span>
                          )}
                        </td>
                        <td>{metricLabel(log.metric)}</td>
                        <td>
                          {log.metric === 'engagement_rate'
                            ? `${log.metric_value.toFixed(2)}%`
                            : log.metric_value}
                        </td>
                        <td>
                          {statusBadge(log.status)}
                          {log.error_message && (
                            <span className="ab-error-msg" title={log.error_message}>
                              {log.error_message.slice(0, 50)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Rule Form Modal */}
        {showForm && (
          <div className="ab-modal-overlay" onClick={() => setShowForm(false)}>
            <div className="ab-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ab-modal-header">
                <h2>{editingRule ? 'Editar Regra' : 'Nova Regra'}</h2>
                <button className="ab-modal-close" onClick={() => setShowForm(false)}>&times;</button>
              </div>
              <form onSubmit={handleSave} className="ab-form">
                <div className="ab-form-group">
                  <label>Nome da regra *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Posts Virais"
                    required
                  />
                </div>

                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label>Metrica *</label>
                    <select
                      value={form.metric}
                      onChange={(e) => setForm({ ...form, metric: e.target.value })}
                    >
                      {METRIC_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ab-form-group">
                    <label>Threshold minimo *</label>
                    <input
                      type="number"
                      step={form.metric === 'engagement_rate' ? '0.1' : '1'}
                      value={form.threshold}
                      onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                      placeholder={form.metric === 'engagement_rate' ? 'Ex: 5.0' : 'Ex: 100'}
                      required
                    />
                  </div>
                </div>

                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label>Orcamento diario (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={form.daily_budget}
                      onChange={(e) => setForm({ ...form, daily_budget: e.target.value })}
                      placeholder="Ex: 20.00"
                      required
                    />
                  </div>
                  <div className="ab-form-group">
                    <label>Duracao (dias) *</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={form.duration_days}
                      onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ab-form-group">
                  <label>Objetivo da campanha</label>
                  <select
                    value={form.objective}
                    onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  >
                    {OBJECTIVE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label>Cooldown (horas)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.cooldown_hours}
                      onChange={(e) => setForm({ ...form, cooldown_hours: e.target.value })}
                    />
                  </div>
                  <div className="ab-form-group">
                    <label>Idade max do post (horas)</label>
                    <input
                      type="number"
                      min="1"
                      value={form.max_post_age_hours}
                      onChange={(e) => setForm({ ...form, max_post_age_hours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="ab-form-section-title">Targeting</div>
                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label>Paises (codigos separados por virgula)</label>
                    <input
                      type="text"
                      value={form.targeting?.geo_locations?.countries?.join(', ') || ''}
                      onChange={(e) => setForm({
                        ...form,
                        targeting: {
                          ...form.targeting,
                          geo_locations: {
                            ...form.targeting?.geo_locations,
                            countries: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
                          },
                        },
                      })}
                      placeholder="BR"
                    />
                  </div>
                </div>
                <div className="ab-form-row">
                  <div className="ab-form-group">
                    <label>Idade minima</label>
                    <input
                      type="number"
                      min="13"
                      max="65"
                      value={form.targeting?.age_min || 18}
                      onChange={(e) => setForm({
                        ...form,
                        targeting: { ...form.targeting, age_min: Number(e.target.value) },
                      })}
                    />
                  </div>
                  <div className="ab-form-group">
                    <label>Idade maxima</label>
                    <input
                      type="number"
                      min="13"
                      max="65"
                      value={form.targeting?.age_max || 65}
                      onChange={(e) => setForm({
                        ...form,
                        targeting: { ...form.targeting, age_max: Number(e.target.value) },
                      })}
                    />
                  </div>
                </div>

                <div className="ab-form-actions">
                  <button type="button" className="ab-btn-ghost" onClick={() => setShowForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="ab-btn-primary" disabled={saving}>
                    {saving ? 'Salvando...' : editingRule ? 'Atualizar' : 'Criar Regra'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {deleteConfirm && (
          <div className="ab-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="ab-modal ab-modal-sm" onClick={(e) => e.stopPropagation()}>
              <h3>Confirmar exclusao</h3>
              <p>Tem certeza que deseja excluir esta regra? Esta acao nao pode ser desfeita.</p>
              <div className="ab-form-actions">
                <button className="ab-btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                <button className="ab-btn-danger" onClick={handleDelete}>Excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default function AutoBoostPage() {
  return (
    <AdminLayout>
      <AutoBoostContent />
    </AdminLayout>
  );
}
