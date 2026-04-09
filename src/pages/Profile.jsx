import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmModal';
import { profile as profileApi, ai as aiApi, API_URL } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { GeneralTab, AppearanceTab, MembersTab, BillingTab } from './OrgSettings';
import './Profile.css';
import './OrgSettings.css';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
};

export default function Profile() {
  const { profile: authProfile, updateProfile } = useAuth();
  const { hasOrgRole } = useOrg();
  const toast = useToast();
  const confirm = useConfirm();
  const isAdmin = hasOrgRole('owner', 'admin');
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Social links
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');

  // AI Config
  const [aiConfigured, setAiConfigured] = useState(false);
  const [aiProvider, setAiProvider] = useState('gemini');
  const [aiKeyPrefix, setAiKeyPrefix] = useState('');
  const [aiModel, setAiModel] = useState('gemini-2.0-flash');
  const [aiApiKey, setAiApiKey] = useState('');
  const [savingAi, setSavingAi] = useState(false);

  // Settings (localization only — theme/colors moved to org Aparência)
  const [language, setLanguage] = useState('pt-BR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [currency, setCurrency] = useState('BRL');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await profileApi.get();
      setProfileData(data);
      setName(data.name || '');
      setBio(data.bio || '');
      setAvatar(data.avatar || '');
      setCoverImage(data.cover_image || '');

      // Social links
      if (data.social_links) {
        setInstagram(data.social_links.instagram || '');
        setTwitter(data.social_links.twitter || '');
        setLinkedin(data.social_links.linkedin || '');
        setGithub(data.social_links.github || '');
        setWebsite(data.social_links.website || '');
      }

      // Sync with global context
      updateProfile({
        name: data.name,
        bio: data.bio,
        avatar: data.avatar,
        email: data.email,
        role: data.role
      });

      if (data.settings) {
        setLanguage(data.settings.language || 'pt-BR');
        setDateFormat(data.settings.date_format || 'DD/MM/YYYY');
        setCurrency(data.settings.currency || 'BRL');
      }

      // Load AI config
      try {
        const aiData = await aiApi.getConfig();
        setAiConfigured(aiData.configured || false);
        setAiKeyPrefix(aiData.key_prefix || '');
        if (aiData.provider) setAiProvider(aiData.provider);
        if (aiData.model) setAiModel(aiData.model);
      } catch {
        // AI config not available, ignore
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const result = await profileApi.uploadAvatar(file);
      const newAvatar = result.avatar || result.url;
      setAvatar(newAvatar);
      updateProfile({ avatar: newAvatar });
      toast.success('Avatar atualizado com sucesso!', 'Perfil');
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    const ok = await confirm({ title: 'Remover avatar', message: 'Remover avatar?', confirmText: 'Remover', variant: 'danger' });
    if (!ok) return;

    try {
      await profileApi.removeAvatar();
      setAvatar('');
      updateProfile({ avatar: '' });
      toast.success('Avatar removido', 'Perfil');
    } catch (err) {
      toast.error(err.message || 'Erro ao remover avatar');
    }
  };

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const result = await profileApi.uploadCoverImage(file);
      setCoverImage(result.cover_image || '');
      toast.success('Foto de capa atualizada!', 'Perfil');
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar foto de capa');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await Promise.all([
        profileApi.update({
          name,
          bio,
          social_links: { instagram, twitter, linkedin, github, website },
        }),
        profileApi.updateSettings({
          language,
          date_format: dateFormat,
          currency,
        }),
      ]);
      updateProfile({ name, bio });
      toast.success('Perfil atualizado com sucesso!', 'Salvo');
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAIConfig = async (e) => {
    e.preventDefault();
    if (!aiApiKey && !aiConfigured) {
      toast.error('Informe a API key');
      return;
    }
    setSavingAi(true);
    try {
      const payload = { provider: aiProvider, model: aiModel };
      if (aiApiKey) payload.api_key = aiApiKey;
      const res = await aiApi.saveConfig(payload);
      setAiConfigured(true);
      setAiKeyPrefix(res.key_prefix || '');
      if (res.provider) setAiProvider(res.provider);
      setAiApiKey('');
      toast.success('Configuracao de IA salva!', 'IA');
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar configuracao de IA');
    } finally {
      setSavingAi(false);
    }
  };

  const handleDeleteAIConfig = async () => {
    const ok = await confirm({ title: 'Remover configuracao de IA', message: 'Remover configuracao de IA?', confirmText: 'Remover', variant: 'danger' });
    if (!ok) return;
    try {
      await aiApi.deleteConfig();
      setAiConfigured(false);
      setAiKeyPrefix('');
      setAiApiKey('');
      toast.success('Configuracao de IA removida', 'IA');
    } catch (err) {
      toast.error(err.message || 'Erro ao remover configuracao de IA');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSkeleton variant="form" />
      </AdminLayout>
    );
  }

  const navItems = [
    { id: 'profile', label: 'Meu Perfil' },
    { id: 'ai', label: 'Inteligência Artificial' },
    ...(isAdmin ? [
      { divider: true },
      { id: 'org', label: 'Empresa' },
      { id: 'appearance', label: 'Aparência' },
      { id: 'members', label: 'Membros' },
    ] : []),
    { divider: true },
    { id: 'billing', label: 'Plano & Faturamento' },
  ];

  return (
    <AdminLayout>
      <div className="settings-page">
        <div className="settings-page-header">
          <h1>Configurações</h1>
        </div>

        <div className="settings-layout">
          {/* Sidebar nav */}
          <aside className="settings-sidebar">
            {/* User mini-card */}
            <div className="settings-user-card">
              <div className="settings-avatar-wrap">
                {avatar ? (
                  <img src={getImageUrl(avatar)} alt="Avatar" className="settings-avatar-img" />
                ) : (
                  <div className="settings-avatar-placeholder">
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                {uploadingAvatar && <div className="avatar-uploading">...</div>}
              </div>
              <div className="settings-user-info">
                <strong>{name || 'Usuário'}</strong>
                <span>{profileData?.role || authProfile?.role}</span>
              </div>
              <div className="settings-avatar-actions">
                <label className="btn-secondary btn-sm">
                  {uploadingAvatar ? '...' : 'Foto'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    hidden
                  />
                </label>
                {avatar && (
                  <button type="button" className="btn-danger btn-sm" onClick={handleRemoveAvatar}>
                    Remover
                  </button>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="settings-nav">
              {navItems.map((item, i) =>
                item.divider ? (
                  <div key={`d${i}`} className="settings-nav-divider" />
                ) : (
                  <button
                    key={item.id}
                    className={`settings-nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    {item.label}
                  </button>
                )
              )}
            </nav>
          </aside>

          {/* Main content */}
          <main className="settings-main">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="profile-form">
                {/* Cover Banner */}
                <div className="profile-cover-banner">
                  {coverImage ? (
                    <img src={getImageUrl(coverImage)} alt="Capa" className="cover-banner-img" />
                  ) : (
                    <div className="cover-banner-placeholder" />
                  )}
                  <label className="cover-banner-btn">
                    {uploadingCover ? 'Enviando...' : 'Alterar capa'}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCoverImageUpload}
                      disabled={uploadingCover}
                      hidden
                    />
                  </label>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Nome</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                    rows={4}
                  />
                </div>

                <div className="social-links-section">
                  <h4>Redes Sociais</h4>
                  <div className="social-links-grid">
                    <div className="form-group social-input">
                      <label htmlFor="instagram">Instagram</label>
                      <input
                        type="url"
                        id="instagram"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="https://instagram.com/usuario"
                      />
                    </div>
                    <div className="form-group social-input">
                      <label htmlFor="twitter">X / Twitter</label>
                      <input
                        type="url"
                        id="twitter"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="https://x.com/usuario"
                      />
                    </div>
                    <div className="form-group social-input">
                      <label htmlFor="linkedin">LinkedIn</label>
                      <input
                        type="url"
                        id="linkedin"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/usuario"
                      />
                    </div>
                    <div className="form-group social-input">
                      <label htmlFor="github">GitHub</label>
                      <input
                        type="url"
                        id="github"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="https://github.com/usuario"
                      />
                    </div>
                    <div className="form-group social-input">
                      <label htmlFor="website">Website</label>
                      <input
                        type="url"
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://meusite.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileData?.email || authProfile?.email || ''}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Função</label>
                    <input
                      type="text"
                      value={profileData?.role || authProfile?.role || 'user'}
                      disabled
                    />
                  </div>
                </div>

                <div className="settings-section">
                  <h4>Localização</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="language">Idioma</label>
                      <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="dateFormat">Formato de Data</label>
                      <select
                        id="dateFormat"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="currency">Moeda</label>
                      <select
                        id="currency"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                      >
                        <option value="BRL">Real (R$)</option>
                        <option value="USD">Dólar ($)</option>
                        <option value="EUR">Euro (€)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            )}

            {/* Org Tabs */}
            {activeTab === 'org' && isAdmin && (
              <div className="profile-org-section">
                <GeneralTab />
              </div>
            )}
            {activeTab === 'appearance' && isAdmin && (
              <div className="profile-org-section">
                <AppearanceTab />
              </div>
            )}
            {activeTab === 'members' && isAdmin && (
              <div className="profile-org-section">
                <MembersTab />
              </div>
            )}
            {activeTab === 'billing' && (
              <div className="profile-org-section">
                <BillingTab />
              </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
              <form onSubmit={handleSaveAIConfig} className="profile-form">
                <div className="settings-section">
                  <h4>Inteligencia Artificial</h4>

                  <div className="ai-status-badge">
                    <span className={`ai-status-dot ${aiConfigured ? 'active' : ''}`} />
                    {aiConfigured ? (
                      <span>Configurado &middot; {aiProvider === 'gemini' ? 'Google Gemini' : 'Claude'} &middot; {aiKeyPrefix}</span>
                    ) : (
                      <span>Nao configurado</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="aiProvider">Provedor</label>
                    <div className="ai-provider-cards">
                      <button
                        type="button"
                        className={`ai-provider-card ${aiProvider === 'gemini' ? 'active' : ''}`}
                        onClick={() => { setAiProvider('gemini'); setAiModel('gemini-2.0-flash'); }}
                      >
                        <span className="ai-provider-name">Google Gemini</span>
                        <span className="ai-provider-tag free">Gratis</span>
                        <span className="ai-provider-desc">15 req/min, 1M tokens/dia</span>
                      </button>
                      <button
                        type="button"
                        className={`ai-provider-card ${aiProvider === 'claude' ? 'active' : ''}`}
                        onClick={() => { setAiProvider('claude'); setAiModel('claude-sonnet-4-5-20250929'); }}
                      >
                        <span className="ai-provider-name">Claude (Anthropic)</span>
                        <span className="ai-provider-tag paid">Pago</span>
                        <span className="ai-provider-desc">Melhor qualidade, ~$0.003/req</span>
                      </button>
                    </div>
                  </div>

                  {!aiConfigured && aiProvider === 'gemini' && (
                    <div className="ai-setup-guide">
                      <p className="ai-setup-title">Como obter sua API Key (Google Gemini):</p>
                      <ol className="ai-setup-steps">
                        <li>
                          Acesse{' '}
                          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="ai-setup-link">
                            aistudio.google.com/apikey
                          </a>
                        </li>
                        <li>Faca login com sua conta Google</li>
                        <li>Clique em <strong>"Create API Key"</strong></li>
                        <li>Copie a chave e cole abaixo</li>
                      </ol>
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="ai-get-key-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Criar API Key no Google AI Studio
                      </a>
                    </div>
                  )}

                  {!aiConfigured && aiProvider === 'claude' && (
                    <div className="ai-setup-guide">
                      <p className="ai-setup-title">Como obter sua API Key (Claude):</p>
                      <ol className="ai-setup-steps">
                        <li>
                          Acesse{' '}
                          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="ai-setup-link">
                            console.anthropic.com/settings/keys
                          </a>
                        </li>
                        <li>Crie uma conta ou faca login</li>
                        <li>Clique em <strong>"Create Key"</strong></li>
                        <li>Adicione creditos em Billing (min. $5 USD)</li>
                        <li>Copie a chave e cole abaixo</li>
                      </ol>
                      <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="ai-get-key-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        Criar API Key na Anthropic
                      </a>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="aiApiKey">API Key</label>
                    <input
                      type="password"
                      id="aiApiKey"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder={aiConfigured ? 'Deixe vazio para manter a atual' : aiProvider === 'gemini' ? 'Cole sua key aqui: AIza...' : 'Cole sua key aqui: sk-ant-...'}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="aiModel">Modelo</label>
                    <select
                      id="aiModel"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                    >
                      {aiProvider === 'gemini' ? (
                        <>
                          <option value="gemini-2.0-flash">Gemini 2.0 Flash (recomendado)</option>
                          <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (mais rapido)</option>
                          <option value="gemini-1.5-pro">Gemini 1.5 Pro (melhor qualidade)</option>
                        </>
                      ) : (
                        <>
                          <option value="claude-sonnet-4-5-20250929">Sonnet 4.5 (recomendado)</option>
                          <option value="claude-haiku-4-5-20251001">Haiku 4.5 (mais rapido)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="ai-actions">
                  <button type="submit" className="btn-primary" disabled={savingAi}>
                    {savingAi ? 'Salvando...' : 'Salvar Configuracao'}
                  </button>
                  {aiConfigured && (
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={handleDeleteAIConfig}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </AdminLayout>
  );
}
