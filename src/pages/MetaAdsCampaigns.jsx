import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { metaAds } from '../services/api';
import './MetaAdsCampaigns.css';

const STATUS_COLORS = {
  ACTIVE: '#4ade80',
  PAUSED: '#fbbf24',
  ARCHIVED: '#71717a',
  DELETED: '#f87171',
};

const OBJECTIVES_LABEL = {
  OUTCOME_AWARENESS: 'Reconhecimento',
  OUTCOME_TRAFFIC: 'Trafego',
  OUTCOME_ENGAGEMENT: 'Engajamento',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_APP_PROMOTION: 'App',
  OUTCOME_SALES: 'Vendas',
};

export default function MetaAdsCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, [statusFilter]);

  const loadCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await metaAds.listCampaigns({ status: statusFilter || undefined });
      setCampaigns(data?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    if (!window.confirm(`Arquivar campanha "${campaign.name}"?`)) return;
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
    if (!window.confirm(`Excluir campanha "${campaign.name}"? Essa acao nao pode ser desfeita.`)) return;
    try {
      await metaAds.deleteCampaign(campaign.id);
      setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatBudget = (value) => {
    if (!value) return '-';
    return `R$ ${(parseInt(value) / 100).toFixed(2)}`;
  };

  return (
    <div className="mads-campaigns">
      <div className="mads-campaigns-header">
        <div className="mads-campaigns-filters">
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
        </div>
        <button
          className="mads-btn primary"
          onClick={() => navigate('/admin/instagram/campaigns/new')}
        >
          + Nova Campanha
        </button>
      </div>

      {error && <div className="mads-error">{error}</div>}

      {loading ? (
        <div className="mads-loading">
          <span className="ig-spinner" />
          Carregando campanhas...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="mads-empty">
          <p>Nenhuma campanha encontrada</p>
          <button
            className="mads-btn primary"
            onClick={() => navigate('/admin/instagram/campaigns/new')}
          >
            Criar primeira campanha
          </button>
        </div>
      ) : (
        <div className="mads-campaigns-grid">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="mads-campaign-card">
              <div className="mads-campaign-top">
                <div className="mads-campaign-info">
                  <h3>{campaign.name}</h3>
                  <span className="mads-campaign-objective">
                    {OBJECTIVES_LABEL[campaign.objective] || campaign.objective}
                  </span>
                </div>
                <span
                  className="mads-status-badge"
                  style={{ background: `${STATUS_COLORS[campaign.status] || '#71717a'}20`, color: STATUS_COLORS[campaign.status] || '#71717a' }}
                >
                  {campaign.status}
                </span>
              </div>

              <div className="mads-campaign-budget">
                {campaign.daily_budget && (
                  <div className="mads-budget-item">
                    <span className="mads-budget-label">Diario</span>
                    <span className="mads-budget-value">{formatBudget(campaign.daily_budget)}</span>
                  </div>
                )}
                {campaign.lifetime_budget && (
                  <div className="mads-budget-item">
                    <span className="mads-budget-label">Vitalicio</span>
                    <span className="mads-budget-value">{formatBudget(campaign.lifetime_budget)}</span>
                  </div>
                )}
                {campaign.bid_strategy && (
                  <div className="mads-budget-item">
                    <span className="mads-budget-label">Estrategia</span>
                    <span className="mads-budget-value">{campaign.bid_strategy}</span>
                  </div>
                )}
              </div>

              <div className="mads-campaign-actions">
                {campaign.status !== 'ARCHIVED' && campaign.status !== 'DELETED' && (
                  <button
                    className={`mads-btn-action ${campaign.status === 'ACTIVE' ? 'pause' : 'play'}`}
                    onClick={() => handleStatusToggle(campaign)}
                    title={campaign.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                  >
                    {campaign.status === 'ACTIVE' ? '⏸' : '▶'}
                  </button>
                )}
                <button
                  className="mads-btn-action edit"
                  onClick={() => navigate(`/admin/instagram/campaigns/edit/${campaign.id}`)}
                  title="Editar"
                >
                  ✏️
                </button>
                {campaign.status !== 'ARCHIVED' && (
                  <button
                    className="mads-btn-action archive"
                    onClick={() => handleArchive(campaign)}
                    title="Arquivar"
                  >
                    📦
                  </button>
                )}
                <button
                  className="mads-btn-action delete"
                  onClick={() => handleDelete(campaign)}
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
