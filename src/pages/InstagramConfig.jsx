import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { instagram, metaAds } from '../services/api';
import './InstagramScheduling.css';
import './MetaAdsConfig.css';
import './InstagramConfig.css';

export default function InstagramConfig({ configuredProp, onConfigChange }) {
  const toast = useToast();

  const [configured, setConfigured] = useState(configuredProp ?? null);
  const [configSource, setConfigSource] = useState('');
  const [configAccountIdDisplay, setConfigAccountIdDisplay] = useState('');
  const [adAccountIdDisplay, setAdAccountIdDisplay] = useState('');
  const [businessIdDisplay, setBusinessIdDisplay] = useState('');

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Config form
  const [configAccountId, setConfigAccountId] = useState('');
  const [configAccessToken, setConfigAccessToken] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Test connection
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Feed
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Budget alerts
  const [alerts, setAlerts] = useState([]);
  const [alertType, setAlertType] = useState('daily_spend');
  const [alertThreshold, setAlertThreshold] = useState('');
  const [alertCampaignId, setAlertCampaignId] = useState('');

  useEffect(() => {
    checkConfig();
  }, []);

  useEffect(() => {
    if (configured) loadAlerts();
  }, [configured]);

  const checkConfig = async () => {
    try {
      const data = await instagram.getConfig();
      setConfigured(data.configured);
      setConfigSource(data.source || '');
      setConfigAccountIdDisplay(data.account_id || '');
      setAdAccountIdDisplay(data.ad_account_id || '');
      setBusinessIdDisplay(data.business_id || '');
      onConfigChange?.(data.configured);
    } catch {
      setConfigured(false);
      onConfigChange?.(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!configured && (!configAccountId.trim() || !configAccessToken.trim())) {
      toast.warning('Preencha Account ID e Access Token');
      return;
    }
    if (configured) {
      const hasChange =
        (configAccountId.trim() && configAccountId.trim() !== configAccountIdDisplay) ||
        configAccessToken.trim() ||
        adAccountId.trim() !== adAccountIdDisplay ||
        businessId.trim() !== businessIdDisplay;
      if (!hasChange) {
        toast.warning('Nenhum campo foi alterado');
        return;
      }
    }
    setSavingConfig(true);
    try {
      const payload = {};
      // Only send fields that changed from current values
      if (configAccountId.trim() && configAccountId.trim() !== configAccountIdDisplay)
        payload.instagram_account_id = configAccountId.trim();
      if (configAccessToken.trim())
        payload.access_token = configAccessToken.trim();
      if (adAccountId.trim() !== adAccountIdDisplay)
        payload.ad_account_id = adAccountId.trim();
      if (businessId.trim() !== businessIdDisplay)
        payload.business_id = businessId.trim();

      await instagram.saveConfig(payload);
      toast.success('Configuracao salva!');
      setConfigAccountId('');
      setConfigAccessToken('');
      setAdAccountId('');
      setBusinessId('');
      setEditing(false);
      await checkConfig();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar configuracao');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setConfigAccountId('');
    setConfigAccessToken('');
    setAdAccountId('');
    setBusinessId('');
  };

  const handleDeleteConfig = async () => {
    try {
      await instagram.deleteConfig();
      toast.success('Configuracao removida');
      setTestResult(null);
      setFeed([]);
      setAlerts([]);
      setEditing(false);
      await checkConfig();
    } catch (err) {
      toast.error(err.message || 'Erro ao remover configuracao');
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const data = await instagram.testConnection();
      setTestResult(data);
      if (data.success) {
        toast.success(`Conectado: @${data.username}`);
      } else {
        toast.error('Falha na conexao');
      }
    } catch (err) {
      setTestResult({ success: false, error: err.message });
      toast.error(err.message || 'Erro ao testar conexao');
    } finally {
      setTestLoading(false);
    }
  };

  const handleLoadFeed = async () => {
    setFeedLoading(true);
    try {
      const data = await instagram.getFeed(12);
      setFeed(data.data || []);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar feed');
    } finally {
      setFeedLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await metaAds.listAlerts();
      setAlerts(data || []);
    } catch { /* ignore */ }
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
      toast.error(err.message || 'Erro ao criar alerta');
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await metaAds.deleteAlert(id);
      loadAlerts();
    } catch (err) {
      toast.error(err.message || 'Erro ao remover alerta');
    }
  };

  const handleToggleAlert = async (alert) => {
    try {
      await metaAds.updateAlert(alert.id, { active: !alert.active });
      loadAlerts();
    } catch (err) {
      toast.error(err.message || 'Erro ao atualizar alerta');
    }
  };

  if (configured === null) {
    return (
      <div className="igcfg-loading">
        <span className="ig-spinner" />
        Verificando configuracao...
      </div>
    );
  }

  // ─── Configured: card com status + editar inline ───
  if (configured) {
    return (
      <div className="igcfg">
        <div className="mads-config-section">
          <div className="igcfg-card-header">
            <h3>Configuracao</h3>
            {!editing && (
              <button className="mads-btn secondary small" onClick={() => {
                setAdAccountId(adAccountIdDisplay);
                setBusinessId(businessIdDisplay);
                setConfigAccountId(configAccountIdDisplay);
                setConfigAccessToken('');
                setEditing(true);
              }}>
                Editar
              </button>
            )}
          </div>

          {/* Status rows */}
          {!editing ? (
            <div className="igcfg-status-info">
              <div className="igcfg-badge igcfg-badge-ok">Configurado</div>
              <div className="igcfg-detail-row">
                <span className="igcfg-detail-label">Instagram Account ID:</span>
                <span className="igcfg-detail-value">{configAccountIdDisplay}</span>
              </div>
              <div className="igcfg-detail-row">
                <span className="igcfg-detail-label">Fonte:</span>
                <span className="igcfg-detail-value">
                  {configSource === 'user' ? 'Banco de dados' : 'Variaveis de ambiente'}
                </span>
              </div>
              <div className="igcfg-detail-row">
                <span className="igcfg-detail-label">Ad Account ID:</span>
                <span className="igcfg-detail-value" style={!adAccountIdDisplay ? { color: '#71717a' } : undefined}>
                  {adAccountIdDisplay || 'Nao configurado'}
                </span>
              </div>
              {businessIdDisplay && (
                <div className="igcfg-detail-row">
                  <span className="igcfg-detail-label">Business ID:</span>
                  <span className="igcfg-detail-value">{businessIdDisplay}</span>
                </div>
              )}

              <div className="mads-config-actions" style={{ marginTop: '0.75rem' }}>
                <button className="mads-btn primary small" onClick={handleTestConnection} disabled={testLoading}>
                  {testLoading ? 'Testando...' : 'Testar conexao'}
                </button>
                <button className="mads-btn secondary small" onClick={handleLoadFeed} disabled={feedLoading}>
                  {feedLoading ? 'Carregando...' : 'Ver feed'}
                </button>
                {configSource === 'user' && (
                  <button className="mads-btn-text danger" onClick={handleDeleteConfig}>
                    Remover
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ─── Edit mode inline ─── */
            <div className="igcfg-edit-form">
              <p className="mads-config-hint" style={{ margin: '0 0 1rem' }}>
                Altere os campos desejados. O Access Token so e atualizado se preenchido.
              </p>

              <button
                type="button"
                className="igcfg-info-toggle"
                onClick={() => setShowInfo(!showInfo)}
              >
                {showInfo ? '▾' : '▸'} Onde encontrar cada ID?
              </button>

              {showInfo && (
                <div className="igcfg-info-box">
                  <div className="igcfg-info-item">
                    <strong>Ad Account ID</strong>
                    <span>Abra o <a href="https://adsmanager.facebook.com" target="_blank" rel="noopener noreferrer">Ads Manager</a> &gt; Dropdown no topo &gt; ID abaixo do nome (ex: <code>act_123456789</code>)</span>
                    <span>Ou: <a href="https://business.facebook.com/settings/ad-accounts" target="_blank" rel="noopener noreferrer">Business Settings &gt; Ad Accounts</a></span>
                  </div>
                  <div className="igcfg-info-item">
                    <strong>Business ID</strong>
                    <span><a href="https://business.facebook.com/settings/info" target="_blank" rel="noopener noreferrer">Business Settings &gt; Business Info</a> &gt; ID exibido na pagina</span>
                  </div>
                  <div className="igcfg-info-item">
                    <strong>Instagram Account ID</strong>
                    <span><a href="https://business.facebook.com/settings/instagram-account" target="_blank" rel="noopener noreferrer">Business Settings &gt; Instagram Accounts</a> &gt; ID numerico da conta</span>
                  </div>
                  <div className="igcfg-info-item">
                    <strong>Access Token</strong>
                    <span><a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer">Business Settings &gt; System Users</a> &gt; Gerar token (permanente, nao expira)</span>
                  </div>
                </div>
              )}

              <div className="mads-field">
                <label>Ad Account ID</label>
                <input
                  type="text"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  placeholder={adAccountIdDisplay || 'Ex: 123456789 ou act_123456789'}
                />
              </div>
              <div className="mads-field">
                <label>Business ID</label>
                <input
                  type="text"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder={businessIdDisplay || 'ID da pagina do Facebook (opcional)'}
                />
              </div>

              <div className="igcfg-edit-divider" />

              <div className="mads-field">
                <label>Instagram Account ID</label>
                <input
                  type="text"
                  value={configAccountId}
                  onChange={(e) => setConfigAccountId(e.target.value)}
                  placeholder="Ex: 17841473285320059"
                />
              </div>
              <div className="mads-field">
                <label>Access Token</label>
                <input
                  type="password"
                  value={configAccessToken}
                  onChange={(e) => setConfigAccessToken(e.target.value)}
                  placeholder="Deixe vazio para manter o atual"
                />
              </div>

              <div className="mads-config-actions" style={{ marginTop: '0.5rem' }}>
                <button
                  className="mads-btn primary"
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                >
                  {savingConfig ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="mads-btn secondary" onClick={handleCancelEdit} disabled={savingConfig}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`mads-test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? (
              <>
                <div className="ig-test-profile">
                  {testResult.profile_picture_url && (
                    <img src={testResult.profile_picture_url} alt="" className="ig-test-avatar" />
                  )}
                  <div className="ig-test-info">
                    <strong>@{testResult.username}</strong>
                    {testResult.name && <span className="ig-test-name">{testResult.name}</span>}
                    <div className="ig-test-stats">
                      <span>{testResult.followers_count?.toLocaleString('pt-BR') || 0} seguidores</span>
                      <span>{testResult.media_count?.toLocaleString('pt-BR') || 0} posts</span>
                    </div>
                  </div>
                </div>
                {testResult.ads_account && (
                  <div className="igcfg-ads-test">
                    <strong>Meta Ads OK</strong>
                    <div className="mads-test-details">
                      <span>Conta: {testResult.ads_account.name}</span>
                      <span>Moeda: {testResult.ads_account.currency}</span>
                      <span>Timezone: {testResult.ads_account.timezone_name}</span>
                      <span>Gasto: {testResult.ads_account.amount_spent}</span>
                    </div>
                  </div>
                )}
                {testResult.ads_account_error && (
                  <div className="igcfg-ads-test error">
                    <strong>Meta Ads: erro</strong>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
                      {typeof testResult.ads_account_error === 'string'
                        ? testResult.ads_account_error
                        : JSON.stringify(testResult.ads_account_error)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <strong>Falha na conexao</strong>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
                  {typeof testResult.error === 'string' ? testResult.error : JSON.stringify(testResult.error)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feed */}
        {feed.length > 0 && (
          <div className="mads-config-section">
            <h3>Feed recente ({feed.length} posts)</h3>
            <div className="ig-feed-grid">
              {feed.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ig-feed-item"
                >
                  <img
                    src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                    alt=""
                  />
                  {post.media_type === 'CAROUSEL_ALBUM' && (
                    <span className="ig-feed-item-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h2v12H4V6zm14 0h2v12h-2V6zm-4-2H10a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/></svg>
                    </span>
                  )}
                  {post.media_type === 'VIDEO' && (
                    <span className="ig-feed-item-badge">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </span>
                  )}
                  <div className="ig-feed-item-overlay">
                    {post.like_count != null && <span>&#9829; {post.like_count}</span>}
                    {post.comments_count != null && <span>&#128172; {post.comments_count}</span>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Budget Alerts */}
        {adAccountIdDisplay && (
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

  // ─── Not configured: full setup form ───
  return (
    <div className="igcfg">
      <div className="mads-config-section">
        <h3>Configurar credenciais</h3>
        <p className="mads-config-hint">
          Necessario: <code>instagram_basic</code>, <code>instagram_content_publish</code>.
          Para Meta Ads, tambem: <code>ads_management</code>, <code>ads_read</code>.
          Use o mesmo token do Meta Business Suite para ambos.
        </p>

        <div className="mads-config-form">
          <button
            type="button"
            className="igcfg-info-toggle"
            onClick={() => setShowInfo(!showInfo)}
          >
            {showInfo ? '▾' : '▸'} Onde encontrar cada ID?
          </button>

          {showInfo && (
            <div className="igcfg-info-box">
              <div className="igcfg-info-item">
                <strong>Instagram Account ID</strong>
                <span><a href="https://business.facebook.com/settings/instagram-account" target="_blank" rel="noopener noreferrer">Business Settings &gt; Instagram Accounts</a> &gt; ID numerico da conta</span>
              </div>
              <div className="igcfg-info-item">
                <strong>Access Token</strong>
                <span><a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer">Business Settings &gt; System Users</a> &gt; Gerar token (permanente, nao expira)</span>
              </div>
              <div className="igcfg-info-item">
                <strong>Ad Account ID</strong>
                <span>Abra o <a href="https://adsmanager.facebook.com" target="_blank" rel="noopener noreferrer">Ads Manager</a> &gt; Dropdown no topo &gt; ID abaixo do nome (ex: <code>act_123456789</code>)</span>
                <span>Ou: <a href="https://business.facebook.com/settings/ad-accounts" target="_blank" rel="noopener noreferrer">Business Settings &gt; Ad Accounts</a></span>
              </div>
              <div className="igcfg-info-item">
                <strong>Business ID</strong>
                <span><a href="https://business.facebook.com/settings/info" target="_blank" rel="noopener noreferrer">Business Settings &gt; Business Info</a> &gt; ID exibido na pagina</span>
              </div>
            </div>
          )}

          <div className="mads-field">
            <label>Instagram Account ID</label>
            <input
              type="text"
              value={configAccountId}
              onChange={(e) => setConfigAccountId(e.target.value)}
              placeholder="Ex: 17841473285320059"
            />
          </div>
          <div className="mads-field">
            <label>Access Token</label>
            <input
              type="password"
              value={configAccessToken}
              onChange={(e) => setConfigAccessToken(e.target.value)}
              placeholder="Token do Meta Business Suite"
            />
          </div>

          <div className="igcfg-edit-divider" />

          <div className="mads-field">
            <label>Ad Account ID (opcional)</label>
            <input
              type="text"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              placeholder="Ex: 123456789 ou act_123456789"
            />
          </div>
          <div className="mads-field">
            <label>Business ID (opcional)</label>
            <input
              type="text"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="ID da pagina do Facebook"
            />
          </div>

          <button
            className="mads-btn primary"
            onClick={handleSaveConfig}
            disabled={savingConfig || !configAccountId.trim() || !configAccessToken.trim()}
          >
            {savingConfig ? 'Salvando...' : 'Salvar configuracao'}
          </button>
        </div>
      </div>

      <div className="mads-config-section">
        <h3>Como configurar</h3>

        <h4 style={{ margin: '0.75rem 0 0.5rem', fontSize: '0.9rem', color: '#a1a1aa' }}>
          1. Criar o App (se ainda nao tiver)
        </h4>
        <ol className="igcfg-steps-list">
          <li>Acesse <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer">developers.facebook.com/apps</a></li>
          <li>Crie um App do tipo <strong>Business</strong></li>
          <li>Adicione o produto <strong>API do Instagram com login do Instagram</strong></li>
        </ol>

        <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#a1a1aa' }}>
          2. Gerar Token permanente (nao expira)
        </h4>
        <ol className="igcfg-steps-list">
          <li>Acesse <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer">Business Settings &gt; System Users</a></li>
          <li>Crie um <strong>System User</strong> (tipo Admin) ou use um existente</li>
          <li>Clique em <strong>Adicionar ativos</strong> e atribua:
            <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', listStyle: 'disc' }}>
              <li>Sua <strong>Pagina do Facebook</strong></li>
              <li>Sua <strong>Conta do Instagram</strong></li>
              <li>Sua <strong>Conta de anuncios</strong> (se usar Meta Ads)</li>
              <li>Seu <strong>App</strong></li>
            </ul>
          </li>
          <li>Clique em <strong>Gerar token</strong>, selecione seu App</li>
          <li>Marque as permissoes:
            <ul style={{ margin: '0.25rem 0', paddingLeft: '1.25rem', listStyle: 'disc' }}>
              <li><code>instagram_basic</code></li>
              <li><code>instagram_content_publish</code></li>
              <li><code>instagram_manage_comments</code></li>
              <li><code>instagram_manage_messages</code></li>
              <li><code>pages_show_list</code></li>
              <li><code>pages_read_engagement</code></li>
              <li>Para Meta Ads: <code>ads_management</code>, <code>ads_read</code></li>
            </ul>
          </li>
          <li>Copie o token gerado — <strong>ele nao expira</strong></li>
        </ol>

        <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: '#a1a1aa' }}>
          3. Encontrar o Instagram Account ID
        </h4>
        <ol className="igcfg-steps-list">
          <li>Acesse <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">Graph API Explorer</a></li>
          <li>Cole seu token e faca a requisicao: <code>me/accounts</code></li>
          <li>Pegue o <strong>id</strong> da sua Pagina</li>
          <li>Faca outra requisicao: <code>{'{page_id}'}?fields=instagram_business_account</code></li>
          <li>O <strong>id</strong> retornado e o seu Instagram Account ID</li>
        </ol>
      </div>
    </div>
  );
}
