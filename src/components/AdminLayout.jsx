import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { useTheme } from '../context/ThemeContext';
import UserAvatar from './UserAvatar';
import OrgSwitcher from './OrgSwitcher';
import './AdminLayout.css';

// SVG Icons
const Icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  posts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  megaphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  blog: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
};

const Icons_settings = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const Icons_lock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const menuItems = [
  { path: '/admin', icon: Icons.dashboard, label: 'Dashboard', exact: true },
];

const Icons_3d = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const Icons_financeiro = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const Icons_contabil = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="12" y2="14" />
    <line x1="8" y1="18" x2="10" y2="18" />
  </svg>
);

const toolItems = [
  { path: '/admin/instagram', icon: Icons.instagram, label: 'Instagram', minPlan: 'starter' },
  { path: '/admin/facebook', icon: Icons.facebook, label: 'Facebook', minPlan: 'starter' },
  { path: '/admin/email-marketing', icon: Icons.email, label: 'Email Marketing', minPlan: 'pro', superOnly: true },
  { path: '/admin/cta-analytics', icon: Icons.blog, label: 'CTA Clicks', exact: true, minPlan: 'starter', superOnly: true },
  { path: '/admin/3d-store', icon: Icons_3d, label: '3D Store', superOnly: true },
  { path: '/admin/financeiro', icon: Icons_financeiro, label: 'Financeiro', superOnly: true },
  { path: '/admin/users', icon: Icons.users, label: 'Usuários', superOnly: true },
  { path: '/admin/contabil', icon: Icons_contabil, label: 'Contabilidade', minPlan: 'starter' },
];

const contentItems = [
  { path: '/admin/posts', icon: Icons.posts, label: 'Posts' },
];

const managementItems = [
  { path: '/admin/profile', icon: Icons.profile, label: 'Configurações' },
];

const PLAN_RANK = { free: 0, starter: 1, pro: 2, enterprise: 3 };

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const { currentOrg, subscription, hasOrgRole } = useOrg();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentPlan = (subscription?.status === 'active' ? subscription?.plan_id : 'free') || 'free';
  const isAdmin = hasOrgRole('owner', 'admin');
  const isSuperuser = profile?.role === 'superuser' || profile?.role === 'superadmin';

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // ── Sidebar branding based on org settings ──
  const sidebarMode = currentOrg?.settings?.sidebar_display || 'platform';
  const orgLogo = currentOrg?.logo_url;
  const orgName = currentOrg?.name;
  const orgInitial = orgName?.charAt(0)?.toUpperCase() || 'W';

  const renderSidebarBrand = () => {
    switch (sidebarMode) {
      case 'logo':
        return orgLogo
          ? <img src={orgLogo} alt={orgName} className="logo-img" />
          : <span className="logo-icon">{orgInitial}</span>;
      case 'name':
        return <span className="logo-text">{orgName || 'whodo'}</span>;
      case 'logo_and_name':
        return (
          <>
            {orgLogo
              ? <img src={orgLogo} alt={orgName} className="logo-img" />
              : <span className="logo-icon">{orgInitial}</span>}
            <span className="logo-text">{orgName || 'whodo'}</span>
          </>
        );
      default: // 'platform'
        return (
          <>
            <span className="logo-icon">W</span>
            <span className="logo-text">whodo</span>
          </>
        );
    }
  };

  const renderTopbarBrand = () => {
    if (sidebarMode === 'platform' || !orgLogo) {
      return <span className="logo-icon">{sidebarMode === 'platform' ? 'W' : orgInitial}</span>;
    }
    return <img src={orgLogo} alt={orgName} className="logo-img" />;
  };

  return (
    <div className={`admin-layout ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu} />
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={closeMobileMenu}>
            {renderSidebarBrand()}
          </Link>
          <button
            className="sidebar-close"
            onClick={closeMobileMenu}
          >
            {Icons.close}
          </button>
        </div>

        <div className="sidebar-org">
          <OrgSwitcher onClose={closeMobileMenu} />
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="nav-section-title">Geral</span>
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          {isAdmin && (
            <div className="nav-section">
              <span className="nav-section-title">Ferramentas</span>
              {toolItems.filter(item => !item.superOnly || isSuperuser).map(item => {
                const locked = item.minPlan && (PLAN_RANK[currentPlan] ?? 0) < (PLAN_RANK[item.minPlan] ?? 0);
                return (
                  <Link
                    key={item.path}
                    to={locked ? '/admin/checkout' : item.path}
                    className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''} ${locked ? 'nav-locked' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <span className="nav-icon">{locked ? Icons_lock : item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {locked && <span className="nav-badge">{item.minPlan === 'pro' ? 'PRO' : 'STARTER'}</span>}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="nav-section">
            <span className="nav-section-title">Conteúdo</span>
            {contentItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <span className="nav-section-title">Gestão</span>
            {managementItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          {/* Mobile user info */}
          <div className="mobile-user-info">
            <div className="mobile-user-header">
              <UserAvatar profile={profile} size="md" />
              <div className="mobile-user-details">
                <span className="mobile-user-name">{profile?.name}</span>
                <span className="mobile-user-role">{currentOrg?.my_role || profile?.role}</span>
              </div>
            </div>
            <button className="mobile-logout-btn" onClick={handleLogout}>
              <span className="nav-icon">{Icons.logout}</span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-content">
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
            >
              {Icons.menu}
            </button>
            <Link to="/" className="topbar-logo">
              {renderTopbarBrand()}
            </Link>
          </div>

          <div className="topbar-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? Icons.sun : Icons.moon}
            </button>
            <div className="user-dropdown">
              <button
                className="user-dropdown-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <UserAvatar profile={profile} />
                <span className="user-name">{profile?.name}</span>
                <span className="dropdown-arrow">{Icons.chevronDown}</span>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="dropdown-overlay"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="dropdown-menu">
                    <div className="dropdown-header">
                      <UserAvatar profile={profile} size="lg" />
                      <div className="dropdown-user-info">
                        <strong>{profile?.name}</strong>
                        <span>{profile?.email}</span>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link
                      to="/admin/profile"
                      className="dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="dropdown-icon">{Icons.profile}</span>
                      Meu Perfil
                    </Link>
                    <div className="dropdown-divider" />
                    <button
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <span className="dropdown-icon">{Icons.logout}</span>
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
