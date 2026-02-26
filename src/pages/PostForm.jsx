import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { blog, API_URL } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import './PostForm.css';

export default function PostForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [showSeo, setShowSeo] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditing);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [savingAs, setSavingAs] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const data = await blog.getBySlug(id);
      // Suporta resposta direta ou wrapper {post: ...}
      const post = data.post || data;
      setTitle(post.title || '');
      setContent(post.content || '');
      setExcerpt(post.excerpt || '');
      setCoverImage(post.cover_image || '');
      setCategory(post.category || '');
      setTags(post.tags?.join(', ') || '');
      setMetaTitle(post.meta_title || '');
      setMetaDescription(post.meta_description || '');
    } catch (err) {
      console.error('Erro ao carregar post:', err);
      setError('Erro ao carregar post: ' + err.message);
    } finally {
      setLoadingPost(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      const result = await blog.uploadImage(file);
      setCoverImage(result.url);
    } catch (err) {
      setError(err.message || 'Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setCoverImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (status) => {
    setError('');

    if (!title.trim()) {
      setError('Título é obrigatório');
      return;
    }
    if (!content.trim()) {
      setError('Conteúdo é obrigatório');
      return;
    }

    setLoading(true);
    setSavingAs(status);

    const postData = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt.trim() || undefined,
      cover_image: coverImage || undefined,
      category: category.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      meta_title: metaTitle.trim() || undefined,
      meta_description: metaDescription.trim() || undefined,
      status,
    };

    try {
      if (isEditing) {
        await blog.update(id, postData);
      } else {
        await blog.create(postData);
      }
      navigate('/admin/posts');
    } catch (err) {
      setError(err.message || 'Erro ao salvar post');
    } finally {
      setLoading(false);
      setSavingAs('');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este post?')) return;

    setLoading(true);
    try {
      await blog.delete(id);
      navigate('/admin/posts');
    } catch (err) {
      setError(err.message || 'Erro ao excluir post');
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <AdminLayout>
        <div className="postform-loading">Carregando...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="postform-page">
        <div className="page-header">
          <h1>{isEditing ? 'Editar Post' : 'Novo Post'}</h1>
          <p>{isEditing ? 'Edite as informações do post' : 'Crie um novo post para o blog'}</p>
        </div>
        {error && <div className="postform-error">{error}</div>}

        <div className="postform-content">
          <div className="postform-editor">
            <div className="form-group">
              <label htmlFor="title">Título *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do post"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Conteúdo * (suporta Markdown)</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva o conteúdo do post..."
                rows={15}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="excerpt">Resumo</label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve resumo do post..."
                rows={3}
              />
            </div>
          </div>

          <div className="postform-sidebar">
            <div className="sidebar-section">
              <h3>Imagem de Capa</h3>
              <div className="form-group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="file-input"
                />
                {uploadingImage && (
                  <span className="upload-status">Enviando imagem...</span>
                )}
              </div>
              {coverImage && (
                <div className="cover-preview">
                  <img
                    src={getImageUrl(coverImage)}
                    alt="Preview"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={handleRemoveImage}
                  >
                    Remover imagem
                  </button>
                </div>
              )}
            </div>

            <div className="sidebar-section">
              <h3>Organização</h3>
              <div className="form-group">
                <label htmlFor="category">Categoria</label>
                <input
                  type="text"
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Tecnologia"
                />
              </div>
              <div className="form-group">
                <label htmlFor="tags">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="react, javascript, web"
                />
              </div>
            </div>

            <div className="sidebar-section">
              <button
                type="button"
                className="seo-toggle"
                onClick={() => setShowSeo(!showSeo)}
              >
                {showSeo ? '▼' : '▶'} SEO
              </button>
              {showSeo && (
                <div className="seo-fields">
                  <div className="form-group">
                    <label htmlFor="metaTitle">Meta Título</label>
                    <input
                      type="text"
                      id="metaTitle"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Título para SEO"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="metaDescription">Meta Descrição</label>
                    <textarea
                      id="metaDescription"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Descrição para SEO..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sidebar-actions">
              <button
                type="button"
                className="draft-button"
                onClick={() => handleSubmit('draft')}
                disabled={loading || uploadingImage}
              >
                {savingAs === 'draft' ? 'Salvando...' : 'Salvar Rascunho'}
              </button>
              <button
                type="button"
                className="publish-button"
                onClick={() => handleSubmit('published')}
                disabled={loading || uploadingImage}
              >
                {savingAs === 'published' ? 'Publicando...' : 'Publicar'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="delete-post-button"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Excluir Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
