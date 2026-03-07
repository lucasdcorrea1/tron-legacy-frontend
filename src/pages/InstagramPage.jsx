import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { instagram, instagramAnalytics } from '../services/api';
import { useToast } from '../components/Toast';
import InstagramConfig from './InstagramConfig';
import { InstagramSchedulingContent } from './InstagramScheduling';
import { InstagramAutoReplyContent } from './InstagramAutoReply';
import { InstagramLeadsContent } from './InstagramLeads';
import { InstagramAnalyticsContent } from './InstagramAnalytics';
import MetaAdsCampaigns from './MetaAdsCampaigns';
import MetaAdsInsights from './MetaAdsInsights';
import { AutoBoostContent } from './AutoBoostPage';
import './InstagramPage.css';

const TABS = [
  { key: 'config', label: 'Configuracao', alwaysVisible: true },
  { key: 'home', label: 'Home' },
  { key: 'agendamento', label: 'Agendamento' },
  { key: 'autoreply', label: 'Auto-Resposta' },
  { key: 'leads', label: 'Leads' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'campanhas', label: 'Campanhas', requiresAdAccount: true },
  { key: 'insights', label: 'Insights', requiresAdAccount: true },
  { key: 'autoboost', label: 'Auto-Boost', requiresAdAccount: true },
];

const TOOL_CARDS = [
  { key: 'agendamento', icon: '📅', title: 'Agendamento', desc: 'Agende posts e stories' },
  { key: 'autoreply', icon: '💬', title: 'Auto-Resposta', desc: 'Respostas automáticas a comentários' },
  { key: 'leads', icon: '👥', title: 'Leads', desc: 'Capture e gerencie leads' },
  { key: 'analytics', icon: '📊', title: 'Analytics', desc: 'Métricas detalhadas e relatórios' },
  { key: 'campanhas', icon: '📢', title: 'Campanhas', desc: 'Gerencie campanhas Meta Ads', requiresAdAccount: true },
  { key: 'insights', icon: '🔍', title: 'Insights', desc: 'Insights de anúncios pagos', requiresAdAccount: true },
  { key: 'autoboost', icon: '🚀', title: 'Auto-Boost', desc: 'Impulsione posts automaticamente', requiresAdAccount: true },
];

function InstagramHomeTab({ hasAdAccount, onNavigate }) {
  const toast = useToast();
  const [engData, setEngData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { loadEngagement(); }, [loadEngagement]);

  const visibleTools = TOOL_CARDS.filter(t => !t.requiresAdAccount || hasAdAccount);

  return (
    <div className="ig-home-tab">
      {loading ? (
        <div className="analytics-loading">
          <div className="analytics-spinner" />
          Buscando dados de engajamento...
        </div>
      ) : engData && (
        <>
          {/* Stats cards */}
          <div className="analytics-stats">
            <div className="analytics-stat-card blue">
              <span className="analytics-stat-value">{engData.total_posts}</span>
              <span className="analytics-stat-label">Posts</span>
            </div>
            <div className="analytics-stat-card purple">
              <span className="analytics-stat-value">
                {engData.followers_count.toLocaleString('pt-BR')}
              </span>
              <span className="analytics-stat-label">Seguidores</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">{engData.avg_likes.toFixed(0)}</span>
              <span className="analytics-stat-label">Média Likes</span>
            </div>
            <div className="analytics-stat-card">
              <span className="analytics-stat-value">{engData.avg_comments.toFixed(0)}</span>
              <span className="analytics-stat-label">Média Comentários</span>
            </div>
            <div className="analytics-stat-card green">
              <span className="analytics-stat-value">{engData.avg_engagement_rate.toFixed(2)}%</span>
              <span className="analytics-stat-label">Eng. Médio</span>
            </div>
          </div>

          {/* Best posting hours */}
          {engData.best_posting_hours.length > 0 && (
            <div className="analytics-section">
              <h3 className="analytics-section-title">Melhores Horários para Postar</h3>
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

      {/* Tool cards grid */}
      <div className="ig-home-section-title">Ferramentas</div>
      <div className="ig-home-tools-grid">
        {visibleTools.map(tool => (
          <button
            key={tool.key}
            className="ig-home-tool-card"
            onClick={() => onNavigate(tool.key)}
          >
            <span className="ig-home-tool-icon">{tool.icon}</span>
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
    // Only auto-redirect when user just saved config for the first time
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
        <div className="page-header">
          <h1>Instagram</h1>
          <p>Gerencie agendamentos, auto-respostas, leads e analytics</p>
        </div>

        {configured === null ? (
          <div className="ig-unified-loading">
            <span className="ig-spinner" />
            Verificando configuracao...
          </div>
        ) : (
          <>
            <div className="ar-tabs ig-unified-tabs">
              {visibleTabs.map(t => (
                <button
                  key={t.key}
                  className={`ar-tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

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
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === 'agendamento' && (
                <InstagramSchedulingContent
                  configuredProp={configured}
                  onConfigChange={handleConfigChange}
                />
              )}
              {activeTab === 'autoreply' && <InstagramAutoReplyContent />}
              {activeTab === 'leads' && <InstagramLeadsContent />}
              {activeTab === 'analytics' && <InstagramAnalyticsContent />}
              {activeTab === 'campanhas' && <MetaAdsCampaigns />}
              {activeTab === 'insights' && <MetaAdsInsights />}
              {activeTab === 'autoboost' && <AutoBoostContent />}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
