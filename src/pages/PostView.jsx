import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { blog, API_URL } from '../services/api';
import './PostView.css';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
};

export default function PostView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await blog.getBySlug(slug);
      setPost(data);
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderContent = (content) => {
    if (!content) return null;
    const paragraphs = content.split('\n\n');
    return paragraphs.map((p, i) => {
      const trimmed = p.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith('# ')) {
        return <h1 key={i}>{trimmed.slice(2)}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={i}>{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={i}>{trimmed.slice(4)}</h3>;
      }
      return <p key={i}>{trimmed}</p>;
    });
  };

  if (loading) {
    return (
      <div className="postview-page">
        <div className="postview-loading">Carregando...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="postview-page">
        <div className="postview-notfound">
          <h1>404</h1>
          <p>Post não encontrado</p>
          <Link to="/blog" className="back-link">← Voltar para o blog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="postview-page">
      <header className="postview-header">
        <nav className="postview-nav">
          <Link to="/blog" className="back-link">← Voltar para o blog</Link>
        </nav>
      </header>

      {post.cover_image && (
        <div className="postview-cover">
          <img src={getImageUrl(post.cover_image)} alt={post.title} />
        </div>
      )}

      <article className="postview-article">
        <header className="article-header">
          {post.category && (
            <span className="article-category">{post.category}</span>
          )}
          <h1 className="article-title">{post.title}</h1>

          <div className="article-meta">
            <div className="article-author">
              {post.author_avatar ? (
                <img src={getImageUrl(post.author_avatar)} alt={post.author_name} className="author-avatar" />
              ) : (
                <div className="author-avatar-placeholder">
                  {post.author_name?.charAt(0) || 'A'}
                </div>
              )}
              <span className="author-name">{post.author_name || 'Autor'}</span>
            </div>
            <span className="meta-divider">·</span>
            <span className="article-date">{formatDate(post.published_at || post.created_at)}</span>
            {post.reading_time && (
              <>
                <span className="meta-divider">·</span>
                <span className="article-reading-time">{post.reading_time} min de leitura</span>
              </>
            )}
          </div>
        </header>

        <div className="article-content">
          {renderContent(post.content)}
        </div>

        {post.tags && post.tags.length > 0 && (
          <footer className="article-footer">
            <div className="article-tags">
              {post.tags.map((tag, i) => (
                <span key={i} className="tag-badge">{tag}</span>
              ))}
            </div>
          </footer>
        )}
      </article>
    </div>
  );
}
