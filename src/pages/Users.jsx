import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { users, orgs, platform } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './Users.css';

const ORG_ROLES = ['owner', 'admin', 'member', 'viewer'];
const ORG_LABELS = { owner: 'Proprietário', admin: 'Admin', member: 'Membro', viewer: 'Visualizador' };

function PlatformView() {
  const [orgsList, setOrgsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await platform.orgsWithMembers();
      setOrgsList(data.organizations || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return email?.charAt(0).toUpperCase() || '?';
  };

  // Flatten: one row per member, grouped visually by org
  const rows = [];
  for (const org of orgsList) {
    for (const m of org.members) {
      rows.push({ ...m, orgName: org.name, orgId: org.id });
    }
  }

  // Filter
  const filtered = search.trim()
    ? rows.filter(r => {
        const q = search.toLowerCase();
        return r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.orgName?.toLowerCase().includes(q);
      })
    : rows;

  // Group by org for display
  const grouped = [];
  let lastOrg = null;
  for (const r of filtered) {
    if (r.orgId !== lastOrg) {
      grouped.push({ type: 'org', name: r.orgName, id: r.orgId });
      lastOrg = r.orgId;
    }
    grouped.push({ type: 'member', ...r });
  }

  const orgCount = orgsList.length;
  const memberCount = filtered.length;

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Empresas & Membros</h1>
          <p>{orgCount} empresa{orgCount !== 1 ? 's' : ''} &middot; {memberCount} membro{memberCount !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="users-filters">
        <form onSubmit={(e) => e.preventDefault()} className="search-form">
          <input
            type="text"
            placeholder="Buscar empresa, nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </form>
      </div>

      {error && <div className="users-error">{error}</div>}

      {loading ? (
        <LoadingSkeleton variant="list" />
      ) : filtered.length === 0 ? (
        <div className="users-empty">Nenhum resultado encontrado</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Email</th>
                  <th>Empresa</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={`${r.user_id}-${r.orgId}-${i}`}>
                    <td className="user-cell">
                      {r.avatar ? (
                        <img src={r.avatar} alt={r.name} className="user-avatar" />
                      ) : (
                        <div className="user-initials">{getInitials(r.name, r.email)}</div>
                      )}
                      <span className="user-name">{r.name || '-'}</span>
                    </td>
                    <td>{r.email}</td>
                    <td><span className="org-name-cell">{r.orgName}</span></td>
                    <td>
                      <span className={`role-badge role-${r.org_role}`}>
                        {ORG_LABELS[r.org_role] || r.org_role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="users-cards">
            {grouped.map((item, i) => (
              item.type === 'org' ? (
                <div key={`org-${item.id}`} className="mobile-org-divider">
                  {item.name}
                </div>
              ) : (
                <div key={`${item.user_id}-${item.orgId}-${i}`} className="user-card">
                  <div className="user-card-header">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="user-avatar" />
                    ) : (
                      <div className="user-initials">{getInitials(item.name, item.email)}</div>
                    )}
                    <div className="user-card-info">
                      <span className="user-name">{item.name || '-'}</span>
                      <span className="user-email">{item.email}</span>
                    </div>
                    <span className={`role-badge role-${item.org_role}`}>
                      {ORG_LABELS[item.org_role] || item.org_role}
                    </span>
                  </div>
                </div>
              )
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrgMembersView() {
  const { hasOrgRole, usage, refreshUsage, subscription } = useOrg();
  const [userList, setUserList] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('member');
  const [inviting, setInviting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orgs.listMembers();
      let members = data.members || [];
      if (search) {
        const q = search.toLowerCase();
        members = members.filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
      }
      if (roleFilter) members = members.filter(m => m.org_role === roleFilter);
      setUserList(members);
      setInvitations((data.invitations || []).filter(i => i.status === 'pending'));
    } catch (err) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOrgRoleChange = async (uid, newRole) => {
    setUpdatingId(uid);
    try {
      await orgs.updateMemberRole(uid, newRole);
      setSuccess('Role atualizada');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) { setError(err.message || 'Erro ao atualizar role'); }
    finally { setUpdatingId(null); }
  };

  const handleRemoveMember = async (uid, name) => {
    if (!window.confirm(`Remover ${name || 'este membro'}?`)) return;
    try {
      await orgs.removeMember(uid);
      setSuccess('Membro removido');
      setTimeout(() => setSuccess(''), 3000);
      await Promise.all([fetchData(), refreshUsage()]);
    } catch (err) { setError(err.message || 'Erro ao remover'); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!invEmail.trim()) return;
    setInviting(true);
    setError('');
    try {
      await orgs.inviteMember({ email: invEmail.trim(), org_role: invRole });
      setInvEmail('');
      setShowInvite(false);
      setSuccess('Convite enviado');
      setTimeout(() => setSuccess(''), 3000);
      await Promise.all([fetchData(), refreshUsage()]);
    } catch (err) { setError(err.message || 'Erro ao convidar'); }
    finally { setInviting(false); }
  };

  const getInitials = (name, email) => {
    if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    return email?.charAt(0).toUpperCase() || '?';
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');
  const total = userList.length;
  const memberLimit = usage?.limits?.max_members ?? 1;
  const memberCount = usage?.usage?.members ?? 0;
  const atLimit = memberLimit !== -1 && memberCount >= memberLimit;
  const canManage = hasOrgRole('owner', 'admin');

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Membros da Empresa</h1>
          <p>{total} membro{total !== 1 ? 's' : ''}{memberLimit !== -1 ? ` / ${memberLimit} do plano` : ''}</p>
        </div>
        {canManage && (
          <button className="invite-btn" onClick={() => setShowInvite(true)} disabled={atLimit}>
            {atLimit ? 'Limite atingido' : '+ Convidar'}
          </button>
        )}
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="invite-form-bar">
          <input type="email" placeholder="Email do membro" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} autoFocus />
          <select value={invRole} onChange={(e) => setInvRole(e.target.value)}>
            <option value="member">Membro</option>
            <option value="admin">Admin</option>
            <option value="viewer">Visualizador</option>
          </select>
          <button type="submit" className="search-button" disabled={inviting}>{inviting ? 'Enviando...' : 'Enviar convite'}</button>
          <button type="button" className="cancel-btn" onClick={() => setShowInvite(false)}>Cancelar</button>
        </form>
      )}

      {atLimit && (
        <div className="users-upgrade-hint">
          Limite de membros do plano <strong>{subscription?.plan_id || 'free'}</strong> atingido.
        </div>
      )}

      <div className="users-filters">
        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="search-form">
          <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
          <button type="submit" className="search-button">Buscar</button>
        </form>
        <div className="role-filters">
          <button className={`role-filter ${roleFilter === '' ? 'active' : ''}`} onClick={() => setRoleFilter('')}>Todos</button>
          {ORG_ROLES.map(r => (
            <button key={r} className={`role-filter ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>{ORG_LABELS[r]}</button>
          ))}
        </div>
      </div>

      {error && <div className="users-error">{error}</div>}
      {success && <div className="users-success">{success}</div>}

      {loading ? (
        <LoadingSkeleton variant="list" />
      ) : (
        <>
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Entrou em</th>
                  {canManage && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {userList.map(u => {
                  const isOwner = u.org_role === 'owner';
                  return (
                    <tr key={u.user_id}>
                      <td className="user-cell">
                        {u.avatar ? <img src={u.avatar} alt={u.name} className="user-avatar" /> : <div className="user-initials">{getInitials(u.name, u.email)}</div>}
                        <span className="user-name">{u.name || '-'}</span>
                      </td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge role-${u.org_role}`}>{ORG_LABELS[u.org_role] || u.org_role}</span></td>
                      <td>{formatDate(u.joined_at)}</td>
                      {canManage && (
                        <td className="actions-cell">
                          {!isOwner ? (
                            <div className="org-actions">
                              <select value={u.org_role} onChange={(e) => handleOrgRoleChange(u.user_id, e.target.value)} disabled={updatingId === u.user_id} className="role-select">
                                <option value="admin">Admin</option>
                                <option value="member">Membro</option>
                                <option value="viewer">Visualizador</option>
                              </select>
                              <button className="remove-btn" onClick={() => handleRemoveMember(u.user_id, u.name)}>Remover</button>
                            </div>
                          ) : <span className="no-actions">Proprietário</span>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="users-cards">
            {userList.map(u => {
              const isOwner = u.org_role === 'owner';
              return (
                <div key={u.user_id} className="user-card">
                  <div className="user-card-header">
                    {u.avatar ? <img src={u.avatar} alt={u.name} className="user-avatar" /> : <div className="user-initials">{getInitials(u.name, u.email)}</div>}
                    <div className="user-card-info">
                      <span className="user-name">{u.name || '-'}</span>
                      <span className="user-email">{u.email}</span>
                    </div>
                    <span className={`role-badge role-${u.org_role}`}>{ORG_LABELS[u.org_role] || u.org_role}</span>
                  </div>
                  {canManage && !isOwner && (
                    <div className="user-card-actions">
                      <select value={u.org_role} onChange={(e) => handleOrgRoleChange(u.user_id, e.target.value)} disabled={updatingId === u.user_id} className="role-select">
                        <option value="admin">Admin</option>
                        <option value="member">Membro</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                      <button className="remove-btn" onClick={() => handleRemoveMember(u.user_id, u.name)}>Remover</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {invitations.length > 0 && (
            <div className="invitations-section">
              <h3>Convites pendentes</h3>
              {invitations.map(inv => (
                <div key={inv.id} className="invitation-row">
                  <span className="inv-email">{inv.email}</span>
                  <span className={`role-badge role-${inv.org_role}`}>{ORG_LABELS[inv.org_role] || inv.org_role}</span>
                  <span className="inv-date">Enviado {formatDate(inv.created_at)}</span>
                </div>
              ))}
            </div>
          )}

          {userList.length === 0 && <div className="users-empty">Nenhum usuário encontrado</div>}
        </>
      )}
    </div>
  );
}

export default function Users() {
  const { profile } = useAuth();
  const { hasOrgRole } = useOrg();
  const navigate = useNavigate();
  const isSuperuser = profile?.role === 'superuser';

  useEffect(() => {
    if (!isSuperuser && !hasOrgRole('owner', 'admin', 'member')) navigate('/admin');
  }, []);

  return (
    <AdminLayout>
      {isSuperuser ? <PlatformView /> : <OrgMembersView />}
    </AdminLayout>
  );
}
