import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import { instagram, API_URL } from '../services/api';
import './InstagramScheduling.css';

const STEPS = [
  { label: 'Midia' },
  { label: 'Legenda' },
  { label: 'Agendar' },
  { label: 'Revisar' },
];

const STATUS_LABELS = {
  scheduled: 'Agendado',
  publishing: 'Publicando',
  published: 'Publicado',
  failed: 'Falhou',
};

export default function InstagramScheduling() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState('agenda');
  const [configured, setConfigured] = useState(null); // null = loading, true/false
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // List state
  const [schedules, setSchedules] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);

  // Wizard state
  const [images, setImages] = useState([]); // [{id, url, file?}]
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [publishNow, setPublishNow] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Check config on mount
  useEffect(() => {
    checkConfig();
  }, []);

  // Load schedules when tab switches or filter changes
  useEffect(() => {
    if (tab === 'agenda' && configured) {
      loadSchedules();
    }
  }, [tab, statusFilter, configured]);

  const checkConfig = async () => {
    try {
      const data = await instagram.getConfig();
      setConfigured(data.configured);
    } catch {
      setConfigured(false);
    }
  };

  const loadSchedules = async () => {
    setListLoading(true);
    try {
      const data = await instagram.list({ page: listPage, limit: 20, status: statusFilter || undefined });
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

    const validFiles = Array.from(files).filter(f =>
      f.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      toast.warning('Selecione apenas imagens (JPEG, PNG)');
      return;
    }

    setUploading(true);
    try {
      for (const file of validFiles) {
        const data = await instagram.uploadImage(file);
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

  const getMediaType = () => {
    return images.length > 1 ? 'carousel' : 'image';
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

      await instagram.create({
        caption,
        media_type: getMediaType(),
        image_ids: images.map(img => img.id),
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
      await instagram.delete(id);
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
      await instagram.update(schedule.id, {
        scheduled_at: newDate.toISOString(),
      });
      toast.success('Post re-agendado');
      loadSchedules();
    } catch (err) {
      toast.error(err.message || 'Erro ao re-agendar');
    }
  };

  const handleReset = () => {
    setStep(0);
    setImages([]);
    setCaption('');
    setScheduleDate('');
    setScheduleTime('');
    setPublishNow(false);
  };

  const renderCaption = (text) => {
    if (!text) return '';
    return text.split(/(#\w+)/g).map((part, i) =>
      part.startsWith('#') ? <span key={i} className="ig-hashtag">{part}</span> : part
    );
  };

  const canProceedStep = () => {
    switch (step) {
      case 0: return images.length > 0 && !uploading;
      case 1: return caption.length <= 2200;
      case 2: return publishNow || (scheduleDate && scheduleTime);
      default: return true;
    }
  };

  // Not configured screen
  if (configured === false) {
    return (
      <AdminLayout>
        <div className="ig-page">
          <div className="page-header">
            <h1>Instagram</h1>
            <p>Agende posts no Instagram diretamente do painel</p>
          </div>
          <div className="ig-not-configured">
            <div className="ig-not-configured-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
            </div>
            <h2>Instagram nao configurado</h2>
            <p>Para agendar posts, configure as credenciais do Instagram Graph API no backend.</p>
            <div className="ig-setup-steps">
              <ol>
                <li>Crie uma conta Instagram Business</li>
                <li>Conecte o Instagram a uma Facebook Page</li>
                <li>Crie um Meta App em <strong>developers.facebook.com</strong></li>
                <li>Solicite permissoes: <code>instagram_basic</code>, <code>instagram_content_publish</code></li>
                <li>Gere um long-lived access token (valido 60 dias)</li>
                <li>Configure as variaveis de ambiente: <code>INSTAGRAM_ACCOUNT_ID</code> e <code>INSTAGRAM_ACCESS_TOKEN</code></li>
              </ol>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Loading config
  if (configured === null) {
    return (
      <AdminLayout>
        <div className="ig-page">
          <div className="ig-loading">
            <span className="ig-spinner" />
            Verificando configuracao...
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="ig-page">
        <div className="page-header">
          <h1>Instagram</h1>
          <p>Agende posts no Instagram diretamente do painel</p>
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

        {/* ====== AGENDA TAB ====== */}
        {tab === 'agenda' && (
          <>
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
              <div className="ig-loading">
                <span className="ig-spinner" />
                Carregando agendamentos...
              </div>
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
                        {s.caption || '(sem legenda)'}
                      </div>
                      <div className="ig-schedule-card-meta">
                        <span className={`ig-status ig-status-${s.status}`}>
                          {STATUS_LABELS[s.status] || s.status}
                        </span>
                        <span>
                          {new Date(s.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {s.error_message && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444' }}>
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
          </>
        )}

        {/* ====== NEW POST TAB ====== */}
        {tab === 'novo' && (
          <>
            {/* Steps indicator */}
            <div className="ig-steps">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`ig-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
                >
                  <span className="ig-step-number">
                    {i < step ? '\u2713' : i + 1}
                  </span>
                  <span className="ig-step-label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Step 0: Media upload */}
            {step === 0 && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div
                  className={`ig-upload-area ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="ig-upload-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  </div>
                  <p><strong>Clique</strong> ou arraste imagens aqui</p>
                  <p className="ig-upload-hint">JPEG, PNG ou WebP. Max 10MB por imagem.</p>
                </div>

                {uploading && (
                  <div className="ig-loading" style={{ padding: '1rem' }}>
                    <span className="ig-spinner" />
                    Enviando imagem...
                  </div>
                )}

                {images.length > 0 && (
                  <>
                    <div className="ig-image-previews">
                      {images.map((img, i) => (
                        <div key={img.id} className="ig-image-preview">
                          <img src={`${API_URL}${img.url}`} alt={`Imagem ${i + 1}`} />
                          <button
                            className="ig-image-preview-remove"
                            onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                          >
                            X
                          </button>
                          {images.length > 1 && (
                            <span className="ig-image-preview-order">{i + 1}</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {images.length > 1 && (
                      <div className="ig-carousel-toggle">
                        <strong>Carrossel</strong> — {images.length} imagens
                      </div>
                    )}
                  </>
                )}

                <div className="ig-actions">
                  <button
                    className="ig-btn ig-btn-primary"
                    disabled={!canProceedStep()}
                    onClick={() => setStep(1)}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Caption */}
            {step === 1 && (
              <div>
                <div className="ig-form-group">
                  <label>
                    Legenda <span className="ig-label-hint">(opcional, max 2200 caracteres)</span>
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Escreva a legenda do post... Use #hashtags para alcance"
                  />
                  <span className={`ig-char-count ${caption.length > 2000 ? caption.length > 2200 ? 'danger' : 'warning' : ''}`}>
                    {caption.length}/2200
                  </span>
                </div>

                <div className="ig-actions">
                  <button className="ig-btn ig-btn-secondary" onClick={() => setStep(0)}>
                    Voltar
                  </button>
                  <button
                    className="ig-btn ig-btn-primary"
                    disabled={!canProceedStep()}
                    onClick={() => setStep(2)}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Schedule */}
            {step === 2 && (
              <div>
                <label className="ig-publish-now">
                  <input
                    type="checkbox"
                    checked={publishNow}
                    onChange={(e) => setPublishNow(e.target.checked)}
                  />
                  Publicar agora
                </label>

                {!publishNow && (
                  <div className="ig-schedule-row">
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

                <div className="ig-actions">
                  <button className="ig-btn ig-btn-secondary" onClick={() => setStep(1)}>
                    Voltar
                  </button>
                  <button
                    className="ig-btn ig-btn-primary"
                    disabled={!canProceedStep()}
                    onClick={() => setStep(3)}
                  >
                    Revisar
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div>
                <div className="ig-preview-mockup">
                  <div className="ig-preview-header">
                    <div className="ig-preview-avatar">W</div>
                    <span className="ig-preview-username">whodo</span>
                  </div>

                  {images.length === 1 ? (
                    <img
                      className="ig-preview-image"
                      src={`${API_URL}${images[0].url}`}
                      alt="Preview"
                    />
                  ) : (
                    <div className="ig-preview-carousel">
                      <img
                        src={`${API_URL}${images[0].url}`}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div className="ig-preview-carousel-dots">
                        {images.map((_, i) => (
                          <div key={i} className={`ig-preview-carousel-dot ${i === 0 ? 'active' : ''}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  {caption && (
                    <div className="ig-preview-caption">
                      {renderCaption(caption)}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#a1a1aa', textAlign: 'center' }}>
                  {publishNow ? (
                    <span>Sera publicado imediatamente apos confirmar.</span>
                  ) : (
                    <span>
                      Agendado para <strong style={{ color: '#fafafa' }}>
                        {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="ig-actions" style={{ justifyContent: 'center' }}>
                  <button className="ig-btn ig-btn-secondary" onClick={() => setStep(2)}>
                    Voltar
                  </button>
                  <button
                    className="ig-btn ig-btn-primary"
                    onClick={() => setShowConfirm(true)}
                  >
                    {publishNow ? 'Publicar agora' : 'Agendar post'}
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
                  ? 'O post sera publicado no Instagram imediatamente. Continuar?'
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
    </AdminLayout>
  );
}
