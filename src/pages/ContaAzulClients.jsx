import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { contaAzul } from '../services/api';
import PortalThemeEditor from '../components/PortalThemeEditor';
import './ContaAzulClients.css';

// ── Constants ────────────────────────────────────────────────────────

const DASHBOARD_OPTIONS = [
  { key: 'revenue',    label: 'Receita' },
  { key: 'expense',    label: 'Despesa' },
  { key: 'profit',     label: 'Lucro' },
  { key: 'cashflow',   label: 'Fluxo de Caixa' },
  { key: 'categories', label: 'Categorias DRE' },
  { key: 'upcoming',   label: 'Próximos vencimentos' },
];

// Stable avatar color from a string
const AVATAR_PALETTE = [
  ['#4f46e5', '#7c3aed'], ['#0ea5e9', '#2563eb'],
  ['#10b981', '#059669'], ['#f59e0b', '#d97706'],
  ['#ef4444', '#dc2626'], ['#ec4899', '#db2777'],
  ['#8b5cf6', '#6d28d9'], ['#14b8a6', '#0d9488'],
];
const avatarGradient = (s) => {
  const h = [...(s || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [from, to] = AVATAR_PALETTE[h % AVATAR_PALETTE.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
};

const initialsOf = (name) =>
  (name || 'C').split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

const fmtDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (isNaN(date)) return null;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Icons ────────────────────────────────────────────────────────────

const Icon = {
  plus:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  key:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  palette: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2a10 10 0 0 0 0 20c.5 0 1-.5 1-1 0-.4-.2-.7-.4-1-.3-.4-.6-.8-.6-1.4 0-1 .9-1.6 1.8-1.6h2.2c2.7 0 5-2.2 5-5 0-4.4-4.5-8-10-8z"/></svg>,
  power: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1.5 14a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  users: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  warning: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  userPlus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  keyLarge: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
};

// ══════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function ContaAzulClients() {
  const toast = useToast();
  const confirm = useConfirm();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialFormState());
  const [saving, setSaving] = useState(false);

  const [importing, setImporting] = useState(null);
  const [importForm, setImportForm] = useState({ access_token: '', refresh_token: '', expires_in: 3600 });
  const [importSaving, setImportSaving] = useState(false);

  // Theme editor — `themeEditor` carries scope + target client + initial draft
  const [themeEditor, setThemeEditor] = useState(null);
  const [orgTheme, setOrgTheme] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await contaAzul.listClients();
      setClients(res.end_clients || []);
    } catch (err) {
      toast.error(err.message || 'Falha ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    contaAzul.getOrgTheme().then(setOrgTheme).catch(() => {});
  }, []);

  // ── Theme handlers ──
  const openOrgTheme = () => {
    setThemeEditor({ scope: 'org', scopeLabel: 'Empresa', initial: orgTheme || {}, client: null });
  };
  const openClientTheme = (client) => {
    setThemeEditor({
      scope: 'client',
      scopeLabel: client.name,
      initial: client.portal_theme || {},
      client,
    });
  };
  const saveTheme = async (payload) => {
    try {
      if (themeEditor.scope === 'org') {
        const saved = await contaAzul.saveOrgTheme(payload);
        setOrgTheme(saved || payload);
        toast.success('Tema padrão da empresa salvo');
      } else {
        await contaAzul.setClientTheme(themeEditor.client.id, payload);
        toast.success(`Tema de ${themeEditor.client.name} salvo`);
        load();
      }
      setThemeEditor(null);
    } catch (e) {
      toast.error(e.message || 'Falha ao salvar tema');
    }
  };
  const clearTheme = async () => {
    try {
      if (themeEditor.scope === 'org') {
        await contaAzul.saveOrgTheme({});
        setOrgTheme({});
        toast.success('Tema padrão resetado para o sistema');
      } else {
        await contaAzul.setClientTheme(themeEditor.client.id, null);
        toast.success(`Override de ${themeEditor.client.name} removido`);
        load();
      }
      setThemeEditor(null);
    } catch (e) {
      toast.error(e.message || 'Falha ao limpar tema');
    }
  };

  // ── Create ──
  const toggleAccess = (key) => {
    setForm((f) => ({
      ...f,
      dashboardAccess: f.dashboardAccess.includes(key)
        ? f.dashboardAccess.filter((k) => k !== key)
        : [...f.dashboardAccess, key],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await contaAzul.createClient({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        document: form.document || undefined,
        dashboard_access: form.dashboardAccess,
      });
      toast.success('Cliente cadastrado');
      setShowForm(false);
      setForm(initialFormState());
      load();
    } catch (err) {
      toast.error(err.message || 'Falha ao cadastrar cliente');
    } finally {
      setSaving(false);
    }
  };

  // ── Import tokens ──
  const openImport = (client) => {
    setImporting(client);
    setImportForm({ access_token: '', refresh_token: '', expires_in: 3600 });
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setImportSaving(true);
    try {
      await contaAzul.importTokens(importing.id, {
        access_token: importForm.access_token.trim(),
        refresh_token: importForm.refresh_token.trim() || undefined,
        expires_in: Number(importForm.expires_in) || 3600,
        scope: 'aws.cognito.signin.user.admin',
      });
      toast.success('Tokens importados — cliente conectado');
      setImporting(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Falha ao importar tokens');
    } finally {
      setImportSaving(false);
    }
  };

  // ── Toggle active ──
  const handleToggleActive = async (client) => {
    const nextActive = !client.is_active;
    if (!nextActive) {
      const ok = await confirm({
        title: 'Desativar cliente?',
        message: `${client.name} não conseguirá mais entrar no portal e sessões ativas serão encerradas. Você pode reativar quando quiser.`,
        confirmText: 'Desativar',
        variant: 'danger',
      });
      if (!ok) return;
    }
    try {
      await contaAzul.setActive(client.id, nextActive);
      toast.success(nextActive ? 'Cliente ativado' : 'Cliente desativado');
      load();
    } catch (err) {
      toast.error(err.message || 'Falha ao atualizar status');
    }
  };

  // ── Delete ──
  const handleDelete = async (client) => {
    const ok = await confirm({
      title: 'Remover cliente?',
      message: `Tem certeza que deseja remover "${client.name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Remover',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await contaAzul.deleteClient(client.id);
      toast.success('Cliente removido');
      load();
    } catch (err) {
      toast.error(err.message || 'Falha ao remover');
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════

  return (
    <AdminLayout>
      <div className="cac-root">
        <header className="cac-header">
          <div>
            <h1 className="cac-title">Conta Azul — Clientes</h1>
            <p className="cac-subtitle">
              Cadastre clientes-finais para acessarem o próprio dashboard financeiro via portal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="cac-btn cac-btn-ghost" onClick={openOrgTheme}>
              {Icon.palette} Tema padrão
            </button>
            <button className="cac-btn cac-btn-primary" onClick={() => setShowForm(true)}>
              {Icon.plus} Novo cliente
            </button>
          </div>
        </header>

        {loading ? (
          <div className="cac-empty">Carregando…</div>
        ) : clients.length === 0 ? (
          <div className="cac-empty">
            <div className="cac-empty-icon">{Icon.users}</div>
            <h2>Nenhum cliente cadastrado</h2>
            <p>
              Cadastre seu primeiro cliente. Depois disso ele receberá um link do portal
              onde poderá autorizar o acesso à Conta Azul dele.
            </p>
            <button className="cac-btn cac-btn-primary" onClick={() => setShowForm(true)}>
              {Icon.plus} Cadastrar primeiro cliente
            </button>
          </div>
        ) : (
          <div className="cac-table-wrap">
            <table className="cac-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Conta Azul</th>
                  <th>Último acesso</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cac-identity">
                        <div className="cac-avatar" style={{ background: avatarGradient(c.email) }}>
                          {initialsOf(c.name)}
                        </div>
                        <div className="cac-identity-text">
                          <span className="cac-identity-name">{c.name}</span>
                          <span className="cac-identity-email">{c.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`cac-badge ${c.is_active ? 'success' : 'muted'}`}>
                        <span className={`cac-dot ${c.is_active ? 'success' : 'muted'}`} />
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <span className={`cac-badge ${c.has_conta_azul ? 'success' : 'warn'}`}>
                        <span className={`cac-dot ${c.has_conta_azul ? 'success' : 'warn'}`} />
                        {c.has_conta_azul ? 'Conectado' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <span className="cac-date">{fmtDate(c.last_login_at) || '—'}</span>
                    </td>
                    <td>
                      <div className="cac-actions">
                        <button
                          className="cac-iaction primary"
                          onClick={() => openClientTheme(c)}
                          data-tip={c.portal_theme ? 'Editar tema (override ativo)' : 'Personalizar tema'}
                          aria-label="Tema do cliente"
                        >
                          {Icon.palette}
                        </button>
                        <button
                          className="cac-iaction primary"
                          onClick={() => openImport(c)}
                          data-tip="Importar tokens (dev)"
                          aria-label="Importar tokens"
                        >
                          {Icon.key}
                        </button>
                        <button
                          className={`cac-iaction ${c.is_active ? '' : 'success'}`}
                          onClick={() => handleToggleActive(c)}
                          data-tip={c.is_active ? 'Desativar acesso' : 'Reativar acesso'}
                          aria-label={c.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {Icon.power}
                        </button>
                        <button
                          className="cac-iaction danger"
                          onClick={() => handleDelete(c)}
                          data-tip="Remover"
                          aria-label="Remover"
                        >
                          {Icon.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Modal: Novo cliente ── */}
        {showForm && (
          <div className="cac-modal-overlay" onClick={() => setShowForm(false)}>
            <form className="cac-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
              <div className="cac-modal-header">
                <div>
                  <h2>Novo cliente</h2>
                  <p className="cac-modal-subtitle">
                    A senha aqui é a inicial pra ele entrar no portal. Depois do primeiro login,
                    ele autoriza a Conta Azul via OAuth.
                  </p>
                </div>
              </div>

              <div className="cac-field">
                <label>Nome*</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required autoFocus />
              </div>

              <div className="cac-field-row">
                <div className="cac-field">
                  <label>E-mail*</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="cac-field">
                  <label>Senha inicial*</label>
                  <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
                </div>
              </div>

              <div className="cac-field-row">
                <div className="cac-field">
                  <label>Telefone</label>
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
                <div className="cac-field">
                  <label>CPF / CNPJ</label>
                  <input value={form.document} onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))} />
                </div>
              </div>

              <div className="cac-field">
                <label>Widgets do dashboard</label>
                <div className="cac-checks">
                  {DASHBOARD_OPTIONS.map((opt) => (
                    <label key={opt.key} className="cac-check">
                      <input type="checkbox" checked={form.dashboardAccess.includes(opt.key)} onChange={() => toggleAccess(opt.key)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="cac-field-hint">O cliente só verá os widgets que você marcar.</div>
              </div>

              <div className="cac-modal-actions">
                <button type="button" className="cac-btn cac-btn-ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="cac-btn cac-btn-primary" disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Salvando…' : 'Cadastrar cliente'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Modal: Importar tokens ── */}
        {importing && (
          <div className="cac-modal-overlay" onClick={() => setImporting(null)}>
            <form className="cac-modal wide" onClick={(e) => e.stopPropagation()} onSubmit={handleImport}>
              <div className="cac-modal-header">
                <div>
                  <h2>Importar tokens — {importing.name}</h2>
                  <p className="cac-modal-subtitle">
                    Cola um access_token (e refresh_token se tiver) gerado manualmente no devportal da Conta Azul.
                    Pula o fluxo OAuth completo.
                  </p>
                </div>
              </div>

              <div className="cac-warn-strip">
                <div style={{ flexShrink: 0, marginTop: 1 }}>{Icon.warning}</div>
                <div>
                  Apenas em desenvolvimento. Em produção, a conexão deve ser sempre via OAuth no portal do cliente —
                  evita você ter custódia da senha dele e mantém a auditoria.
                </div>
              </div>

              <div className="cac-field">
                <label>access_token*</label>
                <textarea
                  rows={4}
                  value={importForm.access_token}
                  onChange={(e) => setImportForm((f) => ({ ...f, access_token: e.target.value }))}
                  required
                  placeholder="eyJraWQiOiJUa1BR..."
                />
              </div>

              <div className="cac-field">
                <label>refresh_token (opcional)</label>
                <textarea
                  rows={3}
                  value={importForm.refresh_token}
                  onChange={(e) => setImportForm((f) => ({ ...f, refresh_token: e.target.value }))}
                  placeholder="Deixe vazio se não tiver — sem refresh_token o dashboard para de funcionar quando o access expirar"
                />
              </div>

              <div className="cac-field">
                <label>expires_in (segundos)</label>
                <input
                  type="number"
                  value={importForm.expires_in}
                  onChange={(e) => setImportForm((f) => ({ ...f, expires_in: e.target.value }))}
                  style={{ maxWidth: 200 }}
                />
                <div className="cac-field-hint">Padrão Conta Azul: 3600 (1 hora)</div>
              </div>

              <div className="cac-modal-actions">
                <button type="button" className="cac-btn cac-btn-ghost" onClick={() => setImporting(null)}>
                  Cancelar
                </button>
                <button type="submit" className="cac-btn cac-btn-primary" disabled={importSaving} style={{ opacity: importSaving ? 0.6 : 1 }}>
                  {importSaving ? 'Importando…' : 'Importar e conectar'}
                </button>
              </div>
            </form>
          </div>
        )}
        <PortalThemeEditor
          open={!!themeEditor}
          scope={themeEditor?.scope}
          scopeLabel={themeEditor?.scopeLabel}
          initial={themeEditor?.initial}
          fallback={themeEditor?.scope === 'client' ? orgTheme : undefined}
          onClose={() => setThemeEditor(null)}
          onSave={saveTheme}
          onClear={clearTheme}
        />
      </div>
    </AdminLayout>
  );
}

function initialFormState() {
  return {
    name: '',
    email: '',
    password: '',
    phone: '',
    document: '',
    dashboardAccess: DASHBOARD_OPTIONS.map((o) => o.key),
  };
}
