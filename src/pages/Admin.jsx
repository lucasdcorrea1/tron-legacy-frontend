import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { blog, orgs } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './Admin.css';

export default function Admin() {
  const { profile } = useAuth();
  const { hasOrgRole, switchOrg, refreshOrg } = useOrg();
  const navigate = useNavigate();
  const isSuperuser = profile?.role === 'superuser';
  const isOrgAdmin = hasOrgRole('owner', 'admin');
  const [stats, setStats] = useState({ posts: 0, published: 0, drafts: 0 });
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    fetchData();
    loadInvitations();
  }, []);

  const fetchData = async () => {
    try {
      const data = await blog.myPosts({ limit: 5 });
      const posts = data.posts || [];
      setRecentPosts(posts);
      setStats({
        posts: data.total || 0,
        published: posts.filter(p => p.status === 'published').length,
        drafts: posts.filter(p => p.status === 'draft').length,
      });
    } catch (err) {
      // ignore fetch error
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const data = await orgs.myInvitations();
      setPendingInvites(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  };

  const handleAcceptInvite = async (inv) => {
    setAcceptingId(inv.id);
    try {
      await orgs.acceptInvitation(inv.id);
      await switchOrg(inv.org_id);
      await refreshOrg();
      setPendingInvites(prev => prev.filter(i => i.id !== inv.id));
    } catch { /* ignore */ }
    setAcceptingId(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <AdminLayout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Olá, {profile?.name?.split(' ')[0]}</h1>
            <p>Bem-vindo ao seu painel</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/posts/new')}
          >
            + Novo Post
          </button>
        </div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="invites-banner">
            <h3>Convites pendentes</h3>
            {pendingInvites.map(inv => (
              <div key={inv.id} className="invite-item">
                <div className="invite-info">
                  <strong>{inv.org_name || 'Organização'}</strong>
                  <span>Cargo: {inv.org_role}</span>
                </div>
                <button
                  className="btn-primary"
                  disabled={acceptingId === inv.id}
                  onClick={() => handleAcceptInvite(inv)}
                >
                  {acceptingId === inv.id ? 'Entrando...' : 'Aceitar'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">◧</div>
            <div className="stat-info">
              <span className="stat-value">{stats.posts}</span>
              <span className="stat-label">Total de Posts</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">◉</div>
            <div className="stat-info">
              <span className="stat-value">{stats.published}</span>
              <span className="stat-label">Publicados</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon yellow">◎</div>
            <div className="stat-info">
              <span className="stat-value">{stats.drafts}</span>
              <span className="stat-label">Rascunhos</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2>Ações Rápidas</h2>
          <div className="quick-actions">
            <button
              className="action-card"
              onClick={() => navigate('/admin/posts/new')}
            >
              <span className="action-icon">+</span>
              <span className="action-label">Criar Post</span>
            </button>
            <button
              className="action-card"
              onClick={() => navigate('/admin/posts')}
            >
              <span className="action-icon">◧</span>
              <span className="action-label">Ver Posts</span>
            </button>
            <button
              className="action-card"
              onClick={() => navigate('/admin/profile')}
            >
              <span className="action-icon">◯</span>
              <span className="action-label">Editar Perfil</span>
            </button>
            <button
              className="action-card"
              onClick={() => navigate('/')}
            >
              <span className="action-icon">◱</span>
              <span className="action-label">Ver Blog</span>
            </button>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="section">
          <div className="section-header">
            <h2>{isSuperuser ? 'Posts Recentes (Todos)' : 'Posts Recentes'}</h2>
            <button
              className="btn-link"
              onClick={() => navigate('/admin/posts')}
            >
              Ver todos
            </button>
          </div>

          {loading ? (
            <LoadingSkeleton variant="cards" />
          ) : recentPosts.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum post ainda</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/admin/posts/new')}
              >
                Criar primeiro post
              </button>
            </div>
          ) : (
            <div className="posts-list">
              {recentPosts.map(post => {
                const postId = post._id || post.id;
                return (
                  <div
                    key={postId}
                    className="post-item"
                    onClick={() => navigate(`/admin/posts/edit/${post.slug}`)}
                  >
                    <div className="post-item-content">
                      <h3>{post.title}</h3>
                      <span className="post-item-meta">
                        {post.category || 'Sem categoria'} • {formatDate(post.created_at)}
                      </span>
                    </div>
                    <span className={`status-badge ${post.status}`}>
                      {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
