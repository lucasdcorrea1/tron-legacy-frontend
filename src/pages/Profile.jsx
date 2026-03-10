import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { profile as profileApi, ai as aiApi, API_URL } from '../services/api';
import AdminLayout from '../components/AdminLayout';
import './Profile.css';

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
};

export default function Profile() {
  const { profile: authProfile, updateProfile } = useAuth();
  const toast = useToast();
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

  // Settings
  const [language, setLanguage] = useState('pt-BR');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [currency, setCurrency] = useState('BRL');
  const [themeMode, setThemeMode] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [accentColor, setAccentColor] = useState('#3b82f6');

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
        if (data.settings.theme) {
          setThemeMode(data.settings.theme.mode || 'light');
          setPrimaryColor(data.settings.theme.primary_color || '#0ea5e9');
          setAccentColor(data.settings.theme.accent_color || '#3b82f6');
        }
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
    if (!window.confirm('Remover avatar?')) return;

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
      await profileApi.update({
        name,
        bio,
        social_links: { instagram, twitter, linkedin, github, website },
      });
      updateProfile({ name, bio });
      toast.success('Perfil atualizado com sucesso!', 'Salvo');
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await profileApi.updateSettings({
        language,
        date_format: dateFormat,
        currency,
        theme: {
          mode: themeMode,
          primary_color: primaryColor,
          accent_color: accentColor,
        },
      });
      toast.success('Configurações salvas com sucesso!', 'Preferências');
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar configurações');
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
    if (!window.confirm('Remover configuracao de IA?')) return;
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
        <div className="profile-loading">Carregando...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="profile-page">
        <div className="page-header">
          <h1>Meu Perfil</h1>
          <p>Gerencie suas informações e preferências</p>
        </div>

        <div className="profile-layout">
          {/* Cover Banner */}
          <div className="profile-cover-banner">
            {coverImage ? (
              <img src={getImageUrl(coverImage)} alt="Capa" className="cover-image" />
            ) : (
              <div className="cover-image-placeholder" />
            )}
            <label className="cover-upload-btn">
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

          {/* Avatar Card */}
          <div className="profile-card avatar-card">
            <div className="avatar-wrapper">
              {avatar ? (
                <img src={getImageUrl(avatar)} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {uploadingAvatar && <div className="avatar-uploading">...</div>}
            </div>
            <h3>{name || 'Usuário'}</h3>
            <span className="user-role">{profileData?.role || authProfile?.role}</span>
            <div className="avatar-actions">
              <label className="btn-secondary">
                {uploadingAvatar ? 'Enviando...' : 'Alterar foto'}
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
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleRemoveAvatar}
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="profile-content">
            {/* Tabs */}
            <div className="profile-tabs">
              <button
                className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Informações
              </button>
              <button
                className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Preferências
              </button>
              <button
                className={`profile-tab ${activeTab === 'ai' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai')}
              >
                IA
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="profile-form">
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

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveSettings} className="profile-form">
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

                <div className="settings-section">
                  <h4>Aparência</h4>
                  <div className="form-group">
                    <label htmlFor="themeMode">Tema</label>
                    <select
                      id="themeMode"
                      value={themeMode}
                      onChange={(e) => setThemeMode(e.target.value)}
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Escuro</option>
                      <option value="system">Sistema</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="primaryColor">Cor Primária</label>
                      <div className="color-picker">
                        <input
                          type="color"
                          id="primaryColor"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                        />
                        <span>{primaryColor}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="accentColor">Cor de Destaque</label>
                      <div className="color-picker">
                        <input
                          type="color"
                          id="accentColor"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                        />
                        <span>{accentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Preferências'}
                </button>
              </form>
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
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
