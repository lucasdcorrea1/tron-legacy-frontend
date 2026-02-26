import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { users } from '../services/api';
import './Users.css';

const ROLES = ['admin', 'author', 'user'];
const ROLE_LABELS = { admin: 'Admin', author: 'Autor', user: 'Usuário' };

export default function Users() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const limit = 20;

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/admin');
      return;
    }
    fetchUsers();
  }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await users.list({ page, limit, search, role: roleFilter });
      setUserList(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    setError('');
    setSuccess('');
    try {
      const updated = await users.updateRole(userId, newRole);
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
      setSuccess('Role atualizada com sucesso');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar role');
    } finally {
      setUpdatingId(null);
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || '?';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const totalPages = Math.ceil(total / limit);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="users-page">
      <header className="admin-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/admin')}>
            ← Voltar
          </button>
          <h1>Gerenciar Usuários</h1>
        </div>
        <div className="admin-user">
          <span>{profile?.name}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="users-main">
        <div className="users-filters">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">Buscar</button>
          </form>

          <div className="role-filters">
            <button
              className={`role-filter ${roleFilter === '' ? 'active' : ''}`}
              onClick={() => { setRoleFilter(''); setPage(1); }}
            >
              Todos
            </button>
            {ROLES.map(role => (
              <button
                key={role}
                className={`role-filter ${roleFilter === role ? 'active' : ''}`}
                onClick={() => { setRoleFilter(role); setPage(1); }}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="users-error">{error}</div>}
        {success && <div className="users-success">{success}</div>}

        {loading ? (
          <div className="users-loading">Carregando...</div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
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
                  {userList.map(user => (
                    <tr key={user.id}>
                      <td className="user-cell">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="user-avatar" />
                        ) : (
                          <div className="user-initials">{getInitials(user.name, user.email)}</div>
                        )}
                        <span className="user-name">{user.name || '-'}</span>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingId === user.id}
                          className="role-select"
                        >
                          {ROLES.map(role => (
                            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                          ))}
                        </select>
                        {updatingId === user.id && <span className="updating">...</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="users-cards">
              {userList.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-card-header">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="user-avatar" />
                    ) : (
                      <div className="user-initials">{getInitials(user.name, user.email)}</div>
                    )}
                    <div className="user-card-info">
                      <span className="user-name">{user.name || '-'}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                  <div className="user-card-body">
                    <div className="user-card-row">
                      <span>Role:</span>
                      <span className={`role-badge role-${user.role}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                    <div className="user-card-row">
                      <span>Criado:</span>
                      <span>{formatDate(user.created_at)}</span>
                    </div>
                    <div className="user-card-row">
                      <span>Alterar role:</span>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingId === user.id}
                        className="role-select"
                      >
                        {ROLES.map(role => (
                          <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {userList.length === 0 && (
              <div className="users-empty">Nenhum usuário encontrado</div>
            )}

            {totalPages > 1 && (
              <div className="users-pagination">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="pagination-button"
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {page} de {totalPages} ({total} usuários)
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="pagination-button"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
