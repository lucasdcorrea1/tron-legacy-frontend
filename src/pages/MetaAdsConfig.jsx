import { useState, useEffect } from 'react';
import { metaAds } from '../services/api';
import './MetaAdsConfig.css';

export default function MetaAdsConfig({ configuredProp, onConfigChange }) {
  const [adAccountId, setAdAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState('');
  const [configInfo, setConfigInfo] = useState(null);

  // Budget alerts
  const [alerts, setAlerts] = useState([]);
  const [alertType, setAlertType] = useState('daily_spend');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [alertCampaignId, setAlertCampaignId] = useState('');

  useEffect(() => {
    loadConfig();
    if (configuredProp) loadAlerts();
  }, [configuredProp]);

  const loadConfig = async () => {
    try {
      const data = await metaAds.getConfig();
      setConfigInfo(data);
    } catch {
      // ignore
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await metaAds.listAlerts();
      setAlerts(data || []);
    } catch {
      // ignore
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!adAccountId || !accessToken) {
      setError('Ad Account ID e Access Token obrigatorios');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await metaAds.saveConfig({
        ad_account_id: adAccountId,
        access_token: accessToken,
        business_id: businessId,
      });
      setAccessToken('');
      onConfigChange?.(true);
      loadConfig();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const data = await metaAds.testConnection();
      setTestResult(data);
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remover configuracao de Meta Ads?')) return;
    try {
      await metaAds.deleteConfig();
      onConfigChange?.(false);
      setConfigInfo(null);
      setTestResult(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddAlert = async (e) => {
    e.preventDefault();
    if (!alertThreshold || parseFloat(alertThreshold) <= 0) return;
    try {
      await metaAds.createAlert({
        alert_type: alertType,
        threshold: parseFloat(alertThreshold),
        campaign_id: alertCampaignId || undefined,
      });
      setAlertThreshold('');
      setAlertCampaignId('');
      loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await metaAds.deleteAlert(id);
      loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleAlert = async (alert) => {
    try {
      await metaAds.updateAlert(alert.id, { active: !alert.active });
      loadAlerts();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mads-config">
      <div className="mads-config-section">
        <h3>Credenciais da API</h3>
        <p className="mads-config-hint">
          Necessario: <code>ads_management</code>, <code>ads_read</code> e <code>business_management</code> permissions.
          O Ad Account ID esta no Meta Business Suite em Configuracoes &gt; Contas de anuncio.
        </p>

        {configInfo?.configured && (
          <div className="mads-config-status">
            <span className="mads-status-dot active" />
            Configurado (Conta: {configInfo.ad_account_id}) — Fonte: {configInfo.source}
            <button className="mads-btn-text danger" onClick={handleDelete}>Remover</button>
          </div>
        )}

        <form onSubmit={handleSave} className="mads-config-form">
          <div className="mads-field">
            <label>Ad Account ID</label>
            <input
              type="text"
              value={adAccountId}
              onChange={e => setAdAccountId(e.target.value)}
              placeholder="Ex: 123456789 ou act_123456789"
            />
          </div>
          <div className="mads-field">
            <label>Access Token</label>
            <input
              type="password"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="Token com permissoes ads_management"
            />
          </div>
          <div className="mads-field">
            <label>Business ID (opcional)</label>
            <input
              type="text"
              value={businessId}
              onChange={e => setBusinessId(e.target.value)}
              placeholder="ID da pagina do Facebook"
            />
          </div>

          {error && <div className="mads-error">{error}</div>}

          <div className="mads-config-actions">
            <button type="submit" className="mads-btn primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Credenciais'}
            </button>
            {configInfo?.configured && (
              <button type="button" className="mads-btn secondary" onClick={handleTest} disabled={testing}>
                {testing ? 'Testando...' : 'Testar Conexao'}
              </button>
            )}
          </div>
        </form>

        {testResult && (
          <div className={`mads-test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? (
              <>
                <strong>Conexao OK!</strong>
                <div className="mads-test-details">
                  <span>Conta: {testResult.name}</span>
                  <span>Moeda: {testResult.currency}</span>
                  <span>Timezone: {testResult.timezone_name}</span>
                  <span>Gasto Total: {testResult.amount_spent}</span>
                </div>
              </>
            ) : (
              <>
                <strong>Erro na conexao</strong>
                <p>{typeof testResult.error === 'string' ? testResult.error : JSON.stringify(testResult.error)}</p>
              </>
            )}
          </div>
        )}
      </div>

      {configuredProp && (
        <div className="mads-config-section">
          <h3>Alertas de Orcamento</h3>
          <form onSubmit={handleAddAlert} className="mads-alert-form">
            <select value={alertType} onChange={e => setAlertType(e.target.value)}>
              <option value="daily_spend">Gasto Diario</option>
              <option value="total_spend">Gasto Total (30d)</option>
            </select>
            <input
              type="number"
              step="0.01"
              min="0"
              value={alertThreshold}
              onChange={e => setAlertThreshold(e.target.value)}
              placeholder="Limite (R$)"
            />
            <input
              type="text"
              value={alertCampaignId}
              onChange={e => setAlertCampaignId(e.target.value)}
              placeholder="Campaign ID (vazio = conta)"
            />
            <button type="submit" className="mads-btn primary small">Adicionar</button>
          </form>

          {alerts.length > 0 && (
            <div className="mads-alerts-list">
              {alerts.map(a => (
                <div key={a.id} className={`mads-alert-item ${a.active ? '' : 'inactive'}`}>
                  <div className="mads-alert-info">
                    <span className="mads-alert-type">
                      {a.alert_type === 'daily_spend' ? 'Diario' : 'Total 30d'}
                    </span>
                    <span className="mads-alert-threshold">R$ {a.threshold.toFixed(2)}</span>
                    {a.campaign_id && <span className="mads-alert-campaign">Camp: {a.campaign_id}</span>}
                    {a.last_triggered && (
                      <span className="mads-alert-triggered">
                        Disparado: {new Date(a.last_triggered).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="mads-alert-actions">
                    <button
                      className={`mads-btn-text ${a.active ? '' : 'success'}`}
                      onClick={() => handleToggleAlert(a)}
                    >
                      {a.active ? 'Desativar' : 'Ativar'}
                    </button>
                    <button className="mads-btn-text danger" onClick={() => handleDeleteAlert(a.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
