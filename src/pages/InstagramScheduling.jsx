import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import { instagram, integratedPublish, metaAds, API_URL } from '../services/api';
import './InstagramScheduling.css';

const STEPS = [
  { label: 'Midia', desc: 'Adicione fotos', icon: 'image' },
  { label: 'Legenda', desc: 'Escreva o texto', icon: 'edit' },
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
  publishing_ig: 'Publicando IG',
  publishing_ads: 'Criando Ads',
  published: 'Publicado',
  completed: 'Concluido',
  failed: 'Falhou',
};

const OBJECTIVE_OPTIONS = [
  { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento' },
  { value: 'OUTCOME_TRAFFIC', label: 'Trafego' },
];

const GENDER_LABELS = { 0: 'Todos', 1: 'Masculino', 2: 'Feminino' };

// Audience presets removed — interest IDs must come from Meta's search API.
// Use the interest search field + "Meus presets salvos" for audience targeting.

// Presets de alcance geografico (so localizacao, sem interesses)
const GEO_PRESETS = [
  {
    id: '_geo_franca',
    name: 'Franca',
    desc: 'Cidade de Franca/SP',
    locations: [{ key: '2429670', name: 'Franca, SP', type: 'city' }],
    targeting: {
      geo_locations: { countries: ['BR'], cities: [{ key: '2429670', name: 'Franca' }] },
    },
  },
  {
    id: '_geo_regiao_franca',
    name: 'Regiao de Franca',
    desc: 'Franca + Patrocinio, Restinga, Cristais',
    locations: [
      { key: '2429670', name: 'Franca, SP', type: 'city' },
      { key: '2513498', name: 'Patrocinio Paulista, SP', type: 'city' },
      { key: '2515720', name: 'Restinga, SP', type: 'city' },
      { key: '2513023', name: 'Cristais Paulista, SP', type: 'city' },
    ],
    targeting: {
      geo_locations: {
        countries: ['BR'],
        cities: [
          { key: '2429670', name: 'Franca' },
          { key: '2513498', name: 'Patrocinio Paulista' },
          { key: '2515720', name: 'Restinga' },
          { key: '2513023', name: 'Cristais Paulista' },
        ],
      },
    },
  },
  {
    id: '_geo_interior_sp',
    name: 'Interior SP',
    desc: 'Ribeirao Preto, Franca, Araraquara, SJRP',
    locations: [
      { key: '2429670', name: 'Franca, SP', type: 'city' },
      { key: '2443890', name: 'Ribeirao Preto, SP', type: 'city' },
      { key: '2429526', name: 'Araraquara, SP', type: 'city' },
      { key: '2429535', name: 'Sao Jose do Rio Preto, SP', type: 'city' },
    ],
    targeting: {
      geo_locations: {
        countries: ['BR'],
        cities: [
          { key: '2429670', name: 'Franca' },
          { key: '2443890', name: 'Ribeirao Preto' },
          { key: '2429526', name: 'Araraquara' },
          { key: '2429535', name: 'Sao Jose do Rio Preto' },
        ],
      },
    },
  },
  {
    id: '_geo_sp_capital',
    name: 'Sao Paulo Capital',
    desc: 'Cidade de Sao Paulo',
    locations: [{ key: '2430536', name: 'Sao Paulo, SP', type: 'city' }],
    targeting: {
      geo_locations: { countries: ['BR'], cities: [{ key: '2430536', name: 'Sao Paulo' }] },
    },
  },
  {
    id: '_geo_brasil',
    name: 'Brasil Inteiro',
    desc: 'Todo o territorio nacional',
    locations: [{ key: 'BR', name: 'Brasil', type: 'country' }],
    targeting: {
      geo_locations: { countries: ['BR'] },
    },
  },
];

const ALL_PRESETS = [...GEO_PRESETS];

export function InstagramSchedulingContent({ configuredProp, onConfigChange }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [tab, setTab] = useState('agenda');
  const [configured, setConfigured] = useState(configuredProp ?? null);
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

  // Campaign state
  const [campaignEnabled, setCampaignEnabled] = useState(false);
  const [campaign, setCampaign] = useState({
    name: '',
    objective: 'OUTCOME_TRAFFIC',
    daily_budget: '',
    duration_days: 7,
    targeting: {
      geo_locations: { countries: ['BR'] },
      age_min: 18,
      age_max: 65,
      genders: [0],
      interests: [],
    },
    creative: { link_url: '', call_to_action: 'LEARN_MORE' },
  });
  const [interestSearch, setInterestSearch] = useState('');
  const [interestResults, setInterestResults] = useState([]);
  const [searchingInterests, setSearchingInterests] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocations, setSearchingLocations] = useState(false);
  const [locations, setLocations] = useState([{ key: 'BR', name: 'Brasil', type: 'country' }]);
  const [savedPresets, setSavedPresets] = useState([]);
  const [activePresetIds, setActivePresetIds] = useState([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);

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

  // Load saved presets when campaign is enabled
  useEffect(() => {
    if (campaignEnabled) {
      metaAds.listPresets().then(data => setSavedPresets(data || [])).catch(() => {});
    }
  }, [campaignEnabled]);

  const applyPreset = (preset) => {
    const isActive = activePresetIds.includes(preset.id);

    if (isActive) {
      // Deselect: remove this preset's contributions
      setActivePresetIds(prev => prev.filter(id => id !== preset.id));
      // Rebuild from remaining active presets
      const remaining = ALL_PRESETS.filter(p => activePresetIds.includes(p.id) && p.id !== preset.id);
      const savedActive = savedPresets.filter(p => activePresetIds.includes(p.id) && p.id !== preset.id);
      rebuildFromPresets([...remaining, ...savedActive]);
    } else {
      // Add: merge this preset's targeting
      setActivePresetIds(prev => [...prev, preset.id]);
      mergePreset(preset);
    }
    setInterestSearch('');
    setInterestResults([]);
    setLocationSearch('');
    setLocationResults([]);
  };

  const mergePreset = (preset) => {
    const t = preset.targeting;
    setCampaign(prev => {
      const existingInterests = prev.targeting.interests || [];
      const newInterests = (t.interests || []).filter(
        ni => !existingInterests.find(ei => ei.id === ni.id)
      );
      // Only merge geo if preset has geo_locations
      let geo = prev.targeting.geo_locations;
      if (t.geo_locations) {
        const existingCities = geo.cities || [];
        const newCities = (t.geo_locations.cities || []).filter(
          nc => !existingCities.find(ec => ec.key === nc.key)
        );
        const existingCountries = geo.countries || [];
        const newCountries = (t.geo_locations.countries || []).filter(
          c => !existingCountries.includes(c)
        );
        geo = {
          ...geo,
          countries: [...existingCountries, ...newCountries],
          ...(([...existingCities, ...newCities].length > 0) && { cities: [...existingCities, ...newCities] }),
        };
      }
      return {
        ...prev,
        targeting: {
          ...prev.targeting,
          geo_locations: geo,
          age_min: t.age_min != null ? Math.min(prev.targeting.age_min, t.age_min) : prev.targeting.age_min,
          age_max: t.age_max != null ? Math.max(prev.targeting.age_max, t.age_max) : prev.targeting.age_max,
          genders: t.genders ? (t.genders[0] !== 0 ? t.genders : prev.targeting.genders) : prev.targeting.genders,
          interests: [...existingInterests, ...newInterests],
        },
      };
    });
    // Merge locations
    const presetLocs = preset.locations || [];
    setLocations(prev => {
      const merged = [...prev];
      for (const loc of presetLocs) {
        if (!merged.find(l => l.key === loc.key)) {
          merged.push(loc);
        }
      }
      return merged;
    });
  };

  const rebuildFromPresets = (presetList) => {
    // Reset to defaults then merge all
    const base = {
      geo_locations: { countries: [] },
      age_min: 65,
      age_max: 13,
      genders: [0],
      interests: [],
    };
    let allLocations = [];

    for (const p of presetList) {
      const t = p.targeting;
      for (const c of (t.geo_locations?.countries || [])) {
        if (!base.geo_locations.countries.includes(c)) base.geo_locations.countries.push(c);
      }
      const cities = t.geo_locations?.cities || [];
      if (cities.length > 0) {
        if (!base.geo_locations.cities) base.geo_locations.cities = [];
        for (const city of cities) {
          if (!base.geo_locations.cities.find(c => c.key === city.key)) {
            base.geo_locations.cities.push(city);
          }
        }
      }
      base.age_min = Math.min(base.age_min, t.age_min ?? 65);
      base.age_max = Math.max(base.age_max, t.age_max ?? 13);
      if (t.genders && t.genders[0] !== 0) base.genders = t.genders;
      for (const interest of (t.interests || [])) {
        if (!base.interests.find(i => i.id === interest.id)) {
          base.interests.push(interest);
        }
      }
      for (const loc of (p.locations || [])) {
        if (!allLocations.find(l => l.key === loc.key)) {
          allLocations.push(loc);
        }
      }
    }

    if (base.geo_locations.countries.length === 0) base.geo_locations.countries = ['BR'];
    if (base.age_min === 65) base.age_min = 18;
    if (base.age_max === 13) base.age_max = 65;
    if (allLocations.length === 0) allLocations = [{ key: 'BR', name: 'Brasil', type: 'country' }];

    setCampaign(prev => ({ ...prev, targeting: base }));
    setLocations(allLocations);
  };

  const handleSavePreset = async () => {
    if (!presetNameInput.trim()) return;
    setSavingPreset(true);
    try {
      await metaAds.createPreset({ name: presetNameInput.trim(), targeting: campaign.targeting });
      const data = await metaAds.listPresets();
      setSavedPresets(data || []);
      toast.success('Preset salvo');
      setPresetNameInput('');
      setShowSavePreset(false);
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar preset');
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = async (id) => {
    try {
      await metaAds.deletePreset(id);
      setSavedPresets(prev => prev.filter(p => p.id !== id));
      setActivePresetIds(prev => prev.filter(pid => pid !== id));
      toast.success('Preset removido');
    } catch (err) {
      toast.error(err.message || 'Erro ao remover preset');
    }
  };

  // Debounced location search
  useEffect(() => {
    if (!campaignEnabled || locationSearch.length < 2) {
      setLocationResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingLocations(true);
      try {
        const data = await metaAds.searchLocations(locationSearch);
        setLocationResults(data?.data || []);
      } catch {
        setLocationResults([]);
      } finally {
        setSearchingLocations(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationSearch, campaignEnabled]);

  const addLocation = (loc) => {
    const locKey = loc.key || loc.country_code || loc.name;
    if (!locations.find(l => l.key === locKey)) {
      setLocations(prev => [...prev, { key: locKey, name: loc.name, type: loc.type }]);
      // Sync countries to campaign targeting
      const newCountries = loc.type === 'country'
        ? [...new Set([...campaign.targeting.geo_locations.countries, loc.country_code || locKey])]
        : campaign.targeting.geo_locations.countries;
      const newCities = loc.type === 'city'
        ? [...(campaign.targeting.geo_locations.cities || []), { key: locKey, name: loc.name }]
        : (campaign.targeting.geo_locations.cities || []);
      const newRegions = loc.type === 'region'
        ? [...(campaign.targeting.geo_locations.regions || []), { key: locKey, name: loc.name }]
        : (campaign.targeting.geo_locations.regions || []);
      setCampaign(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          geo_locations: {
            ...prev.targeting.geo_locations,
            countries: newCountries,
            ...(newCities.length > 0 && { cities: newCities }),
            ...(newRegions.length > 0 && { regions: newRegions }),
          },
        },
      }));
    }
    setLocationSearch('');
    setLocationResults([]);
  };

  const removeLocation = (key) => {
    const loc = locations.find(l => l.key === key);
    setLocations(prev => prev.filter(l => l.key !== key));
    if (loc?.type === 'country') {
      setCampaign(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          geo_locations: {
            ...prev.targeting.geo_locations,
            countries: prev.targeting.geo_locations.countries.filter(c => c !== key),
          },
        },
      }));
    } else if (loc?.type === 'city') {
      setCampaign(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          geo_locations: {
            ...prev.targeting.geo_locations,
            cities: (prev.targeting.geo_locations.cities || []).filter(c => c.key !== key),
          },
        },
      }));
    } else if (loc?.type === 'region') {
      setCampaign(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          geo_locations: {
            ...prev.targeting.geo_locations,
            regions: (prev.targeting.geo_locations.regions || []).filter(r => r.key !== key),
          },
        },
      }));
    }
  };

  // Debounced interest search
  useEffect(() => {
    if (!campaignEnabled || interestSearch.length < 2) {
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
  }, [interestSearch, campaignEnabled]);

  const addInterest = (interest) => {
    if (!campaign.targeting.interests.find(i => i.id === interest.id)) {
      setCampaign({
        ...campaign,
        targeting: {
          ...campaign.targeting,
          interests: [...campaign.targeting.interests, { id: String(interest.id), name: interest.name }],
        },
      });
    }
    setInterestSearch('');
    setInterestResults([]);
  };

  const removeInterest = (id) => {
    setCampaign({
      ...campaign,
      targeting: {
        ...campaign.targeting,
        interests: campaign.targeting.interests.filter(i => i.id !== id),
      },
    });
  };

  const checkConfig = async () => {
    try {
      const data = await instagram.getConfig();
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
      const [igData, ipData] = await Promise.all([
        instagram.list({ page: listPage, limit: 20, status: statusFilter || undefined }),
        integratedPublish.list({ page: 1, limit: 50, status: statusFilter || undefined }),
      ]);
      const igItems = (igData.schedules || []).map(s => ({ ...s, _type: 'ig' }));
      const ipItems = (ipData.items || []).map(s => ({ ...s, _type: 'integrated' }));
      const merged = [...igItems, ...ipItems].sort(
        (a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)
      );
      setSchedules(merged);
      setListTotal((igData.total || 0) + (ipData.total || 0));
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

      if (campaignEnabled) {
        await integratedPublish.create({
          caption,
          media_type: getMediaType(),
          image_ids: images.map(img => img.id),
          scheduled_at: scheduledAt,
          campaign: {
            ...campaign,
            daily_budget: Math.round(Number(campaign.daily_budget) * 100),
            duration_days: Number(campaign.duration_days),
            targeting: {
              ...campaign.targeting,
              interests: campaign.targeting.interests.map(i => ({ id: i.id, name: i.name })),
            },
            creative: campaign.creative,
          },
        });
      } else {
        await instagram.create({
          caption,
          media_type: getMediaType(),
          image_ids: images.map(img => img.id),
          scheduled_at: scheduledAt,
        });
      }

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
      const item = schedules.find(s => s.id === id);
      if (item?._type === 'integrated') {
        await integratedPublish.delete(id);
      } else {
        await instagram.delete(id);
      }
      setShowDeleteConfirm(null);
      toast.success('Agendamento removido');
      loadSchedules();
    } catch (err) {
      toast.error(err.message || 'Erro ao remover');
    }
  };

  const handleReschedule = async (schedule) => {
    try {
      if (schedule._type === 'integrated') {
        toast.warning('Re-agendamento de posts com campanha ainda nao suportado. Delete e crie novamente.');
        return;
      }
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
    setCampaignEnabled(false);
    setCampaign({
      name: '',
      objective: 'OUTCOME_TRAFFIC',
      daily_budget: '',
      duration_days: 7,
      targeting: {
        geo_locations: { countries: ['BR'] },
        age_min: 18,
        age_max: 65,
        genders: [0],
        interests: [],
      },
      creative: { link_url: '', call_to_action: 'LEARN_MORE' },
    });
    setInterestSearch('');
    setInterestResults([]);
    setLocationSearch('');
    setLocationResults([]);
    setLocations([{ key: 'BR', name: 'Brasil', type: 'country' }]);
    setActivePresetIds([]);
    setShowSavePreset(false);
    setPresetNameInput('');
  };

  const renderCaption = (text) => {
    if (!text) return '';
    return text.split(/(#\w+)/g).map((part, i) =>
      part.startsWith('#') ? <span key={i} className="ig-hashtag">{part}</span> : part
    );
  };

  const MIN_DAILY_BUDGET = 6;

  const getCampaignErrors = () => {
    const errors = [];
    if (!campaign.name.trim()) errors.push('Nome da campanha obrigatorio');
    if (!campaign.daily_budget || Number(campaign.daily_budget) < MIN_DAILY_BUDGET)
      errors.push(`Orcamento minimo R$${MIN_DAILY_BUDGET}/dia`);
    if (campaign.targeting.interests.length === 0) errors.push('Adicione pelo menos 1 interesse');
    if (campaign.targeting.age_min >= campaign.targeting.age_max) errors.push('Idade min deve ser menor que max');
    if (Number(campaign.duration_days) < 1) errors.push('Duracao minima 1 dia');
    return errors;
  };

  const canProceedStep = () => {
    switch (step) {
      case 0: return images.length > 0 && !uploading;
      case 1: return caption.length <= 2200;
      case 2:
        if (!publishNow && (!scheduleDate || !scheduleTime)) return false;
        if (campaignEnabled && getCampaignErrors().length > 0) return false;
        return true;
      default: return true;
    }
  };

  // Not configured screen — redirect to config tab
  if (configured === false) {
    return (
        <div className="ig-page">
          <div className="ig-not-configured">
            <div className="ig-not-configured-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
            </div>
            <h2>Instagram nao configurado</h2>
            <p>Configure as credenciais na aba <strong>Configuracao</strong> para comecar a agendar posts.</p>
          </div>
        </div>
    );
  }

  // Loading config
  if (configured === null) {
    return (
        <div className="ig-page">
          <div className="ig-loading">
            <span className="ig-spinner" />
            Verificando configuracao...
          </div>
        </div>
    );
  }

  return (
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
                        {s._type === 'integrated' && (
                          <span className="ig-status" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                            + Ads
                          </span>
                        )}
                        <span>
                          {new Date(s.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      {s._type === 'integrated' && s.campaign && (
                        <div className="ig-card-campaign-info">
                          <span className="ig-card-campaign-name">{s.campaign.name}</span>
                          <span className="ig-card-campaign-budget">
                            R${(s.campaign.daily_budget / 100).toFixed(2)}/dia
                            {s.campaign.duration_days && ` · ${s.campaign.duration_days}d`}
                          </span>
                          {s.meta_campaign_id && (
                            <a
                              className="ig-card-campaign-link"
                              href={`https://www.facebook.com/adsmanager/manage/campaigns?act=${s.meta_campaign_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Ver no Ads Manager
                            </a>
                          )}
                        </div>
                      )}
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
          </>
        )}

        {/* ====== NEW POST TAB ====== */}
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

            {/* Step 0: Media upload */}
            {step === 0 && (
              <div className="ig-step-card" style={{ animationDelay: '0.05s' }}>
                <div className="ig-step-card-header">
                  <div className="ig-step-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  </div>
                  <div>
                    <h3 className="ig-step-card-title">Selecione as imagens</h3>
                    <p className="ig-step-card-subtitle">Escolha uma ou mais fotos para o post. Multiplas imagens criam um carrossel.</p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
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
                  >
                    <div className="ig-upload-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <p className="ig-upload-main-text"><strong>Clique aqui</strong> ou arraste suas imagens</p>
                    <p className="ig-upload-hint">JPEG, PNG ou WebP — Maximo 10MB por imagem</p>
                  </div>
                ) : (
                  <div className="ig-media-gallery">
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
                      <button
                        className="ig-add-more-btn"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        <span>Adicionar</span>
                      </button>
                    </div>
                    {images.length > 1 && (
                      <div className="ig-carousel-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="14" height="14" rx="2" /><path d="M18 8h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2" /></svg>
                        Carrossel — {images.length} imagens
                      </div>
                    )}
                  </div>
                )}

                {uploading && (
                  <div className="ig-upload-progress">
                    <span className="ig-spinner" />
                    <span>Enviando imagem...</span>
                  </div>
                )}

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

            {/* Step 1: Caption */}
            {step === 1 && (
              <div className="ig-step-card" style={{ animationDelay: '0.05s' }}>
                <div className="ig-step-card-header">
                  <div className="ig-step-card-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </div>
                  <div>
                    <h3 className="ig-step-card-title">Escreva a legenda</h3>
                    <p className="ig-step-card-subtitle">A legenda e opcional. Use #hashtags para aumentar o alcance do post.</p>
                  </div>
                </div>

                <div className="ig-caption-layout">
                  <div className="ig-caption-editor">
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Escreva a legenda do post... &#10;&#10;Use #hashtags para mais alcance"
                      autoFocus
                    />
                    <div className="ig-caption-footer">
                      <span className="ig-caption-hint">Legenda opcional — max 2200 caracteres</span>
                      <span className={`ig-char-count ${caption.length > 2000 ? caption.length > 2200 ? 'danger' : 'warning' : ''}`}>
                        {caption.length}/2200
                      </span>
                    </div>
                  </div>
                  {images.length > 0 && (
                    <div className="ig-caption-preview">
                      <div className="ig-caption-preview-label">Preview</div>
                      <div className="ig-caption-preview-img">
                        <img src={`${API_URL}${images[0].url}`} alt="Preview" />
                        {images.length > 1 && (
                          <span className="ig-caption-preview-badge">{images.length} fotos</span>
                        )}
                      </div>
                      {caption && (
                        <div className="ig-caption-preview-text">
                          {renderCaption(caption.length > 120 ? caption.slice(0, 120) + '...' : caption)}
                        </div>
                      )}
                    </div>
                  )}
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
                    <p className="ig-step-card-subtitle">Publique agora ou agende para o melhor horario.</p>
                  </div>
                </div>

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

                {/* Campaign toggle */}
                <div className="ig-campaign-toggle">
                  <label className="ig-toggle-label">
                    <span className="ig-toggle-switch">
                      <input
                        type="checkbox"
                        checked={campaignEnabled}
                        onChange={(e) => setCampaignEnabled(e.target.checked)}
                      />
                      <span className="ig-toggle-slider" />
                    </span>
                    <span className="ig-toggle-text">
                      <strong>Criar campanha Meta Ads</strong>
                      <span>Promover este post automaticamente</span>
                    </span>
                  </label>
                </div>

                {/* Campaign fields */}
                {campaignEnabled && (
                  <div className="ig-campaign-section">
                    <div className="ig-form-group">
                      <label>Nome da campanha *</label>
                      <input
                        type="text"
                        value={campaign.name}
                        onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                        placeholder="Ex: Lancamento Produto X"
                      />
                    </div>

                    <div className="ig-form-group">
                      <label>Objetivo</label>
                      <select
                        value={campaign.objective}
                        onChange={(e) => setCampaign({ ...campaign, objective: e.target.value })}
                      >
                        {OBJECTIVE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="ig-campaign-grid">
                      <div className="ig-form-group">
                        <label>Orcamento diario (R$) *</label>
                        <input
                          type="number"
                          step="1"
                          min={MIN_DAILY_BUDGET}
                          value={campaign.daily_budget}
                          onChange={(e) => setCampaign({ ...campaign, daily_budget: e.target.value })}
                          placeholder={`Min R$${MIN_DAILY_BUDGET}`}
                          className={campaign.daily_budget && Number(campaign.daily_budget) < MIN_DAILY_BUDGET ? 'ig-input-error' : ''}
                        />
                        {campaign.daily_budget && Number(campaign.daily_budget) < MIN_DAILY_BUDGET && (
                          <span className="ig-form-error">Minimo R${MIN_DAILY_BUDGET}/dia</span>
                        )}
                        {campaign.daily_budget && Number(campaign.daily_budget) >= MIN_DAILY_BUDGET && (
                          <span className="ig-form-hint">
                            Total estimado: R${(Number(campaign.daily_budget) * Number(campaign.duration_days || 1)).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="ig-form-group">
                        <label>Duracao (dias)</label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={campaign.duration_days}
                          onChange={(e) => setCampaign({ ...campaign, duration_days: e.target.value })}
                        />
                      </div>
                    </div>

                    {campaign.objective === 'OUTCOME_TRAFFIC' && (
                      <div className="ig-campaign-link-section">
                        <div className="ig-form-group">
                          <label>Link de destino</label>
                          <input
                            type="url"
                            value={campaign.creative.link_url}
                            onChange={(e) => setCampaign({
                              ...campaign,
                              creative: { ...campaign.creative, link_url: e.target.value },
                            })}
                            placeholder="https://www.whodo.com.br"
                          />
                          <span className="ig-form-hint">URL que abre quando clicam no anuncio. Vazio = site principal.</span>
                        </div>
                        <div className="ig-form-group">
                          <label>Botao do anuncio</label>
                          <select
                            value={campaign.creative.call_to_action}
                            onChange={(e) => setCampaign({
                              ...campaign,
                              creative: { ...campaign.creative, call_to_action: e.target.value },
                            })}
                          >
                            <option value="LEARN_MORE">Saiba Mais</option>
                            <option value="SHOP_NOW">Comprar Agora</option>
                            <option value="SIGN_UP">Cadastre-se</option>
                            <option value="CONTACT_US">Fale Conosco</option>
                            <option value="BOOK_TRAVEL">Reservar</option>
                            <option value="DOWNLOAD">Baixar</option>
                            <option value="GET_QUOTE">Solicitar Orcamento</option>
                            <option value="WATCH_MORE">Assistir Mais</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="ig-campaign-targeting-title">Segmentacao</div>

                    {/* Preset selectors */}
                    <div className="ig-presets-section">
                      <div className="ig-presets-label">Alcance geografico <span className="ig-presets-hint">selecione um ou mais</span></div>
                      <div className="ig-presets-grid">
                        {GEO_PRESETS.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className={`ig-preset-card ig-preset-geo ${activePresetIds.includes(p.id) ? 'active' : ''}`}
                            onClick={() => applyPreset(p)}
                          >
                            <strong>{p.name}</strong>
                            <span>{p.desc}</span>
                          </button>
                        ))}
                      </div>

                      {savedPresets.length > 0 && (
                        <>
                          <div className="ig-presets-label" style={{ marginTop: '0.75rem' }}>Meus presets salvos</div>
                          <div className="ig-presets-saved">
                            {savedPresets.map(p => (
                              <div key={p.id} className={`ig-preset-saved-item ${activePresetIds.includes(p.id) ? 'active' : ''}`}>
                                <button
                                  type="button"
                                  className="ig-preset-saved-btn"
                                  onClick={() => applyPreset(p)}
                                >
                                  {p.name}
                                </button>
                                <button
                                  type="button"
                                  className="ig-preset-saved-delete"
                                  onClick={() => handleDeletePreset(p.id)}
                                  title="Remover preset"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="ig-form-group">
                      <label>Localizacoes</label>
                      <div className="ig-interest-search-wrap">
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          placeholder="Buscar pais, estado ou cidade..."
                        />
                        {searchingLocations && (
                          <span className="ig-interest-searching">
                            <span className="ig-spinner" style={{ width: 14, height: 14 }} />
                          </span>
                        )}
                      </div>
                      {locationResults.length > 0 && (
                        <div className="ig-interest-results">
                          {locationResults.map(r => (
                            <div
                              key={r.key}
                              className="ig-interest-result-item"
                              onClick={() => addLocation(r)}
                            >
                              <span className="ig-interest-result-name">{r.name}</span>
                              <span className="ig-location-type-badge">{r.type === 'country' ? 'Pais' : r.type === 'region' ? 'Estado' : r.type === 'city' ? 'Cidade' : r.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {locations.length > 0 && (
                        <div className="ig-interest-tags">
                          {locations.map(l => (
                            <span key={l.key} className="ig-interest-tag ig-location-tag">
                              <span className="ig-location-tag-type">{l.type === 'country' ? 'Pais' : l.type === 'region' ? 'Estado' : 'Cidade'}</span>
                              {l.name}
                              <button type="button" onClick={() => removeLocation(l.key)}>&times;</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="ig-campaign-grid ig-campaign-grid-3">
                      <div className="ig-form-group">
                        <label>Idade min</label>
                        <input
                          type="number"
                          min="13"
                          max="65"
                          value={campaign.targeting.age_min}
                          onChange={(e) => setCampaign({
                            ...campaign,
                            targeting: { ...campaign.targeting, age_min: Number(e.target.value) },
                          })}
                        />
                      </div>
                      <div className="ig-form-group">
                        <label>Idade max</label>
                        <input
                          type="number"
                          min="13"
                          max="65"
                          value={campaign.targeting.age_max}
                          onChange={(e) => setCampaign({
                            ...campaign,
                            targeting: { ...campaign.targeting, age_max: Number(e.target.value) },
                          })}
                        />
                      </div>
                      <div className="ig-form-group">
                        <label>Genero</label>
                        <select
                          value={campaign.targeting.genders?.[0] ?? 0}
                          onChange={(e) => setCampaign({
                            ...campaign,
                            targeting: { ...campaign.targeting, genders: [parseInt(e.target.value)] },
                          })}
                        >
                          <option value={0}>Todos</option>
                          <option value={1}>Masculino</option>
                          <option value={2}>Feminino</option>
                        </select>
                      </div>
                    </div>

                    <div className="ig-form-group">
                      <label>Interesses</label>
                      <div className="ig-interest-search-wrap">
                        <input
                          type="text"
                          value={interestSearch}
                          onChange={(e) => setInterestSearch(e.target.value)}
                          placeholder="Buscar interesses (ex: moda, fitness, tecnologia...)"
                        />
                        {searchingInterests && (
                          <span className="ig-interest-searching">
                            <span className="ig-spinner" style={{ width: 14, height: 14 }} />
                          </span>
                        )}
                      </div>
                      {interestResults.length > 0 && (
                        <div className="ig-interest-results">
                          {interestResults.map(r => (
                            <div
                              key={r.id}
                              className="ig-interest-result-item"
                              onClick={() => addInterest(r)}
                            >
                              <span className="ig-interest-result-name">{r.name}</span>
                              {r.audience_size && (
                                <span className="ig-interest-result-audience">
                                  {Number(r.audience_size).toLocaleString('pt-BR')} pessoas
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {campaign.targeting.interests.length > 0 && (
                        <div className="ig-interest-tags">
                          {campaign.targeting.interests.map(i => (
                            <span key={i.id} className="ig-interest-tag">
                              {i.name}
                              <button type="button" onClick={() => removeInterest(i.id)}>&times;</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {!showSavePreset ? (
                      <button
                        type="button"
                        className="ig-save-preset-btn"
                        onClick={() => setShowSavePreset(true)}
                      >
                        Salvar segmentacao como preset
                      </button>
                    ) : (
                      <div className="ig-save-preset-form">
                        <input
                          type="text"
                          value={presetNameInput}
                          onChange={(e) => setPresetNameInput(e.target.value)}
                          placeholder="Nome do preset..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePreset();
                            if (e.key === 'Escape') { setShowSavePreset(false); setPresetNameInput(''); }
                          }}
                          disabled={savingPreset}
                        />
                        <button
                          type="button"
                          className="ig-save-preset-confirm"
                          onClick={handleSavePreset}
                          disabled={!presetNameInput.trim() || savingPreset}
                        >
                          {savingPreset ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          type="button"
                          className="ig-save-preset-cancel"
                          onClick={() => { setShowSavePreset(false); setPresetNameInput(''); }}
                          disabled={savingPreset}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {campaignEnabled && getCampaignErrors().length > 0 && (
                  <div className="ig-campaign-errors">
                    {getCampaignErrors().map((err, i) => (
                      <div key={i} className="ig-campaign-error-item">{err}</div>
                    ))}
                  </div>
                )}

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

                <div className="ig-review-layout">
                  <div className="ig-review-preview">
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
                  </div>

                  <div className="ig-review-details">
                    <div className="ig-review-info-card">
                      <div className="ig-review-info-row">
                        <span className="ig-review-info-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                          Midia
                        </span>
                        <span className="ig-review-info-value">{images.length} {images.length === 1 ? 'imagem' : 'imagens'}{images.length > 1 ? ' (carrossel)' : ''}</span>
                      </div>
                      <div className="ig-review-info-row">
                        <span className="ig-review-info-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          Legenda
                        </span>
                        <span className="ig-review-info-value">{caption ? `${caption.length} caracteres` : 'Sem legenda'}</span>
                      </div>
                      <div className="ig-review-info-row">
                        <span className="ig-review-info-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          Publicacao
                        </span>
                        <span className="ig-review-info-value">
                          {publishNow ? (
                            <span className="ig-review-badge ig-review-badge-now">Agora</span>
                          ) : (
                            <span>{new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          )}
                        </span>
                      </div>
                      {campaignEnabled && (
                        <div className="ig-review-info-row">
                          <span className="ig-review-info-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                            Campanha
                          </span>
                          <span className="ig-review-info-value">
                            <span className="ig-review-badge ig-review-badge-ads">Meta Ads</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {campaignEnabled && (
                  <div className="ig-campaign-review">
                    <h4>Campanha Meta Ads</h4>
                    <div className="ig-campaign-review-grid">
                      <div className="ig-campaign-review-item">
                        <span className="ig-campaign-review-label">Campanha</span>
                        <span className="ig-campaign-review-value">{campaign.name}</span>
                      </div>
                      <div className="ig-campaign-review-item">
                        <span className="ig-campaign-review-label">Objetivo</span>
                        <span className="ig-campaign-review-value">
                          {OBJECTIVE_OPTIONS.find(o => o.value === campaign.objective)?.label}
                        </span>
                      </div>
                      <div className="ig-campaign-review-item">
                        <span className="ig-campaign-review-label">Orcamento diario</span>
                        <span className="ig-campaign-review-value">R$ {Number(campaign.daily_budget).toFixed(2)}</span>
                      </div>
                      <div className="ig-campaign-review-item">
                        <span className="ig-campaign-review-label">Duracao</span>
                        <span className="ig-campaign-review-value">{campaign.duration_days} dias (total ~R${(Number(campaign.daily_budget) * Number(campaign.duration_days)).toFixed(2)})</span>
                      </div>
                      {campaign.objective === 'OUTCOME_TRAFFIC' && (
                        <div className="ig-campaign-review-item ig-campaign-review-full">
                          <span className="ig-campaign-review-label">Link de destino</span>
                          <span className="ig-campaign-review-value">{campaign.creative?.link_url || '(site principal)'}</span>
                        </div>
                      )}
                      <div className="ig-campaign-review-item">
                        <span className="ig-campaign-review-label">Localizacoes</span>
                        <span className="ig-campaign-review-value">{locations.map(l => l.name).join(', ')}</span>
                      </div>
                      <div className="ig-campaign-review-item">
                        <span className="ig-campaign-review-label">Idade</span>
                        <span className="ig-campaign-review-value">{campaign.targeting.age_min} - {campaign.targeting.age_max}</span>
                      </div>
                      <div className="ig-campaign-review-item">
                        <span className="ig-campaign-review-label">Genero</span>
                        <span className="ig-campaign-review-value">
                          {(campaign.targeting.genders?.[0] ?? 0) === 0 ? 'Todos' : campaign.targeting.genders?.[0] === 1 ? 'Masculino' : 'Feminino'}
                        </span>
                      </div>
                      {campaign.targeting.interests.length > 0 && (
                        <div className="ig-campaign-review-item ig-campaign-review-full">
                          <span className="ig-campaign-review-label">Interesses</span>
                          <span className="ig-campaign-review-value">
                            {campaign.targeting.interests.map(i => i.name).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="ig-step-actions">
                  <button className="ig-btn ig-btn-secondary ig-btn-back" onClick={() => setStep(2)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Voltar
                  </button>
                  <button
                    className="ig-btn ig-btn-primary ig-btn-submit"
                    onClick={() => setShowConfirm(true)}
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
  );
}

export default function InstagramScheduling() {
  return (
    <AdminLayout>
      <InstagramSchedulingContent />
    </AdminLayout>
  );
}
