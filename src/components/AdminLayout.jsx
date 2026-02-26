import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';
import './AdminLayout.css';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
};

const menuItems = [
  { path: '/admin', icon: '◐', label: 'Dashboard', exact: true },
  { path: '/admin/posts', icon: '◧', label: 'Posts' },
  { path: '/admin/profile', icon: '◯', label: 'Perfil' },
];

const adminItems = [
  { path: '/admin/users', icon: '◫', label: 'Usuários' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`admin-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            {collapsed ? 'T' : 'Tron Legacy'}
          </Link>
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? '▸' : '◂'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {!collapsed && <span className="nav-section-title">Menu</span>}
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                title={collapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </Link>
            ))}
          </div>

          {isAdmin && (
            <div className="nav-section">
              {!collapsed && <span className="nav-section-title">Admin</span>}
              {adminItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                </Link>
              ))}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="nav-item blog-link" title={collapsed ? 'Ver Blog' : ''}>
            <span className="nav-icon">◱</span>
            {!collapsed && <span className="nav-label">Ver Blog</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-content">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              ☰
            </button>
          </div>

          <div className="topbar-right">
            <div className="user-dropdown">
              <button
                className="user-dropdown-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {profile?.avatar ? (
                  <img
                    src={getImageUrl(profile.avatar)}
                    alt={profile.name}
                    className="user-avatar"
                  />
                ) : (
                  <div className="user-avatar-placeholder">
                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="user-name">{profile?.name}</span>
                <span className="dropdown-arrow">▾</span>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="dropdown-overlay"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <strong>{profile?.name}</strong>
                      <span>{profile?.email}</span>
                    </div>
                    <div className="dropdown-divider" />
                    <Link
                      to="/admin/profile"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Meu Perfil
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
