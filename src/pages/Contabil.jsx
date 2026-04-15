import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { contabil } from '../services/api';
import './Contabil.css';

// ── Helpers ──────────────────────────────────────────────────────────

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatCompetence(comp) {
  if (!comp) return '-';
  const [year, month] = comp.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${months[parseInt(month, 10) - 1]}/${year}`;
}

function parseMoney(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
}

function errMsg(err) {
  return err?.message || 'Erro desconhecido';
}

const STATUS_LABELS = {
  PENDING: 'Pendente', SENT: 'Enviada', PAID: 'Paga',
  OVERDUE: 'Atrasada', CANCELLED: 'Cancelada', BILLED: 'Faturado',
};

const STATUS_COLORS = {
  PENDING: '#f59e0b', SENT: '#3b82f6', PAID: '#10b981',
  OVERDUE: '#ef4444', CANCELLED: '#6b7280', BILLED: '#8b5cf6',
};

const TAX_LABELS = {
  SIMPLES: 'Simples', LUCRO_PRESUMIDO: 'L. Presumido', LUCRO_REAL: 'L. Real',
  CEI: 'CEI', MEI: 'MEI', DOMESTICO: 'Domestico',
};

const TAX_OPTIONS = [
  { value: 'SIMPLES', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
  { value: 'CEI', label: 'CEI' },
  { value: 'MEI', label: 'MEI' },
  { value: 'DOMESTICO', label: 'Domestico' },
];

const CHANNEL_OPTIONS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PLATFORM', label: 'Plataforma' },
];

const PAYMENT_METHODS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_CREDITO', label: 'Cartao de Credito' },
  { value: 'CARTAO_DEBITO', label: 'Cartao de Debito' },
  { value: 'CHEQUE', label: 'Cheque' },
];

const MAPPING_ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'OPERATOR', label: 'Operador' },
  { value: 'VIEWER', label: 'Visualizador' },
];

// ── Icons ────────────────────────────────────────────────────────────

const Icons = {
  plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};

// ── Debounce hook ────────────────────────────────────────────────────

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Bulk selection hook ──────────────────────────────────────────────
// Persists selection across pagination, resets only when filters change.
// Provides selectAllMatching to fetch ALL ids matching current filters.

function useBulkSelection({ items, filterKey }) {
  const [selected, setSelected] = useState(new Set());

  // Reset selection only when filters change (not page)
  useEffect(() => {
    setSelected(new Set());
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPageIds = items.map(it => it.id);
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selected.has(id));
  const someCurrentPageSelected = currentPageIds.some(id => selected.has(id));
  const indeterminate = someCurrentPageSelected && !allCurrentPageSelected;

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCurrentPage = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allCurrentPageSelected) {
        currentPageIds.forEach(id => next.delete(id));
      } else {
        currentPageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectMany = (ids) => {
    setSelected(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  };

  const clear = () => setSelected(new Set());

  return {
    selected,
    selectedCount: selected.size,
    allCurrentPageSelected,
    indeterminate,
    toggleOne,
    toggleCurrentPage,
    selectMany,
    clear,
    isSelected: (id) => selected.has(id),
  };
}

// Master checkbox component that handles indeterminate state via ref
function MasterCheckbox({ checked, indeterminate, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} />;
}

// ── Reusable Form Field ──────────────────────────────────────────────

function Field({ label, children, className = '' }) {
  return (
    <div className={`form-field ${className}`}>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

// ── Dashboard Tab ────────────────────────────────────────────────────

function DashboardTab() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      contabil.getDashboardSummary().catch(err => {
        console.error('Dashboard summary error:', err);
        return null;
      }),
      contabil.getDashboardRevenue().catch(err => {
        console.error('Dashboard revenue error:', err);
        return [];
      }),
    ]).then(([s, r]) => {
      if (cancelled) return;
      setStats(s);
      setRevenue(Array.isArray(r) ? r : r?.data || []);
      if (!s && !r) toast.error('Nao foi possivel carregar o dashboard. Verifique se o servico contabil esta ativo.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="contabil-loading"><div className="spinner" /></div>;

  const s = stats || {};
  const maxRevenue = Math.max(...revenue.map(r => (r.total || r.paid || 0)), 1);

  return (
    <div className="contabil-dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Clientes Ativos</span>
          <span className="stat-value">{s.totalClients ?? s.activeClients ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Mensalidades Pendentes</span>
          <span className="stat-value">{s.pendingBills ?? 0}</span>
        </div>
        <div className="stat-card accent">
          <span className="stat-label">Pagas este Mes</span>
          <span className="stat-value">{s.paidThisMonth ?? 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Servicos este Mes</span>
          <span className="stat-value">{s.servicesThisMonth ?? 0}</span>
        </div>
      </div>

      <div className="stats-grid cols-2">
        <div className="stat-card wide">
          <span className="stat-label">Receita Total</span>
          <span className="stat-value text-green">{formatMoney(s.totalRevenue)}</span>
        </div>
        <div className="stat-card wide">
          <span className="stat-label">Em Atraso</span>
          <span className="stat-value text-red">{formatMoney(s.overdueAmount)}</span>
        </div>
      </div>

      {revenue.length > 0 && (
        <div className="revenue-chart-card">
          <h3 className="chart-title">Receita - Ultimos 6 Meses</h3>
          <div className="revenue-chart">
            {revenue.map((r, i) => {
              const total = r.total || r.paid || 0;
              const paid = r.paid || 0;
              const pending = r.pending || 0;
              const pct = (total / maxRevenue) * 100;
              return (
                <div key={i} className="chart-bar-group">
                  <div className="chart-bar-container">
                    <div className="chart-bar" style={{ height: `${Math.max(pct, 4)}%` }}>
                      {paid > 0 && (
                        <div className="chart-bar-paid" style={{ height: `${(paid / total) * 100}%` }} title={`Pago: ${formatMoney(paid)}`} />
                      )}
                      {pending > 0 && (
                        <div className="chart-bar-pending" style={{ height: `${(pending / total) * 100}%` }} title={`Pendente: ${formatMoney(pending)}`} />
                      )}
                    </div>
                  </div>
                  <span className="chart-label">{formatCompetence(r.competence)}</span>
                  <span className="chart-value">{formatMoney(total)}</span>
                </div>
              );
            })}
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot paid" /> Pago</span>
            <span className="legend-item"><span className="legend-dot pending" /> Pendente</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client Form Modal ────────────────────────────────────────────────

const EMPTY_CLIENT = {
  code: '', name: '', tradeName: '', taxRegime: 'SIMPLES', activity: '',
  contact: { email: '', phone: '', whatsapp: '' },
  billing: {
    dueDay: 10, channel: 'EMAIL', baseAmount: 0, employeeRate: 0,
    employeeCount: 0, itrAmount: 0, dasAmount: 0, inssReceipt: 0,
    fgtsReceipt: 0, miscAmount: 0, adjustmentIndex: 0,
  },
  notes: '', isActive: true,
};

function ClientFormModal({ client, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = !!client?.id;
  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        code: client.code || '',
        name: client.name || '',
        tradeName: client.tradeName || '',
        taxRegime: client.taxRegime || 'SIMPLES',
        activity: client.activity || '',
        contact: {
          email: client.contact?.email || '',
          phone: client.contact?.phone || '',
          whatsapp: client.contact?.whatsapp || '',
        },
        billing: {
          dueDay: client.billing?.dueDay || 10,
          channel: client.billing?.channel || 'EMAIL',
          baseAmount: client.billing?.baseAmount || 0,
          employeeRate: client.billing?.employeeRate || 0,
          employeeCount: client.billing?.employeeCount || 0,
          itrAmount: client.billing?.itrAmount || 0,
          dasAmount: client.billing?.dasAmount || 0,
          inssReceipt: client.billing?.inssReceipt || 0,
          fgtsReceipt: client.billing?.fgtsReceipt || 0,
          miscAmount: client.billing?.miscAmount || 0,
          adjustmentIndex: client.billing?.adjustmentIndex || 0,
        },
        notes: client.notes || '',
        isActive: client.isActive !== false,
      };
    }
    return { ...EMPTY_CLIENT, contact: { ...EMPTY_CLIENT.contact }, billing: { ...EMPTY_CLIENT.billing } };
  });
  const [saving, setSaving] = useState(false);

  const set = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      if (parts.length === 2) {
        next[parts[0]] = { ...next[parts[0]], [parts[1]]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.warning('Nome e obrigatorio');
    if (!form.code.trim()) return toast.warning('Codigo e obrigatorio');
    setSaving(true);
    try {
      const payload = {
        ...form,
        billing: {
          ...form.billing,
          dueDay: parseInt(form.billing.dueDay, 10) || 10,
          baseAmount: parseMoney(form.billing.baseAmount),
          employeeRate: parseMoney(form.billing.employeeRate),
          employeeCount: parseInt(form.billing.employeeCount, 10) || 0,
          itrAmount: parseMoney(form.billing.itrAmount),
          dasAmount: parseMoney(form.billing.dasAmount),
          inssReceipt: parseMoney(form.billing.inssReceipt),
          fgtsReceipt: parseMoney(form.billing.fgtsReceipt),
          miscAmount: parseMoney(form.billing.miscAmount),
          adjustmentIndex: parseMoney(form.billing.adjustmentIndex),
        },
      };
      if (isEdit) {
        await contabil.updateClient(client.id, payload);
        toast.success('Cliente atualizado');
      } else {
        await contabil.createClient(payload);
        toast.success('Cliente criado');
      }
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    }
    setSaving(false);
  };

  return (
    <div className="contabil-modal-overlay" onClick={onClose}>
      <div className="contabil-modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <button className="btn-icon" onClick={onClose}>{Icons.x}</button>
        </div>

        <div className="form-grid cols-3">
          <Field label="Codigo *">
            <input className="contabil-input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="001" />
          </Field>
          <Field label="Nome / Razao Social *" className="span-2">
            <input className="contabil-input" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
        </div>

        <div className="form-grid cols-3">
          <Field label="Nome Fantasia">
            <input className="contabil-input" value={form.tradeName} onChange={e => set('tradeName', e.target.value)} />
          </Field>
          <Field label="Regime Tributario">
            <select className="contabil-select" value={form.taxRegime} onChange={e => set('taxRegime', e.target.value)}>
              {TAX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Atividade">
            <input className="contabil-input" value={form.activity} onChange={e => set('activity', e.target.value)} />
          </Field>
        </div>

        <div className="form-section-title">Contato</div>
        <div className="form-grid cols-3">
          <Field label="Email">
            <input className="contabil-input" type="email" value={form.contact.email} onChange={e => set('contact.email', e.target.value)} />
          </Field>
          <Field label="Telefone">
            <input className="contabil-input" value={form.contact.phone} onChange={e => set('contact.phone', e.target.value)} placeholder="(00) 0000-0000" />
          </Field>
          <Field label="WhatsApp">
            <input className="contabil-input" value={form.contact.whatsapp} onChange={e => set('contact.whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
          </Field>
        </div>

        <div className="form-section-title">Faturamento</div>
        <div className="form-grid cols-4">
          <Field label="Dia Vencimento">
            <input className="contabil-input" type="number" min="1" max="31" value={form.billing.dueDay} onChange={e => set('billing.dueDay', e.target.value)} />
          </Field>
          <Field label="Canal de Envio">
            <select className="contabil-select" value={form.billing.channel} onChange={e => set('billing.channel', e.target.value)}>
              {CHANNEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Valor Base (R$)">
            <input className="contabil-input" type="number" step="0.01" value={form.billing.baseAmount} onChange={e => set('billing.baseAmount', e.target.value)} />
          </Field>
          <Field label="Indice Reajuste (%)">
            <input className="contabil-input" type="number" step="0.01" value={form.billing.adjustmentIndex} onChange={e => set('billing.adjustmentIndex', e.target.value)} />
          </Field>
        </div>

        <div className="form-grid cols-3">
          <Field label="Qtd Funcionarios">
            <input className="contabil-input" type="number" value={form.billing.employeeCount} onChange={e => set('billing.employeeCount', e.target.value)} />
          </Field>
          <Field label="Valor por Funcionario (R$)">
            <input className="contabil-input" type="number" step="0.01" value={form.billing.employeeRate} onChange={e => set('billing.employeeRate', e.target.value)} />
          </Field>
          <Field label="ITR (R$)">
            <input className="contabil-input" type="number" step="0.01" value={form.billing.itrAmount} onChange={e => set('billing.itrAmount', e.target.value)} />
          </Field>
        </div>

        <div className="form-grid cols-4">
          <Field label="DAS (R$)">
            <input className="contabil-input" type="number" step="0.01" value={form.billing.dasAmount} onChange={e => set('billing.dasAmount', e.target.value)} />
          </Field>
          <Field label="Recibo INSS (R$)">
            <input className="contabil-input" type="number" step="0.01" value={form.billing.inssReceipt} onChange={e => set('billing.inssReceipt', e.target.value)} />
          </Field>
          <Field label="Recibo FGTS (R$)">
            <input className="contabil-input" type="number" step="0.01" value={form.billing.fgtsReceipt} onChange={e => set('billing.fgtsReceipt', e.target.value)} />
          </Field>
          <Field label="Diversos (R$)">
            <input className="contabil-input" type="number" step="0.01" value={form.billing.miscAmount} onChange={e => set('billing.miscAmount', e.target.value)} />
          </Field>
        </div>

        <Field label="Observacoes">
          <textarea className="contabil-input contabil-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
        </Field>

        <div className="form-grid cols-2" style={{ alignItems: 'center' }}>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
            <span>Cliente Ativo</span>
          </label>
        </div>

        <div className="modal-actions">
          <button className="contabil-btn" onClick={onClose}>Cancelar</button>
          <button className="contabil-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Criar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Clients Tab ──────────────────────────────────────────────────────

function ClientsTab() {
  const confirm = useConfirm();
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [taxFilter, setTaxFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [editClient, setEditClient] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);

  const debouncedSearch = useDebounce(search);

  const filterKey = `${debouncedSearch}|${taxFilter}`;

  const sel = useBulkSelection({ items: clients, filterKey });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contabil.listClients({
        page, limit: 20,
        search: debouncedSearch || undefined,
        taxRegime: taxFilter || undefined,
      });
      setClients(data?.data || []);
      setTotal(data?.totalPages || 1);
      setTotalItems(data?.total ?? data?.totalItems ?? data?.data?.length ?? 0);
    } catch (err) {
      toast.error('Erro ao carregar clientes: ' + errMsg(err));
    }
    setLoading(false);
  }, [page, debouncedSearch, taxFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSelectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const data = await contabil.listClients({
        page: 1, limit: 10000,
        search: debouncedSearch || undefined,
        taxRegime: taxFilter || undefined,
      });
      const ids = (data?.data || []).map(c => c.id);
      sel.selectMany(ids);
      toast.success(`${ids.length} clientes selecionados`);
    } catch (err) {
      toast.error('Erro ao selecionar todos: ' + errMsg(err));
    }
    setSelectingAll(false);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Excluir cliente', message: 'Tem certeza que deseja excluir este cliente?', confirmText: 'Excluir', variant: 'danger' });
    if (!ok) return;
    try {
      await contabil.deleteClient(id);
      toast.success('Cliente excluido');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleBulkDelete = async () => {
    const count = sel.selectedCount;
    if (count === 0) return;
    const ok = await confirm({
      title: `Excluir ${count} cliente${count > 1 ? 's' : ''}`,
      message: `Tem certeza que deseja excluir ${count} cliente${count > 1 ? 's' : ''}? Esta acao nao pode ser desfeita.`,
      confirmText: 'Excluir todos',
      variant: 'danger',
    });
    if (!ok) return;

    setBulkLoading(true);
    const ids = Array.from(sel.selected);
    const results = await Promise.allSettled(ids.map(id => contabil.deleteClient(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    const ok2 = results.length - failed;

    if (failed === 0) {
      toast.success(`${ok2} cliente${ok2 > 1 ? 's excluidos' : ' excluido'}`);
    } else {
      toast.error(`${ok2} excluido${ok2 > 1 ? 's' : ''}, ${failed} falharam`);
    }
    setBulkLoading(false);
    sel.clear();
    load();
  };

  const handleEdit = async (c) => {
    try {
      const full = await contabil.getClient(c.id);
      setEditClient(full);
      setShowForm(true);
    } catch {
      setEditClient(c);
      setShowForm(true);
    }
  };

  const handleFormClose = () => { setShowForm(false); setEditClient(null); };
  const handleFormSaved = () => { handleFormClose(); load(); };

  return (
    <div className="contabil-section">
      <div className="section-toolbar">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="contabil-input"
        />
        <select
          value={taxFilter}
          onChange={(e) => { setTaxFilter(e.target.value); setPage(1); }}
          className="contabil-select"
        >
          <option value="">Todos os Regimes</option>
          {TAX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button className="contabil-btn primary" onClick={() => { setEditClient(null); setShowForm(true); }}>
          {Icons.plus} Novo Cliente
        </button>
      </div>

      {showForm && (
        <ClientFormModal client={editClient} onClose={handleFormClose} onSaved={handleFormSaved} />
      )}

      {sel.selectedCount > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span className="bulk-count">
              {sel.selectedCount} selecionado{sel.selectedCount > 1 ? 's' : ''}
            </span>
            {sel.allCurrentPageSelected && totalItems > sel.selectedCount && (
              <button
                className="bulk-link"
                onClick={handleSelectAllMatching}
                disabled={selectingAll}
              >
                {selectingAll ? 'Selecionando...' : `Selecionar todos os ${totalItems} clientes`}
              </button>
            )}
          </div>
          <div className="bulk-actions">
            <button className="contabil-btn btn-danger" onClick={handleBulkDelete} disabled={bulkLoading}>
              {Icons.trash} {bulkLoading ? 'Excluindo...' : 'Excluir selecionados'}
            </button>
            <button className="contabil-btn" onClick={sel.clear}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="contabil-loading"><div className="spinner" /></div>
      ) : clients.length === 0 ? (
        <div className="contabil-empty">Nenhum cliente encontrado</div>
      ) : (
        <div className="contabil-table-wrap">
          <table className="contabil-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <MasterCheckbox
                    checked={sel.allCurrentPageSelected}
                    indeterminate={sel.indeterminate}
                    onChange={sel.toggleCurrentPage}
                  />
                </th>
                <th>Codigo</th>
                <th>Nome</th>
                <th>Regime</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Valor Base</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className={sel.isSelected(c.id) ? 'row-selected' : ''}>
                  <td className="checkbox-col">
                    <input type="checkbox" checked={sel.isSelected(c.id)} onChange={() => sel.toggleOne(c.id)} />
                  </td>
                  <td className="mono">{c.code}</td>
                  <td>{c.name}</td>
                  <td><span className="badge">{TAX_LABELS[c.taxRegime] || c.taxRegime}</span></td>
                  <td>{c.contact?.email || '-'}</td>
                  <td>{c.contact?.phone || '-'}</td>
                  <td className="mono">{formatMoney(c.billing?.baseAmount)}</td>
                  <td><span className={`badge ${c.isActive ? 'badge-green' : 'badge-red'}`}>{c.isActive ? 'Ativo' : 'Inativo'}</span></td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => handleEdit(c)} title="Editar">{Icons.edit}</button>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(c.id)} title="Excluir">{Icons.trash}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 1 && (
        <div className="contabil-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
          <span>Pagina {page} de {total}</span>
          <button disabled={page === total} onClick={() => setPage(p => p + 1)}>Proxima</button>
        </div>
      )}
    </div>
  );
}

// ── Payment Modal ────────────────────────────────────────────────────

function PaymentModal({ bill, onClose, onPaid }) {
  const toast = useToast();
  const [method, setMethod] = useState('PIX');
  const [saving, setSaving] = useState(false);

  const handlePay = async () => {
    setSaving(true);
    try {
      await contabil.markBillAsPaid(bill.id, method);
      toast.success('Mensalidade marcada como paga');
      onPaid();
    } catch (err) {
      toast.error(errMsg(err));
    }
    setSaving(false);
  };

  return (
    <div className="contabil-modal-overlay" onClick={onClose}>
      <div className="contabil-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Marcar como Paga</h3>
          <button className="btn-icon" onClick={onClose}>{Icons.x}</button>
        </div>
        <p>Cliente: <strong>{bill.clientName}</strong></p>
        <p>Competencia: <strong>{formatCompetence(bill.competence)}</strong> | Total: <strong>{formatMoney(bill.amounts?.total)}</strong></p>
        <Field label="Metodo de Pagamento">
          <select className="contabil-select" value={method} onChange={e => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <div className="modal-actions">
          <button className="contabil-btn" onClick={onClose}>Cancelar</button>
          <button className="contabil-btn primary" onClick={handlePay} disabled={saving}>
            {saving ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bill Edit Modal ──────────────────────────────────────────────────

function BillEditModal({ bill, onClose, onSaved }) {
  const toast = useToast();
  const [notes, setNotes] = useState(bill.notes || '');
  const [isActive, setIsActive] = useState(bill.isActive !== false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await contabil.updateBill(bill.id, { notes, isActive });
      toast.success('Mensalidade atualizada');
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    }
    setSaving(false);
  };

  return (
    <div className="contabil-modal-overlay" onClick={onClose}>
      <div className="contabil-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Mensalidade</h3>
          <button className="btn-icon" onClick={onClose}>{Icons.x}</button>
        </div>
        <p>Cliente: <strong>{bill.clientName}</strong> | {formatCompetence(bill.competence)}</p>

        <Field label="Observacoes">
          <textarea className="contabil-input contabil-textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
        </Field>

        <label className="checkbox-label">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          <span>Mensalidade Ativa</span>
        </label>

        <div className="modal-actions">
          <button className="contabil-btn" onClick={onClose}>Cancelar</button>
          <button className="contabil-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bills Tab ────────────────────────────────────────────────────────

function BillsTab() {
  const toast = useToast();
  const confirm = useConfirm();
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [competence, setCompetence] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genComp, setGenComp] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewBill, setViewBill] = useState(null);
  const [payBill, setPayBill] = useState(null);
  const [editBill, setEditBill] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);

  const debouncedSearch = useDebounce(search);

  const filterKey = `${debouncedSearch}|${competence}|${status}`;

  const sel = useBulkSelection({ items: bills, filterKey });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contabil.listBills({
        page, limit: 20,
        search: debouncedSearch || undefined,
        competence: competence || undefined,
        status: status || undefined,
      });
      setBills(data?.data || []);
      setTotal(data?.totalPages || 1);
      setTotalItems(data?.total ?? data?.totalItems ?? data?.data?.length ?? 0);
    } catch (err) {
      toast.error('Erro ao carregar mensalidades: ' + errMsg(err));
    }
    setLoading(false);
  }, [page, debouncedSearch, competence, status]);

  useEffect(() => { load(); }, [load]);

  const handleSelectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const data = await contabil.listBills({
        page: 1, limit: 10000,
        search: debouncedSearch || undefined,
        competence: competence || undefined,
        status: status || undefined,
      });
      const ids = (data?.data || []).map(b => b.id);
      sel.selectMany(ids);
      toast.success(`${ids.length} mensalidades selecionadas`);
    } catch (err) {
      toast.error('Erro ao selecionar todos: ' + errMsg(err));
    }
    setSelectingAll(false);
  };

  const handleBulkMarkPaid = async () => {
    const count = sel.selectedCount;
    if (count === 0) return;
    const ok = await confirm({
      title: `Marcar ${count} como paga${count > 1 ? 's' : ''}`,
      message: `Marcar ${count} mensalidade${count > 1 ? 's' : ''} como paga${count > 1 ? 's' : ''} via PIX?`,
      confirmText: 'Confirmar',
    });
    if (!ok) return;

    setBulkLoading(true);
    const ids = Array.from(sel.selected);
    const results = await Promise.allSettled(ids.map(id => contabil.markBillAsPaid(id, 'PIX')));
    const failed = results.filter(r => r.status === 'rejected').length;
    const okCount = results.length - failed;
    if (failed === 0) {
      toast.success(`${okCount} mensalidade${okCount > 1 ? 's marcadas' : ' marcada'} como paga${okCount > 1 ? 's' : ''}`);
    } else {
      toast.error(`${okCount} ok, ${failed} falharam`);
    }
    setBulkLoading(false);
    sel.clear();
    load();
  };

  const handleBulkChangeStatus = async (newStatus) => {
    const count = sel.selectedCount;
    if (count === 0) return;
    const label = STATUS_LABELS[newStatus] || newStatus;
    const ok = await confirm({
      title: `Alterar status de ${count}`,
      message: `Alterar status de ${count} mensalidade${count > 1 ? 's' : ''} para "${label}"?`,
      confirmText: 'Confirmar',
    });
    if (!ok) return;

    setBulkLoading(true);
    const ids = Array.from(sel.selected);
    const results = await Promise.allSettled(ids.map(id => contabil.updateBillStatus(id, newStatus)));
    const failed = results.filter(r => r.status === 'rejected').length;
    const okCount = results.length - failed;
    if (failed === 0) {
      toast.success(`${okCount} status atualizado${okCount > 1 ? 's' : ''}`);
    } else {
      toast.error(`${okCount} ok, ${failed} falharam`);
    }
    setBulkLoading(false);
    sel.clear();
    load();
  };

  const handleGenerate = async () => {
    if (!genComp) return;
    setGenerating(true);
    try {
      const result = await contabil.generateBills(genComp);
      toast.success(`${result?.generated || 0} mensalidades geradas!`);
      setShowGenerate(false);
      setGenComp('');
      load();
    } catch (err) {
      toast.error('Erro ao gerar mensalidades: ' + errMsg(err));
    }
    setGenerating(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await contabil.updateBillStatus(id, newStatus);
      toast.success('Status atualizado');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="contabil-section">
      <div className="section-toolbar">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="contabil-input"
        />
        <input
          type="month"
          value={competence}
          onChange={(e) => { setCompetence(e.target.value); setPage(1); }}
          className="contabil-input small"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="contabil-select"
        >
          <option value="">Todos os Status</option>
          <option value="PENDING">Pendente</option>
          <option value="SENT">Enviada</option>
          <option value="PAID">Paga</option>
          <option value="OVERDUE">Atrasada</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <button className="contabil-btn primary" onClick={() => setShowGenerate(true)}>
          {Icons.plus} Gerar Mensalidades
        </button>
      </div>

      {showGenerate && (
        <div className="contabil-modal-overlay" onClick={() => setShowGenerate(false)}>
          <div className="contabil-modal" onClick={e => e.stopPropagation()}>
            <h3>Gerar Mensalidades</h3>
            <p>Selecione o mes de competencia para gerar mensalidades de todos os clientes ativos.</p>
            <input
              type="month"
              value={genComp}
              onChange={(e) => setGenComp(e.target.value)}
              className="contabil-input"
            />
            <div className="modal-actions">
              <button className="contabil-btn" onClick={() => setShowGenerate(false)}>Cancelar</button>
              <button className="contabil-btn primary" onClick={handleGenerate} disabled={generating || !genComp}>
                {generating ? 'Gerando...' : 'Gerar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {payBill && (
        <PaymentModal bill={payBill} onClose={() => setPayBill(null)} onPaid={() => { setPayBill(null); load(); }} />
      )}

      {editBill && (
        <BillEditModal bill={editBill} onClose={() => setEditBill(null)} onSaved={() => { setEditBill(null); load(); }} />
      )}

      {sel.selectedCount > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span className="bulk-count">
              {sel.selectedCount} selecionada{sel.selectedCount > 1 ? 's' : ''}
            </span>
            {sel.allCurrentPageSelected && totalItems > sel.selectedCount && (
              <button
                className="bulk-link"
                onClick={handleSelectAllMatching}
                disabled={selectingAll}
              >
                {selectingAll ? 'Selecionando...' : `Selecionar todas as ${totalItems} mensalidades`}
              </button>
            )}
          </div>
          <div className="bulk-actions">
            <button className="contabil-btn primary" onClick={handleBulkMarkPaid} disabled={bulkLoading}>
              {Icons.dollar} {bulkLoading ? 'Processando...' : 'Marcar como pagas'}
            </button>
            <button className="contabil-btn" onClick={() => handleBulkChangeStatus('SENT')} disabled={bulkLoading}>
              Marcar como enviadas
            </button>
            <button className="contabil-btn btn-danger" onClick={() => handleBulkChangeStatus('CANCELLED')} disabled={bulkLoading}>
              Cancelar selecionadas
            </button>
            <button className="contabil-btn" onClick={sel.clear}>Limpar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="contabil-loading"><div className="spinner" /></div>
      ) : bills.length === 0 ? (
        <div className="contabil-empty">Nenhuma mensalidade encontrada</div>
      ) : (
        <div className="contabil-table-wrap">
          <table className="contabil-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <MasterCheckbox
                    checked={sel.allCurrentPageSelected}
                    indeterminate={sel.indeterminate}
                    onChange={sel.toggleCurrentPage}
                  />
                </th>
                <th>Cliente</th>
                <th>Competencia</th>
                <th>Vencimento</th>
                <th>Total</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.id} className={sel.isSelected(b.id) ? 'row-selected' : ''}>
                  <td className="checkbox-col">
                    <input type="checkbox" checked={sel.isSelected(b.id)} onChange={() => sel.toggleOne(b.id)} />
                  </td>
                  <td>{b.clientName || '-'}</td>
                  <td>{formatCompetence(b.competence)}</td>
                  <td>{formatDate(b.dueDate)}</td>
                  <td className="mono">{formatMoney(b.amounts?.total)}</td>
                  <td>
                    <select
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.id, e.target.value)}
                      className="contabil-select inline"
                      style={{ color: STATUS_COLORS[b.status] }}
                    >
                      {Object.entries(STATUS_LABELS).filter(([k]) => k !== 'BILLED').map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon" onClick={() => setViewBill(b)} title="Detalhes">{Icons.eye}</button>
                    <button className="btn-icon" onClick={() => setEditBill(b)} title="Editar">{Icons.edit}</button>
                    {b.status !== 'PAID' && b.status !== 'CANCELLED' && (
                      <button className="btn-icon btn-success" onClick={() => setPayBill(b)} title="Marcar como Paga">{Icons.dollar}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 1 && (
        <div className="contabil-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
          <span>Pagina {page} de {total}</span>
          <button disabled={page === total} onClick={() => setPage(p => p + 1)}>Proxima</button>
        </div>
      )}

      {viewBill && (
        <div className="contabil-modal-overlay" onClick={() => setViewBill(null)}>
          <div className="contabil-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes da Mensalidade</h3>
              <button className="btn-icon" onClick={() => setViewBill(null)}>{Icons.x}</button>
            </div>
            <div className="bill-details">
              <div className="detail-row"><span>Cliente</span><strong>{viewBill.clientName}</strong></div>
              <div className="detail-row"><span>Competencia</span><strong>{formatCompetence(viewBill.competence)}</strong></div>
              <div className="detail-row"><span>Vencimento</span><strong>{formatDate(viewBill.dueDate)}</strong></div>
              <div className="detail-row"><span>Status</span><span className="badge" style={{ background: STATUS_COLORS[viewBill.status] + '22', color: STATUS_COLORS[viewBill.status] }}>{STATUS_LABELS[viewBill.status]}</span></div>
              {viewBill.paidAt && <div className="detail-row"><span>Pago em</span><strong>{formatDate(viewBill.paidAt)}</strong></div>}
              {viewBill.paymentMethod && <div className="detail-row"><span>Metodo</span><strong>{PAYMENT_METHODS.find(m => m.value === viewBill.paymentMethod)?.label || viewBill.paymentMethod}</strong></div>}
              <hr />
              <div className="detail-row"><span>Base</span><span>{formatMoney(viewBill.amounts?.base)}</span></div>
              <div className="detail-row"><span>Funcionarios</span><span>{formatMoney(viewBill.amounts?.employees)}</span></div>
              <div className="detail-row"><span>ITR</span><span>{formatMoney(viewBill.amounts?.itr)}</span></div>
              <div className="detail-row"><span>DAS</span><span>{formatMoney(viewBill.amounts?.das)}</span></div>
              <div className="detail-row"><span>Recibo INSS</span><span>{formatMoney(viewBill.amounts?.inssReceipt)}</span></div>
              <div className="detail-row"><span>Recibo FGTS</span><span>{formatMoney(viewBill.amounts?.fgtsReceipt)}</span></div>
              <div className="detail-row"><span>Diversos</span><span>{formatMoney(viewBill.amounts?.misc)}</span></div>
              <div className="detail-row"><span>Servicos Eventuais</span><span>{formatMoney(viewBill.amounts?.occasionalServices)}</span></div>
              <hr />
              <div className="detail-row total"><span>Total</span><strong>{formatMoney(viewBill.amounts?.total)}</strong></div>
              {viewBill.notes && (
                <>
                  <hr />
                  <div className="detail-notes"><span>Obs:</span> {viewBill.notes}</div>
                </>
              )}
            </div>
            <div className="modal-actions">
              {viewBill.status !== 'PAID' && viewBill.status !== 'CANCELLED' && (
                <button className="contabil-btn primary" onClick={() => { setViewBill(null); setPayBill(viewBill); }}>
                  {Icons.dollar} Marcar como Paga
                </button>
              )}
              <button className="contabil-btn" onClick={() => setViewBill(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Service Form Modal ───────────────────────────────────────────────

function ServiceFormModal({ service, clients, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = !!service?.id;
  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        clientId: service.clientId || '',
        serviceDate: service.serviceDate ? service.serviceDate.substring(0, 10) : '',
        sector: service.sector || 'MASSON',
        services: {
          dae: service.services?.dae || 0,
          das: service.services?.das || 0,
          fgts: service.services?.fgts || 0,
          inss: service.services?.inss || 0,
          nf: service.services?.nf || 0,
          diffRate: service.services?.diffRate || 0,
          darfIR: service.services?.darfIR || 0,
          other: service.services?.other || '',
        },
        amount: service.amount || 0,
        notes: service.notes || '',
      };
    }
    return {
      clientId: '', serviceDate: new Date().toISOString().substring(0, 10),
      sector: 'MASSON',
      services: { dae: 0, das: 0, fgts: 0, inss: 0, nf: 0, diffRate: 0, darfIR: 0, other: '' },
      amount: 0, notes: '',
    };
  });
  const [saving, setSaving] = useState(false);

  const set = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const parts = path.split('.');
      if (parts.length === 2) {
        next[parts[0]] = { ...next[parts[0]], [parts[1]]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.clientId) return toast.warning('Selecione um cliente');
    if (!form.serviceDate) return toast.warning('Data e obrigatoria');
    setSaving(true);
    try {
      const payload = {
        ...form,
        serviceDate: new Date(form.serviceDate + 'T00:00:00').toISOString(),
        amount: parseMoney(form.amount),
        services: {
          dae: parseInt(form.services.dae, 10) || 0,
          das: parseInt(form.services.das, 10) || 0,
          fgts: parseInt(form.services.fgts, 10) || 0,
          inss: parseInt(form.services.inss, 10) || 0,
          nf: parseInt(form.services.nf, 10) || 0,
          diffRate: parseInt(form.services.diffRate, 10) || 0,
          darfIR: parseInt(form.services.darfIR, 10) || 0,
          other: form.services.other || '',
        },
      };
      if (isEdit) {
        await contabil.updateService(service.id, payload);
        toast.success('Servico atualizado');
      } else {
        await contabil.createService(payload);
        toast.success('Servico criado');
      }
      onSaved();
    } catch (err) {
      toast.error(errMsg(err));
    }
    setSaving(false);
  };

  return (
    <div className="contabil-modal-overlay" onClick={onClose}>
      <div className="contabil-modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Editar Servico' : 'Novo Servico Eventual'}</h3>
          <button className="btn-icon" onClick={onClose}>{Icons.x}</button>
        </div>

        <div className="form-grid cols-3">
          <Field label="Cliente *">
            <select className="contabil-select" value={form.clientId} onChange={e => set('clientId', e.target.value)}>
              <option value="">Selecione...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </select>
          </Field>
          <Field label="Data *">
            <input className="contabil-input" type="date" value={form.serviceDate} onChange={e => set('serviceDate', e.target.value)} />
          </Field>
          <Field label="Setor">
            <select className="contabil-select" value={form.sector} onChange={e => set('sector', e.target.value)}>
              <option value="MASSON">Masson</option>
              <option value="MS_GESTOR">MS Gestor</option>
            </select>
          </Field>
        </div>

        <div className="form-section-title">Itens do Servico</div>
        <div className="form-grid cols-4">
          <Field label="DAE">
            <input className="contabil-input" type="number" value={form.services.dae} onChange={e => set('services.dae', e.target.value)} />
          </Field>
          <Field label="DAS">
            <input className="contabil-input" type="number" value={form.services.das} onChange={e => set('services.das', e.target.value)} />
          </Field>
          <Field label="FGTS">
            <input className="contabil-input" type="number" value={form.services.fgts} onChange={e => set('services.fgts', e.target.value)} />
          </Field>
          <Field label="INSS">
            <input className="contabil-input" type="number" value={form.services.inss} onChange={e => set('services.inss', e.target.value)} />
          </Field>
        </div>
        <div className="form-grid cols-4">
          <Field label="NF">
            <input className="contabil-input" type="number" value={form.services.nf} onChange={e => set('services.nf', e.target.value)} />
          </Field>
          <Field label="Dif. Aliquota">
            <input className="contabil-input" type="number" value={form.services.diffRate} onChange={e => set('services.diffRate', e.target.value)} />
          </Field>
          <Field label="DARF IR">
            <input className="contabil-input" type="number" value={form.services.darfIR} onChange={e => set('services.darfIR', e.target.value)} />
          </Field>
          <Field label="Valor (R$)">
            <input className="contabil-input" type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} />
          </Field>
        </div>

        <Field label="Outros / Descricao">
          <input className="contabil-input" value={form.services.other} onChange={e => set('services.other', e.target.value)} placeholder="Descricao do servico..." />
        </Field>

        <Field label="Observacoes">
          <textarea className="contabil-input contabil-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
        </Field>

        <div className="modal-actions">
          <button className="contabil-btn" onClick={onClose}>Cancelar</button>
          <button className="contabil-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Criar Servico'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Services Tab ─────────────────────────────────────────────────────

function ServicesTab() {
  const confirm = useConfirm();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [editService, setEditService] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);

  const debouncedSearch = useDebounce(search);

  const filterKey = `${debouncedSearch}|${sector}|${statusFilter}`;
  const sel = useBulkSelection({ items: services, filterKey });

  const loadClients = useCallback(async () => {
    try {
      const data = await contabil.listClients({ limit: 500 });
      setClients(data?.data || []);
    } catch (err) {
      console.error('Failed to load clients for services:', err);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contabil.listServices({
        page, limit: 20,
        search: debouncedSearch || undefined,
        sector: sector || undefined,
        status: statusFilter || undefined,
      });
      setServices(data?.data || []);
      setTotal(data?.totalPages || 1);
      setTotalItems(data?.total ?? data?.totalItems ?? data?.data?.length ?? 0);
    } catch (err) {
      toast.error('Erro ao carregar servicos: ' + errMsg(err));
    }
    setLoading(false);
  }, [page, debouncedSearch, sector, statusFilter]);

  useEffect(() => { loadClients(); }, [loadClients]);
  useEffect(() => { load(); }, [load]);

  const handleSelectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const data = await contabil.listServices({
        page: 1, limit: 10000,
        search: debouncedSearch || undefined,
        sector: sector || undefined,
        status: statusFilter || undefined,
      });
      const ids = (data?.data || []).map(s => s.id);
      sel.selectMany(ids);
      toast.success(`${ids.length} servicos selecionados`);
    } catch (err) {
      toast.error('Erro ao selecionar todos: ' + errMsg(err));
    }
    setSelectingAll(false);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Excluir servico', message: 'Tem certeza que deseja excluir este servico?', confirmText: 'Excluir', variant: 'danger' });
    if (!ok) return;
    try {
      await contabil.deleteService(id);
      toast.success('Servico excluido');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleBulkDelete = async () => {
    const count = sel.selectedCount;
    if (count === 0) return;
    const ok = await confirm({
      title: `Excluir ${count} servico${count > 1 ? 's' : ''}`,
      message: `Excluir ${count} servico${count > 1 ? 's' : ''}? Esta acao nao pode ser desfeita.`,
      confirmText: 'Excluir todos',
      variant: 'danger',
    });
    if (!ok) return;

    setBulkLoading(true);
    const ids = Array.from(sel.selected);
    const results = await Promise.allSettled(ids.map(id => contabil.deleteService(id)));
    const failed = results.filter(r => r.status === 'rejected').length;
    const okCount = results.length - failed;
    if (failed === 0) {
      toast.success(`${okCount} servico${okCount > 1 ? 's excluidos' : ' excluido'}`);
    } else {
      toast.error(`${okCount} ok, ${failed} falharam`);
    }
    setBulkLoading(false);
    sel.clear();
    load();
  };

  const handleFormClose = () => { setShowForm(false); setEditService(null); };
  const handleFormSaved = () => { handleFormClose(); load(); };

  return (
    <div className="contabil-section">
      <div className="section-toolbar">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="contabil-input"
        />
        <select
          value={sector}
          onChange={(e) => { setSector(e.target.value); setPage(1); }}
          className="contabil-select"
        >
          <option value="">Todos os Setores</option>
          <option value="MASSON">Masson</option>
          <option value="MS_GESTOR">MS Gestor</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="contabil-select"
        >
          <option value="">Todos os Status</option>
          <option value="PENDING">Pendente</option>
          <option value="BILLED">Faturado</option>
          <option value="PAID">Pago</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
        <button className="contabil-btn primary" onClick={() => { setEditService(null); setShowForm(true); }}>
          {Icons.plus} Novo Servico
        </button>
      </div>

      {showForm && (
        <ServiceFormModal
          service={editService}
          clients={clients}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}

      {sel.selectedCount > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <span className="bulk-count">
              {sel.selectedCount} selecionado{sel.selectedCount > 1 ? 's' : ''}
            </span>
            {sel.allCurrentPageSelected && totalItems > sel.selectedCount && (
              <button
                className="bulk-link"
                onClick={handleSelectAllMatching}
                disabled={selectingAll}
              >
                {selectingAll ? 'Selecionando...' : `Selecionar todos os ${totalItems} servicos`}
              </button>
            )}
          </div>
          <div className="bulk-actions">
            <button className="contabil-btn btn-danger" onClick={handleBulkDelete} disabled={bulkLoading}>
              {Icons.trash} {bulkLoading ? 'Excluindo...' : 'Excluir selecionados'}
            </button>
            <button className="contabil-btn" onClick={sel.clear}>Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="contabil-loading"><div className="spinner" /></div>
      ) : services.length === 0 ? (
        <div className="contabil-empty">Nenhum servico encontrado</div>
      ) : (
        <div className="contabil-table-wrap">
          <table className="contabil-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <MasterCheckbox
                    checked={sel.allCurrentPageSelected}
                    indeterminate={sel.indeterminate}
                    onChange={sel.toggleCurrentPage}
                  />
                </th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Setor</th>
                <th>Servicos</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {services.map(s => {
                const svcParts = [];
                if (s.services?.dae) svcParts.push(`DAE:${s.services.dae}`);
                if (s.services?.das) svcParts.push(`DAS:${s.services.das}`);
                if (s.services?.fgts) svcParts.push(`FGTS:${s.services.fgts}`);
                if (s.services?.inss) svcParts.push(`INSS:${s.services.inss}`);
                if (s.services?.nf) svcParts.push(`NF:${s.services.nf}`);
                if (s.services?.diffRate) svcParts.push(`Dif:${s.services.diffRate}`);
                if (s.services?.darfIR) svcParts.push(`DARF:${s.services.darfIR}`);
                if (s.services?.other) svcParts.push(s.services.other);
                return (
                  <tr key={s.id} className={sel.isSelected(s.id) ? 'row-selected' : ''}>
                    <td className="checkbox-col">
                      <input type="checkbox" checked={sel.isSelected(s.id)} onChange={() => sel.toggleOne(s.id)} />
                    </td>
                    <td>{s.clientName || s.clientCode || '-'}</td>
                    <td>{formatDate(s.serviceDate)}</td>
                    <td><span className="badge">{s.sector}</span></td>
                    <td className="mono small">{svcParts.join(', ') || '-'}</td>
                    <td className="mono">{formatMoney(s.amount)}</td>
                    <td>
                      <span className="badge" style={{ background: STATUS_COLORS[s.status] + '22', color: STATUS_COLORS[s.status] }}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="btn-icon" onClick={() => { setEditService(s); setShowForm(true); }} title="Editar">{Icons.edit}</button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(s.id)} title="Excluir">{Icons.trash}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {total > 1 && (
        <div className="contabil-pagination">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
          <span>Pagina {page} de {total}</span>
          <button disabled={page === total} onClick={() => setPage(p => p + 1)}>Proxima</button>
        </div>
      )}
    </div>
  );
}

// ── Import Tab ───────────────────────────────────────────────────────

function ImportTab() {
  const toast = useToast();
  const [importType, setImportType] = useState('clients');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runPreview = async (selectedFile, type) => {
    if (!selectedFile) return;
    setLoading(true);
    setResult(null);
    setPreview(null);
    try {
      const fn = type === 'clients' ? contabil.importClientsPreview : contabil.importServicesPreview;
      const data = await fn(selectedFile);
      setPreview(data);
    } catch (err) {
      toast.error('Erro no preview: ' + errMsg(err));
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      runPreview(selectedFile, importType);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fn = importType === 'clients' ? contabil.importClients : contabil.importServices;
      const data = await fn(file);
      setResult(data);
      setPreview(null);
      setFile(null);
      toast.success('Importacao concluida!');
    } catch (err) {
      toast.error('Erro na importacao: ' + errMsg(err));
    }
    setLoading(false);
  };

  const handleTypeChange = (type) => {
    setImportType(type);
    setPreview(null);
    setResult(null);
    setFile(null);
  };

  return (
    <div className="contabil-section">
      <div className="import-controls">
        <div className="import-type-selector">
          <button
            className={`contabil-btn ${importType === 'clients' ? 'primary' : ''}`}
            onClick={() => handleTypeChange('clients')}
          >
            Clientes
          </button>
          <button
            className={`contabil-btn ${importType === 'services' ? 'primary' : ''}`}
            onClick={() => handleTypeChange('services')}
          >
            Servicos
          </button>
        </div>

        <div className="file-upload-area">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            id="import-file"
          />
          <label htmlFor="import-file" className="file-label">
            {file ? file.name : 'Selecionar arquivo Excel (.xlsx)'}
          </label>
        </div>

        {preview && (
          <div className="import-actions">
            <button className="contabil-btn primary" onClick={handleImport} disabled={loading}>
              {loading ? 'Importando...' : 'Confirmar Importacao'}
            </button>
          </div>
        )}
      </div>

      {loading && !preview && (
        <div className="contabil-loading"><div className="spinner" /></div>
      )}

      {preview && (
        <div className="import-preview">
          <div className="stats-grid cols-3">
            <div className="stat-card"><span className="stat-label">Total</span><span className="stat-value">{preview.totalRows ?? preview.total ?? 0}</span></div>
            <div className="stat-card accent"><span className="stat-label">Validos</span><span className="stat-value">{preview.validRows ?? preview.valid ?? 0}</span></div>
            <div className="stat-card"><span className="stat-label">Invalidos</span><span className="stat-value text-red">{preview.invalidRows ?? preview.invalid ?? 0}</span></div>
          </div>

          {/* Preview table — shows actual rows that will be imported */}
          {importType === 'clients' && preview.clients?.length > 0 && (
            <div className="contabil-table-wrap" style={{ marginTop: '1rem' }}>
              <table className="contabil-table">
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Codigo</th>
                    <th>Nome</th>
                    <th>Regime</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Valor Base</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.clients.map((c) => (
                    <tr key={c.rowNumber}>
                      <td className="mono">{c.rowNumber}</td>
                      <td className="mono">{c.code || '-'}</td>
                      <td>{c.name}</td>
                      <td><span className="badge">{TAX_LABELS[c.taxRegime] || c.taxRegime || '-'}</span></td>
                      <td>{c.email || '-'}</td>
                      <td>{c.phone || '-'}</td>
                      <td className="mono">{formatMoney(c.baseAmount)}</td>
                      <td className="mono">{formatMoney(c.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {importType === 'services' && preview.services?.length > 0 && (
            <div className="contabil-table-wrap" style={{ marginTop: '1rem' }}>
              <table className="contabil-table">
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Data</th>
                    <th>Codigo</th>
                    <th>Empresa</th>
                    <th>Setor</th>
                    <th>NF</th>
                    <th>DAS</th>
                    <th>FGTS</th>
                    <th>INSS</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.services.map((s) => (
                    <tr key={s.rowNumber}>
                      <td className="mono">{s.rowNumber}</td>
                      <td>{s.date || '-'}</td>
                      <td className="mono">{s.code || '-'}</td>
                      <td>{s.companyName || '-'}</td>
                      <td><span className="badge">{s.sector || '-'}</span></td>
                      <td>{s.nf || '-'}</td>
                      <td className="mono">{s.das || 0}</td>
                      <td className="mono">{s.fgts || 0}</td>
                      <td className="mono">{s.inss || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.errors?.length > 0 && (
            <div className="import-errors">
              <h4>Erros encontrados:</h4>
              <ul>
                {preview.errors.map((err, i) => (
                  <li key={i}>Linha {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="import-result">
          <h4>Importacao concluida!</h4>
          <div className="stats-grid cols-3">
            <div className="stat-card accent"><span className="stat-label">Importados</span><span className="stat-value">{result.imported ?? 0}</span></div>
            <div className="stat-card"><span className="stat-label">Atualizados</span><span className="stat-value">{result.updated ?? 0}</span></div>
            <div className="stat-card"><span className="stat-label">Erros</span><span className="stat-value text-red">{result.errors ?? 0}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mappings Tab ─────────────────────────────────────────────────────

function MappingsTab() {
  const confirm = useConfirm();
  const toast = useToast();
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('OPERATOR');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contabil.listMappings();
      setMappings(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error('Erro ao carregar mapeamentos: ' + errMsg(err));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newEmail.trim()) return toast.warning('Email e obrigatorio');
    setSaving(true);
    try {
      await contabil.createMapping({ email: newEmail.trim(), contabilRole: newRole });
      toast.success('Acesso adicionado');
      setShowCreate(false);
      setNewEmail('');
      setNewRole('OPERATOR');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Remover acesso', message: 'Remover acesso deste usuario ao modulo contabil?', confirmText: 'Remover', variant: 'danger' });
    if (!ok) return;
    try {
      await contabil.deleteMapping(id);
      toast.success('Acesso removido');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const handleRoleChange = async (id, newRoleVal) => {
    try {
      await contabil.updateMapping(id, { contabilRole: newRoleVal });
      toast.success('Papel atualizado');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="contabil-section">
      <div className="section-toolbar">
        <div style={{ flex: 1 }}>
          <p className="section-description">
            Gerencie quais usuarios da organizacao tem acesso ao modulo contabil e suas permissoes.
          </p>
        </div>
        <button className="contabil-btn primary" onClick={() => setShowCreate(true)}>
          {Icons.plus} Adicionar Usuario
        </button>
      </div>

      {showCreate && (
        <div className="contabil-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="contabil-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Acesso Contabil</h3>
              <button className="btn-icon" onClick={() => setShowCreate(false)}>{Icons.x}</button>
            </div>
            <p>Informe o email do usuario da organizacao que tera acesso ao modulo contabil.</p>
            <Field label="Email do Usuario">
              <input className="contabil-input" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@email.com" />
            </Field>
            <Field label="Papel no Contabil">
              <select className="contabil-select" value={newRole} onChange={e => setNewRole(e.target.value)}>
                {MAPPING_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <div className="role-descriptions">
              <div className="role-desc"><strong>Administrador:</strong> Acesso total - usuarios, importacao, configuracoes</div>
              <div className="role-desc"><strong>Operador:</strong> Gerencia clientes, mensalidades e servicos</div>
              <div className="role-desc"><strong>Visualizador:</strong> Apenas consulta, sem edicao</div>
            </div>
            <div className="modal-actions">
              <button className="contabil-btn" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="contabil-btn primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="contabil-loading"><div className="spinner" /></div>
      ) : mappings.length === 0 ? (
        <div className="contabil-empty">Nenhum mapeamento de usuario encontrado</div>
      ) : (
        <div className="contabil-table-wrap">
          <table className="contabil-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Papel Contabil</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map(m => (
                <tr key={m.id}>
                  <td>{m.tronEmail || m.email || '-'}</td>
                  <td>
                    <select
                      className="contabil-select inline"
                      value={m.contabilRole || 'OPERATOR'}
                      onChange={e => handleRoleChange(m.id, e.target.value)}
                    >
                      {MAPPING_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${m.isActive !== false ? 'badge-green' : 'badge-red'}`}>
                      {m.isActive !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>{formatDate(m.createdAt)}</td>
                  <td>
                    <button className="btn-icon btn-danger" onClick={() => handleDelete(m.id)} title="Remover">
                      {Icons.trash}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'clients', label: 'Clientes' },
  { key: 'bills', label: 'Mensalidades' },
  { key: 'services', label: 'Servicos' },
  { key: 'import', label: 'Importar' },
  { key: 'mappings', label: 'Usuarios' },
];

export default function Contabil() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'dashboard';

  const setTab = (t) => {
    navigate(t === 'dashboard' ? '/admin/contabil' : `/admin/contabil/${t}`);
  };

  return (
    <AdminLayout>
      <div className="contabil-page">
        <div className="contabil-header">
          <h1>Contabilidade</h1>
          <p>Gestao contabil integrada</p>
        </div>

        <div className="contabil-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="contabil-content">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'clients' && <ClientsTab />}
          {activeTab === 'bills' && <BillsTab />}
          {activeTab === 'services' && <ServicesTab />}
          {activeTab === 'import' && <ImportTab />}
          {activeTab === 'mappings' && <MappingsTab />}
        </div>
      </div>
    </AdminLayout>
  );
}
