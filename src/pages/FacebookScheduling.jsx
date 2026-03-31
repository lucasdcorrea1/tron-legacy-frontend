import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import { facebook, ai as aiApi, API_URL } from '../services/api';
import './InstagramScheduling.css'; // Reuse Instagram styles

const STEPS = [
  { label: 'Midia', desc: 'Adicione fotos ou texto', icon: 'image' },
  { label: 'Mensagem', desc: 'Escreva o conteudo', icon: 'edit' },
  { label: 'Agendar', desc: 'Data e hora', icon: 'calendar' },
  { label: 'Revisar', desc: 'Confirme tudo', icon: 'check' },
];

const StepIcon = ({ type, completed }) => {
  if (completed) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  switch (type) {
    case 'image':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
    case 'edit':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
    case 'calendar':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
    case 'check':
      return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
    default:
      return null;
  }
};

const STATUS_LABELS = {
  scheduled: 'Agendado',
  publishing: 'Publicando',
  published: 'Publicado',
  failed: 'Falhou',
};

const MEDIA_TYPE_OPTIONS = [
  { value: 'text', label: 'Apenas texto', icon: 'text' },
  { value: 'image', label: 'Imagem', icon: 'image' },
  { value: 'carousel', label: 'Multiplas fotos', icon: 'carousel' },
  { value: 'link', label: 'Link', icon: 'link' },
];

