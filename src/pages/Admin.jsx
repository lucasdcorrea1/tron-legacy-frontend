import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Admin.css';

export default function Admin() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>Painel Admin</h1>
          <Link to="/" className="view-blog-link">Ver Blog</Link>
        </div>
        <div className="admin-user">
          <Link to="/admin/profile" className="user-profile-link">
            {profile?.name || profile?.email}
          </Link>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="admin-main">
        <h2>Dashboard</h2>
        <p>Bem-vindo ao painel administrativo do blog.</p>

        <div className="admin-cards">
          <div className="admin-card" onClick={() => navigate('/admin/posts')}>
            <h3>Posts</h3>
            <p>Gerenciar posts do blog</p>
          </div>
          <div className="admin-card" onClick={() => navigate('/admin/profile')}>
            <h3>Meu Perfil</h3>
            <p>Avatar, bio e configurações</p>
          </div>
          {isAdmin && (
            <div className="admin-card" onClick={() => navigate('/admin/users')}>
              <h3>Usuários</h3>
              <p>Gerenciar usuários e permissões</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
