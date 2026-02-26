import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blog } from '../services/api';
import './PostList.css';

export default function PostList() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await blog.myPosts({ page, limit });
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${title}"?`)) return;

    try {
      await blog.delete(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      setError(err.message || 'Erro ao excluir post');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="postlist-page">
      <header className="admin-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/admin')}>
            ← Voltar
          </button>
          <h1>Meus Posts</h1>
        </div>
        <div className="admin-user">
          <span>{profile?.name}</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="postlist-main">
        <div className="postlist-header">
          <p className="postlist-count">{total} post{total !== 1 ? 's' : ''}</p>
          <button className="new-post-button" onClick={() => navigate('/admin/posts/new')}>
            + Novo Post
          </button>
        </div>

        {error && <div className="postlist-error">{error}</div>}

        {loading ? (
          <div className="postlist-loading">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="postlist-empty">
            <p>Nenhum post ainda</p>
            <button className="new-post-button" onClick={() => navigate('/admin/posts/new')}>
              Criar primeiro post
            </button>
          </div>
        ) : (
          <>
            <div className="postlist-table-wrapper">
              <table className="postlist-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Leitura</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id}>
                      <td
                        className="post-title-cell"
                        onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                      >
                        {post.title}
                      </td>
                      <td>{post.category || '-'}</td>
                      <td>
                        <span className={`status-badge status-${post.status}`}>
                          {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </span>
                      </td>
                      <td>{post.reading_time ? `${post.reading_time} min` : '-'}</td>
                      <td>{formatDate(post.published_at || post.created_at)}</td>
                      <td>
                        <div className="post-actions">
                          <button
                            className="edit-button"
                            onClick={() => navigate(`/admin/posts/edit/${post.id}`)}
                          >
                            Editar
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(post.id, post.title)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="postlist-cards">
              {posts.map(post => (
                <div key={post.id} className="post-card" onClick={() => navigate(`/admin/posts/edit/${post.id}`)}>
                  <div className="post-card-header">
                    <h3>{post.title}</h3>
                    <span className={`status-badge status-${post.status}`}>
                      {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                  <div className="post-card-meta">
                    <span>{post.category || 'Sem categoria'}</span>
                    <span>{post.reading_time ? `${post.reading_time} min` : ''}</span>
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                  </div>
                  <button
                    className="delete-button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(post.id, post.title); }}
                  >
                    Excluir
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="postlist-pagination">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="pagination-button"
                >
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {page} de {totalPages}
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
