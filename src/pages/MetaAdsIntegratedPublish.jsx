import { useState, useEffect, useCallback, useRef } from 'react';
import { integratedPublish, instagram, metaAds, API_URL } from '../services/api';
import './MetaAdsIntegratedPublish.css';

const STATUS_COLORS = {
  scheduled: '#60a5fa',
  published: '#4ade80',
  completed: '#4ade80',
  failed: '#f87171',
  processing: '#fbbf24',
};

const STATUS_LABEL = {
  scheduled: 'Agendado',
  published: 'Publicado',
  completed: 'Concluido',
  failed: 'Falhou',
  processing: 'Processando',
};

const OBJECTIVES = [
  { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento' },
  { value: 'OUTCOME_TRAFFIC', label: 'Trafego' },
];

const CTA_OPTIONS = [
  'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'CONTACT_US', 'BOOK_TRAVEL',
  'DOWNLOAD', 'GET_OFFER', 'WATCH_MORE', 'APPLY_NOW', 'SUBSCRIBE',
];

const STEPS = ['Midia', 'Legenda', 'Campanha', 'Segmentacao', 'Revisao'];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export default function MetaAdsIntegratedPublish() {
  // View: 'list' or 'wizard'
  const [view, setView] = useState('list');

  // List state
  const [items, setItems] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [listFilter, setListFilter] = useState('');

  // Wizard state
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState('');

  // Step 1: Media
  const [mediaFiles, setMediaFiles] = useState([]); // { file, preview, id?, url?, uploading? }
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Step 2: Caption
  const [caption, setCaption] = useState('');

  // Step 3: Campaign
  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState('OUTCOME_AWARENESS');
  const [dailyBudget, setDailyBudget] = useState('');
  const [durationDays, setDurationDays] = useState('7');
  const [linkUrl, setLinkUrl] = useState('');
  const [cta, setCta] = useState('LEARN_MORE');

  // Step 4: Targeting
  const [countries, setCountries] = useState('BR');
  const [ageMin, setAgeMin] = useState('18');
  const [ageMax, setAgeMax] = useState('65');
  const [gender, setGender] = useState('0'); // 0=all, 1=male, 2=female
  const [interestQuery, setInterestQuery] = useState('');
  const [interestResults, setInterestResults] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [searchingInterests, setSearchingInterests] = useState(false);
  const interestDebounce = useRef(null);

  // Load list
  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const params = { page: 1, limit: 100 };
      if (listFilter) params.status = listFilter;
      const data = await integratedPublish.list(params);
      setItems(data?.items || []);
    } catch (err) {
      setListError(err.message);
    } finally {
      setListLoading(false);
    }
  }, [listFilter]);

  useEffect(() => {
    if (view === 'list') loadList();
  }, [view, loadList]);

  // Interest search with debounce
  useEffect(() => {
    if (!interestQuery.trim()) {
      setInterestResults([]);
      return;
    }
    clearTimeout(interestDebounce.current);
    interestDebounce.current = setTimeout(async () => {
      setSearchingInterests(true);
      try {
        const res = await metaAds.searchInterests(interestQuery);
        setInterestResults(res?.data || res || []);
      } catch {
        setInterestResults([]);
      } finally {
        setSearchingInterests(false);
      }
    }, 400);
    return () => clearTimeout(interestDebounce.current);
  }, [interestQuery]);

  // File handling
  const handleFiles = (files) => {
    const newFiles = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: null,
      url: null,
      uploading: false,
    }));
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => {
      const next = [...prev];
      if (next[index].preview) URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  // Upload all files that haven't been uploaded
  const uploadAllMedia = async () => {
    const updated = [...mediaFiles];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].id) continue; // already uploaded
      updated[i] = { ...updated[i], uploading: true };
      setMediaFiles([...updated]);
      try {
        const res = await instagram.uploadImage(updated[i].file);
        updated[i] = { ...updated[i], id: res.id, url: res.url, uploading: false };
      } catch (err) {
        throw new Error(`Erro ao fazer upload da imagem ${i + 1}: ${err.message}`);
      }
    }
    setMediaFiles([...updated]);
    return updated;
  };

  // Delete item
  const handleDeleteItem = async (item) => {
    if (!window.confirm('Excluir esta publicacao agendada?')) return;
    try {
      await integratedPublish.delete(item._id || item.id);
      setItems(prev => prev.filter(i => (i._id || i.id) !== (item._id || item.id)));
    } catch (err) {
      setListError(err.message);
    }
  };

  // Wizard navigation
  const canAdvance = () => {
    switch (step) {
      case 0: return mediaFiles.length > 0;
      case 1: return caption.trim().length > 0;
      case 2: return campaignName.trim() && dailyBudget && Number(dailyBudget) > 0;
      case 3: return countries.trim().length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1 && canAdvance()) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    setWizardError('');
    try {
      const uploaded = await uploadAllMedia();
      const imageIds = uploaded.map(m => m.id).filter(Boolean);
      if (imageIds.length === 0) throw new Error('Nenhuma imagem foi enviada com sucesso.');

      const payload = {
        caption,
        media_type: imageIds.length > 1 ? 'CAROUSEL' : 'IMAGE',
        image_ids: imageIds,
        campaign: {
          name: campaignName,
          objective,
          daily_budget: Math.round(Number(dailyBudget) * 100),
          duration_days: parseInt(durationDays) || 7,
          targeting: {
            countries: countries.split(',').map(c => c.trim().toUpperCase()).filter(Boolean),
            age_min: parseInt(ageMin) || 18,
            age_max: parseInt(ageMax) || 65,
            genders: gender === '0' ? [] : [parseInt(gender)],
            interests: selectedInterests.map(i => ({ id: i.id, name: i.name })),
          },
          creative: {
            call_to_action: cta,
            ...(objective === 'OUTCOME_TRAFFIC' && linkUrl ? { link_url: linkUrl } : {}),
          },
        },
      };

      await integratedPublish.create(payload);

      // Reset wizard
      resetWizard();
      setView('list');
    } catch (err) {
      setWizardError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setMediaFiles([]);
    setCaption('');
    setCampaignName('');
    setObjective('OUTCOME_AWARENESS');
    setDailyBudget('');
    setDurationDays('7');
    setLinkUrl('');
    setCta('LEARN_MORE');
    setCountries('BR');
    setAgeMin('18');
    setAgeMax('65');
    setGender('0');
    setInterestQuery('');
    setInterestResults([]);
    setSelectedInterests([]);
    setWizardError('');
  };

  const startWizard = () => {
    resetWizard();
    setView('wizard');
  };

  // ─── LIST VIEW ───
  if (view === 'list') {
    const filteredItems = listFilter
      ? items.filter(i => i.status === listFilter)
      : items;

    return (
      <div className="mads-ip">
        <div className="mads-ip-header">
          <div className="mads-ip-filters">
            {['', 'scheduled', 'completed', 'failed'].map(f => (
              <button
                key={f}
                className={`mads-ip-filter-btn ${listFilter === f ? 'active' : ''}`}
                onClick={() => setListFilter(f)}
              >
                {f === '' ? 'Todos' : STATUS_LABEL[f] || f}
              </button>
            ))}
          </div>
          <button className="mads-btn-new" onClick={startWizard}>
            + Nova Publicacao
          </button>
        </div>

        {listError && <div className="mads-error">{listError}</div>}

        {listLoading ? (
          <div className="mads-loading">
            <span className="mads-spinner" />
            Carregando publicacoes...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mads-empty">
            <div className="mads-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <h3>Nenhuma publicacao integrada</h3>
            <p>Publique no Instagram e crie uma campanha Meta Ads em um unico fluxo.</p>
            <button className="mads-btn-new" onClick={startWizard}>
              + Criar primeira publicacao
            </button>
          </div>
        ) : (
          <div className="mads-ip-list">
            {filteredItems.map(item => {
              const statusColor = STATUS_COLORS[item.status] || '#71717a';
              return (
                <div key={item._id || item.id} className="mads-ip-card">
                  {item.image_urls?.[0] && (
                    <div className="mads-ip-card-thumb">
                      <img src={`${API_URL}${item.image_urls[0]}`} alt="" loading="lazy" />
                    </div>
                  )}
                  <div className="mads-ip-card-body">
                    <p className="mads-ip-card-caption">
                      {item.caption?.slice(0, 120) || 'Sem legenda'}
                      {item.caption?.length > 120 ? '...' : ''}
                    </p>
                    {item.campaign && (
                      <div className="mads-ip-card-campaign">
                        <span>{item.campaign.name}</span>
                        {item.campaign.daily_budget && (
                          <span>R${(item.campaign.daily_budget / 100).toFixed(2)}/dia</span>
                        )}
                        {item.campaign.duration_days && (
                          <span>{item.campaign.duration_days} dias</span>
                        )}
                      </div>
                    )}
                    {item.status === 'failed' && item.error_message && (
                      <p className="mads-ip-error">{item.error_message}</p>
                    )}
                  </div>
                  <div className="mads-ip-card-right">
                    <span
                      className="mads-ip-status"
                      style={{
                        background: `${statusColor}18`,
                        color: statusColor,
                        borderColor: `${statusColor}30`,
                      }}
                    >
                      {STATUS_LABEL[item.status] || item.status}
                    </span>
                    {item.scheduled_at && (
                      <span className="mads-ip-card-date">{formatDate(item.scheduled_at)}</span>
                    )}
                    {item.status === 'scheduled' && (
                      <button
                        className="mads-action-btn mads-action-delete"
                        onClick={() => handleDeleteItem(item)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── WIZARD VIEW ───
  return (
    <div className="mads-ip">
      <div className="mads-ip-wizard-header">
        <button className="mads-ip-back-btn" onClick={() => setView('list')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar
        </button>
        <h2 className="mads-ip-wizard-title">Nova Publicacao Integrada</h2>
      </div>

      {/* Steps indicator */}
      <div className="mads-ip-steps">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={`mads-ip-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => i < step && setStep(i)}
          >
            <span className="mads-ip-step-num">{i < step ? '\u2713' : i + 1}</span>
            <span className="mads-ip-step-label">{s}</span>
          </div>
        ))}
      </div>

      {wizardError && <div className="mads-error">{wizardError}</div>}

      <div className="mads-ip-step-content">
        {/* Step 1: Media */}
        {step === 0 && (
          <div className="mads-form-section">
            <h3>Upload de Midia</h3>
            <p className="mads-form-hint">Arraste imagens ou clique para selecionar.</p>
            <div
              className={`mads-ip-dropzone ${dragOver ? 'dragover' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>Clique ou arraste imagens aqui</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => handleFiles(e.target.files)}
              />
            </div>

            {mediaFiles.length > 0 && (
              <div className="mads-ip-media-grid">
                {mediaFiles.map((m, i) => (
                  <div key={i} className="mads-ip-media-item">
                    <img src={m.preview} alt="" />
                    {m.uploading && <div className="mads-ip-media-uploading"><span className="mads-spinner" /></div>}
                    {m.id && <div className="mads-ip-media-check">{'\u2713'}</div>}
                    <button className="mads-ip-media-remove" onClick={(e) => { e.stopPropagation(); removeMedia(i); }}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Caption */}
        {step === 1 && (
          <div className="mads-form-section">
            <h3>Legenda do Post</h3>
            <textarea
              className="mads-field mads-ip-textarea"
              placeholder="Escreva a legenda do seu post no Instagram..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={6}
            />
            <div className="mads-ip-char-count">
              {caption.length} / 2.200 caracteres
            </div>
          </div>
        )}

        {/* Step 3: Campaign */}
        {step === 2 && (
          <div className="mads-form-section">
            <h3>Configuracao da Campanha</h3>
            <div className="mads-ip-form-grid">
              <label className="mads-ip-label">
                Nome da Campanha
                <input
                  className="mads-field"
                  type="text"
                  placeholder="Ex: Lancamento Verao 2026"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                />
              </label>
              <label className="mads-ip-label">
                Objetivo
                <select
                  className="mads-field"
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                >
                  {OBJECTIVES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className="mads-ip-label">
                Orcamento Diario (R$)
                <input
                  className="mads-field"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ex: 20.00"
                  value={dailyBudget}
                  onChange={e => setDailyBudget(e.target.value)}
                />
              </label>
              <label className="mads-ip-label">
                Duracao (dias)
                <input
                  className="mads-field"
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={e => setDurationDays(e.target.value)}
                />
              </label>
              {objective === 'OUTCOME_TRAFFIC' && (
                <label className="mads-ip-label mads-ip-label-full">
                  URL de Destino
                  <input
                    className="mads-field"
                    type="url"
                    placeholder="https://seusite.com/pagina"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                  />
                </label>
              )}
              <label className="mads-ip-label">
                Call to Action
                <select
                  className="mads-field"
                  value={cta}
                  onChange={e => setCta(e.target.value)}
                >
                  {CTA_OPTIONS.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Targeting */}
        {step === 3 && (
          <div className="mads-form-section">
            <h3>Segmentacao</h3>
            <div className="mads-ip-form-grid">
              <label className="mads-ip-label">
                Paises (codigos separados por virgula)
                <input
                  className="mads-field"
                  type="text"
                  placeholder="BR, US, PT"
                  value={countries}
                  onChange={e => setCountries(e.target.value)}
                />
              </label>
              <label className="mads-ip-label">
                Idade Minima
                <input
                  className="mads-field"
                  type="number"
                  min="13"
                  max="65"
                  value={ageMin}
                  onChange={e => setAgeMin(e.target.value)}
                />
              </label>
              <label className="mads-ip-label">
                Idade Maxima
                <input
                  className="mads-field"
                  type="number"
                  min="13"
                  max="65"
                  value={ageMax}
                  onChange={e => setAgeMax(e.target.value)}
                />
              </label>
              <label className="mads-ip-label">
                Genero
                <select
                  className="mads-field"
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                >
                  <option value="0">Todos</option>
                  <option value="1">Masculino</option>
                  <option value="2">Feminino</option>
                </select>
              </label>
            </div>

            {/* Interest search */}
            <div className="mads-ip-interests">
              <label className="mads-ip-label">
                Interesses
                <input
                  className="mads-field"
                  type="text"
                  placeholder="Buscar interesses..."
                  value={interestQuery}
                  onChange={e => setInterestQuery(e.target.value)}
                />
              </label>
              {searchingInterests && (
                <div className="mads-ip-interest-loading">
                  <span className="mads-spinner" style={{ width: 14, height: 14 }} /> Buscando...
                </div>
              )}
              {interestResults.length > 0 && (
                <div className="mads-ip-interest-results">
                  {interestResults.slice(0, 15).map(interest => {
                    const selected = selectedInterests.some(s => s.id === interest.id);
                    return (
                      <button
                        key={interest.id}
                        className={`mads-ip-interest-tag ${selected ? 'selected' : ''}`}
                        onClick={() => {
                          if (selected) {
                            setSelectedInterests(prev => prev.filter(s => s.id !== interest.id));
                          } else {
                            setSelectedInterests(prev => [...prev, { id: interest.id, name: interest.name }]);
                          }
                        }}
                      >
                        {interest.name}
                        {interest.audience_size_lower_bound && (
                          <span className="mads-ip-interest-audience">
                            {(interest.audience_size_lower_bound / 1000000).toFixed(1)}M+
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedInterests.length > 0 && (
                <div className="mads-ip-selected-interests">
                  <span className="mads-ip-selected-label">Selecionados:</span>
                  {selectedInterests.map(s => (
                    <span key={s.id} className="mads-ip-interest-tag selected">
                      {s.name}
                      <button onClick={() => setSelectedInterests(prev => prev.filter(i => i.id !== s.id))}>
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="mads-form-section">
            <h3>Revisao</h3>
            <div className="mads-ip-review">
              <div className="mads-ip-review-section">
                <h4>Midia</h4>
                <div className="mads-ip-media-grid small">
                  {mediaFiles.map((m, i) => (
                    <div key={i} className="mads-ip-media-item small">
                      <img src={m.preview} alt="" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mads-ip-review-section">
                <h4>Legenda</h4>
                <p className="mads-ip-review-text">{caption}</p>
              </div>

              <div className="mads-ip-review-section">
                <h4>Campanha</h4>
                <div className="mads-ip-review-grid">
                  <span>Nome: <strong>{campaignName}</strong></span>
                  <span>Objetivo: <strong>{OBJECTIVES.find(o => o.value === objective)?.label}</strong></span>
                  <span>Orcamento: <strong>R$ {Number(dailyBudget).toFixed(2)}/dia</strong></span>
                  <span>Duracao: <strong>{durationDays} dias</strong></span>
                  <span>CTA: <strong>{cta.replace(/_/g, ' ')}</strong></span>
                  {objective === 'OUTCOME_TRAFFIC' && linkUrl && (
                    <span>URL: <strong>{linkUrl}</strong></span>
                  )}
                </div>
              </div>

              <div className="mads-ip-review-section">
                <h4>Segmentacao</h4>
                <div className="mads-ip-review-grid">
                  <span>Paises: <strong>{countries}</strong></span>
                  <span>Idade: <strong>{ageMin} - {ageMax}</strong></span>
                  <span>Genero: <strong>{gender === '0' ? 'Todos' : gender === '1' ? 'Masculino' : 'Feminino'}</strong></span>
                  {selectedInterests.length > 0 && (
                    <span>Interesses: <strong>{selectedInterests.map(i => i.name).join(', ')}</strong></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard navigation */}
      <div className="mads-ip-wizard-nav">
        {step > 0 && (
          <button className="mads-action-btn" onClick={handleBack} disabled={submitting}>
            Voltar
          </button>
        )}
        <div className="mads-ip-wizard-nav-spacer" />
        {step < STEPS.length - 1 ? (
          <button
            className="mads-btn-new"
            onClick={handleNext}
            disabled={!canAdvance()}
          >
            Proximo
          </button>
        ) : (
          <button
            className="mads-btn-new"
            onClick={handleSubmit}
            disabled={submitting || !canAdvance()}
          >
            {submitting ? (
              <><span className="mads-spinner" style={{ width: 16, height: 16 }} /> Publicando...</>
            ) : (
              'Publicar + Criar Campanha'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
