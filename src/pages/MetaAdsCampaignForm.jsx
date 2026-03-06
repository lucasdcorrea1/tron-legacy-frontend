import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { metaAds } from '../services/api';
import './MetaAdsCampaignForm.css';

const OBJECTIVES = [
  { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento', desc: 'Alcance e lembranca de marca' },
  { value: 'OUTCOME_TRAFFIC', label: 'Trafego', desc: 'Direcionar para site ou app' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento', desc: 'Curtidas, comentarios, compartilhamentos' },
  { value: 'OUTCOME_LEADS', label: 'Leads', desc: 'Gerar cadastros e contatos' },
  { value: 'OUTCOME_APP_PROMOTION', label: 'App', desc: 'Instalacoes e engajamento no app' },
  { value: 'OUTCOME_SALES', label: 'Vendas', desc: 'Conversoes e vendas no catalogo' },
];

const SPECIAL_AD_CATEGORIES = [
  { value: 'CREDIT', label: 'Credito' },
  { value: 'EMPLOYMENT', label: 'Emprego' },
  { value: 'HOUSING', label: 'Moradia' },
  { value: 'ISSUES_ELECTIONS_POLITICS', label: 'Politica' },
];

const BID_STRATEGIES = [
  { value: 'LOWEST_COST_WITHOUT_CAP', label: 'Menor custo' },
  { value: 'LOWEST_COST_WITH_BID_CAP', label: 'Menor custo com limite' },
  { value: 'COST_CAP', label: 'Custo limite' },
];

const BILLING_EVENTS = [
  { value: 'IMPRESSIONS', label: 'Impressoes' },
  { value: 'LINK_CLICKS', label: 'Cliques no link' },
  { value: 'POST_ENGAGEMENT', label: 'Engajamento' },
];

const OPTIMIZATION_GOALS = [
  { value: 'REACH', label: 'Alcance' },
  { value: 'IMPRESSIONS', label: 'Impressoes' },
  { value: 'LINK_CLICKS', label: 'Cliques no link' },
  { value: 'LANDING_PAGE_VIEWS', label: 'Visualizacoes da pagina' },
  { value: 'LEAD_GENERATION', label: 'Geracao de leads' },
  { value: 'OFFSITE_CONVERSIONS', label: 'Conversoes' },
];

const CTA_TYPES = [
  'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'BOOK_TRAVEL', 'CONTACT_US',
  'DOWNLOAD', 'GET_OFFER', 'GET_QUOTE', 'SUBSCRIBE', 'WATCH_MORE',
];

const STEPS = ['Campanha', 'Conjunto', 'Anuncio', 'Revisao'];

export default function MetaAdsCampaignForm() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Templates & Presets
  const [templates, setTemplates] = useState([]);
  const [presets, setPresets] = useState([]);

  // Step 1: Campaign
  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState('OUTCOME_TRAFFIC');
  const [specialCategories, setSpecialCategories] = useState([]);
  const [bidStrategy, setBidStrategy] = useState('LOWEST_COST_WITHOUT_CAP');

  // Step 2: Ad Set
  const [adsetName, setAdsetName] = useState('');
  const [budgetType, setBudgetType] = useState('daily');
  const [budget, setBudget] = useState('');
  const [billingEvent, setBillingEvent] = useState('IMPRESSIONS');
  const [optimizationGoal, setOptimizationGoal] = useState('LINK_CLICKS');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Targeting
  const [countries, setCountries] = useState(['BR']);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [genders, setGenders] = useState([0]);
  const [interests, setInterests] = useState([]);
  const [interestSearch, setInterestSearch] = useState('');
  const [interestResults, setInterestResults] = useState([]);
  const [searchingInterests, setSearchingInterests] = useState(false);

  // Step 3: Ad
  const [adName, setAdName] = useState('');
  const [adFormat, setAdFormat] = useState('image');
  const [adText, setAdText] = useState('');
  const [adHeadline, setAdHeadline] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adCta, setAdCta] = useState('LEARN_MORE');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageHash, setImageHash] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    metaAds.listTemplates().then(setTemplates).catch(() => {});
    metaAds.listPresets().then(setPresets).catch(() => {});
  }, []);

  useEffect(() => {
    if (editId) {
      metaAds.getCampaign(editId).then(data => {
        setCampaignName(data.name || '');
        setObjective(data.objective || 'OUTCOME_TRAFFIC');
        setSpecialCategories(data.special_ad_categories || []);
        setBidStrategy(data.bid_strategy || 'LOWEST_COST_WITHOUT_CAP');
      }).catch(err => setError(err.message));
    }
  }, [editId]);

  // Debounced interest search
  useEffect(() => {
    if (interestSearch.length < 2) {
      setInterestResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingInterests(true);
      try {
        const data = await metaAds.searchInterests(interestSearch);
        setInterestResults(data?.data || []);
      } catch {
        setInterestResults([]);
      } finally {
        setSearchingInterests(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [interestSearch]);

  const handleImageUpload = async (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');
    try {
      const result = await metaAds.uploadImage(file);
      // Meta returns images: { filename: { hash: "...", ... } }
      const images = result?.images;
      if (images) {
        const firstKey = Object.keys(images)[0];
        if (firstKey) {
          setImageHash(images[firstKey].hash);
        }
      }
    } catch (err) {
      setError('Erro no upload: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const addInterest = (interest) => {
    if (!interests.find(i => i.id === interest.id)) {
      setInterests([...interests, { id: String(interest.id), name: interest.name }]);
    }
    setInterestSearch('');
    setInterestResults([]);
  };

  const removeInterest = (id) => {
    setInterests(interests.filter(i => i.id !== id));
  };

  const loadTemplate = (tpl) => {
    setCampaignName(tpl.name + ' (copia)');
    setObjective(tpl.objective || 'OUTCOME_TRAFFIC');
    setBidStrategy(tpl.bid_strategy || 'LOWEST_COST_WITHOUT_CAP');
    if (tpl.daily_budget) {
      setBudgetType('daily');
      setBudget(String(tpl.daily_budget / 100));
    } else if (tpl.lifetime_budget) {
      setBudgetType('lifetime');
      setBudget(String(tpl.lifetime_budget / 100));
    }
    if (tpl.billing_event) setBillingEvent(tpl.billing_event);
    if (tpl.optimization_goal) setOptimizationGoal(tpl.optimization_goal);
    if (tpl.targeting) applyTargeting(tpl.targeting);
  };

  const loadPreset = (preset) => {
    applyTargeting(preset.targeting);
  };

  const applyTargeting = (t) => {
    if (t.geo_locations?.countries) setCountries(t.geo_locations.countries);
    if (t.age_min) setAgeMin(t.age_min);
    if (t.age_max) setAgeMax(t.age_max);
    if (t.genders) setGenders(t.genders);
    if (t.interests) setInterests(t.interests);
  };

  const buildTargeting = () => ({
    geo_locations: { countries },
    age_min: ageMin,
    age_max: ageMax,
    genders,
    interests: interests.map(i => ({ id: i.id, name: i.name })),
  });

  const handleSavePreset = async () => {
    const name = window.prompt('Nome do preset de targeting:');
    if (!name) return;
    try {
      await metaAds.createPreset({ name, targeting: buildTargeting() });
      const data = await metaAds.listPresets();
      setPresets(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSaveTemplate = async () => {
    const name = window.prompt('Nome do template:');
    if (!name) return;
    try {
      await metaAds.createTemplate({
        name,
        objective,
        bid_strategy: bidStrategy,
        daily_budget: budgetType === 'daily' ? Math.round(parseFloat(budget || 0) * 100) : 0,
        lifetime_budget: budgetType === 'lifetime' ? Math.round(parseFloat(budget || 0) * 100) : 0,
        billing_event: billingEvent,
        optimization_goal: optimizationGoal,
        targeting: buildTargeting(),
      });
      const data = await metaAds.listTemplates();
      setTemplates(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      // 1. Create campaign
      const budgetCents = Math.round(parseFloat(budget || 0) * 100);
      const campaignData = {
        name: campaignName,
        objective,
        status: 'PAUSED',
        bid_strategy: bidStrategy,
        special_ad_categories: specialCategories.length > 0 ? specialCategories : undefined,
        ...(budgetType === 'daily' ? { daily_budget: budgetCents } : { lifetime_budget: budgetCents }),
      };

      const campaignResult = await metaAds.createCampaign(campaignData);
      const campaignId = campaignResult.id;

      // 2. Create ad set
      const adsetData = {
        campaign_id: campaignId,
        name: adsetName || campaignName + ' - Conjunto',
        status: 'PAUSED',
        billing_event: billingEvent,
        optimization_goal: optimizationGoal,
        targeting: buildTargeting(),
        ...(budgetType === 'daily' ? { daily_budget: budgetCents } : { lifetime_budget: budgetCents }),
        ...(startDate && { start_time: new Date(startDate).toISOString() }),
        ...(endDate && { end_time: new Date(endDate).toISOString() }),
      };

      const adsetResult = await metaAds.createAdSet(adsetData);
      const adsetId = adsetResult.id;

      // 3. Create ad
      const adData = {
        adset_id: adsetId,
        name: adName || campaignName + ' - Anuncio',
        status: 'PAUSED',
        creative: {
          format: adFormat,
          body: adText,
          title: adHeadline,
          description: adDescription,
          link_url: adLinkUrl,
          call_to_action: adCta,
          image_hash: imageHash || undefined,
        },
      };

      await metaAds.createAd(adData);

      navigate('/admin/meta-ads');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return !!campaignName && !!objective;
      case 1: return !!budget && parseFloat(budget) > 0;
      case 2: return !!adText && !!adLinkUrl;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <AdminLayout>
      <div className="mads-form-page">
        <div className="mads-form-header">
          <button className="mads-back-btn" onClick={() => navigate('/admin/meta-ads')}>
            ← Voltar
          </button>
          <h1>{editId ? 'Editar Campanha' : 'Nova Campanha'}</h1>
        </div>

        {/* Step indicator */}
        <div className="mads-steps">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`mads-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => i < step && setStep(i)}
            >
              <span className="mads-step-num">{i + 1}</span>
              <span className="mads-step-label">{s}</span>
            </div>
          ))}
        </div>

        {error && <div className="mads-error">{error}</div>}

        {/* Step 0: Campaign */}
        {step === 0 && (
          <div className="mads-form-section">
            {templates.length > 0 && (
              <div className="mads-templates-bar">
                <span>Carregar template:</span>
                {templates.map(t => (
                  <button key={t.id} className="mads-chip" onClick={() => loadTemplate(t)}>
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mads-field">
              <label>Nome da Campanha *</label>
              <input
                type="text"
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="Ex: Black Friday 2024"
              />
            </div>

            <div className="mads-field">
              <label>Objetivo *</label>
              <div className="mads-objectives-grid">
                {OBJECTIVES.map(obj => (
                  <div
                    key={obj.value}
                    className={`mads-objective-card ${objective === obj.value ? 'selected' : ''}`}
                    onClick={() => setObjective(obj.value)}
                  >
                    <strong>{obj.label}</strong>
                    <span>{obj.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mads-field">
              <label>Estrategia de Lance</label>
              <select value={bidStrategy} onChange={e => setBidStrategy(e.target.value)}>
                {BID_STRATEGIES.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="mads-field">
              <label>Categorias Especiais de Anuncio</label>
              <div className="mads-checkbox-group">
                {SPECIAL_AD_CATEGORIES.map(cat => (
                  <label key={cat.value} className="mads-checkbox">
                    <input
                      type="checkbox"
                      checked={specialCategories.includes(cat.value)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSpecialCategories([...specialCategories, cat.value]);
                        } else {
                          setSpecialCategories(specialCategories.filter(c => c !== cat.value));
                        }
                      }}
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Ad Set */}
        {step === 1 && (
          <div className="mads-form-section">
            {presets.length > 0 && (
              <div className="mads-templates-bar">
                <span>Preset targeting:</span>
                {presets.map(p => (
                  <button key={p.id} className="mads-chip" onClick={() => loadPreset(p)}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mads-field">
              <label>Nome do Conjunto</label>
              <input
                type="text"
                value={adsetName}
                onChange={e => setAdsetName(e.target.value)}
                placeholder="Opcional - sera gerado automaticamente"
              />
            </div>

            <div className="mads-field-row">
              <div className="mads-field">
                <label>Tipo de Orcamento</label>
                <select value={budgetType} onChange={e => setBudgetType(e.target.value)}>
                  <option value="daily">Diario</option>
                  <option value="lifetime">Vitalicio</option>
                </select>
              </div>
              <div className="mads-field">
                <label>Valor (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="Ex: 50.00"
                />
              </div>
            </div>

            <div className="mads-field-row">
              <div className="mads-field">
                <label>Evento de Cobranca</label>
                <select value={billingEvent} onChange={e => setBillingEvent(e.target.value)}>
                  {BILLING_EVENTS.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>
              <div className="mads-field">
                <label>Objetivo de Otimizacao</label>
                <select value={optimizationGoal} onChange={e => setOptimizationGoal(e.target.value)}>
                  {OPTIMIZATION_GOALS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mads-field-row">
              <div className="mads-field">
                <label>Data Inicio</label>
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="mads-field">
                <label>Data Fim</label>
                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <hr className="mads-divider" />
            <h3 className="mads-section-title">Targeting</h3>

            <div className="mads-field">
              <label>Paises</label>
              <input
                type="text"
                value={countries.join(', ')}
                onChange={e => setCountries(e.target.value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean))}
                placeholder="BR, US, PT"
              />
            </div>

            <div className="mads-field-row">
              <div className="mads-field">
                <label>Idade Min</label>
                <input type="number" min={13} max={65} value={ageMin} onChange={e => setAgeMin(parseInt(e.target.value))} />
              </div>
              <div className="mads-field">
                <label>Idade Max</label>
                <input type="number" min={13} max={65} value={ageMax} onChange={e => setAgeMax(parseInt(e.target.value))} />
              </div>
              <div className="mads-field">
                <label>Genero</label>
                <select value={genders[0]} onChange={e => setGenders([parseInt(e.target.value)])}>
                  <option value={0}>Todos</option>
                  <option value={1}>Masculino</option>
                  <option value={2}>Feminino</option>
                </select>
              </div>
            </div>

            <div className="mads-field">
              <label>Interesses</label>
              <input
                type="text"
                value={interestSearch}
                onChange={e => setInterestSearch(e.target.value)}
                placeholder="Buscar interesses..."
              />
              {searchingInterests && <div className="mads-search-hint">Buscando...</div>}
              {interestResults.length > 0 && (
                <div className="mads-search-results">
                  {interestResults.map(r => (
                    <div key={r.id} className="mads-search-item" onClick={() => addInterest(r)}>
                      {r.name}
                      {r.audience_size && <span className="mads-audience-size">{Number(r.audience_size).toLocaleString('pt-BR')}</span>}
                    </div>
                  ))}
                </div>
              )}
              {interests.length > 0 && (
                <div className="mads-tags">
                  {interests.map(i => (
                    <span key={i.id} className="mads-tag">
                      {i.name}
                      <button onClick={() => removeInterest(i.id)}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button className="mads-btn secondary small" onClick={handleSavePreset}>
              Salvar como Preset
            </button>
          </div>
        )}

        {/* Step 2: Ad */}
        {step === 2 && (
          <div className="mads-form-section">
            <div className="mads-field">
              <label>Nome do Anuncio</label>
              <input
                type="text"
                value={adName}
                onChange={e => setAdName(e.target.value)}
                placeholder="Opcional - sera gerado automaticamente"
              />
            </div>

            <div className="mads-field">
              <label>Formato</label>
              <div className="mads-format-options">
                {['image', 'video', 'carousel'].map(f => (
                  <button
                    key={f}
                    className={`mads-format-btn ${adFormat === f ? 'active' : ''}`}
                    onClick={() => setAdFormat(f)}
                  >
                    {f === 'image' ? 'Imagem' : f === 'video' ? 'Video' : 'Carousel'}
                  </button>
                ))}
              </div>
            </div>

            {adFormat === 'image' && (
              <div className="mads-field">
                <label>Imagem</label>
                <div
                  className="mads-dropzone"
                  onClick={() => document.getElementById('mads-image-input').click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    handleImageUpload(e.dataTransfer.files[0]);
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="mads-image-preview" />
                  ) : (
                    <span>{uploading ? 'Fazendo upload...' : 'Clique ou arraste uma imagem'}</span>
                  )}
                  <input
                    id="mads-image-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => handleImageUpload(e.target.files[0])}
                  />
                </div>
                {imageHash && <span className="mads-hash-info">Hash: {imageHash}</span>}
              </div>
            )}

            <div className="mads-field">
              <label>Texto do Anuncio *</label>
              <textarea
                value={adText}
                onChange={e => setAdText(e.target.value)}
                rows={3}
                placeholder="Texto principal do anuncio"
              />
            </div>

            <div className="mads-field-row">
              <div className="mads-field">
                <label>Headline</label>
                <input
                  type="text"
                  value={adHeadline}
                  onChange={e => setAdHeadline(e.target.value)}
                  placeholder="Titulo curto"
                />
              </div>
              <div className="mads-field">
                <label>CTA</label>
                <select value={adCta} onChange={e => setAdCta(e.target.value)}>
                  {CTA_TYPES.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mads-field">
              <label>Descricao</label>
              <input
                type="text"
                value={adDescription}
                onChange={e => setAdDescription(e.target.value)}
                placeholder="Descricao complementar"
              />
            </div>

            <div className="mads-field">
              <label>URL de Destino *</label>
              <input
                type="url"
                value={adLinkUrl}
                onChange={e => setAdLinkUrl(e.target.value)}
                placeholder="https://seusite.com/pagina"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="mads-form-section">
            <h3 className="mads-section-title">Resumo da Campanha</h3>

            <div className="mads-review-grid">
              <div className="mads-review-card">
                <h4>Campanha</h4>
                <div className="mads-review-row"><span>Nome:</span><strong>{campaignName}</strong></div>
                <div className="mads-review-row"><span>Objetivo:</span><strong>{OBJECTIVES.find(o => o.value === objective)?.label}</strong></div>
                <div className="mads-review-row"><span>Lance:</span><strong>{BID_STRATEGIES.find(b => b.value === bidStrategy)?.label}</strong></div>
                <div className="mads-review-row"><span>Status:</span><strong className="mads-paused">PAUSED</strong></div>
              </div>

              <div className="mads-review-card">
                <h4>Conjunto de Anuncios</h4>
                <div className="mads-review-row"><span>Orcamento:</span><strong>R$ {parseFloat(budget || 0).toFixed(2)} ({budgetType === 'daily' ? 'diario' : 'vitalicio'})</strong></div>
                <div className="mads-review-row"><span>Cobranca:</span><strong>{BILLING_EVENTS.find(b => b.value === billingEvent)?.label}</strong></div>
                <div className="mads-review-row"><span>Otimizacao:</span><strong>{OPTIMIZATION_GOALS.find(g => g.value === optimizationGoal)?.label}</strong></div>
                <div className="mads-review-row"><span>Paises:</span><strong>{countries.join(', ')}</strong></div>
                <div className="mads-review-row"><span>Idade:</span><strong>{ageMin} - {ageMax}</strong></div>
                {interests.length > 0 && (
                  <div className="mads-review-row"><span>Interesses:</span><strong>{interests.map(i => i.name).join(', ')}</strong></div>
                )}
              </div>

              <div className="mads-review-card">
                <h4>Anuncio</h4>
                <div className="mads-review-row"><span>Formato:</span><strong>{adFormat}</strong></div>
                <div className="mads-review-row"><span>Texto:</span><strong>{adText}</strong></div>
                {adHeadline && <div className="mads-review-row"><span>Headline:</span><strong>{adHeadline}</strong></div>}
                <div className="mads-review-row"><span>CTA:</span><strong>{adCta.replace(/_/g, ' ')}</strong></div>
                <div className="mads-review-row"><span>URL:</span><strong>{adLinkUrl}</strong></div>
              </div>
            </div>

            <div className="mads-review-note">
              A campanha sera criada com status <strong>PAUSED</strong> por seguranca.
              Ative-a manualmente depois de verificar no Meta Ads Manager.
            </div>

            <button className="mads-btn secondary" onClick={handleSaveTemplate}>
              Salvar como Template
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="mads-form-nav">
          {step > 0 && (
            <button className="mads-btn secondary" onClick={() => setStep(step - 1)}>
              Anterior
            </button>
          )}
          <div className="mads-form-nav-spacer" />
          {step < 3 ? (
            <button
              className="mads-btn primary"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Proximo
            </button>
          ) : (
            <button
              className="mads-btn primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Criando...' : 'Criar Campanha (PAUSED)'}
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
