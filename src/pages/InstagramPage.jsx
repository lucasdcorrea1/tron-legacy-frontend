import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { instagram } from '../services/api';
import { InstagramSchedulingContent } from './InstagramScheduling';
import { InstagramAutoReplyContent } from './InstagramAutoReply';
import { InstagramLeadsContent } from './InstagramLeads';
import { InstagramAnalyticsContent } from './InstagramAnalytics';
import './InstagramPage.css';

const TABS = [
  { key: 'config', label: 'Configuração', alwaysVisible: true },
  { key: 'agendamento', label: 'Agendamento' },
  { key: 'autoreply', label: 'Auto-Resposta' },
  { key: 'leads', label: 'Leads' },
  { key: 'analytics', label: 'Analytics' },
];

export default function InstagramPage() {
  const [configured, setConfigured] = useState(null); // null = loading
  const [activeTab, setActiveTab] = useState('config');

  useEffect(() => {
    instagram.getConfig()
      .then(data => {
        const isConfigured = !!data?.configured;
        setConfigured(isConfigured);
        if (isConfigured) setActiveTab('agendamento');
      })
      .catch(() => setConfigured(false));
  }, []);

  const handleConfigChange = (isConfigured) => {
    setConfigured(isConfigured);
    if (isConfigured && activeTab === 'config') {
      setActiveTab('agendamento');
    }
  };

  const visibleTabs = configured
    ? TABS
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
            Verificando configuração...
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
                <InstagramSchedulingContent
                  configuredProp={configured}
                  onConfigChange={handleConfigChange}
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
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
