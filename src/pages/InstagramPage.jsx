import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { instagram, instagramAnalytics, integratedPublish, metaAds, API_URL } from '../services/api';
import { useToast } from '../components/Toast';
import InstagramConfig from './InstagramConfig';
import { InstagramSchedulingContent } from './InstagramScheduling';
import { InstagramAutoReplyContent } from './InstagramAutoReply';
import { InstagramLeadsContent } from './InstagramLeads';
import { InstagramAnalyticsContent } from './InstagramAnalytics';
import MetaAdsCampaigns from './MetaAdsCampaigns';
import MetaAdsInsights from './MetaAdsInsights';
import MetaAdsFinanceiro from './MetaAdsFinanceiro';
import { AutoBoostContent } from './AutoBoostPage';
import './InstagramPage.css';

/* ── SVG Icon Component ── */
const Icon = ({ name, size = 18 }) => {
  const paths = {
    config: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    home: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
    chat: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    barChart: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
    volume: (
      <>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    zap: (
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    ),
    dollarSign: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
    heart: (
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    ),
    messageCircle: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    ),
    trendingUp: (
      <>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
    chevronRight: (
      <polyline points="9 18 15 12 9 6" />
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
};

const TABS = [
  { key: 'config', label: 'Config', icon: 'config', alwaysVisible: true },
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'campanhas', label: 'Campanhas', icon: 'volume', requiresAdAccount: true },
  { key: 'financeiro', label: 'Financeiro', icon: 'dollarSign', requiresAdAccount: true },
  { key: 'agendamento', label: 'Agendamento', icon: 'calendar' },
  { key: 'autoreply', label: 'Auto-Resposta', icon: 'chat' },
  { key: 'leads', label: 'Leads', icon: 'users' },
  { key: 'analytics', label: 'Analytics', icon: 'barChart' },
  { key: 'insights', label: 'Insights', icon: 'search', requiresAdAccount: true },
  { key: 'autoboost', label: 'Auto-Boost', icon: 'zap', requiresAdAccount: true },
];

const TOOL_CARDS = [
  { key: 'campanhas', icon: 'volume', title: 'Campanhas', desc: 'Gerencie campanhas Meta Ads', requiresAdAccount: true },
  { key: 'autoreply', icon: 'chat', title: 'Auto-Resposta', desc: 'Respostas automaticas a comentarios' },
  { key: 'leads', icon: 'users', title: 'Leads', desc: 'Capture e gerencie leads' },
  { key: 'analytics', icon: 'barChart', title: 'Analytics', desc: 'Metricas detalhadas e relatorios' },
  { key: 'insights', icon: 'search', title: 'Insights', desc: 'Insights de anuncios pagos', requiresAdAccount: true },
  { key: 'autoboost', icon: 'zap', title: 'Auto-Boost', desc: 'Impulsione posts automaticamente', requiresAdAccount: true },
];

function InstagramHomeTab({ hasAdAccount, onNavigate }) {
  const toast = useToast();
  const [engData, setEngData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcoming, setUpcoming] = useState([]);
  const [finSummary, setFinSummary] = useState(null);

  const loadEngagement = useCallback(async () => {
    setLoading(true);
    try {
      const data = await instagramAnalytics.engagement();
      setEngData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadUpcoming = useCallback(async () => {
    try {
      const [igRes, ipRes] = await Promise.all([
        instagram.list({ limit: 20 }),
        integratedPublish.list({ limit: 20 }),
      ]);
      const igItems = (igRes.schedules || igRes.items || []).map(s => ({
        id: s.id, caption: s.caption, scheduled_at: s.scheduled_at,
        image: s.image_urls?.[0], imageCount: s.image_urls?.length || 0,
        integrated: false, status: s.status, error: s.error_message,
      }));
      const ipItems = (ipRes.items || []).map(s => ({
        id: s.id, caption: s.caption, scheduled_at: s.scheduled_at,
        image: s.image_urls?.[0], imageCount: s.image_urls?.length || 0,
        integrated: true, status: s.status, error: s.error_message,
        campaignName: s.campaign?.name,
      }));
      const all = [...igItems, ...ipItems]
        .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
      setUpcoming(all);
    } catch { /* silent */ }
  }, []);

  const loadFinanceSummary = useCallback(async () => {
    if (!hasAdAccount) return;
    try {
      const [finRes, recsRes] = await Promise.allSettled([
        metaAds.getAccountFinance(),
        metaAds.getAccountRecommendations(),
      ]);
      const fin = finRes.status === 'fulfilled' ? finRes.value : null;
      const recs = recsRes.status === 'fulfilled' ? recsRes.value : null;
      if (fin || recs) {
        setFinSummary({
          spend_today: fin?.spend_today || 0,
          spend_this_month: fin?.spend_this_month || 0,
          currency: fin?.currency || 'BRL',
          opportunity_score: recs?.opportunity_score ?? null,
          recommendations_count: recs?.recommendations?.length || 0,
          total_lift: (recs?.recommendations || []).reduce((s, r) => s + (r.opportunity_score_lift || 0), 0),
        });
      }
    } catch { /* silent */ }
  }, [hasAdAccount]);

  useEffect(() => { loadEngagement(); loadUpcoming(); loadFinanceSummary(); }, [loadEngagement, loadUpcoming, loadFinanceSummary]);

  const visibleTools = TOOL_CARDS.filter(t => !t.requiresAdAccount || hasAdAccount);

  return (
    <div className="ig-home-tab">
      {/* Hero CTA — Criar Post */}
      <button className="ig-cta-hero" onClick={() => onNavigate('agendamento', 'novo')}>
        <span className="ig-cta-icon">
          <Icon name="plus" size={24} />
        </span>
        <span className="ig-cta-text">
          <strong>Criar novo post</strong>
          <span>Agende uma publicacao para o Instagram</span>
        </span>
        <span className="ig-cta-arrow">
          <Icon name="chevronRight" size={20} />
        </span>
      </button>

      {loading ? (
        <div className="ig-home-loading">
          <div className="ig-spinner" />
          Buscando dados de engajamento...
        </div>
      ) : engData && (
        <>
          {/* Stats cards */}
          <div className="ig-home-stats">
            <div className="ig-home-stat blue">
              <span className="ig-home-stat-icon"><Icon name="grid" size={15} /></span>
              <span className="ig-home-stat-value">{engData.total_posts}</span>
              <span className="ig-home-stat-label">Posts</span>
            </div>
            <div className="ig-home-stat purple">
              <span className="ig-home-stat-icon"><Icon name="users" size={15} /></span>
              <span className="ig-home-stat-value">
                {engData.followers_count.toLocaleString('pt-BR')}
              </span>
              <span className="ig-home-stat-label">Seguidores</span>
            </div>
            <div className="ig-home-stat pink">
              <span className="ig-home-stat-icon"><Icon name="heart" size={15} /></span>
              <span className="ig-home-stat-value">{engData.avg_likes.toFixed(0)}</span>
              <span className="ig-home-stat-label">Media Likes</span>
            </div>
            <div className="ig-home-stat amber">
              <span className="ig-home-stat-icon"><Icon name="messageCircle" size={15} /></span>
              <span className="ig-home-stat-value">{engData.avg_comments.toFixed(0)}</span>
              <span className="ig-home-stat-label">Media Comentarios</span>
            </div>
            <div className="ig-home-stat green">
              <span className="ig-home-stat-icon"><Icon name="trendingUp" size={15} /></span>
              <span className="ig-home-stat-value">{engData.avg_engagement_rate.toFixed(2)}%</span>
              <span className="ig-home-stat-label">Eng. Medio</span>
            </div>
          </div>

          {/* Financial summary */}
          {finSummary && (
            <div className="ig-home-section ig-fin-summary">
              <div className="ig-home-section-header">
                <span className="ig-home-section-icon"><Icon name="dollarSign" size={16} /></span>
                <h3 className="ig-home-section-title">Resumo Financeiro</h3>
                <button className="ig-home-see-all" onClick={() => onNavigate('financeiro')}>
                  Ver detalhes <Icon name="chevronRight" size={14} />
                </button>
              </div>
              <div className="ig-fin-summary-grid">
                <div className="ig-fin-summary-card">
                  <span className="ig-fin-summary-label">Gasto Hoje</span>
                  <span className="ig-fin-summary-value today">
                    R$ {(finSummary.spend_today || 0).toFixed(2)}
                  </span>
                </div>
                <div className="ig-fin-summary-card">
                  <span className="ig-fin-summary-label">Gasto no Mes</span>
                  <span className="ig-fin-summary-value month">
                    R$ {(finSummary.spend_this_month || 0).toFixed(2)}
                  </span>
                </div>
                {finSummary.opportunity_score !== null && (
                  <div className="ig-fin-summary-card score">
                    <span className="ig-fin-summary-label">Oportunidade</span>
                    <div className="ig-fin-score-row">
                      <svg viewBox="0 0 36 36" className="ig-fin-score-mini">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#27272a" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.5"
                          fill="none"
                          stroke={
                            finSummary.opportunity_score > 70 ? '#22c55e'
                              : finSummary.opportunity_score > 30 ? '#f59e0b'
                                : '#ef4444'
                          }
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray={`${(finSummary.opportunity_score / 100) * 97.39} 97.39`}
                          transform="rotate(-90 18 18)"
                        />
                      </svg>
                      <span className="ig-fin-score-num">{Math.round(finSummary.opportunity_score)}</span>
                    </div>
                  </div>
                )}
                {finSummary.recommendations_count > 0 && (
                  <div className="ig-fin-summary-card recs" onClick={() => onNavigate('financeiro')}>
                    <span className="ig-fin-summary-label">Recomendacoes</span>
                    <span className="ig-fin-summary-value recs-val">
                      {finSummary.recommendations_count}
                    </span>
                    <span className="ig-fin-summary-sub">+{finSummary.total_lift} pts possiveis</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scheduled posts */}
          <div className="ig-home-section">
            <div className="ig-home-section-header">
              <span className="ig-home-section-icon"><Icon name="calendar" size={16} /></span>
              <h3 className="ig-home-section-title">Posts Agendados</h3>
              <button className="ig-home-see-all" onClick={() => onNavigate('agendamento', 'novo')}>
                <Icon name="plus" size={14} /> Novo post
              </button>
            </div>
            {upcoming.length === 0 ? (
              <div className="ig-home-empty-posts">
                <Icon name="calendar" size={32} />
                <p>Nenhum post agendado</p>
                <button className="ig-home-empty-btn" onClick={() => onNavigate('agendamento', 'novo')}>
                  Criar primeiro post
                </button>
              </div>
            ) : (
              <div className="ig-home-posts-grid">
                {upcoming.map(item => {
                  const STATUS_MAP = {
                    scheduled: { label: 'Agendado', cls: 'scheduled' },
                    publishing: { label: 'Publicando', cls: 'publishing' },
                    publishing_ig: { label: 'Publicando IG', cls: 'publishing' },
                    publishing_ads: { label: 'Criando Ads', cls: 'publishing' },
                    published: { label: 'Publicado', cls: 'published' },
                    completed: { label: 'Concluido', cls: 'published' },
                    failed: { label: 'Falhou', cls: 'failed' },
                  };
                  const st = STATUS_MAP[item.status] || { label: item.status, cls: '' };
                  const isScheduled = item.status === 'scheduled';
                  const dt = new Date(item.scheduled_at);
                  const now = new Date();
                  const diffMs = dt - now;
                  const diffH = Math.floor(diffMs / 3600000);
                  const diffD = Math.floor(diffMs / 86400000);
                  let timeLabel = '';
                  if (diffMs > 0) {
                    if (diffD > 0) timeLabel = `em ${diffD}d`;
                    else if (diffH > 0) timeLabel = `em ${diffH}h`;
                    else timeLabel = 'em breve';
                  }

                  return (
                    <div key={item.id} className={`ig-post-card ${st.cls}`}>
                      <div className="ig-post-card-thumb">
                        {item.image ? (
                          <img src={item.image.startsWith('http') ? item.image : `${API_URL}${item.image}`} alt="" />
                        ) : (
                          <div className="ig-post-card-no-img"><Icon name="image" size={24} /></div>
                        )}
                        {item.imageCount > 1 && (
                          <span className="ig-post-card-multi">{item.imageCount}</span>
                        )}
                        <span className={`ig-post-card-status ${st.cls}`}>{st.label}</span>
                        {item.integrated && <span className="ig-post-card-ads">Ads</span>}
                      </div>
                      <div className="ig-post-card-body">
                        <p className="ig-post-card-caption">{item.caption || 'Sem legenda'}</p>
                        <div className="ig-post-card-meta">
                          <span className="ig-post-card-date">
                            <Icon name="clock" size={12} />
                            {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            {' '}
                            {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isScheduled && timeLabel && (
                            <span className="ig-post-card-countdown">{timeLabel}</span>
                          )}
                        </div>
                        {item.campaignName && (
                          <span className="ig-post-card-campaign">{item.campaignName}</span>
                        )}
                        {item.error && (
                          <span className="ig-post-card-error">{item.error}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Best posting hours */}
          {engData.best_posting_hours.length > 0 && (
            <div className="ig-home-section">
              <div className="ig-home-section-header">
                <span className="ig-home-section-icon"><Icon name="clock" size={16} /></span>
                <h3 className="ig-home-section-title">Melhores Horarios para Postar</h3>
              </div>
              <div className="analytics-ranking-list">
                {engData.best_posting_hours.slice(0, 6).map((h, i) => {
                  const maxEng = engData.best_posting_hours[0]?.avg_engagement || 1;
                  return (
                    <div key={i} className="analytics-ranking-item">
                      <span className="analytics-ranking-name">{String(h.hour).padStart(2, '0')}:00</span>
                      <div className="analytics-ranking-bar-wrap">
                        <div
                          className="analytics-ranking-bar-fill"
                          style={{ width: `${(h.avg_engagement / maxEng) * 100}%` }}
                        />
                      </div>
                      <span className="analytics-ranking-count">
                        {h.avg_engagement.toFixed(2)}% ({h.post_count})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tools divider */}
      <div className="ig-home-divider" />

      {/* Tool cards grid */}
      <div className="ig-home-section-header">
        <span className="ig-home-section-icon"><Icon name="grid" size={16} /></span>
        <h3 className="ig-home-section-title">Ferramentas</h3>
      </div>
      <div className="ig-home-tools-grid">
        {visibleTools.map(tool => (
          <button
            key={tool.key}
            className="ig-home-tool-card"
            onClick={() => onNavigate(tool.key)}
          >
            <span className={`ig-home-tool-icon ${tool.key}`}>
              <Icon name={tool.icon} size={22} />
            </span>
            <span className="ig-home-tool-title">{tool.title}</span>
            <span className="ig-home-tool-desc">{tool.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InstagramPage() {
  const [configured, setConfigured] = useState(null); // null = loading
  const [hasAdAccount, setHasAdAccount] = useState(false);
  const [activeTab, setActiveTab] = useState('config');
  const [schedulingInitialTab, setSchedulingInitialTab] = useState(null);

  useEffect(() => {
    instagram.getConfig()
      .then(data => {
        const isConfigured = !!data?.configured;
        setConfigured(isConfigured);
        setHasAdAccount(!!data?.ad_account_id);
        if (isConfigured) setActiveTab('home');
      })
      .catch(() => setConfigured(false));
  }, []);

  const handleConfigChange = (isConfigured, data) => {
    const wasNotConfigured = configured === false;
    setConfigured(isConfigured);
    if (data?.ad_account_id !== undefined) {
      setHasAdAccount(!!data.ad_account_id);
    }
    if (isConfigured && wasNotConfigured) {
      setActiveTab('home');
    }
  };

  const visibleTabs = configured
    ? TABS.filter(t => !t.requiresAdAccount || hasAdAccount)
    : TABS.filter(t => t.alwaysVisible);

  return (
    <AdminLayout>
      <div className="ig-unified-page">
        {/* Premium Header */}
        <div className="ig-header">
          <div className="ig-header-left">
            <div className="ig-header-logo">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#feda75" />
                    <stop offset="25%" stopColor="#fa7e1e" />
                    <stop offset="50%" stopColor="#d62976" />
                    <stop offset="75%" stopColor="#962fbf" />
                    <stop offset="100%" stopColor="#4f5bd5" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig-grad)" strokeWidth="2" />
                <circle cx="12" cy="12" r="5" stroke="url(#ig-grad)" strokeWidth="2" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-grad)" />
              </svg>
            </div>
            <div className="ig-header-text">
              <h1>Instagram</h1>
              <p>Gerencie agendamentos, auto-respostas, leads e analytics</p>
            </div>
          </div>
          {configured !== null && (
            <div className={`ig-header-badge ${configured ? 'connected' : 'disconnected'}`}>
              <span className="ig-header-badge-dot" />
              {configured ? 'Conectado' : 'Desconectado'}
            </div>
          )}
        </div>

        {configured === null ? (
          <div className="ig-unified-loading">
            <span className="ig-spinner" />
            Verificando configuracao...
          </div>
        ) : (
          <>
            {/* Icon Navigation */}
            <nav className="ig-nav">
              {visibleTabs.map(t => (
                <button
                  key={t.key}
                  className={`ig-nav-item ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => { setSchedulingInitialTab(null); setActiveTab(t.key); }}
                  data-tooltip={t.label}
                >
                  <Icon name={t.icon} size={18} />
                </button>
              ))}
            </nav>

            <div className="ig-unified-content">
              {activeTab === 'config' && (
                <InstagramConfig
                  configuredProp={configured}
                  onConfigChange={handleConfigChange}
                />
              )}
              {activeTab === 'home' && (
                <InstagramHomeTab
                  hasAdAccount={hasAdAccount}
                  onNavigate={(tab, subTab) => {
                    if (subTab) setSchedulingInitialTab(subTab);
                    setActiveTab(tab);
                  }}
                />
              )}
              {activeTab === 'agendamento' && (
                <InstagramSchedulingContent
                  configuredProp={configured}
                  onConfigChange={handleConfigChange}
                  initialTab={schedulingInitialTab}
                  key={schedulingInitialTab}
                />
              )}
              {activeTab === 'autoreply' && <InstagramAutoReplyContent />}
              {activeTab === 'leads' && <InstagramLeadsContent />}
              {activeTab === 'analytics' && <InstagramAnalyticsContent />}
              {activeTab === 'campanhas' && <MetaAdsCampaigns />}
              {activeTab === 'insights' && <MetaAdsInsights />}
              {activeTab === 'financeiro' && <MetaAdsFinanceiro />}
              {activeTab === 'autoboost' && <AutoBoostContent />}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
