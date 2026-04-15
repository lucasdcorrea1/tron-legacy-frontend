import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { users, platform } from '../services/api';
import { useConfirm } from '../components/ConfirmModal';
import AdminLayout from '../components/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './Users.css';

const ORG_ROLES = ['owner', 'admin', 'member', 'viewer'];
const ORG_LABELS = { owner: 'Proprietário', admin: 'Admin', member: 'Membro', viewer: 'Visualizador' };
const PLATFORM_ROLES = ['superuser', 'admin', 'author', 'user'];
const PLATFORM_LABELS = { superuser: 'Super Admin', admin: 'Admin', author: 'Autor', user: 'Usuário' };

const getInitials = (name, email) => {
  if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return email?.charAt(0).toUpperCase() || '?';
};

/* ─── Tab: Plataforma ─── */
function PlatformUsersTab() {
  const { profile } = useAuth();
  const confirm = useConfirm();
  const [userList, setUserList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const data = await users.list(params);
      setUserList(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleRoleChange = async (uid, newRole) => {
    const label = PLATFORM_LABELS[newRole];
    const ok = await confirm({
      title: 'Alterar role de plataforma',
      message: `Alterar para ${label}?${newRole === 'superuser' ? ' Este usuário terá acesso total à plataforma.' : ''}`,
      confirmText: 'Confirmar',
      variant: newRole === 'superuser' ? 'danger' : 'default'
    });
    if (!ok) return;
    setUpdatingId(uid);
    try {
      await users.updateRole(uid, newRole);
      setSuccess(`Role alterada para ${label}`);
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      setError(err.message || 'Erro ao alterar role');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('pt-BR');
  const totalPages = Math.ceil(total / limit);
  const superCount = userList.filter(u => u.role === 'superuser').length;

  return (
    <>
      {error && <div className="up-msg up-msg--error">{error}</div>}
      {success && <div className="up-msg up-msg--success">{success}</div>}

      <div className="up-toolbar">
        <div className="up-toolbar-left">
          <div className="up-search-wrap">
            <svg className="up-search-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="up-search" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="up-select">
            <option value="">Todos os roles</option>
            {PLATFORM_ROLES.map(r => (
              <option key={r} value={r}>{PLATFORM_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <span className="up-result-count">{total} usuário{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <LoadingSkeleton variant="list" />
      ) : userList.length === 0 ? (
        <div className="up-empty"><p>Nenhum usuário encontrado</p></div>
      ) : (
        <>
          {/* Desktop */}
          <div className="up-table-wrap">
            <table className="up-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Criado em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {userList.map(u => {
                  const isSelf = u.id === profile?.user_id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="up-user">
                          {u.avatar ? <img src={u.avatar} alt={u.name} className="up-avatar" /> : <div className="up-initials">{getInitials(u.name, u.email)}</div>}
                          <span className="up-name">{u.name || '-'}</span>
                        </div>
                      </td>
                      <td className="up-email-cell">{u.email}</td>
                      <td><span className={`up-role up-role--${u.role}`}>{PLATFORM_LABELS[u.role] || u.role}</span></td>
                      <td className="up-date-cell">{formatDate(u.created_at)}</td>
                      <td>
                        {isSelf ? (
                          <span className="up-muted">Você</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={updatingId === u.id}
                            className="up-action-select"
                          >
                            {PLATFORM_ROLES.map(r => (
                              <option key={r} value={r}>{PLATFORM_LABELS[r]}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="up-cards">
            {userList.map(u => {
              const isSelf = u.id === profile?.user_id;
              return (
                <div key={u.id} className="up-card">
                  <div className="up-card-top">
                    {u.avatar ? <img src={u.avatar} alt={u.name} className="up-avatar" /> : <div className="up-initials">{getInitials(u.name, u.email)}</div>}
                    <div className="up-card-info">
                      <span className="up-name">{u.name || '-'}</span>
                      <span className="up-card-email">{u.email}</span>
                    </div>
                    <span className={`up-role up-role--${u.role}`}>{PLATFORM_LABELS[u.role] || u.role}</span>
                  </div>
                  {!isSelf && (
                    <div className="up-card-actions">
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={updatingId === u.id} className="up-action-select">
                        {PLATFORM_ROLES.map(r => (
                          <option key={r} value={r}>{PLATFORM_LABELS[r]}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="up-pagination">
              <button className="up-btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
              <span className="up-muted">Página {page} de {totalPages}</span>
              <button className="up-btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ─── Tab: Por Empresa ─── */
function OrgMembersTab() {
  const [orgsList, setOrgsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

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

  const q = search.trim().toLowerCase();
  const visibleOrgs = [];
  for (const org of orgsList) {
    if (selectedOrg && org.id !== selectedOrg) continue;
    let members = org.members || [];
    if (q) members = members.filter(m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q));
    if (roleFilter) members = members.filter(m => m.org_role === roleFilter);
    if (members.length > 0) {
      visibleOrgs.push({ ...org, filteredMembers: members });
    }
  }

  const totalFiltered = visibleOrgs.reduce((sum, o) => sum + o.filteredMembers.length, 0);

  return (
    <>
      {error && <div className="up-msg up-msg--error">{error}</div>}

      <div className="up-toolbar">
        <div className="up-toolbar-left">
          <div className="up-search-wrap">
            <svg className="up-search-icon" width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            <input type="text" placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="up-search" />
          </div>
          <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} className="up-select">
            <option value="">Todas as empresas</option>
            {orgsList.map(o => (
              <option key={o.id} value={o.id}>{o.name} ({o.members?.length || 0})</option>
            ))}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="up-select">
            <option value="">Todos os roles</option>
            {ORG_ROLES.map(r => (
              <option key={r} value={r}>{ORG_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <span className="up-result-count">{totalFiltered} resultado{totalFiltered !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <LoadingSkeleton variant="list" />
      ) : visibleOrgs.length === 0 ? (
        <div className="up-empty"><p>Nenhum resultado encontrado</p></div>
      ) : (
        <div className="up-groups">
          {visibleOrgs.map(org => (
            <div key={org.id} className="up-group">
              <div className="up-group-header">
                <span className="up-group-name">{org.name}</span>
                <span className="up-group-count">{org.filteredMembers.length}</span>
              </div>

              {/* Desktop table */}
              <div className="up-table-wrap">
                <table className="up-table">
                  <thead>
                    <tr>
                      <th>Membro</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {org.filteredMembers.map((m, i) => (
                      <tr key={`${m.user_id}-${i}`}>
                        <td>
                          <div className="up-user">
                            {m.avatar ? <img src={m.avatar} alt={m.name} className="up-avatar" /> : <div className="up-initials">{getInitials(m.name, m.email)}</div>}
                            <span className="up-name">{m.name || '-'}</span>
                          </div>
                        </td>
                        <td className="up-email-cell">{m.email}</td>
                        <td><span className={`up-role up-role--${m.org_role}`}>{ORG_LABELS[m.org_role] || m.org_role}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="up-cards">
                {org.filteredMembers.map((m, i) => (
                  <div key={`${m.user_id}-${i}`} className="up-card">
                    <div className="up-card-top">
                      {m.avatar ? <img src={m.avatar} alt={m.name} className="up-avatar" /> : <div className="up-initials">{getInitials(m.name, m.email)}</div>}
                      <div className="up-card-info">
                        <span className="up-name">{m.name || '-'}</span>
                        <span className="up-card-email">{m.email}</span>
                      </div>
                      <span className={`up-role up-role--${m.org_role}`}>{ORG_LABELS[m.org_role] || m.org_role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ─── Main Component ─── */
export default function Users() {
  const { profile } = useAuth();
  const isSuperuser = profile?.role === 'superuser' || profile?.role === 'superadmin';
  const [tab, setTab] = useState('platform');

  if (!isSuperuser) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
          Acesso restrito a Super Administradores.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="up">
        <div className="up-header">
          <div>
            <h1 className="up-title">Usuários</h1>
            <p className="up-subtitle">Gestão de usuários e permissões da plataforma</p>
          </div>
        </div>

        <div className="up-tabs">
          <button className={`up-tab ${tab === 'platform' ? 'up-tab--active' : ''}`} onClick={() => setTab('platform')}>
            Plataforma
          </button>
          <button className={`up-tab ${tab === 'orgs' ? 'up-tab--active' : ''}`} onClick={() => setTab('orgs')}>
            Por Empresa
          </button>
        </div>

        {tab === 'platform' && <PlatformUsersTab />}
        {tab === 'orgs' && <OrgMembersTab />}
      </div>
    </AdminLayout>
  );
}
