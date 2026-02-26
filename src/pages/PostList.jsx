import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { blog } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import './PostList.css';

export default function PostList() {
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

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="posts-page">
        <div className="page-header">
          <div>
            <h1>Meus Posts</h1>
            <p>{total} post{total !== 1 ? 's' : ''} no total</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/posts/new')}
          >
            + Novo Post
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◧</div>
            <h3>Nenhum post ainda</h3>
            <p>Comece criando seu primeiro post</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/admin/posts/new')}
            >
              Criar primeiro post
            </button>
          </div>
        ) : (
          <>
            <div className="posts-table">
              <div className="table-header">
                <span className="col-title">Título</span>
                <span className="col-category">Categoria</span>
                <span className="col-status">Status</span>
                <span className="col-date">Data</span>
                <span className="col-actions">Ações</span>
              </div>
              {posts.map(post => {
                const postId = post._id || post.id;
                return (
                  <div key={postId} className="table-row">
                    <span
                      className="col-title clickable"
                      onClick={() => navigate(`/admin/posts/edit/${post.slug}`)}
                    >
                      {post.title}
                    </span>
                    <span className="col-category">
                      {post.category || '-'}
                    </span>
                    <span className="col-status">
                      <span className={`status-badge ${post.status}`}>
                        {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </span>
                    <span className="col-date">
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                    <span className="col-actions">
                      <button
                        className="btn-icon edit"
                        onClick={() => navigate(`/admin/posts/edit/${post.slug}`)}
                        title="Editar"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(postId, post.title)}
                        title="Excluir"
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Cards */}
            <div className="posts-cards">
              {posts.map(post => {
                const postId = post._id || post.id;
                return (
                  <div
                    key={postId}
                    className="post-card"
                    onClick={() => navigate(`/admin/posts/edit/${post.slug}`)}
                  >
                    <div className="post-card-header">
                      <h3>{post.title}</h3>
                      <span className={`status-badge ${post.status}`}>
                        {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </div>
                    <div className="post-card-meta">
                      <span>{post.category || 'Sem categoria'}</span>
                      <span>•</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    <button
                      className="btn-delete-card"
                      onClick={(e) => { e.stopPropagation(); handleDelete(postId, post.title); }}
                    >
                      Excluir
                    </button>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                  className="pagination-btn"
                >
                  ← Anterior
                </button>
                <span className="pagination-info">
                  {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="pagination-btn"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
