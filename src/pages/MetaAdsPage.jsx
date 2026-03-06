import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { instagram } from '../services/api';
import MetaAdsCampaigns from './MetaAdsCampaigns';
import MetaAdsInsights from './MetaAdsInsights';
import './MetaAdsPage.css';

const TABS = [
  { key: 'campanhas', label: 'Campanhas' },
  { key: 'insights', label: 'Insights' },
];

export default function MetaAdsPage() {
  const [configured, setConfigured] = useState(null);
  const [activeTab, setActiveTab] = useState('campanhas');

  useEffect(() => {
    // Check if Instagram config has ad_account_id set (unified token)
    instagram.getConfig()
      .then(data => {
        const isConfigured = !!data?.configured && !!data?.ad_account_id;
        setConfigured(isConfigured);
      })
      .catch(() => setConfigured(false));
  }, []);

  return (
    <AdminLayout>
      <div className="mads-page">
        <div className="page-header">
          <h1>Meta Ads</h1>
          <p>Gerencie campanhas, conjuntos de anuncios e insights</p>
        </div>

        {configured === null ? (
          <div className="mads-loading">
            <span className="ig-spinner" />
            Verificando configuracao...
          </div>
        ) : !configured ? (
          <div className="mads-not-configured">
            <div className="mads-not-configured-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M12 8v4m0 4h.01" /></svg>
            </div>
            <h2>Meta Ads nao configurado</h2>
            <p>
              Configure o Ad Account ID na pagina <strong>Instagram &gt; Configuracao</strong>.
              O mesmo token do Instagram e usado para o Meta Ads.
            </p>
          </div>
        ) : (
          <>
            <div className="ar-tabs mads-tabs">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`ar-tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mads-content">
              {activeTab === 'campanhas' && <MetaAdsCampaigns />}
              {activeTab === 'insights' && <MetaAdsInsights />}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
