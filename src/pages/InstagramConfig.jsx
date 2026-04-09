import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { useOrg } from '../context/OrgContext';
import { instagram, metaAds, metaOAuth } from '../services/api';
import './InstagramScheduling.css';
import './MetaAdsConfig.css';
import './InstagramConfig.css';

/* ── SVG Icons ── */
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconWifi = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0114 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
);

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconKey = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconLink = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const IconToggle = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {active
      ? <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></>
      : <><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="8" cy="12" r="3" fill="currentColor"/></>
    }
  </svg>
);

const IconFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function InstagramConfig({ configuredProp, onConfigChange }) {
  const toast = useToast();
  const { currentOrg } = useOrg();

  const [configured, setConfigured] = useState(configuredProp ?? null);
  const [hasToken, setHasToken] = useState(false);
  const [igReason, setIgReason] = useState(''); // "no_pages" | "no_ig_linked" | ""
  const [igAccounts, setIgAccounts] = useState([]); // multiple IG accounts found
  const [configSource, setConfigSource] = useState('');
  const [configAccountIdDisplay, setConfigAccountIdDisplay] = useState('');
  const [adAccountIdDisplay, setAdAccountIdDisplay] = useState('');
  const [businessIdDisplay, setBusinessIdDisplay] = useState('');

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showManualSetup, setShowManualSetup] = useState(false);

  // OAuth
  const [oauthLoading, setOauthLoading] = useState(false);

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

  // Auto-open manual setup when token exists but account ID is missing
  useEffect(() => {
    if (hasToken && !configured) setShowManualSetup(true);
  }, [hasToken, configured]);

  const checkConfig = async () => {
    try {
      const data = await instagram.getConfig();
      setConfigured(data.configured);
      setHasToken(data.has_token || false);
      setConfigSource(data.source || '');
      setConfigAccountIdDisplay(data.account_id || '');
      setAdAccountIdDisplay(data.ad_account_id || '');
      setBusinessIdDisplay(data.business_id || '');
      onConfigChange?.(data.configured);
    } catch {
      setConfigured(false);
      setHasToken(false);
      onConfigChange?.(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!configured && !hasToken && (!configAccountId.trim() || !configAccessToken.trim())) {
      toast.warning('Preencha Account ID e Access Token');
      return;
    }
    if (!configured && hasToken && !configAccountId.trim()) {
      toast.warning('Preencha o Instagram Account ID');
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

  const handleSelectIgAccount = async (account) => {
    setSavingConfig(true);
    try {
      await instagram.saveConfig({
        instagram_account_id: account.ig_account_id,
        business_id: account.page_id,
      });
      toast.success(`Conta @${account.page_name} configurada!`);
      setIgAccounts([]);
      await checkConfig();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar conta selecionada');
    } finally {
      setSavingConfig(false);
    }
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

  // ── OAuth: Conectar com Facebook ──
  const handleConnectFacebook = async () => {
    if (!currentOrg?.id) {
      toast.error('Nenhuma organizacao selecionada');
      return;
    }
    setOauthLoading(true);
    try {
      const data = await metaOAuth.getOAuthURL(currentOrg.id);
      const popup = window.open(data.url, 'meta_oauth', 'width=600,height=700,scrollbars=yes');
      if (!popup) {
        toast.error('Popup bloqueado. Permita popups para este site.');
        return;
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao iniciar conexao');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleOAuthMessage = useCallback((event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== 'META_OAUTH_RESULT') return;
    if (event.data.success) {
      if (event.data.needs_selection && event.data.ig_accounts?.length > 1) {
        setIgAccounts(event.data.ig_accounts);
        toast.success(`Conectado! ${event.data.ig_accounts.length} contas Instagram encontradas — escolha qual usar.`);
      } else if (event.data.needs_manual_config) {
        setIgReason(event.data.ig_reason || '');
        if (event.data.ig_reason === 'no_pages') {
          toast.warning('Conectado! Voce nao possui uma Pagina do Facebook. Crie uma e vincule ao Instagram.');
        } else if (event.data.ig_reason === 'no_ig_linked') {
          toast.warning('Conectado! Suas Paginas do Facebook nao tem Instagram Business vinculado.');
        } else {
          toast.warning('Conectado! Configure o Instagram Account ID manualmente.');
        }
        setShowManualSetup(true);
      } else {
        toast.success('Conta Meta conectada com sucesso!');
      }
      // Toast about ad accounts found
      const adCount = event.data.ad_accounts_count || event.data.ad_accounts?.length || 0;
      if (adCount > 1) {
        toast.success(`${adCount} contas de anuncios encontradas. Use o seletor para alternar entre elas.`);
      } else if (adCount === 1) {
        toast.success('1 conta de anuncios configurada.');
      }
      checkConfig();
    } else {
      toast.error(event.data.error || 'Falha na conexao com Facebook');
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [handleOAuthMessage]);

  if (configured === null) {
    return (
      <div className="igcfg-loading">
        <span className="ig-spinner" />
        Verificando configuracao...
      </div>
    );
  }

  /* ── Info box (shared) ── */
  const renderInfoBox = () => (
    <>
      <button
        type="button"
        className="igcfg-info-toggle"
        onClick={() => setShowInfo(!showInfo)}
      >
        <IconChevron open={showInfo} /> Onde encontrar cada ID?
      </button>

      {showInfo && (
        <div className="igcfg-info-box">
          <div className="igcfg-info-item">
            <strong>Instagram Account ID</strong>
            <span><a href="https://business.facebook.com/settings/instagram-account" target="_blank" rel="noopener noreferrer">Business Settings &gt; Instagram Accounts <IconLink /></a> &mdash; ID numerico da conta</span>
          </div>
          <div className="igcfg-info-item">
            <strong>Access Token</strong>
            <span><a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer">Business Settings &gt; System Users <IconLink /></a> &mdash; Token permanente</span>
          </div>
          <div className="igcfg-info-item">
            <strong>Ad Account ID</strong>
            <span><a href="https://adsmanager.facebook.com" target="_blank" rel="noopener noreferrer">Ads Manager <IconLink /></a> &mdash; ID abaixo do nome (ex: <code>act_123456789</code>)</span>
          </div>
          <div className="igcfg-info-item">
            <strong>Business ID</strong>
            <span><a href="https://business.facebook.com/settings/info" target="_blank" rel="noopener noreferrer">Business Settings &gt; Business Info <IconLink /></a> &mdash; ID exibido na pagina</span>
          </div>
        </div>
      )}
    </>
  );

  // ─── CONFIGURED STATE ───
  if (configured) {
    return (
      <div className="igcfg">
        {/* Status + Credentials Card */}
        <div className="igcfg-section">
          <div className="igcfg-section-header">
            <div className="igcfg-section-icon igcfg-section-icon--green">
              <IconShield />
            </div>
            <div>
              <h3 className="igcfg-section-title">Credenciais</h3>
              <p className="igcfg-section-sub">Conexao com Instagram e Meta Ads</p>
            </div>
            {!editing && (
              <button className="igcfg-header-btn" onClick={() => {
                setAdAccountId(adAccountIdDisplay);
                setBusinessId(businessIdDisplay);
                setConfigAccountId(configAccountIdDisplay);
                setConfigAccessToken('');
                setEditing(true);
              }}>
                <IconEdit /> Editar
              </button>
            )}
          </div>

          {!editing ? (
            <>
              {/* Status badge */}
              <div className="igcfg-status-strip">
                <span className="igcfg-connected-badge">
                  <span className="igcfg-connected-dot" /> Conectado
                </span>
                <span className="igcfg-source-badge">
                  {configSource === 'user' ? 'Banco de dados' : 'Variaveis de ambiente'}
                </span>
              </div>

              {/* Detail grid */}
              <div className="igcfg-detail-grid">
                <div className="igcfg-detail-card">
                  <span className="igcfg-detail-label">Instagram Account ID</span>
                  <span className="igcfg-detail-value">{configAccountIdDisplay}</span>
                </div>
                <div className="igcfg-detail-card">
                  <span className="igcfg-detail-label">Ad Account ID</span>
                  <span className="igcfg-detail-value" style={!adAccountIdDisplay ? { color: '#52525b' } : undefined}>
                    {adAccountIdDisplay || 'Nao configurado'}
                  </span>
                </div>
                {businessIdDisplay && (
                  <div className="igcfg-detail-card">
                    <span className="igcfg-detail-label">Business ID</span>
                    <span className="igcfg-detail-value">{businessIdDisplay}</span>
                  </div>
                )}
                <div className="igcfg-detail-card">
                  <span className="igcfg-detail-label">Access Token</span>
                  <span className="igcfg-detail-value igcfg-detail-masked">{'*'.repeat(24)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="igcfg-actions-row">
                <button className="igcfg-action-btn igcfg-action-btn--primary" onClick={handleTestConnection} disabled={testLoading}>
                  <IconWifi /> {testLoading ? 'Testando...' : 'Testar conexao'}
                </button>
                <button className="igcfg-action-btn igcfg-action-btn--secondary" onClick={handleLoadFeed} disabled={feedLoading}>
                  <IconGrid /> {feedLoading ? 'Carregando...' : 'Ver feed'}
                </button>
                <button className="igcfg-action-btn igcfg-action-btn--secondary" onClick={handleConnectFacebook} disabled={oauthLoading}>
                  <IconFacebook /> {oauthLoading ? 'Abrindo...' : 'Reconectar'}
                </button>
                {configSource === 'user' && (
                  <button className="igcfg-action-btn igcfg-action-btn--danger" onClick={handleDeleteConfig}>
                    <IconTrash /> Remover
                  </button>
                )}
              </div>
            </>
          ) : (
            /* ─── Edit mode ─── */
            <div className="igcfg-edit-form">
              <p className="igcfg-edit-hint">
                Altere os campos desejados. O Access Token so e atualizado se preenchido.
              </p>

              {renderInfoBox()}

              <div className="igcfg-form-grid">
                <div className="igcfg-field">
                  <label>Ad Account ID</label>
                  <input
                    type="text"
                    value={adAccountId}
                    onChange={(e) => setAdAccountId(e.target.value)}
                    placeholder={adAccountIdDisplay || 'Ex: 123456789 ou act_123456789'}
                  />
                </div>
                <div className="igcfg-field">
                  <label>Business ID</label>
                  <input
                    type="text"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    placeholder={businessIdDisplay || 'ID da pagina do Facebook (opcional)'}
                  />
                </div>
                <div className="igcfg-field">
                  <label>Instagram Account ID</label>
                  <input
                    type="text"
                    value={configAccountId}
                    onChange={(e) => setConfigAccountId(e.target.value)}
                    placeholder="Ex: 17841473285320059"
                  />
                </div>
                <div className="igcfg-field">
                  <label>Access Token</label>
                  <input
                    type="password"
                    value={configAccessToken}
                    onChange={(e) => setConfigAccessToken(e.target.value)}
                    placeholder="Deixe vazio para manter o atual"
                  />
                </div>
              </div>

              <div className="igcfg-actions-row">
                <button
                  className="igcfg-action-btn igcfg-action-btn--primary"
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                >
                  <IconCheck /> {savingConfig ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="igcfg-action-btn igcfg-action-btn--secondary" onClick={handleCancelEdit} disabled={savingConfig}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`igcfg-test-result ${testResult.success ? 'igcfg-test-result--ok' : 'igcfg-test-result--err'}`}>
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
                  <div className="igcfg-test-ads">
                    <div className="igcfg-test-ads-badge">Meta Ads OK</div>
                    <div className="igcfg-test-ads-details">
                      <span>Conta: {testResult.ads_account.name}</span>
                      <span>Moeda: {testResult.ads_account.currency}</span>
                      <span>Timezone: {testResult.ads_account.timezone_name}</span>
                      <span>Gasto: {testResult.ads_account.amount_spent}</span>
                    </div>
                  </div>
                )}
                {testResult.ads_account_error && (
                  <div className="igcfg-test-ads igcfg-test-ads--err">
                    <div className="igcfg-test-ads-badge igcfg-test-ads-badge--err">Meta Ads: erro</div>
                    <p className="igcfg-test-ads-error">
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
                <p className="igcfg-test-ads-error">
                  {typeof testResult.error === 'string' ? testResult.error : JSON.stringify(testResult.error)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feed */}
        {feed.length > 0 && (
          <div className="igcfg-section">
            <div className="igcfg-section-header">
              <div className="igcfg-section-icon igcfg-section-icon--purple">
                <IconGrid />
              </div>
              <div>
                <h3 className="igcfg-section-title">Feed recente</h3>
                <p className="igcfg-section-sub">{feed.length} posts</p>
              </div>
            </div>
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
          <div className="igcfg-section">
            <div className="igcfg-section-header">
              <div className="igcfg-section-icon igcfg-section-icon--yellow">
                <IconBell />
              </div>
              <div>
                <h3 className="igcfg-section-title">Alertas de Orcamento</h3>
                <p className="igcfg-section-sub">Receba avisos quando o gasto atingir o limite</p>
              </div>
            </div>

            <form onSubmit={handleAddAlert} className="igcfg-alert-form">
              <div className="igcfg-alert-form-fields">
                <select value={alertType} onChange={e => setAlertType(e.target.value)} className="igcfg-select">
                  <option value="daily_spend">Gasto Diario</option>
                  <option value="total_spend">Gasto Total (30d)</option>
                </select>
                <div className="igcfg-field-inline">
                  <span className="igcfg-field-prefix">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={alertThreshold}
                    onChange={e => setAlertThreshold(e.target.value)}
                    placeholder="Limite"
                  />
                </div>
                <input
                  type="text"
                  value={alertCampaignId}
                  onChange={e => setAlertCampaignId(e.target.value)}
                  placeholder="Campaign ID (vazio = conta)"
                  className="igcfg-alert-campaign-input"
                />
              </div>
              <button type="submit" className="igcfg-action-btn igcfg-action-btn--primary igcfg-action-btn--sm">
                <IconPlus /> Adicionar
              </button>
            </form>

            {alerts.length > 0 && (
              <div className="igcfg-alerts-list">
                {alerts.map(a => (
                  <div key={a.id} className={`igcfg-alert-item ${a.active ? '' : 'igcfg-alert-item--off'}`}>
                    <div className="igcfg-alert-info">
                      <span className="igcfg-alert-type-badge">
                        {a.alert_type === 'daily_spend' ? 'Diario' : 'Total 30d'}
                      </span>
                      <span className="igcfg-alert-threshold">R$ {a.threshold.toFixed(2)}</span>
                      {a.campaign_id && <span className="igcfg-alert-campaign">Camp: {a.campaign_id}</span>}
                      {a.last_triggered && (
                        <span className="igcfg-alert-triggered">
                          Disparado: {new Date(a.last_triggered).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="igcfg-alert-actions">
                      <button
                        className={`igcfg-alert-toggle-btn ${a.active ? 'igcfg-alert-toggle-btn--on' : 'igcfg-alert-toggle-btn--off'}`}
                        onClick={() => handleToggleAlert(a)}
                        title={a.active ? 'Desativar' : 'Ativar'}
                      >
                        <IconToggle active={a.active} />
                      </button>
                      <button className="igcfg-alert-delete-btn" onClick={() => handleDeleteAlert(a.id)} title="Excluir">
                        <IconTrash />
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

  // ─── NOT CONFIGURED STATE ───
  return (
    <div className="igcfg">
      {/* OAuth connect */}
      <div className="igcfg-section">
        <div className="igcfg-section-header">
          <div className="igcfg-section-icon igcfg-section-icon--blue">
            <IconKey />
          </div>
          <div>
            <h3 className="igcfg-section-title">Conectar conta</h3>
            <p className="igcfg-section-sub">Conecte sua conta do Facebook para configurar tudo automaticamente</p>
          </div>
        </div>

        <div className="igcfg-oauth-area">
          {hasToken ? (
            <div className="igcfg-info-box" style={{ borderColor: '#854d0e', background: 'rgba(250, 204, 21, 0.06)' }}>
              {igReason === 'no_pages' ? (
                <>
                  <p style={{ color: '#facc15', margin: '0 0 8px', fontWeight: 600 }}>
                    Token salvo, mas voce nao possui uma Pagina do Facebook.
                  </p>
                  <p style={{ color: '#a1a1aa', margin: '0 0 10px', fontSize: 13 }}>
                    O Instagram Business precisa estar vinculado a uma Pagina do Facebook (nao ao perfil pessoal). Para resolver:
                  </p>
                  <ol style={{ color: '#d4d4d8', margin: '0 0 10px', paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
                    <li>Crie uma <a href="https://www.facebook.com/pages/create" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>Pagina do Facebook</a> para seu negocio</li>
                    <li>No Instagram, va em <strong>Configuracoes &gt; Conta &gt; Paginas vinculadas</strong> e conecte a Pagina que criou</li>
                    <li>Certifique-se de que a conta Instagram e <strong>Business</strong> ou <strong>Creator</strong> (nao pessoal)</li>
                    <li>Volte aqui e clique em <strong>Reconectar com Facebook</strong></li>
                  </ol>
                </>
              ) : igReason === 'no_ig_linked' ? (
                <>
                  <p style={{ color: '#facc15', margin: '0 0 8px', fontWeight: 600 }}>
                    Token salvo, mas nenhuma Pagina tem Instagram Business vinculado.
                  </p>
                  <p style={{ color: '#a1a1aa', margin: '0 0 10px', fontSize: 13 }}>
                    Encontramos suas Paginas do Facebook, mas nenhuma tem uma conta Instagram Business conectada. Para resolver:
                  </p>
                  <ol style={{ color: '#d4d4d8', margin: '0 0 10px', paddingLeft: 20, fontSize: 13, lineHeight: 1.7 }}>
                    <li>Abra o <a href="https://www.instagram.com/accounts/convert_to_professional_account/" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>Instagram</a> e converta para conta <strong>Business</strong> ou <strong>Creator</strong> (se ainda for pessoal)</li>
                    <li>No Instagram, va em <strong>Configuracoes &gt; Conta &gt; Paginas vinculadas</strong> e conecte sua Pagina do Facebook</li>
                    <li>Volte aqui e clique em <strong>Reconectar com Facebook</strong></li>
                  </ol>
                </>
              ) : (
                <>
                  <p style={{ color: '#facc15', margin: '0 0 8px', fontWeight: 600 }}>
                    Token salvo, mas nao foi possivel detectar a conta Instagram automaticamente.
                  </p>
                </>
              )}
              <p style={{ color: '#71717a', margin: 0, fontSize: 12 }}>
                Ou preencha o Instagram Account ID manualmente abaixo se ja souber.
              </p>
            </div>
          ) : (
            <p className="igcfg-oauth-desc">
              Ao conectar, buscaremos automaticamente sua conta Instagram Business,
              conta de anuncios e token de acesso. Sem precisar copiar nada manualmente.
            </p>
          )}
          <button
            className="igcfg-facebook-btn"
            onClick={handleConnectFacebook}
            disabled={oauthLoading}
          >
            <IconFacebook />
            {oauthLoading ? 'Abrindo...' : hasToken ? 'Reconectar com Facebook' : 'Conectar com Facebook'}
          </button>
        </div>

        {/* Account selection (multiple IG accounts) */}
        {igAccounts.length > 1 && (
          <div className="igcfg-section" style={{ marginTop: 16 }}>
            <div className="igcfg-section-header">
              <div className="igcfg-section-icon igcfg-section-icon--purple">
                <IconGrid />
              </div>
              <div>
                <h3 className="igcfg-section-title">Escolha a conta Instagram</h3>
                <p className="igcfg-section-sub">{igAccounts.length} contas encontradas — a primeira foi salva automaticamente</p>
              </div>
            </div>
            <div className="igcfg-detail-grid">
              {igAccounts.map((acc) => (
                <button
                  key={acc.ig_account_id}
                  className="igcfg-detail-card"
                  style={{ cursor: 'pointer', border: '1px solid #3f3f46', textAlign: 'left', background: 'transparent' }}
                  onClick={() => handleSelectIgAccount(acc)}
                  disabled={savingConfig}
                >
                  <span className="igcfg-detail-label">{acc.page_name}</span>
                  <span className="igcfg-detail-value" style={{ fontSize: 12 }}>ID: {acc.ig_account_id}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual fallback */}
        <div className="igcfg-manual-fallback">
          <button
            type="button"
            className="igcfg-info-toggle"
            onClick={() => setShowManualSetup(!showManualSetup)}
          >
            <IconChevron open={showManualSetup} /> Configurar manualmente
          </button>

          {showManualSetup && (
            <div className="igcfg-edit-form" style={{ marginTop: 12 }}>
              {renderInfoBox()}

              <div className="igcfg-form-grid">
                <div className="igcfg-field">
                  <label>Instagram Account ID {hasToken && <span style={{ color: '#f87171', fontSize: 11 }}>(obrigatorio)</span>}</label>
                  <input
                    type="text"
                    value={configAccountId}
                    onChange={(e) => setConfigAccountId(e.target.value)}
                    placeholder="Ex: 17841473285320059"
                    style={hasToken ? { borderColor: '#a78bfa' } : undefined}
                  />
                </div>
                {!hasToken && (
                  <div className="igcfg-field">
                    <label>Access Token</label>
                    <input
                      type="password"
                      value={configAccessToken}
                      onChange={(e) => setConfigAccessToken(e.target.value)}
                      placeholder="Token do Meta Business Suite"
                    />
                  </div>
                )}
                <div className="igcfg-field">
                  <label>Ad Account ID (opcional)</label>
                  <input
                    type="text"
                    value={adAccountId}
                    onChange={(e) => setAdAccountId(e.target.value)}
                    placeholder="Ex: 123456789 ou act_123456789"
                  />
                </div>
                <div className="igcfg-field">
                  <label>Business ID (opcional)</label>
                  <input
                    type="text"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    placeholder="ID da pagina do Facebook"
                  />
                </div>
              </div>

              <button
                className="igcfg-action-btn igcfg-action-btn--primary"
                onClick={handleSaveConfig}
                disabled={savingConfig || !configAccountId.trim() || (!hasToken && !configAccessToken.trim())}
              >
                <IconCheck /> {savingConfig ? 'Salvando...' : 'Salvar configuracao'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
