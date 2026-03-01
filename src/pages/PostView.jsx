import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { blog, API_URL, getImageUrl } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import Header from '../components/Header';
import AdSlot from '../components/AdSlot';
import NewsletterForm from '../components/NewsletterForm';
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
  const [showSidebarAds, setShowSidebarAds] = useState(() => window.innerWidth > 1200);
  const [toc, setToc] = useState([]);
  const [activeTocId, setActiveTocId] = useState('');

  useEffect(() => {
    const handleResize = () => setShowSidebarAds(window.innerWidth > 1200);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
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

  // Extract TOC from article headings
  useEffect(() => {
    if (!post || !contentRef.current) return;
    const headings = contentRef.current.querySelectorAll('h1, h2, h3');
    const items = [];
    headings.forEach((h, i) => {
      const id = `heading-${i}`;
      h.id = id;
      items.push({ id, text: h.textContent, level: parseInt(h.tagName[1]) });
    });
    setToc(items);
  }, [post]);

  // Track active heading on scroll
  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);


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

  const resolveImageUrls = (html) => {
    return html.replace(
      /(<img\s[^>]*src=["'])\/api\//g,
      `$1${API_URL}/api/`
    );
  };

  // Fix content that has mixed real HTML (TipTap autolinks) and escaped HTML entities.
  // TipTap without Link extension created real <a> tags inside escaped &lt;a&gt; tags,
  // producing corrupted nested links. Strategy:
  // 1. Parse HTML, strip TipTap's real <a> tags (keep text content)
  // 2. Decode HTML entities to restore the original tags
  // 3. Re-parse and fix links
  const cleanMixedContent = (html) => {
    // Step 1: Parse and strip real <a> tags, keeping their text
    const temp = document.createElement('div');
    temp.innerHTML = html;
    temp.querySelectorAll('a').forEach((a) => {
      a.replaceWith(a.textContent);
    });
    // innerHTML re-encodes text content, preserving &lt; entities
    html = temp.innerHTML;

    // Step 2: Decode HTML entities to restore original tags
    html = html
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    return html;
  };

  // Ensure all links open in new tab and have valid hrefs
  const fixLinks = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;

    div.querySelectorAll('a').forEach((a) => {
      let href = a.getAttribute('href') || '';

      // If href is broken (contains HTML), try to extract the real URL
      if (href.includes('<')) {
        const match = href.match(/href=["']([^"']+)["']/);
        href = match ? match[1] : (a.textContent.match(/https?:\/\/\S+/) || [''])[0];
        a.setAttribute('href', href);
      }

      // External links open in new tab
      if (href.startsWith('http')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return div.innerHTML;
  };

  const renderContent = (content) => {
    if (!content) return null;

    let html = content;

    // Content with escaped HTML entities mixed with real TipTap tags
    if (hasEscapedHtml(html)) {
      html = cleanMixedContent(html);
    }

    // If content is HTML, render it
    if (isHtmlContent(html)) {
      html = resolveImageUrls(html);
      html = fixLinks(html);
      return (
        <div dangerouslySetInnerHTML={{ __html: html }} />
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

  const postTitle = post.meta_title || post.title;
  const postDescription = post.meta_description || post.excerpt || post.title;
  const postUrl = `https://whodo.com.br/blog/${post.slug}`;
  const postImage = post.cover_images && post.cover_images.length > 0
    ? getImageUrl(post.cover_images[0], 'banner')
    : post.cover_image
      ? getImageUrl(post.cover_image, 'banner')
      : 'https://whodo.com.br/teste-image-home.png';
  const publishedDate = post.published_at || post.created_at;

  const plainText = post.content ? post.content.replace(/<[^>]*>/g, '') : '';
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: postTitle,
    description: postDescription,
    image: {
      '@type': 'ImageObject',
      url: postImage,
      width: 1920,
      height: 1080,
    },
    url: postUrl,
    datePublished: publishedDate,
    dateModified: post.updated_at || publishedDate,
    author: {
      '@type': 'Person',
      name: post.author_name || 'Whodo',
      url: 'https://whodo.com.br',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Whodo',
      url: 'https://whodo.com.br',
      logo: {
        '@type': 'ImageObject',
        url: 'https://whodo.com.br/favicon.svg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    inLanguage: 'pt-BR',
    ...(post.category && { articleSection: post.category }),
    ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
    ...(post.reading_time && { timeRequired: `PT${post.reading_time}M` }),
    ...(wordCount > 0 && { wordCount }),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://whodo.com.br',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://whodo.com.br/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: postTitle,
        item: postUrl,
      },
    ],
  };

  return (
    <div className="postview-page">
      <Helmet>
        <title>{postTitle} | Whodo Blog</title>
        <meta name="description" content={postDescription} />
        <link rel="canonical" href={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={postUrl} />
        <meta property="og:title" content={postTitle} />
        <meta property="og:description" content={postDescription} />
        <meta property="og:image" content={postImage} />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <meta property="article:published_time" content={publishedDate} />
        {post.updated_at && <meta property="article:modified_time" content={post.updated_at} />}
        {post.category && <meta property="article:section" content={post.category} />}
        {post.tags && post.tags.map(tag => (
          <meta property="article:tag" content={tag} key={tag} />
        ))}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postTitle} />
        <meta name="twitter:description" content={postDescription} />
        <meta name="twitter:image" content={postImage} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>
      <Header />

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
        {/* Left Sidebar */}
        {showSidebarAds && (
          <aside className="left-sidebar">
            {/* Table of Contents */}
            {toc.length > 1 && (
              <div className="sidebar-section">
                <h3 className="sidebar-section-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  Neste artigo
                </h3>
                <nav className="toc-nav">
                  {toc.map(({ id, text, level }) => (
                    <a
                      key={id}
                      href={`#${id}`}
                      className={`toc-link ${level > 2 ? 'toc-sub' : ''} ${activeTocId === id ? 'toc-active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    >
                      {text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Share */}
            <div className="sidebar-section">
              <h3 className="sidebar-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Compartilhar
              </h3>
              <div className="sidebar-share-btns">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(postTitle + ' ' + postUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-share-btn sidebar-share-whatsapp"
                  aria-label="WhatsApp"
                  title="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(postUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-share-btn sidebar-share-x"
                  aria-label="X"
                  title="X (Twitter)"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sidebar-share-btn sidebar-share-linkedin"
                  aria-label="LinkedIn"
                  title="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <button
                  className="sidebar-share-btn sidebar-share-copy"
                  onClick={() => navigator.clipboard.writeText(postUrl)}
                  aria-label="Copiar link"
                  title="Copiar link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                </button>
              </div>
            </div>

            {/* Mini CTA */}
            <div className="sidebar-section sidebar-cta">
              <p className="sidebar-cta-text">Precisa de um site ou sistema profissional?</p>
              <a
                href={`https://wa.me/5516999493490?text=${encodeURIComponent(`Oi! Vi o artigo "${post.title}" e quero saber mais.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-cta-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Fale conosco
              </a>
            </div>

          </aside>
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
                <img src={getImageUrl(post.author_avatar)} alt={post.author_name} className="author-avatar" loading="lazy" />
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
              aria-label={isAuthenticated ? (stats.liked ? 'Remover curtida' : 'Curtir') : 'Faça login para curtir'}
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

        {post.tags && post.tags.length > 0 && (
          <footer className="article-footer">
            <div className="article-tags">
              {post.tags.map((tag, i) => (
                <span key={i} className="tag-badge">{tag}</span>
              ))}
            </div>
          </footer>
        )}

        {/* Share Buttons */}
        <div className="article-share">
          <span className="share-label">Compartilhar:</span>
          <div className="share-buttons">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(postTitle + ' ' + postUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn share-whatsapp"
              aria-label="Compartilhar no WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn share-twitter"
              aria-label="Compartilhar no Twitter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="share-btn share-linkedin"
              aria-label="Compartilhar no LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <button
              className="share-btn share-copy"
              onClick={() => { navigator.clipboard.writeText(postUrl); }}
              aria-label="Copiar link"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
      </article>

        {/* Right Sidebar - Ad */}
        {showSidebarAds && (
          <aside className="right-sidebar">
            <AdSlot
              slot="9257625337"
              format="auto"
              style={{ display: 'inline-block', width: '160px', height: '600px' }}
            />
          </aside>
        )}

        {/* Below-article content in center column */}
        <div className="postview-center-col">
          {/* Service CTA */}
          <section className="service-cta">
            <div className="service-cta-card">
              <div className="service-cta-glow" />
              <div className="service-cta-content">
                <span className="service-cta-badge">Consultoria gratuita</span>
                <h2 className="service-cta-title">
                  Gostou do conteúdo?<br />
                  Imagine o que podemos <span className="text-gradient">fazer pelo seu negócio</span>
                </h2>
                <p className="service-cta-description">
                  Criamos sites, sistemas e soluções digitais que trazem resultados reais.
                  Conte seu desafio — a primeira conversa é por nossa conta.
                </p>
                <div className="service-cta-features">
                  <div className="service-cta-feature">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Sites profissionais</span>
                  </div>
                  <div className="service-cta-feature">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Sistemas sob medida</span>
                  </div>
                  <div className="service-cta-feature">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>Apps e automações</span>
                  </div>
                </div>
                <a
                  href={`https://wa.me/5516999493490?text=${encodeURIComponent(`Oi! Vi o artigo "${post.title}" no blog e quero saber mais sobre os serviços da Whodo.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="service-cta-btn"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Falar com especialista
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
                <p className="service-cta-reassurance">Resposta em minutos. Sem compromisso.</p>
              </div>
            </div>
          </section>

          {/* In-article Ad */}
          <div className="ad-in-article">
            <AdSlot
              slot="4024287013"
              format="fluid"
              layout="in-article"
              style={{ display: 'block', textAlign: 'center' }}
            />
          </div>

          {/* Newsletter */}
          <NewsletterForm />

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
      </div>

    </div>
  );
}
