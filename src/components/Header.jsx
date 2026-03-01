import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserAvatar from './UserAvatar';
import './Header.css';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  };

  // Close dropdown on outside click (without blocking page)
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };

    // Small delay so the opening click doesn't immediately close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-logo" onClick={closeMenus}>
          <span className="site-logo-mark">W</span>
          <span className="site-logo-text">whodo</span>
        </Link>

        <button
          className="site-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
        >
          <span className={`site-hamburger ${mobileMenuOpen ? 'open' : ''}`} />
        </button>

        <nav className={`site-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
          <Link
            to="/"
            className={`site-nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={closeMenus}
          >
            Home
          </Link>
          <Link
            to="/servicos"
            className={`site-nav-link ${isActive('/servicos') ? 'active' : ''}`}
            onClick={closeMenus}
          >
            Serviços
          </Link>
          <Link
            to="/blog"
            className={`site-nav-link ${isActive('/blog') || location.pathname.startsWith('/blog/') ? 'active' : ''}`}
            onClick={closeMenus}
          >
            Blog
          </Link>

          {isAuthenticated ? (
            <div className="site-user-area">
              {/* Desktop: avatar → popup menu */}
              <div className="site-user-dropdown" ref={dropdownRef}>
                <button
                  className={`site-avatar-btn ${showUserMenu ? 'open' : ''}`}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="Menu do usuário"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <UserAvatar profile={profile} size="sm" />
                </button>

                {showUserMenu && (
                  <div className="site-dropdown-menu">
                    <Link to="/admin" className="site-dropdown-item" onClick={closeMenus}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                      Painel
                    </Link>
                    <Link to="/admin/profile" className="site-dropdown-item" onClick={closeMenus}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Meu Perfil
                    </Link>
                    <button className="site-dropdown-item logout" onClick={handleLogout}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Sair
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile: inline links */}
              <div className="site-mobile-auth">
                <Link to="/admin" className="site-nav-link" onClick={closeMenus}>Painel</Link>
                <Link to="/admin/profile" className="site-nav-link" onClick={closeMenus}>Meu Perfil</Link>
                <button className="site-nav-link site-mobile-logout" onClick={handleLogout}>Sair</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="site-btn-enter" onClick={closeMenus}>Entrar</Link>
          )}
        </nav>

        {mobileMenuOpen && <div className="site-mobile-overlay" onClick={closeMenus} />}
      </div>
    </header>
  );
}
