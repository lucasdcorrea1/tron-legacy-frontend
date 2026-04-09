import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { metaAds, integratedPublish, API_URL } from '../services/api';
import { useConfirm } from '../components/ConfirmModal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './MetaAdsCampaigns.css';

const STATUS_COLORS = {
  ACTIVE: '#4ade80',
  PAUSED: '#fbbf24',
  ARCHIVED: '#71717a',
  DELETED: '#f87171',
};

const STATUS_LABEL = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  ARCHIVED: 'Arquivado',
  DELETED: 'Excluido',
};

const OBJECTIVES_LABEL = {
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_TRAFFIC: 'Trafego',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_APP_PROMOTION: 'App',
  OUTCOME_SALES: 'Vendas',
};

const SORT_OPTIONS = [
  { key: 'name_asc', label: 'Nome A-Z' },
  { key: 'name_desc', label: 'Nome Z-A' },
  { key: 'spend_desc', label: 'Maior gasto' },
  { key: 'spend_asc', label: 'Menor gasto' },
  { key: 'clicks_desc', label: 'Mais cliques' },
  { key: 'ctr_desc', label: 'Maior CTR' },
  { key: 'budget_desc', label: 'Maior orcamento' },
];

const ALERT_TYPE_LABEL = {
  daily_spend: 'Gasto diario',
  total_spend: 'Gasto total',
  ctr_below: 'CTR abaixo de',
  cpc_above: 'CPC acima de',
};

/* ── SVG Icons ── */

const IconAwareness = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconTraffic = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const IconEngagement = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const IconLeads = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const IconApp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);

const IconSales = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);

const IconDefault = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const OBJECTIVE_ICONS = {
  OUTCOME_AWARENESS: IconAwareness,
  OUTCOME_TRAFFIC: IconTraffic,
  OUTCOME_ENGAGEMENT: IconEngagement,
  OUTCOME_LEADS: IconLeads,
  OUTCOME_APP_PROMOTION: IconApp,
  OUTCOME_SALES: IconSales,
};

const IconPlay = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const IconPause = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
);

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconArchive = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
);

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconMegaphone = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 11-5.8-1.6"/>
  </svg>
);

const IconImage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
  </svg>
);

const IconBell = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const IconCrown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M2 20h20L19 8l-5 5-2-7-2 7-5-5z"/>
  </svg>
);

const IconWarning = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

/* ── Helpers ── */

const formatNum = (n) => {
  if (!n && n !== 0) return '-';
  const num = Number(n);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('pt-BR');
};

const formatBudget = (value) => {
  if (!value) return null;
  return `R$ ${(parseInt(value) / 100).toFixed(2)}`;
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return '-';
  return `R$ ${Number(value).toFixed(2)}`;
};

