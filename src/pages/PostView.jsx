import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blog, API_URL, getImageUrl } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import go from 'highlight.js/lib/languages/go';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import 'highlight.js/styles/github-dark.css';
import './PostView.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('go', go);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays < 7) return `há ${diffDays}d`;
  return date.toLocaleDateString('pt-BR');
};

export default function PostView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const viewRecorded = useRef(false);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const contentRef = useRef(null);

  // Engagement state
  const [stats, setStats] = useState({
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    liked: false,
  });
  const [likeLoading, setLikeLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (post && !viewRecorded.current) {
      viewRecorded.current = true;
      blog.recordView(slug);
      fetchStats();
      fetchComments();
    }
  }, [post, slug]);

  // Apply syntax highlighting to code blocks after content renders
  useEffect(() => {
    if (post && contentRef.current) {
      contentRef.current.querySelectorAll('pre code').forEach((block) => {
        if (!block.dataset.highlighted) {
          hljs.highlightElement(block);
        }
      });
    }
  }, [post]);

  // Initialize AdSense ads
  useEffect(() => {
    if (post) {
      try {
        const ads = document.querySelectorAll('.adsbygoogle');
        ads.forEach((ad) => {
          if (!ad.dataset.adsbygoogleStatus) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          }
        });
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [post]);

  const fetchPost = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const data = await blog.getBySlug(slug);
      setPost(data.post || data);
    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await blog.getStats(slug);
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    }
  };

  const fetchComments = async (page = 1) => {
    setCommentsLoading(true);
    try {
      const data = await blog.getComments(slug, page);
      if (page === 1) {
        setComments(data.comments || []);
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
      }
      setCommentsTotal(data.total || 0);
      setCommentsPage(page);
    } catch (err) {
      console.error('Erro ao carregar comentários:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Optimistic update
    const previousLiked = stats.liked;
    const previousCount = stats.like_count;
    setStats(prev => ({
      ...prev,
      liked: !prev.liked,
      like_count: prev.liked ? prev.like_count - 1 : prev.like_count + 1,
    }));

    setLikeLoading(true);
    try {
      const result = await blog.toggleLike(slug);
      setStats(prev => ({
        ...prev,
        liked: result.liked,
        like_count: result.like_count,
      }));
    } catch (err) {
      // Revert on error
      setStats(prev => ({
        ...prev,
        liked: previousLiked,
        like_count: previousCount,
      }));
      if (err.message.includes('login')) {
        navigate('/login');
      }
    } finally {
      setLikeLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || commentSubmitting) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setCommentSubmitting(true);
    setCommentError('');

    try {
      const comment = await blog.createComment(slug, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setCommentsTotal(prev => prev + 1);
      setStats(prev => ({ ...prev, comment_count: prev.comment_count + 1 }));
      setNewComment('');
    } catch (err) {
      setCommentError(err.message);
      if (err.message.includes('login')) {
        navigate('/login');
      }
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Excluir este comentário?')) return;

    try {
      await blog.deleteComment(slug, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId && c._id !== commentId));
      setCommentsTotal(prev => prev - 1);
      setStats(prev => ({ ...prev, comment_count: Math.max(0, prev.comment_count - 1) }));
    } catch (err) {
      alert(err.message);
    }
  };

  const canDeleteComment = (comment) => {
    if (!isAuthenticated || !profile) return false;
    const commentUserId = comment.user_id || comment.userId;
    const postAuthorId = post?.author_id || post?.authorId || post?.user_id;
    return (
      profile._id === commentUserId ||
      profile.id === commentUserId ||
      profile._id === postAuthorId ||
      profile.id === postAuthorId ||
      profile.role === 'admin'
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isHtmlContent = (text) => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  // Detect escaped HTML entities (e.g. &lt;h2&gt; instead of <h2>)
  const hasEscapedHtml = (text) => {
    return /&lt;[a-z/][^&]*&gt;/i.test(text);
  };

  // Unescape HTML entities back to real tags
  const unescapeHtml = (text) => {
    const el = document.createElement('textarea');
    el.innerHTML = text;
    return el.value;
  };

  const resolveImageUrls = (html) => {
    // Resolve relative image URLs to absolute
    return html.replace(
      /(<img\s[^>]*src=["'])\/api\//g,
      `$1${API_URL}/api/`
    );
  };

  const renderContent = (content) => {
    if (!content) return null;

    let html = content;

    // If content has escaped HTML entities (&lt;h2&gt;), unescape them first
    if (hasEscapedHtml(html)) {
      html = unescapeHtml(html);
    }

    // If content is HTML (from TipTap), render it directly
    if (isHtmlContent(html)) {
      return (
        <div dangerouslySetInnerHTML={{ __html: resolveImageUrls(html) }} />
      );
    }

    // Legacy: simple markdown-like rendering for old posts
    const paragraphs = html.split('\n\n');
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

  const hasMoreComments = comments.length < commentsTotal;

  return (
    <div className="postview-page">
      <header className="postview-header">
        <nav className="postview-nav">
          <Link to="/blog" className="back-link">← Voltar para o blog</Link>
        </nav>
      </header>

      {((post.cover_images && post.cover_images.length > 0) || post.cover_image) && (
        <div className="postview-cover">
          <ImageCarousel
            images={post.cover_images}
            legacyImage={post.cover_image}
            size="banner"
            autoPlay={post.cover_images && post.cover_images.length > 1}
            alt={post.title}
          />
        </div>
      )}

      <div className="postview-body">
        {/* Left Ad Sidebar */}
        <aside className="ad-sidebar ad-sidebar-left">
          <div className="ad-slot">
            <ins className="adsbygoogle"
              style={{ display: 'inline-block', width: '160px', height: '600px' }}
              data-ad-client="ca-pub-8952525362331082"
              data-ad-slot="9257625337"
            />
          </div>
          <div className="ad-slot">
            <ins className="adsbygoogle"
              style={{ display: 'inline-block', width: '160px', height: '600px' }}
              data-ad-client="ca-pub-8952525362331082"
              data-ad-slot="9257625337"
            />
          </div>
        </aside>

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

          {/* Engagement Stats */}
          <div className="article-stats">
            <span className="stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {stats.view_count}
            </span>
            <button
              className={`stat-item like-button ${stats.liked ? 'liked' : ''}`}
              onClick={handleLike}
              disabled={likeLoading}
              title={isAuthenticated ? (stats.liked ? 'Remover curtida' : 'Curtir') : 'Faça login para curtir'}
            >
              <svg viewBox="0 0 24 24" fill={stats.liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {stats.like_count}
            </button>
            <span className="stat-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {stats.comment_count}
            </span>
          </div>
        </header>

        <div className="article-content" ref={contentRef}>
          {renderContent(post.content)}
        </div>

        {/* In-article Ad */}
        <div className="ad-in-article">
          <ins className="adsbygoogle"
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client="ca-pub-8952525362331082"
            data-ad-slot="4024287013"
          />
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

        {/* Right Ad Sidebar */}
        <aside className="ad-sidebar ad-sidebar-right">
          <div className="ad-slot">
            <ins className="adsbygoogle"
              style={{ display: 'inline-block', width: '160px', height: '600px' }}
              data-ad-client="ca-pub-8952525362331082"
              data-ad-slot="9257625337"
            />
          </div>
          <div className="ad-slot">
            <ins className="adsbygoogle"
              style={{ display: 'inline-block', width: '160px', height: '600px' }}
              data-ad-client="ca-pub-8952525362331082"
              data-ad-slot="9257625337"
            />
          </div>
        </aside>
      </div>

      {/* Comments Section */}
      <section className="comments-section">
        <h2 className="comments-title">
          Comentários ({stats.comment_count})
        </h2>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isAuthenticated ? "Escreva um comentário..." : "Faça login para comentar"}
            disabled={!isAuthenticated || commentSubmitting}
            maxLength={2000}
            rows={3}
          />
          <div className="comment-form-footer">
            <span className="char-count">{newComment.length}/2000</span>
            <button
              type="submit"
              disabled={!isAuthenticated || !newComment.trim() || newComment.length > 2000 || commentSubmitting}
              className="comment-submit-btn"
            >
              {commentSubmitting ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
          {commentError && <p className="comment-error">{commentError}</p>}
        </form>

        {/* Comments List */}
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment._id || comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  {comment.author_avatar ? (
                    <img src={getImageUrl(comment.author_avatar)} alt={comment.author_name} className="comment-avatar" />
                  ) : (
                    <div className="comment-avatar-placeholder">
                      {comment.author_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="comment-author-info">
                    <span className="comment-author-name">{comment.author_name}</span>
                    <span className="comment-date">{formatRelativeTime(comment.created_at)}</span>
                  </div>
                </div>
                {canDeleteComment(comment) && (
                  <button
                    className="comment-delete-btn"
                    onClick={() => handleDeleteComment(comment._id || comment.id)}
                    title="Excluir comentário"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
            </div>
          ))}

          {commentsLoading && (
            <div className="comments-loading">Carregando comentários...</div>
          )}

          {!commentsLoading && comments.length === 0 && (
            <div className="comments-empty">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </div>
          )}

          {hasMoreComments && !commentsLoading && (
            <button
              className="load-more-btn"
              onClick={() => fetchComments(commentsPage + 1)}
            >
              Carregar mais comentários
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