export function FacebookSchedulingContent({ configuredProp, onConfigChange, initialTab }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState(initialTab || 'agenda');
  const [configured, setConfigured] = useState(configuredProp ?? null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // List state
  const [schedules, setSchedules] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);

  // Wizard state
  const [mediaType, setMediaType] = useState('text');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [publishNow, setPublishNow] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    checkConfig();
  }, []);

  useEffect(() => {
    if (tab === 'agenda' && configured) {
      loadSchedules();
    }
  }, [tab, statusFilter, configured]);

  const checkConfig = async () => {
    try {
      const data = await facebook.getConfig();
      setConfigured(data.configured);
      onConfigChange?.(data.configured);
    } catch {
      setConfigured(false);
      onConfigChange?.(false);
    }
  };

  const loadSchedules = async () => {
    setListLoading(true);
    try {
      const data = await facebook.list({ page: listPage, limit: 20, status: statusFilter || undefined });
      setSchedules(data.schedules || []);
      setListTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar agendamentos');
    } finally {
      setListLoading(false);
    }
  };

  const handleFileSelect = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      toast.warning('Selecione apenas imagens (JPEG, PNG)');
      return;
    }

    setUploading(true);
    try {
      for (const file of validFiles) {
        const data = await facebook.uploadImage(file);
        setImages(prev => [...prev, { id: data.id, url: data.url }]);
      }
    } catch (err) {
      toast.error(err.message || 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let scheduledAt;
      if (publishNow) {
        scheduledAt = new Date().toISOString();
      } else {
        const dt = new Date(`${scheduleDate}T${scheduleTime}`);
        scheduledAt = dt.toISOString();
      }

      await facebook.create({
        message,
        media_type: mediaType,
        image_ids: images.map(img => img.id),
        link_url: linkUrl || undefined,
        scheduled_at: scheduledAt,
      });

      setShowConfirm(false);
      toast.success(publishNow ? 'Post enviado para publicacao!' : 'Post agendado com sucesso!');
      handleReset();
      setTab('agenda');
      loadSchedules();
    } catch (err) {
      toast.error(err.message || 'Erro ao criar agendamento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await facebook.delete(id);
      setShowDeleteConfirm(null);
      toast.success('Agendamento removido');
      loadSchedules();
    } catch (err) {
      toast.error(err.message || 'Erro ao remover');
    }
  };

  const handleReschedule = async (schedule) => {
    try {
      const newDate = new Date();
      newDate.setMinutes(newDate.getMinutes() + 5);
      await facebook.update(schedule.id, {
        scheduled_at: newDate.toISOString(),
      });
      toast.success('Post re-agendado');
      loadSchedules();
    } catch (err) {
      toast.error(err.message || 'Erro ao re-agendar');
    }
  };

  const handleAIGenerate = async () => {
    setAiGenerating(true);
    try {
      const res = await aiApi.generate({
        type: 'facebook_post',
        context: '',
        media_count: images.length,
        media_type: mediaType,
        language: 'pt-BR',
      });
      if (res.text) setMessage(res.text);
    } catch (err) {
      const msg = err.message || 'Erro ao gerar conteudo com IA';
      if (msg.includes('nao configurada') || msg.includes('Perfil')) {
        toast.error('IA nao configurada. Acesse Perfil > IA para configurar.');
      } else {
        toast.error(msg);
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setMediaType('text');
    setImages([]);
    setMessage('');
    setLinkUrl('');
    setScheduleDate('');
    setScheduleTime('');
    setPublishNow(false);
  };

  const canProceedStep = () => {
    switch (step) {
      case 0:
        if (mediaType === 'text') return true;
        if (mediaType === 'link') return true;
        if (mediaType === 'image') return images.length === 1 && !uploading;
        if (mediaType === 'carousel') return images.length >= 2 && !uploading;
        return false;
      case 1:
        if (mediaType === 'text' && !message.trim()) return false;
        if (mediaType === 'link' && !linkUrl.trim()) return false;
        return true;
      case 2:
        if (!publishNow && (!scheduleDate || !scheduleTime)) return false;
        return true;
      default:
        return true;
    }
  };

  // Not configured screen
  if (configured === false) {
    return (
      <div className="ig-page">
        <div className="ig-not-configured">
          <div className="ig-not-configured-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </div>
          <h2>Facebook nao configurado</h2>
          <p>Conecte sua conta do Facebook via <strong>Meta OAuth</strong> para comecar a agendar posts.</p>
        </div>
      </div>
    );
  }

  if (configured === null) {
    return (
      <div className="ig-page">
        <LoadingSkeleton variant="cards" />
      </div>
    );
  }

  return (
    <div className="ig-page">
      <div className="page-header">
        <h1>Facebook</h1>
        <p>Agende posts na sua pagina do Facebook</p>
      </div>

      {/* Tab switcher */}
      <div className="ig-tabs">
        <button
          className={`ig-tab ${tab === 'agenda' ? 'active' : ''}`}
          onClick={() => setTab('agenda')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          Agenda
          {listTotal > 0 && <span className="ig-tab-count">{listTotal}</span>}
        </button>
        <button
          className={`ig-tab ${tab === 'novo' ? 'active' : ''}`}
          onClick={() => { setTab('novo'); handleReset(); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Novo Post
        </button>
      </div>

      {/* AGENDA TAB */}
      {tab === 'agenda' && (
        <div className="ig-agenda-content">
          <div className="ig-list-header">
            <div className="ig-filter-row">
              {['', 'scheduled', 'published', 'failed'].map(f => (
                <button
                  key={f}
                  className={`ig-filter-btn ${statusFilter === f ? 'active' : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === '' ? 'Todos' : STATUS_LABELS[f]}
                </button>
              ))}
            </div>
            <button className="ig-btn ig-btn-secondary" onClick={loadSchedules} disabled={listLoading} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              {listLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {listLoading && schedules.length === 0 ? (
            <LoadingSkeleton variant="cards" />
          ) : schedules.length === 0 ? (
            <div className="ig-empty">
              <p>Nenhum agendamento encontrado.</p>
              <button className="ig-btn ig-btn-primary" onClick={() => { setTab('novo'); handleReset(); }}>
                Criar primeiro post
              </button>
            </div>
          ) : (
            <div className="ig-schedule-grid">
              {schedules.map(s => (
                <div key={s.id} className="ig-schedule-card">
                  {s.image_urls && s.image_urls.length > 0 && (
                    <img
                      className="ig-schedule-card-thumb"
                      src={`${API_URL}${s.image_urls[0]}`}
                      alt=""
                    />
                  )}
                  <div className="ig-schedule-card-body">
                    <div className="ig-schedule-card-caption">
                      {s.message || '(sem mensagem)'}
                    </div>
                    <div className="ig-schedule-card-meta">
                      <span className={`ig-status ig-status-${s.status}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                      <span className="ig-status" style={{ background: 'rgba(66, 103, 178, 0.15)', color: '#4267B2' }}>
                        {s.media_type}
                      </span>
                      <span>
                        {new Date(s.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    {s.error_message && (
                      <div className="ig-card-error">
                        {s.error_message}
                      </div>
                    )}
                  </div>
                  <div className="ig-schedule-card-actions">
                    {(s.status === 'scheduled' || s.status === 'failed') && (
                      <button
                        className="ig-card-action-btn danger"
                        onClick={() => setShowDeleteConfirm(s.id)}
                      >
                        Remover
                      </button>
                    )}
                    {s.status === 'failed' && (
                      <button
                        className="ig-card-action-btn"
                        onClick={() => handleReschedule(s)}
                      >
                        Re-agendar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NEW POST TAB */}
      {tab === 'novo' && (
        <>
          {/* Steps indicator */}
          <div className="ig-stepper">
            <div className="ig-stepper-track">
              <div className="ig-stepper-progress" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
            </div>
            <div className="ig-stepper-items">
              {STEPS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className={`ig-stepper-item ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''} ${i > step ? 'upcoming' : ''}`}
                  onClick={() => { if (i < step) setStep(i); }}
                  disabled={i > step}
                >
                  <span className="ig-stepper-dot">
                    <StepIcon type={s.icon} completed={i < step} />
                  </span>
                  <span className="ig-stepper-text">
                    <span className="ig-stepper-label">{s.label}</span>
                    <span className="ig-stepper-desc">{s.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 0: Media type selection */}
          {step === 0 && (
            <div className="ig-step-card" style={{ animationDelay: '0.05s' }}>
              <div className="ig-step-card-header">
                <div className="ig-step-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                </div>
                <div>
                  <h3 className="ig-step-card-title">Tipo de post</h3>
                  <p className="ig-step-card-subtitle">Escolha o formato do seu post no Facebook.</p>
                </div>
              </div>

              <div className="ig-step-card-body">
                <div className="ig-schedule-options">
                  {MEDIA_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`ig-schedule-option ${mediaType === opt.value ? 'active' : ''}`}
                      onClick={() => { setMediaType(opt.value); setImages([]); }}
                    >
                      <div className="ig-schedule-option-icon">
                        {opt.icon === 'text' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                        )}
                        {opt.icon === 'image' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        )}
                        {opt.icon === 'carousel' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="14" height="14" rx="2" /><path d="M18 8h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" /></svg>
                        )}
                        {opt.icon === 'link' && (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        )}
                      </div>
                      <div className="ig-schedule-option-text">
                        <strong>{opt.label}</strong>
                      </div>
                      <div className={`ig-schedule-option-radio ${mediaType === opt.value ? 'checked' : ''}`} />
                    </button>
                  ))}
                </div>

                {/* Image upload for image/carousel types */}
                {(mediaType === 'image' || mediaType === 'carousel') && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple={mediaType === 'carousel'}
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />

                    {images.length === 0 ? (
                      <div
                        className={`ig-upload-area ${dragOver ? 'drag-over' : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        style={{ marginTop: '1rem' }}
                      >
                        <div className="ig-upload-icon">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        </div>
                        <p className="ig-upload-main-text"><strong>Clique aqui</strong> ou arraste suas imagens</p>
                        <p className="ig-upload-hint">
                          {mediaType === 'image' ? 'Selecione 1 imagem' : 'Selecione 2 ou mais imagens'}
                        </p>
                      </div>
                    ) : (
                      <div className="ig-media-gallery" style={{ marginTop: '1rem' }}>
                        <div className="ig-image-previews">
                          {images.map((img, i) => (
                            <div key={img.id} className="ig-image-preview">
                              <img src={`${API_URL}${img.url}`} alt={`Imagem ${i + 1}`} />
                              <button
                                className="ig-image-preview-remove"
                                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                              </button>
                              {images.length > 1 && (
                                <span className="ig-image-preview-order">{i + 1}</span>
                              )}
                            </div>
                          ))}
                          {mediaType === 'carousel' && (
                            <button
                              className="ig-add-more-btn"
                              onClick={() => fileInputRef.current?.click()}
                              type="button"
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                              <span>Adicionar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {uploading && (
                      <div className="ig-upload-progress">
                        <span className="ig-spinner" />
                        <span>Enviando imagem...</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="ig-step-actions">
                <div />
                <button
                  className="ig-btn ig-btn-primary ig-btn-next"
                  disabled={!canProceedStep()}
                  onClick={() => setStep(1)}
                >
                  Continuar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Message */}
          {step === 1 && (
            <div className="ig-step-card" style={{ animationDelay: '0.05s' }}>
              <div className="ig-step-card-header">
                <div className="ig-step-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="ig-step-card-title">Escreva a mensagem</h3>
                  <p className="ig-step-card-subtitle">
                    {mediaType === 'link' ? 'Adicione a URL e uma mensagem opcional.' : 'Escreva o conteudo do seu post.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="ig-btn-ai"
                  disabled={aiGenerating}
                  onClick={handleAIGenerate}
                >
                  {aiGenerating ? (
                    <><span className="ig-spinner-small" /> Gerando...</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 16.4 5.7 21l2.3-7L2 9.4h7.6z" /></svg>
                      Preencher com IA
                    </>
                  )}
                </button>
              </div>

              <div className="ig-step-card-body">
                {mediaType === 'link' && (
                  <div className="ig-form-group" style={{ marginBottom: '1rem' }}>
                    <label>URL do link *</label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                )}

                <div className="ig-caption-editor">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escreva a mensagem do post..."
                    autoFocus
                  />
                  <div className="ig-caption-footer">
                    <span className="ig-caption-hint">
                      {mediaType === 'text' ? 'Mensagem obrigatoria' : 'Mensagem opcional'}
                    </span>
                    <span className="ig-char-count">
                      {message.length} caracteres
                    </span>
                  </div>
                </div>
              </div>

              <div className="ig-step-actions">
                <button className="ig-btn ig-btn-secondary ig-btn-back" onClick={() => setStep(0)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  Voltar
                </button>
                <button
                  className="ig-btn ig-btn-primary ig-btn-next"
                  disabled={!canProceedStep()}
                  onClick={() => setStep(2)}
                >
                  Continuar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="ig-step-card" style={{ animationDelay: '0.05s' }}>
              <div className="ig-step-card-header">
                <div className="ig-step-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                <div>
                  <h3 className="ig-step-card-title">Quando publicar?</h3>
                  <p className="ig-step-card-subtitle">Publique agora ou agende para depois.</p>
                </div>
              </div>

              <div className="ig-step-card-body">
                <div className="ig-schedule-options">
                  <button
                    type="button"
                    className={`ig-schedule-option ${publishNow ? 'active' : ''}`}
                    onClick={() => setPublishNow(true)}
                  >
                    <div className="ig-schedule-option-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                    <div className="ig-schedule-option-text">
                      <strong>Publicar agora</strong>
                      <span>O post sera enviado imediatamente</span>
                    </div>
                    <div className={`ig-schedule-option-radio ${publishNow ? 'checked' : ''}`} />
                  </button>
                  <button
                    type="button"
                    className={`ig-schedule-option ${!publishNow ? 'active' : ''}`}
                    onClick={() => setPublishNow(false)}
                  >
                    <div className="ig-schedule-option-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div className="ig-schedule-option-text">
                      <strong>Agendar</strong>
                      <span>Escolha data e horario</span>
                    </div>
                    <div className={`ig-schedule-option-radio ${!publishNow ? 'checked' : ''}`} />
                  </button>
                </div>

                {!publishNow && (
                  <div className="ig-schedule-datetime">
                    <div className="ig-form-group">
                      <label>Data</label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="ig-form-group">
                      <label>Hora</label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="ig-step-actions">
                <button className="ig-btn ig-btn-secondary ig-btn-back" onClick={() => setStep(1)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  Voltar
                </button>
                <button
                  className="ig-btn ig-btn-primary ig-btn-next"
                  disabled={!canProceedStep()}
                  onClick={() => setStep(3)}
                >
                  Revisar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="ig-step-card" style={{ animationDelay: '0.05s' }}>
              <div className="ig-step-card-header">
                <div className="ig-step-card-icon ig-step-card-icon-success">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </div>
                <div>
                  <h3 className="ig-step-card-title">Tudo pronto!</h3>
                  <p className="ig-step-card-subtitle">Revise as informacoes antes de confirmar.</p>
                </div>
              </div>

              <div className="ig-step-card-body">
                <div className="ig-review-details" style={{ maxWidth: '100%' }}>
                  <div className="ig-review-info-card">
                    <div className="ig-review-info-row">
                      <span className="ig-review-info-label">Tipo</span>
                      <span className="ig-review-info-value">
                        {MEDIA_TYPE_OPTIONS.find(o => o.value === mediaType)?.label}
                      </span>
                    </div>
                    {images.length > 0 && (
                      <div className="ig-review-info-row">
                        <span className="ig-review-info-label">Imagens</span>
                        <span className="ig-review-info-value">{images.length} imagem(ns)</span>
                      </div>
                    )}
                    {linkUrl && (
                      <div className="ig-review-info-row">
                        <span className="ig-review-info-label">Link</span>
                        <span className="ig-review-info-value" style={{ wordBreak: 'break-all' }}>{linkUrl}</span>
                      </div>
                    )}
                    <div className="ig-review-info-row">
                      <span className="ig-review-info-label">Mensagem</span>
                      <span className="ig-review-info-value">{message ? `${message.length} caracteres` : 'Sem mensagem'}</span>
                    </div>
                    <div className="ig-review-info-row">
                      <span className="ig-review-info-label">Publicacao</span>
                      <span className="ig-review-info-value">
                        {publishNow ? (
                          <span className="ig-review-badge ig-review-badge-now">Agora</span>
                        ) : (
                          <span>{new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {message && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.5rem' }}>Preview da mensagem:</strong>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="ig-step-actions">
                <button className="ig-btn ig-btn-secondary ig-btn-back" onClick={() => setStep(2)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                  Voltar
                </button>
                <button
                  className="ig-btn ig-btn-primary ig-btn-submit"
                  onClick={() => setShowConfirm(true)}
                  style={{ background: 'linear-gradient(135deg, #4267B2 0%, #3b5998 100%)' }}
                >
                  {publishNow ? 'Publicar agora' : 'Agendar post'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm schedule dialog */}
      {showConfirm && (
        <div className="ig-confirm-overlay" onClick={() => !saving && setShowConfirm(false)}>
          <div className="ig-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{publishNow ? 'Confirmar publicacao' : 'Confirmar agendamento'}</h3>
            <p>
              {publishNow
                ? 'O post sera publicado no Facebook imediatamente. Continuar?'
                : 'O post sera publicado automaticamente na data e hora agendada. Continuar?'
              }
            </p>
            <div className="ig-confirm-actions">
              <button
                className="ig-btn ig-btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="ig-btn ig-btn-primary"
                onClick={handleSubmit}
                disabled={saving}
                style={{ background: 'linear-gradient(135deg, #4267B2 0%, #3b5998 100%)' }}
              >
                {saving ? (
                  <>
                    <span className="ig-spinner" style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    {publishNow ? 'Publicando...' : 'Agendando...'}
                  </>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="ig-confirm-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="ig-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Remover agendamento</h3>
            <p>Tem certeza que deseja remover este agendamento? Esta acao nao pode ser desfeita.</p>
            <div className="ig-confirm-actions">
              <button className="ig-btn ig-btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancelar
              </button>
              <button
                className="ig-btn ig-btn-primary"
                style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FacebookScheduling() {
  return (
    <AdminLayout>
      <FacebookSchedulingContent />
    </AdminLayout>
  );
}
