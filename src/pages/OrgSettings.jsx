import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { orgs, subscription as subscriptionApi } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import './OrgSettings.css';

export function GeneralTab() {
  const { currentOrg, refreshOrg, hasOrgRole } = useOrg();
  const navigate = useNavigate();
  const [name, setName] = useState(currentOrg?.name || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const canEdit = hasOrgRole('owner', 'admin');
  const isOwner = hasOrgRole('owner');

  // Delete org state
  const [showDelete, setShowDelete] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(currentOrg?.name || '');
  }, [currentOrg]);

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

export function MembersTab() {
  const { currentOrg, hasOrgRole, subscription, usage, refreshUsage } = useOrg();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviteMsg, setInviteMsg] = useState('');
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
      await orgs.inviteMember({ email: email.trim(), org_role: role });
      setEmail('');
      setShowInvite(false);
      await Promise.all([load(), refreshUsage()]);
    } catch (err) {
      setInviteMsg(err.message || 'Erro ao convidar');
    }
  };

  const handleRemove = async (uid) => {
    if (!window.confirm('Remover este membro?')) return;
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

  const memberLimit = usage?.limits?.max_members ?? 1;
  const memberCount = usage?.usage?.members ?? members.length;
  const atLimit = memberLimit !== -1 && memberCount >= memberLimit;

  if (loading) return <div className="settings-loading">Carregando...</div>;

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
          <input
            type="email"
            placeholder="Email do membro"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">Membro</option>
            <option value="admin">Admin</option>
            <option value="viewer">Visualizador</option>
          </select>
          <button type="submit" className="settings-btn primary sm">Enviar</button>
          <button type="button" className="settings-btn sm" onClick={() => setShowInvite(false)}>Cancelar</button>
          {inviteMsg && <span className="invite-error">{inviteMsg}</span>}
        </form>
      )}

      <div className="members-list">
        {members.map((m) => (
          <div key={m.user_id} className="member-row">
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
              {canManage && m.org_role !== 'owner' && (
                <button className="member-remove" onClick={() => handleRemove(m.user_id)}>Remover</button>
              )}
            </div>
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function BillingTab() {
  const { subscription, usage, refreshUsage } = useOrg();
  const navigate = useNavigate();
  const [canceling, setCanceling] = useState(false);

  const plan = subscription?.plan_id || 'free';
  const status = subscription?.status || 'active';

  const handleCancel = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar o plano? Você manterá acesso até o final do período.')) return;
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
            <button className="settings-btn primary sm" onClick={() => navigate('/planos')}>
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
          {tab === 'members' && <MembersTab />}
          {tab === 'billing' && <BillingTab />}
        </div>
      </div>
    </AdminLayout>
  );
}
