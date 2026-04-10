import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirm } from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { orgs, subscription as subscriptionApi } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './OrgSettings.css';

export function GeneralTab() {
  const { currentOrg, refreshOrg, hasOrgRole } = useOrg();
  const navigate = useNavigate();
  const [name, setName] = useState(currentOrg?.name || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const canEdit = hasOrgRole('owner', 'admin');
  const isOwner = hasOrgRole('owner');

  // Delete org state
  const [showDelete, setShowDelete] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(currentOrg?.name || '');
  }, [currentOrg]);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setMsg('');
    try {
      await orgs.uploadLogo(file);
      // Auto-switch sidebar to show logo + name if still on default
      const currentDisplay = currentOrg?.settings?.sidebar_display || 'platform';
      if (currentDisplay === 'platform') {
        await orgs.update({
          settings: { ...currentOrg?.settings, sidebar_display: 'logo_and_name' },
        });
      }
      await refreshOrg();
      setMsg('Logo atualizada!');
    } catch (err) {
      setMsg(err.message || 'Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    setMsg('');
    try {
      await orgs.removeLogo();
      // Revert sidebar to platform default since logo is gone
      await orgs.update({
        settings: { ...currentOrg?.settings, sidebar_display: 'platform' },
      });
      await refreshOrg();
      setMsg('Logo removida!');
    } catch (err) {
      setMsg(err.message || 'Erro ao remover logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      await orgs.update({ name: name.trim() });
      await refreshOrg();
      setMsg('Salvo com sucesso!');
    } catch (err) {
      setMsg(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirmName !== currentOrg?.name) return;
    setDeleting(true);
    try {
      await orgs.delete();
      // Full reload to reset org context
      window.location.href = '/admin';
    } catch (err) {
      setMsg(err.message || 'Erro ao excluir empresa');
      setDeleting(false);
    }
  };

  return (
    <div className="settings-section">
      <h3>Informações gerais</h3>
      <form onSubmit={handleSave} className="settings-form">
        <div className="settings-field">
          <label>Nome da empresa</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit || saving}
          />
        </div>
        <div className="settings-field">
          <label>Slug</label>
          <input type="text" value={currentOrg?.slug || ''} disabled />
          <span className="field-hint">O slug é gerado automaticamente</span>
        </div>

        {/* Logo */}
        <div className="settings-field">
          <label>Logo da empresa</label>
          <div className="org-logo-area">
            {currentOrg?.logo_url ? (
              <img src={currentOrg.logo_url} alt="Logo" className="org-logo-preview" />
            ) : (
              <div className="org-logo-placeholder">
                {currentOrg?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            {isOwner && (
              <div className="org-logo-actions">
                <label className="settings-btn primary sm" style={{ cursor: uploadingLogo ? 'not-allowed' : 'pointer' }}>
                  {uploadingLogo ? 'Enviando...' : currentOrg?.logo_url ? 'Trocar logo' : 'Enviar logo'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{ display: 'none' }}
                  />
                </label>
                {currentOrg?.logo_url && (
                  <button
                    type="button"
                    className="settings-btn danger sm"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                  >
                    Remover
                  </button>
                )}
              </div>
            )}
          </div>
          <span className="field-hint">JPEG, PNG, WebP ou SVG. Máximo 2MB.</span>
        </div>

        {msg && <div className={`settings-msg ${msg.includes('Erro') ? 'error' : 'success'}`}>{msg}</div>}
        {canEdit && (
          <button type="submit" className="settings-btn primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        )}
      </form>

      {isOwner && (
        <div className="danger-zone">
          <h3>Zona de perigo</h3>
          {!showDelete ? (
            <div className="danger-zone-row">
              <div>
                <strong>Excluir empresa</strong>
                <p>Todos os dados, membros e convites serão removidos permanentemente.</p>
              </div>
              <button className="settings-btn danger" onClick={() => setShowDelete(true)}>
                Excluir empresa
              </button>
            </div>
          ) : (
            <div className="danger-zone-confirm">
              <p>
                Digite <strong>{currentOrg?.name}</strong> para confirmar:
              </p>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={currentOrg?.name}
                autoFocus
              />
              <div className="danger-zone-actions">
                <button
                  className="settings-btn danger"
                  disabled={confirmName !== currentOrg?.name || deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
                <button className="settings-btn sm" onClick={() => { setShowDelete(false); setConfirmName(''); }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ALL_PERMISSIONS = [
  { key: 'instagram:schedule', label: 'Agendar posts Instagram' },
  { key: 'instagram:autoreply', label: 'Auto-resposta Instagram' },
  { key: 'instagram:leads', label: 'Leads Instagram' },
  { key: 'instagram:config', label: 'Configurar Instagram' },
  { key: 'meta_ads:manage', label: 'Gerenciar Meta Ads' },
  { key: 'meta_ads:budget', label: 'Alertas de orçamento' },
  { key: 'auto_boost:manage', label: 'Auto-boost' },
  { key: 'blog:manage', label: 'Blog' },
  { key: 'email:manage', label: 'Email Marketing' },
  { key: 'ai:generate', label: 'IA / Geração de conteúdo' },
];

export function MembersTab() {
  const { currentOrg, hasOrgRole, subscription, usage, refreshUsage } = useOrg();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [invitePerms, setInvitePerms] = useState([]);
  const [inviteMsg, setInviteMsg] = useState('');
  const [expandedMember, setExpandedMember] = useState(null);
  const canManage = hasOrgRole('owner', 'admin');

  const load = useCallback(async () => {
    try {
      const data = await orgs.listMembers();
      setMembers(data.members || []);
      setInvitations(data.invitations || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviteMsg('');
    try {
      const data = { email: email.trim(), org_role: role };
      if (role === 'member' && invitePerms.length > 0) {
        data.permissions = invitePerms;
      }
      await orgs.inviteMember(data);
      setEmail('');
      setInvitePerms([]);
      setShowInvite(false);
      await Promise.all([load(), refreshUsage()]);
    } catch (err) {
      setInviteMsg(err.message || 'Erro ao convidar');
    }
  };

  const handlePermissionToggle = async (uid, perm, currentPerms) => {
    const has = (currentPerms || []).includes(perm);
    const newPerms = has
      ? (currentPerms || []).filter(p => p !== perm)
      : [...(currentPerms || []), perm];
    try {
      await orgs.updateMemberPermissions(uid, newPerms);
      await load();
    } catch { /* ignore */ }
  };

  const confirm = useConfirm();
  const toast = useToast();
  const [resendingId, setResendingId] = useState(null);

  const handleRemove = async (uid) => {
    const ok = await confirm({ title: 'Remover membro', message: 'Tem certeza que deseja remover este membro da organização?', confirmText: 'Remover', variant: 'danger' });
    if (!ok) return;
    try {
      await orgs.removeMember(uid);
      await Promise.all([load(), refreshUsage()]);
    } catch { /* ignore */ }
  };

  const handleRoleChange = async (uid, newRole) => {
    try {
      await orgs.updateMemberRole(uid, newRole);
      await load();
    } catch { /* ignore */ }
  };

  const handleResendInvite = async (id, email) => {
    setResendingId(id);
    try {
      await orgs.resendInvitation(id);
      toast.success(`Convite reenviado para ${email}`);
    } catch (err) {
      toast.error(err.message || 'Erro ao reenviar convite');
    } finally {
      setResendingId(null);
    }
  };

  const handleCancelInvite = async (id, email) => {
    const ok = await confirm({
      title: 'Cancelar convite',
      message: `Cancelar o convite enviado para ${email}?`,
      confirmText: 'Cancelar convite',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await orgs.cancelInvitation(id);
      toast.success('Convite cancelado');
      await Promise.all([load(), refreshUsage()]);
    } catch (err) {
      toast.error(err.message || 'Erro ao cancelar convite');
    }
  };

  const memberLimit = usage?.limits?.max_members ?? 1;
  const memberCount = usage?.usage?.members ?? members.length;
  const atLimit = memberLimit !== -1 && memberCount >= memberLimit;

  if (loading) return <LoadingSkeleton variant="form" />;

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h3>Membros ({memberCount}{memberLimit !== -1 ? `/${memberLimit}` : ''})</h3>
        {canManage && (
          <button
            className="settings-btn primary sm"
            onClick={() => setShowInvite(true)}
            disabled={atLimit}
          >
            {atLimit ? 'Limite atingido' : 'Convidar membro'}
          </button>
        )}
      </div>

      {atLimit && (
        <div className="settings-upgrade-hint">
          Você atingiu o limite de membros do plano <strong>{subscription?.plan_id || 'free'}</strong>. Faça upgrade para adicionar mais.
        </div>
      )}

      {showInvite && (
        <form onSubmit={handleInvite} className="invite-form">
          <div className="invite-form-row">
            <input
              type="email"
              placeholder="Email do membro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
            <select value={role} onChange={(e) => { setRole(e.target.value); setInvitePerms([]); }}>
              <option value="member">Membro</option>
              <option value="admin">Admin</option>
              <option value="viewer">Visualizador</option>
            </select>
            <button type="submit" className="settings-btn primary sm">Enviar</button>
            <button type="button" className="settings-btn sm" onClick={() => setShowInvite(false)}>Cancelar</button>
          </div>
          {role === 'member' && (
            <div className="permissions-grid">
              <span className="permissions-label">Permissões:</span>
              {ALL_PERMISSIONS.map(p => (
                <label key={p.key} className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={invitePerms.includes(p.key)}
                    onChange={() => {
                      setInvitePerms(prev =>
                        prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key]
                      );
                    }}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          )}
          {inviteMsg && <span className="invite-error">{inviteMsg}</span>}
        </form>
      )}

      <div className="members-list">
        {members.map((m) => (
          <div key={m.user_id} className={`member-row-wrapper ${expandedMember === m.user_id ? 'expanded' : ''}`}>
            <div className="member-row">
              <div className="member-info">
                <strong>{m.name}</strong>
                <span>{m.email}</span>
              </div>
              <div className="member-actions">
                {canManage && m.org_role !== 'owner' ? (
                  <select
                    value={m.org_role}
                    onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Membro</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                ) : (
                  <span className="member-role">{m.org_role}</span>
                )}
                {canManage && m.org_role === 'member' && (
                  <button
                    className="settings-btn sm"
                    onClick={() => setExpandedMember(expandedMember === m.user_id ? null : m.user_id)}
                  >
                    {expandedMember === m.user_id ? 'Fechar' : 'Permissões'}
                  </button>
                )}
                {canManage && m.org_role !== 'owner' && (
                  <button className="member-remove" onClick={() => handleRemove(m.user_id)}>Remover</button>
                )}
              </div>
            </div>
            {canManage && m.org_role === 'member' && expandedMember === m.user_id && (
              <div className="permissions-grid member-permissions">
                {ALL_PERMISSIONS.map(p => (
                  <label key={p.key} className="permission-checkbox">
                    <input
                      type="checkbox"
                      checked={(m.permissions || []).includes(p.key)}
                      onChange={() => handlePermissionToggle(m.user_id, p.key, m.permissions)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <>
          <h4 className="invitations-title">Convites pendentes</h4>
          <div className="members-list">
            {invitations.filter(i => i.status === 'pending').map((inv) => (
              <div key={inv.id} className="member-row pending">
                <div className="member-info">
                  <strong>{inv.email}</strong>
                  <span>Convite enviado &middot; {inv.org_role}</span>
                </div>
                {canManage && (
                  <div className="member-actions">
                    <button
                      className="settings-btn sm"
                      onClick={() => handleResendInvite(inv.id, inv.email)}
                      disabled={resendingId === inv.id}
                      title="Reenviar email do convite"
                    >
                      {resendingId === inv.id ? 'Reenviando...' : 'Reenviar'}
                    </button>
                    <button
                      className="member-remove"
                      onClick={() => handleCancelInvite(inv.id, inv.email)}
                      title="Cancelar convite"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Default brand colors per theme ──
const DEFAULT_DARK = {
  primary_color: '#5b7cf7',
  sidebar_start: '#221a56',
  sidebar_end: '#1a1450',
  bg_color: '#161b26',
  bg_elevated: '#1c2233',
  text_color: '#e8ecf1',
  text_heading: '#f4f6f9',
  success_color: '#22c55e',
  danger_color: '#ef4444',
  warning_color: '#eab308',
};

const DEFAULT_LIGHT = {
  primary_color: '#3652d9',
  sidebar_start: '#2a3a8c',
  sidebar_end: '#1f2e72',
  bg_color: '#f0f2f5',
  bg_elevated: '#f8f9fb',
  text_color: '#2c3444',
  text_heading: '#1a2030',
  success_color: '#16a34a',
  danger_color: '#dc2626',
  warning_color: '#ca8a04',
};

const SIDEBAR_DISPLAY_OPTIONS = [
  { value: 'platform', label: 'Padrão (W / whodo)' },
  { value: 'logo', label: 'Apenas logo da empresa' },
  { value: 'name', label: 'Apenas nome da empresa' },
  { value: 'logo_and_name', label: 'Logo + nome da empresa' },
];

function ColorField({ label, value, onChange, defaultVal }) {
  return (
    <div className="brand-color-field">
      <label>{label}</label>
      <div className="brand-color-input-row">
        <input
          type="color"
          value={value || defaultVal}
          onChange={(e) => onChange(e.target.value)}
          className="brand-color-picker"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={defaultVal}
          maxLength={7}
          className="brand-color-hex"
        />
      </div>
    </div>
  );
}

const EMPTY_COLORS = {
  primary_color: '', sidebar_start: '', sidebar_end: '',
  bg_color: '', bg_elevated: '', text_color: '', text_heading: '',
  success_color: '', danger_color: '', warning_color: '',
};

function ColorSection({ colors, defaults, setColor }) {
  return (
    <>
      <div className="brand-color-group">
        <span className="brand-color-group-label">Cor principal</span>
        <ColorField label="Destaque (botões, links)" value={colors.primary_color} onChange={setColor('primary_color')} defaultVal={defaults.primary_color} />
      </div>
      <div className="brand-color-group">
        <span className="brand-color-group-label">Sidebar</span>
        <div className="brand-color-group-row">
          <ColorField label="Início gradiente" value={colors.sidebar_start} onChange={setColor('sidebar_start')} defaultVal={defaults.sidebar_start} />
          <ColorField label="Fim gradiente" value={colors.sidebar_end} onChange={setColor('sidebar_end')} defaultVal={defaults.sidebar_end} />
        </div>
      </div>
      <div className="brand-color-group">
        <span className="brand-color-group-label">Fundo</span>
        <div className="brand-color-group-row">
          <ColorField label="Principal" value={colors.bg_color} onChange={setColor('bg_color')} defaultVal={defaults.bg_color} />
          <ColorField label="Cards / superfícies" value={colors.bg_elevated} onChange={setColor('bg_elevated')} defaultVal={defaults.bg_elevated} />
        </div>
      </div>
      <div className="brand-color-group">
        <span className="brand-color-group-label">Texto</span>
        <div className="brand-color-group-row">
          <ColorField label="Texto principal" value={colors.text_color} onChange={setColor('text_color')} defaultVal={defaults.text_color} />
          <ColorField label="Títulos" value={colors.text_heading} onChange={setColor('text_heading')} defaultVal={defaults.text_heading} />
        </div>
      </div>
      <div className="brand-color-group">
        <span className="brand-color-group-label">Status</span>
        <div className="brand-color-group-row brand-color-group-3">
          <ColorField label="Sucesso" value={colors.success_color} onChange={setColor('success_color')} defaultVal={defaults.success_color} />
          <ColorField label="Perigo" value={colors.danger_color} onChange={setColor('danger_color')} defaultVal={defaults.danger_color} />
          <ColorField label="Aviso" value={colors.warning_color} onChange={setColor('warning_color')} defaultVal={defaults.warning_color} />
        </div>
      </div>
    </>
  );
}

export function AppearanceTab() {
  const { currentOrg, refreshOrg, hasOrgRole } = useOrg();
  const { theme, setTheme } = useTheme();
  const confirm = useConfirm();
  const canEdit = hasOrgRole('owner');

  const [editingTheme, setEditingTheme] = useState('dark');
  const [sidebarDisplay, setSidebarDisplay] = useState('platform');
  const [darkColors, setDarkColors] = useState({ ...EMPTY_COLORS });
  const [lightColors, setLightColors] = useState({ ...EMPTY_COLORS });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const s = currentOrg?.settings;
    const loadColors = (bc) => ({
      primary_color: bc?.primary_color || '',
      sidebar_start: bc?.sidebar_start || '',
      sidebar_end: bc?.sidebar_end || '',
      bg_color: bc?.bg_color || '',
      bg_elevated: bc?.bg_elevated || '',
      text_color: bc?.text_color || '',
      text_heading: bc?.text_heading || '',
      success_color: bc?.success_color || '',
      danger_color: bc?.danger_color || '',
      warning_color: bc?.warning_color || '',
    });
    setDarkColors(loadColors(s?.brand_colors_dark));
    setLightColors(loadColors(s?.brand_colors_light));
    setSidebarDisplay(s?.sidebar_display || 'platform');
  }, [currentOrg]);

  const activeColors = editingTheme === 'dark' ? darkColors : lightColors;
  const setActiveColors = editingTheme === 'dark' ? setDarkColors : setLightColors;
  const activeDefaults = editingTheme === 'dark' ? DEFAULT_DARK : DEFAULT_LIGHT;

  const setColor = (key) => (v) => setActiveColors(c => ({ ...c, [key]: v }));

  const buildPayload = (colors) => {
    const out = {};
    for (const [k, v] of Object.entries(colors)) {
      if (v) out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await orgs.update({
        settings: {
          ...currentOrg?.settings,
          brand_colors_dark: buildPayload(darkColors),
          brand_colors_light: buildPayload(lightColors),
          sidebar_display: sidebarDisplay,
        },
      });
      await refreshOrg();
      setMsg('Aparência salva!');
    } catch (err) {
      setMsg(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Restaurar padrão',
      message: 'Todas as cores personalizadas (escuro e claro) e a configuração do menu lateral serão redefinidas para o padrão. Deseja continuar?',
      confirmText: 'Restaurar',
      variant: 'danger',
    });
    if (!ok) return;
    setSaving(true);
    setMsg('');
    try {
      await orgs.update({
        settings: {
          ...currentOrg?.settings,
          brand_colors_dark: null,
          brand_colors_light: null,
          sidebar_display: 'platform',
        },
      });
      setDarkColors({ ...EMPTY_COLORS });
      setLightColors({ ...EMPTY_COLORS });
      setSidebarDisplay('platform');
      await refreshOrg();
      setMsg('Restaurado ao padrão!');
    } catch (err) {
      setMsg(err.message || 'Erro ao restaurar');
    } finally {
      setSaving(false);
    }
  };

  const p = (key) => activeColors[key] || activeDefaults[key];

  return (
    <div className="settings-section">
      <h3>Aparência</h3>

      {/* User theme toggle */}
      <div className="brand-color-group" style={{ marginBottom: '1.5rem' }}>
        <span className="brand-color-group-label">Seu tema</span>
        <div className="settings-field">
          <select value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="dark">Escuro</option>
            <option value="light">Claro</option>
          </select>
          <span className="field-hint">Preferência pessoal — cada membro escolhe o seu.</span>
        </div>
      </div>

      {canEdit && (
        <>
          <p className="appearance-desc">
            Configure as cores para cada tema. Todos os membros verão as cores abaixo conforme o tema que escolherem.
          </p>

          {/* Sidebar display */}
          <div className="brand-color-group">
            <span className="brand-color-group-label">Menu lateral</span>
            <div className="settings-field">
              <label>O que exibir no topo</label>
              <select value={sidebarDisplay} onChange={(e) => setSidebarDisplay(e.target.value)}>
                {SIDEBAR_DISPLAY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {sidebarDisplay !== 'platform' && sidebarDisplay !== 'name' && !currentOrg?.logo_url && (
                <span className="field-hint">Adicione uma logo na aba Empresa para usar esta opção.</span>
              )}
            </div>
          </div>

          {/* Theme variant tabs */}
          <div className="brand-theme-tabs">
            <button
              type="button"
              className={`brand-theme-tab ${editingTheme === 'dark' ? 'active' : ''}`}
              onClick={() => setEditingTheme('dark')}
            >
              Cores — Escuro
            </button>
            <button
              type="button"
              className={`brand-theme-tab ${editingTheme === 'light' ? 'active' : ''}`}
              onClick={() => setEditingTheme('light')}
            >
              Cores — Claro
            </button>
          </div>

          {/* Preview */}
          <div className="brand-preview-card">
            <div className="brand-preview-sidebar" style={{ background: `linear-gradient(180deg, ${p('sidebar_start')} 0%, ${p('sidebar_end')} 100%)` }}>
              <div className="brand-preview-logo">{currentOrg?.name?.charAt(0) || 'T'}</div>
              <div className="brand-preview-nav">
                <div className="brand-preview-nav-item" />
                <div className="brand-preview-nav-item active" style={{ borderLeftColor: p('primary_color') }} />
                <div className="brand-preview-nav-item" />
              </div>
            </div>
            <div className="brand-preview-content" style={{ background: p('bg_color') }}>
              <div className="brand-preview-topbar" style={{ background: p('bg_elevated') }} />
              <div className="brand-preview-body">
                <div className="brand-preview-title" style={{ background: p('text_heading'), opacity: 0.3 }} />
                <div className="brand-preview-btn" style={{ background: p('primary_color') }} />
                <div className="brand-preview-lines">
                  <div style={{ background: p('text_color'), opacity: 0.15 }} />
                  <div style={{ background: p('text_color'), opacity: 0.15 }} />
                </div>
                <div className="brand-preview-badges">
                  <span style={{ background: p('success_color') }} />
                  <span style={{ background: p('warning_color') }} />
                  <span style={{ background: p('danger_color') }} />
                </div>
              </div>
            </div>
          </div>

          {/* Color pickers */}
          <form onSubmit={handleSave} className="settings-form brand-colors-form">
            <ColorSection colors={activeColors} defaults={activeDefaults} setColor={setColor} />

            {msg && <div className={`settings-msg ${msg.includes('Erro') ? 'error' : 'success'}`}>{msg}</div>}

            <div className="brand-actions">
              <button type="submit" className="settings-btn primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar aparência'}
              </button>
              <button type="button" className="settings-btn" onClick={handleReset} disabled={saving}>
                Restaurar padrão
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export function BillingTab() {
  const { subscription, usage, refreshUsage } = useOrg();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [canceling, setCanceling] = useState(false);

  const plan = subscription?.plan_id || 'free';
  const status = subscription?.status || 'active';

  const handleCancel = async () => {
    const ok = await confirm({
      title: 'Cancelar plano',
      message: 'Tem certeza que deseja cancelar o plano? Suas ferramentas pagas serão bloqueadas imediatamente e o acesso será revertido para o plano Free.',
      confirmText: 'Cancelar plano',
      cancelText: 'Manter plano',
      variant: 'danger',
    });
    if (!ok) return;
    setCanceling(true);
    try {
      await subscriptionApi.cancel();
      await refreshUsage();
    } catch { /* ignore */ }
    setCanceling(false);
  };

  const usageItems = usage ? [
    { label: 'Membros', current: usage.usage?.members, max: usage.limits?.max_members },
    { label: 'Posts agendados', current: usage.usage?.scheduled_posts, max: usage.limits?.max_scheduled_posts },
    { label: 'Regras auto-resposta', current: usage.usage?.auto_reply_rules, max: usage.limits?.max_auto_reply_rules },
    { label: 'Regras auto-boost', current: usage.usage?.auto_boost_rules, max: usage.limits?.max_auto_boost_rules },
    { label: 'Alertas de orçamento', current: usage.usage?.budget_alerts, max: usage.limits?.max_budget_alerts },
    { label: 'Campanhas', current: usage.usage?.campaigns, max: usage.limits?.max_campaigns },
    { label: 'Publicações integradas', current: usage.usage?.integrated_pubs, max: usage.limits?.max_integrated_pubs },
  ] : [];

  return (
    <div className="settings-section">
      <h3>Plano & Faturamento</h3>

      <div className="billing-plan-card">
        <div className="billing-plan-info">
          <span className="billing-plan-name">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
          <span className={`billing-status ${status}`}>{status === 'active' ? 'Ativo' : status === 'canceled' ? 'Cancelado' : status}</span>
        </div>
        <div className="billing-plan-actions">
          {plan !== 'enterprise' && (
            <button className="settings-btn primary sm" onClick={() => navigate('/admin/checkout')}>
              {plan === 'free' ? 'Fazer upgrade' : 'Mudar plano'}
            </button>
          )}
          {plan !== 'free' && status === 'active' && (
            <button className="settings-btn danger sm" onClick={handleCancel} disabled={canceling}>
              {canceling ? 'Cancelando...' : 'Cancelar plano'}
            </button>
          )}
        </div>
      </div>

      {usageItems.length > 0 && (
        <div className="usage-section">
          <h4>Uso atual</h4>
          <div className="usage-bars">
            {usageItems.map((item) => {
              const unlimited = item.max === -1;
              const pct = unlimited ? 0 : (item.max > 0 ? Math.min((item.current / item.max) * 100, 100) : 0);
              const warn = !unlimited && pct >= 80;
              return (
                <div key={item.label} className="usage-item">
                  <div className="usage-label">
                    <span>{item.label}</span>
                    <span className="usage-count">
                      {item.current ?? 0} / {unlimited ? 'Ilimitado' : item.max}
                    </span>
                  </div>
                  <div className="usage-bar">
                    <div
                      className={`usage-bar-fill ${warn ? 'warn' : ''}`}
                      style={{ width: unlimited ? '0%' : `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgSettings() {
  const [tab, setTab] = useState('general');
  const { hasOrgRole } = useOrg();

  const tabs = [
    { id: 'general', label: 'Geral' },
    { id: 'appearance', label: 'Aparência' },
    { id: 'members', label: 'Membros' },
    { id: 'billing', label: 'Plano & Faturamento' },
  ];

  return (
    <AdminLayout>
      <div className="org-settings-page">
        <h1>Configurações</h1>

        <div className="settings-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`settings-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {tab === 'general' && <GeneralTab />}
          {tab === 'appearance' && <AppearanceTab />}
          {tab === 'members' && <MembersTab />}
          {tab === 'billing' && <BillingTab />}
        </div>
      </div>
    </AdminLayout>
  );
}