const formatPercent = (value) => {
  if (!value && value !== 0) return '-';
  return `${Number(value).toFixed(2)}%`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const getBudgetRaw = (campaign) => {
  if (campaign.daily_budget) return parseInt(campaign.daily_budget);
  if (campaign.lifetime_budget) return parseInt(campaign.lifetime_budget);
  return 0;
};

const getSpendPercent = (spend, budgetRaw) => {
  if (!budgetRaw || !spend) return 0;
  // spend is in real currency, budget is in cents
  return Math.min(100, (Number(spend) / (budgetRaw / 100)) * 100);
};

const getSpendColor = (percent) => {
  if (percent > 80) return '#f87171';
  if (percent > 50) return '#fbbf24';
  return '#4ade80';
};

export default function MetaAdsCampaigns({ adAccountId }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [campaigns, setCampaigns] = useState([]);
  const [insights, setInsights] = useState({});
  const [campaignAds, setCampaignAds] = useState({});
  const [linkedPosts, setLinkedPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedCards, setExpandedCards] = useState({});

  // Search & sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('name_asc');

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const [alertPanels, setAlertPanels] = useState({});
  const [newAlertType, setNewAlertType] = useState({});
  const [newAlertThreshold, setNewAlertThreshold] = useState({});

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const aaParam = adAccountId ? { ad_account_id: adAccountId } : {};
      const [campData, postsData, alertsData] = await Promise.all([
        metaAds.listCampaigns({ status: statusFilter || undefined, ...aaParam }),
        integratedPublish.list({ page: 1, limit: 200 }).catch(() => ({ items: [] })),
        metaAds.listAlerts().catch(() => []),
      ]);
      const list = campData?.data || [];
      setCampaigns(list);
      setAlerts(Array.isArray(alertsData) ? alertsData : alertsData?.data || []);

      const postsByCampaign = {};
      for (const p of (postsData?.items || [])) {
        if (p.meta_campaign_id) {
          if (!postsByCampaign[p.meta_campaign_id]) postsByCampaign[p.meta_campaign_id] = [];
          postsByCampaign[p.meta_campaign_id].push(p);
        }
      }
      setLinkedPosts(postsByCampaign);

      const insightResults = {};
      const adsResults = {};

      await Promise.allSettled(
        list.map(async (c) => {
          try {
            const res = await metaAds.getCampaignInsights(c.id, aaParam);
            if (res?.data?.[0]) insightResults[c.id] = res.data[0];
          } catch { /* skip */ }

          try {
            const adSetsRes = await metaAds.listAdSets({ campaign_id: c.id, ...aaParam });
            const adSets = adSetsRes?.data || [];
            const allAds = [];
            await Promise.allSettled(
              adSets.map(async (as) => {
                try {
                  const adsRes = await metaAds.listAds({ adset_id: as.id, ...aaParam });
                  if (adsRes?.data) allAds.push(...adsRes.data);
                } catch { /* skip */ }
              })
            );
            if (allAds.length > 0) adsResults[c.id] = allAds;
          } catch { /* skip */ }
        })
      );
      setInsights(insightResults);
      setCampaignAds(adsResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, adAccountId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Derived: filter + sort campaigns
  const sortedCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => c.name?.toLowerCase().includes(q));
    }

    // Sort
    const sorted = [...filtered];
    const [key, dir] = sortKey.split('_');
    sorted.sort((a, b) => {
      let va, vb;
      switch (key) {
        case 'name':
          va = (a.name || '').toLowerCase();
          vb = (b.name || '').toLowerCase();
          return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'spend':
          va = Number(insights[a.id]?.spend || 0);
          vb = Number(insights[b.id]?.spend || 0);
          break;
        case 'clicks':
          va = Number(insights[a.id]?.clicks || 0);
          vb = Number(insights[b.id]?.clicks || 0);
          break;
        case 'ctr':
          va = Number(insights[a.id]?.ctr || 0);
          vb = Number(insights[b.id]?.ctr || 0);
          break;
        case 'budget':
          va = getBudgetRaw(a);
          vb = getBudgetRaw(b);
          break;
        default:
          return 0;
      }
      if (key !== 'name') {
        return dir === 'desc' ? vb - va : va - vb;
      }
      return 0;
    });

    return sorted;
  }, [campaigns, searchQuery, sortKey, insights]);

  // Derived: best CTR & highest spend badges
  const { bestCTRId, highestSpendId } = useMemo(() => {
    let bestCTR = -1, bestCTRId = null;
    let highestSpend = -1, highestSpendId = null;

    for (const c of campaigns) {
      const ins = insights[c.id];
      if (!ins) continue;
      const ctr = Number(ins.ctr || 0);
      const spend = Number(ins.spend || 0);
      if (ctr > bestCTR && ctr > 0) { bestCTR = ctr; bestCTRId = c.id; }
      if (spend > highestSpend && spend > 0) { highestSpend = spend; highestSpendId = c.id; }
    }

    return { bestCTRId, highestSpendId };
  }, [campaigns, insights]);

  // Alert handlers
  const getCampaignAlerts = (campaignId) =>
    alerts.filter(a => a.campaign_id === campaignId);

  const handleCreateAlert = async (campaignId) => {
    const type = newAlertType[campaignId] || 'daily_spend';
    const threshold = parseFloat(newAlertThreshold[campaignId]);
    if (!threshold || isNaN(threshold)) return;
    try {
      const created = await metaAds.createAlert({ campaign_id: campaignId, type, threshold });
      const newAlert = created?.data || created;
      setAlerts(prev => [...prev, newAlert]);
      setNewAlertThreshold(prev => ({ ...prev, [campaignId]: '' }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleAlert = async (alert) => {
    try {
      const updated = await metaAds.updateAlert(alert._id || alert.id, { enabled: !alert.enabled });
      const updatedAlert = updated?.data || updated;
      setAlerts(prev =>
        prev.map(a => (a._id || a.id) === (alert._id || alert.id)
          ? { ...a, enabled: updatedAlert.enabled ?? !a.enabled }
          : a
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAlert = async (alert) => {
    try {
      await metaAds.deleteAlert(alert._id || alert.id);
      setAlerts(prev => prev.filter(a => (a._id || a.id) !== (alert._id || alert.id)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusToggle = async (campaign) => {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await metaAds.updateCampaignStatus(campaign.id, newStatus);
      setCampaigns(prev =>
        prev.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleArchive = async (campaign) => {
    const ok = await confirm({ title: 'Arquivar campanha', message: `Arquivar campanha "${campaign.name}"?`, confirmText: 'Arquivar', variant: 'warning' });
    if (!ok) return;
    try {
      await metaAds.updateCampaignStatus(campaign.id, 'ARCHIVED');
      setCampaigns(prev =>
        prev.map(c => c.id === campaign.id ? { ...c, status: 'ARCHIVED' } : c)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (campaign) => {
    const ok = await confirm({ title: 'Excluir campanha', message: `Excluir campanha "${campaign.name}"? Essa acao nao pode ser desfeita.`, confirmText: 'Excluir', variant: 'danger' });
    if (!ok) return;
    try {
      await metaAds.deleteCampaign(campaign.id);
      setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAlertPanel = (id) => {
    setAlertPanels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const ObjectiveIcon = (objective) => OBJECTIVE_ICONS[objective] || IconDefault;

  const getCampaignImages = (campaignId) => {
    const images = [];
    const posts = linkedPosts[campaignId] || [];
    for (const p of posts) {
      if (p.image_urls && p.image_urls.length > 0) {
        for (const url of p.image_urls) {
          images.push({ src: `${API_URL}${url}`, type: 'post', caption: p.caption, date: p.scheduled_at, status: p.status });
        }
      }
    }
    const ads = campaignAds[campaignId] || [];
    for (const ad of ads) {
      if (ad.creative?.image_url) images.push({ src: ad.creative.image_url, type: 'ad', name: ad.name });
      if (ad.creative?.thumbnail_url) images.push({ src: ad.creative.thumbnail_url, type: 'ad', name: ad.name });
      if (ad.image_url) images.push({ src: ad.image_url, type: 'ad', name: ad.name });
      if (ad.preview_url) images.push({ src: ad.preview_url, type: 'ad', name: ad.name });
    }
    return images;
  };

  return (
    <div className="mads-campaigns">
      <div className="mads-campaigns-header">
        <div className="mads-campaigns-filters">
          <div className="mads-search-wrapper">
            <IconSearch />
            <input
              type="text"
              className="mads-search-input"
              placeholder="Buscar campanha..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="mads-filter-select"
          >
            <option value="">Todos os status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="PAUSED">Pausados</option>
            <option value="ARCHIVED">Arquivados</option>
          </select>
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            className="mads-filter-select"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          className="mads-btn-new"
          onClick={() => navigate('/admin/instagram/campaigns/new')}
        >
          <IconPlus /> Nova Campanha
        </button>
      </div>

      {error && <div className="mads-error">{error}</div>}

      {loading ? (
        <LoadingSkeleton variant="cards" />
      ) : sortedCampaigns.length === 0 ? (
        <div className="mads-empty">
          <div className="mads-empty-icon">
            <IconMegaphone />
          </div>
          <h3>{searchQuery ? 'Nenhuma campanha encontrada' : 'Nenhuma campanha encontrada'}</h3>
          <p>{searchQuery ? `Sem resultados para "${searchQuery}".` : 'Crie sua primeira campanha para comecar a promover seus posts.'}</p>
          {!searchQuery && (
            <button
              className="mads-btn-new"
              onClick={() => navigate('/admin/instagram/campaigns/new')}
            >
              <IconPlus /> Criar primeira campanha
            </button>
          )}
        </div>
      ) : (
        <div className="mads-campaigns-grid">
          {sortedCampaigns.map(campaign => {
            const ObjIcon = ObjectiveIcon(campaign.objective);
            const ins = insights[campaign.id];
            const statusColor = STATUS_COLORS[campaign.status] || '#71717a';
            const budget = formatBudget(campaign.daily_budget)
              ? `${formatBudget(campaign.daily_budget)}/dia`
              : formatBudget(campaign.lifetime_budget)
                ? `${formatBudget(campaign.lifetime_budget)} total`
                : null;
            const images = getCampaignImages(campaign.id);
            const posts = linkedPosts[campaign.id] || [];
            const ads = campaignAds[campaign.id] || [];
            const expanded = expandedCards[campaign.id];
            const alertPanelOpen = alertPanels[campaign.id];
            const campAlerts = getCampaignAlerts(campaign.id);

            // Spend bar
            const budgetRaw = getBudgetRaw(campaign);
            const spendPercent = ins ? getSpendPercent(ins.spend, budgetRaw) : 0;
            const spendColor = getSpendColor(spendPercent);

            return (
              <div
                key={campaign.id}
                className={`mads-card mads-card--${campaign.status?.toLowerCase()}`}
              >
                <div className="mads-card-top-bar" style={{ background: statusColor }} />

                {/* Header row */}
                <div className="mads-card-header">
                  <div className="mads-card-title-row">
                    <span className="mads-card-obj-icon">
                      <ObjIcon />
                    </span>
                    <div className="mads-card-title-info">
                      <h3 className="mads-card-name">{campaign.name}</h3>
                      <div className="mads-card-meta-row">
                        <span className="mads-card-objective">
                          {OBJECTIVES_LABEL[campaign.objective] || campaign.objective}
                        </span>
                        {campaign.bid_strategy && (
                          <span className="mads-card-bid">{campaign.bid_strategy.replace(/_/g, ' ')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mads-card-badges">
                    {bestCTRId === campaign.id && (
                      <span className="mads-badge mads-badge-crown" title="Melhor CTR">
                        <IconCrown /> Melhor CTR
                      </span>
                    )}
                    {highestSpendId === campaign.id && (
                      <span className="mads-badge mads-badge-warning" title="Maior Gasto">
                        <IconWarning /> Maior Gasto
                      </span>
                    )}
                    <span
                      className="mads-card-status"
                      style={{
                        background: `${statusColor}18`,
                        color: statusColor,
                        borderColor: `${statusColor}30`,
                      }}
                    >
                      <span className="mads-status-dot" style={{ background: statusColor }} />
                      {STATUS_LABEL[campaign.status] || campaign.status}
                    </span>
                  </div>
                </div>

                {/* Image strip */}
                {images.length > 0 && (
                  <div className="mads-card-images">
                    {images.slice(0, 5).map((img, i) => (
                      <div key={i} className="mads-card-image-thumb">
                        <img src={img.src} alt="" loading="lazy" />
                      </div>
                    ))}
                    {images.length > 5 && (
                      <div className="mads-card-image-more">
                        +{images.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* Mini stats */}
                <div className="mads-card-stats">
                  <div className="mads-mini-stat">
                    <span className="mads-mini-stat-label">Orcamento</span>
                    <span className="mads-mini-stat-value">{budget || '-'}</span>
                  </div>
                  <div className="mads-mini-stat">
                    <span className="mads-mini-stat-label">Alcance</span>
                    <span className="mads-mini-stat-value">{ins ? formatNum(ins.reach) : '-'}</span>
                  </div>
                  <div className="mads-mini-stat">
                    <span className="mads-mini-stat-label">Impressoes</span>
                    <span className="mads-mini-stat-value">{ins ? formatNum(ins.impressions) : '-'}</span>
                  </div>
                  <div className="mads-mini-stat">
                    <span className="mads-mini-stat-label">Cliques</span>
                    <span className="mads-mini-stat-value">{ins ? formatNum(ins.clicks) : '-'}</span>
                  </div>
                  <div className="mads-mini-stat">
                    <span className="mads-mini-stat-label">CTR</span>
                    <span className="mads-mini-stat-value">{ins ? formatPercent(ins.ctr) : '-'}</span>
                  </div>
                  <div className="mads-mini-stat">
                    <span className="mads-mini-stat-label">CPC</span>
                    <span className="mads-mini-stat-value">{ins?.cpc ? formatCurrency(ins.cpc) : '-'}</span>
                  </div>
                  <div className="mads-mini-stat">
                    <span className="mads-mini-stat-label">Gasto</span>
                    <span className="mads-mini-stat-value mads-mini-stat-spend">{ins ? formatCurrency(ins.spend) : '-'}</span>
                  </div>
                  <div className="mads-mini-stat">
                    <span className="mads-mini-stat-label">Posts</span>
                    <span className="mads-mini-stat-value">{posts.length || ads.length || '-'}</span>
                  </div>
                </div>

                {/* Spend bar */}
                {budgetRaw > 0 && ins && (
                  <div className="mads-spend-bar-container">
                    <div className="mads-spend-bar-header">
                      <span className="mads-spend-bar-label">Consumo</span>
                      <span className="mads-spend-bar-percent" style={{ color: spendColor }}>
                        {spendPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mads-spend-bar-track">
                      <div
                        className="mads-spend-bar-fill"
                        style={{ width: `${spendPercent}%`, background: spendColor }}
                      />
                    </div>
                    <div className="mads-spend-bar-legend">
                      <span>{formatCurrency(ins.spend)}</span>
                      <span>de {formatBudget(budgetRaw)}</span>
                    </div>
                  </div>
                )}

                {/* Alerts button + detail expand */}
                <div className="mads-card-inline-actions">
                  <button
                    className={`mads-alert-toggle-btn ${alertPanelOpen ? 'active' : ''}`}
                    onClick={() => toggleAlertPanel(campaign.id)}
                  >
                    <IconBell />
                    Alertas
                    {campAlerts.length > 0 && (
                      <span className="mads-alert-count">{campAlerts.length}</span>
                    )}
                  </button>

                  {(posts.length > 0 || ads.length > 0) && (
                    <button className="mads-expand-btn" onClick={() => toggleExpand(campaign.id)}>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      {expanded ? 'Ocultar detalhes' : `Ver detalhes (${posts.length + ads.length})`}
                    </button>
                  )}
                </div>

                {/* Alert panel */}
                {alertPanelOpen && (
                  <div className="mads-alert-panel">
                    {campAlerts.length > 0 ? (
                      <div className="mads-alert-list">
                        {campAlerts.map(a => (
                          <div key={a._id || a.id} className="mads-alert-item">
                            <div className="mads-alert-item-info">
                              <span className="mads-alert-item-type">
                                {ALERT_TYPE_LABEL[a.type] || a.type}
                              </span>
                              <span className="mads-alert-item-threshold">
                                {a.type?.includes('ctr') ? `${a.threshold}%` : `R$ ${a.threshold}`}
                              </span>
                            </div>
                            <div className="mads-alert-item-actions">
                              <button
                                className={`mads-alert-toggle ${a.enabled !== false ? 'on' : 'off'}`}
                                onClick={() => handleToggleAlert(a)}
                                title={a.enabled !== false ? 'Desativar' : 'Ativar'}
                              >
                                {a.enabled !== false ? 'ON' : 'OFF'}
                              </button>
                              <button
                                className="mads-alert-delete"
                                onClick={() => handleDeleteAlert(a)}
                                title="Remover alerta"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mads-alert-empty">Nenhum alerta configurado.</p>
                    )}
                    <div className="mads-alert-form">
                      <select
                        className="mads-alert-form-select"
                        value={newAlertType[campaign.id] || 'daily_spend'}
                        onChange={e => setNewAlertType(prev => ({ ...prev, [campaign.id]: e.target.value }))}
                      >
                        {Object.entries(ALERT_TYPE_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <input
                        className="mads-alert-form-input"
                        type="number"
                        placeholder="Valor"
                        value={newAlertThreshold[campaign.id] || ''}
                        onChange={e => setNewAlertThreshold(prev => ({ ...prev, [campaign.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleCreateAlert(campaign.id)}
                      />
                      <button
                        className="mads-alert-form-add"
                        onClick={() => handleCreateAlert(campaign.id)}
                        title="Criar alerta"
                      >
                        <IconPlus />
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded details */}
                {expanded && (
                  <div className="mads-card-details">
                    {posts.length > 0 && (
                      <div className="mads-detail-section">
                        <div className="mads-detail-section-title">
                          <IconImage /> Posts vinculados
                        </div>
                        <div className="mads-detail-posts">
                          {posts.map(p => (
                            <div key={p.id || p._id} className="mads-detail-post">
                              {p.image_urls?.[0] && (
                                <img
                                  className="mads-detail-post-img"
                                  src={`${API_URL}${p.image_urls[0]}`}
                                  alt=""
                                  loading="lazy"
                                />
                              )}
                              <div className="mads-detail-post-info">
                                <span className="mads-detail-post-caption">
                                  {p.caption?.slice(0, 80) || 'Sem legenda'}{p.caption?.length > 80 ? '...' : ''}
                                </span>
                                <div className="mads-detail-post-meta">
                                  {p.scheduled_at && (
                                    <span className="mads-detail-post-date">
                                      <IconCalendar /> {formatDate(p.scheduled_at)}
                                    </span>
                                  )}
                                  {p.status && (
                                    <span className={`mads-detail-post-status mads-detail-post-status--${p.status}`}>
                                      {p.status}
                                    </span>
                                  )}
                                  {p.image_urls?.length > 1 && (
                                    <span className="mads-detail-post-media-count">
                                      {p.image_urls.length} imgs
                                    </span>
                                  )}
                                </div>
                                {p.campaign && (
                                  <div className="mads-detail-post-campaign-info">
                                    {p.campaign.daily_budget && (
                                      <span>R${(p.campaign.daily_budget / 100).toFixed(2)}/dia</span>
                                    )}
                                    {p.campaign.duration_days && (
                                      <span>{p.campaign.duration_days} dias</span>
                                    )}
                                    {p.campaign.creative?.link_url && (
                                      <span className="mads-detail-post-link">
                                        <IconLink />
                                        {p.campaign.creative.link_url.replace(/^https?:\/\//, '').slice(0, 30)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ads.length > 0 && (
                      <div className="mads-detail-section">
                        <div className="mads-detail-section-title">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                          </svg>
                          Anuncios Meta
                        </div>
                        <div className="mads-detail-ads">
                          {ads.map(ad => (
                            <div key={ad.id} className="mads-detail-ad">
                              {(ad.creative?.image_url || ad.creative?.thumbnail_url || ad.image_url || ad.preview_url) && (
                                <img
                                  className="mads-detail-ad-img"
                                  src={ad.creative?.image_url || ad.creative?.thumbnail_url || ad.image_url || ad.preview_url}
                                  alt=""
                                  loading="lazy"
                                />
                              )}
                              <div className="mads-detail-ad-info">
                                <span className="mads-detail-ad-name">{ad.name || 'Anuncio'}</span>
                                <span
                                  className="mads-detail-ad-status"
                                  style={{
                                    color: STATUS_COLORS[ad.status] || '#71717a',
                                    background: `${STATUS_COLORS[ad.status] || '#71717a'}18`,
                                  }}
                                >
                                  {ad.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mads-card-actions">
                  {campaign.status !== 'ARCHIVED' && campaign.status !== 'DELETED' && (
                    <button
                      className={`mads-action-btn ${campaign.status === 'ACTIVE' ? 'mads-action-pause' : 'mads-action-play'}`}
                      onClick={() => handleStatusToggle(campaign)}
                      title={campaign.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                    >
                      {campaign.status === 'ACTIVE' ? <IconPause /> : <IconPlay />}
                      <span>{campaign.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}</span>
                    </button>
                  )}
                  <button
                    className="mads-action-btn mads-action-edit"
                    onClick={() => navigate(`/admin/instagram/campaigns/edit/${campaign.id}`)}
                    title="Editar"
                  >
                    <IconEdit />
                    <span>Editar</span>
                  </button>
                  {campaign.status !== 'ARCHIVED' && (
                    <button
                      className="mads-action-btn mads-action-archive"
                      onClick={() => handleArchive(campaign)}
                      title="Arquivar"
                    >
                      <IconArchive />
                      <span>Arquivar</span>
                    </button>
                  )}
                  <button
                    className="mads-action-btn mads-action-delete"
                    onClick={() => handleDelete(campaign)}
                    title="Excluir"
                  >
                    <IconTrash />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
