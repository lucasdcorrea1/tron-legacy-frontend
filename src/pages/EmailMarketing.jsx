import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import { emailMarketing } from '../services/api';
import './EmailMarketing.css';

const STEPS = [
  { label: 'Template' },
  { label: 'Personalizar' },
  { label: 'Pré-visualizar' },
  { label: 'Confirmação' },
];

export default function EmailMarketing() {
  const toast = useToast();
  const iframeRef = useRef(null);

  const [tab, setTab] = useState('send'); // 'send' | 'subscribers'
  const [step, setStep] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [audienceCount, setAudienceCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');

  // Subscribers
  const [subscribers, setSubscribers] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsSearch, setSubsSearch] = useState('');

  // Form fields
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [content, setContent] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonURL, setButtonURL] = useState('');

  // Load templates and audience on mount
  useEffect(() => {
    loadTemplates();
    loadAudience();
  }, []);

  // Load subscribers when tab switches
  useEffect(() => {
    if (tab === 'subscribers' && subscribers.length === 0) {
      loadSubscribers();
    }
  }, [tab]);

  const loadTemplates = async () => {
    try {
      const data = await emailMarketing.listTemplates();
      setTemplates(data.templates || []);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar templates');
    }
  };

  const loadAudience = async () => {
    try {
      const data = await emailMarketing.getAudience();
      // Resend returns audience object; we extract what we can
      setAudienceCount(data.name ? data : null);
    } catch {
      // Non-critical — just won't show audience count
    }
  };

  const loadSubscribers = async () => {
    setSubsLoading(true);
    try {
      const data = await emailMarketing.listSubscribers();
      setSubscribers(data.data || []);
    } catch (err) {
      toast.error(err.message || 'Erro ao carregar inscritos');
    } finally {
      setSubsLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id, email) => {
    if (!window.confirm(`Remover ${email} da lista?`)) return;
    try {
      await emailMarketing.deleteSubscriber(id);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      toast.success(`${email} removido`);
    } catch (err) {
      toast.error(err.message || 'Erro ao remover inscrito');
    }
  };

  const filteredSubscribers = subscribers.filter((s) =>
    (s.email || '').toLowerCase().includes(subsSearch.toLowerCase()) ||
    (s.first_name || '').toLowerCase().includes(subsSearch.toLowerCase())
  );

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setStep(1);
  };

  const handlePreview = async () => {
    if (!subject.trim()) {
      toast.warning('Preencha o assunto do email');
      return;
    }

    setLoading(true);
    try {
      const data = await emailMarketing.previewTemplate(selectedTemplate.id, {
        subject,
        preview_text: previewText,
        content,
        button_text: buttonText,
        button_url: buttonURL,
      });
      setPreviewHTML(data.html);
      setStep(2);
    } catch (err) {
      toast.error(err.message || 'Erro ao gerar preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await emailMarketing.send({
        template_id: selectedTemplate.id,
        subject,
        preview_text: previewText,
        content,
        button_text: buttonText,
        button_url: buttonURL,
      });
      setShowConfirm(false);
      setStep(3);
      toast.success('Email enviado com sucesso!');
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar email');
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setStep(0);
    setSelectedTemplate(null);
    setSubject('');
    setPreviewText('');
    setContent('');
    setButtonText('');
    setButtonURL('');
    setPreviewHTML('');
  };

  // Write preview HTML into iframe
  useEffect(() => {
    if (step === 2 && previewHTML && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHTML);
        doc.close();
      }
    }
  }, [step, previewHTML]);

  return (
    <AdminLayout>
      <div className="email-marketing">
        <div className="page-header">
          <h1>Email Marketing</h1>
          <p>Envie emails para os inscritos da newsletter</p>
        </div>

        {/* Tab switcher */}
        <div className="em-tabs">
          <button
            className={`em-tab ${tab === 'send' ? 'active' : ''}`}
            onClick={() => setTab('send')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Enviar Email
          </button>
          <button
            className={`em-tab ${tab === 'subscribers' ? 'active' : ''}`}
            onClick={() => setTab('subscribers')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Inscritos {subscribers.length > 0 && <span className="em-tab-count">{subscribers.length}</span>}
          </button>
        </div>

        {/* ====== SUBSCRIBERS TAB ====== */}
        {tab === 'subscribers' && (
          <div className="em-subscribers">
            <div className="em-subs-header">
              <input
                type="text"
                className="em-subs-search"
                placeholder="Buscar por email ou nome..."
                value={subsSearch}
                onChange={(e) => setSubsSearch(e.target.value)}
              />
              <button className="em-btn em-btn-secondary" onClick={loadSubscribers} disabled={subsLoading}>
                {subsLoading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>

            {subsLoading && subscribers.length === 0 ? (
              <div className="em-loading">
                <span className="em-spinner" />
                Carregando inscritos...
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="em-subs-empty">
                {subsSearch ? 'Nenhum inscrito encontrado.' : 'Nenhum inscrito ainda.'}
              </div>
            ) : (
              <div className="em-subs-list">
                <div className="em-subs-row em-subs-row-header">
                  <span>Email</span>
                  <span>Nome</span>
                  <span>Data</span>
                  <span></span>
                </div>
                {filteredSubscribers.map((s) => (
                  <div key={s.id} className={`em-subs-row ${s.unsubscribed ? 'unsubscribed' : ''}`}>
                    <span className="em-subs-email">{s.email}</span>
                    <span className="em-subs-name">{s.first_name || '—'}</span>
                    <span className="em-subs-date">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('pt-BR') : '—'}
                    </span>
                    <span className="em-subs-actions">
                      {s.unsubscribed && <span className="em-subs-badge-unsub">Cancelou</span>}
                      <button
                        className="em-subs-delete"
                        onClick={() => handleDeleteSubscriber(s.id, s.email)}
                        title="Remover inscrito"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ====== SEND EMAIL TAB ====== */}
        {tab === 'send' && <>

        {/* Audience bar */}
        {audienceCount && (
          <div className="em-audience-bar">
            <span className="audience-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            Audiência: <strong>{audienceCount.name || 'Newsletter'}</strong>
          </div>
        )}

        {/* Steps indicator */}
        <div className="em-steps">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`em-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
            >
              <span className="em-step-number">
                {i < step ? '\u2713' : i + 1}
              </span>
              <span className="em-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 0: Select template */}
        {step === 0 && (
          <div className="em-templates-grid">
            {templates.map((t) => (
              <div
                key={t.id}
                className={`em-template-card ${selectedTemplate?.id === t.id ? 'selected' : ''}`}
                onClick={() => handleSelectTemplate(t)}
              >
                <span className="em-template-category">{t.category}</span>
                <h3>{t.name}</h3>
                <p>{t.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Customize */}
        {step === 1 && (
          <div className="em-form">
            <div className="em-form-group">
              <label>
                Assunto do email <span className="label-hint">(obrigatório)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Novidades incríveis para você!"
              />
            </div>

            <div className="em-form-group">
              <label>
                Texto de preview <span className="label-hint">(aparece na caixa de entrada)</span>
              </label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Ex: Confira as últimas novidades..."
              />
            </div>

            <div className="em-form-group">
              <label>Conteúdo</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva o conteúdo principal do email..."
              />
            </div>

            <div className="em-form-row">
              <div className="em-form-group">
                <label>Texto do botão</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Ex: Saiba mais"
                />
              </div>
              <div className="em-form-group">
                <label>URL do botão</label>
                <input
                  type="url"
                  value={buttonURL}
                  onChange={(e) => setButtonURL(e.target.value)}
                  placeholder="https://whodo.com.br/..."
                />
              </div>
            </div>

            <div className="em-actions">
              <button className="em-btn em-btn-secondary" onClick={() => setStep(0)}>
                Voltar
              </button>
              <button
                className="em-btn em-btn-primary"
                onClick={handlePreview}
                disabled={loading || !subject.trim()}
              >
                {loading ? 'Gerando preview...' : 'Pré-visualizar'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 2 && (
          <div className="em-preview-container">
            <div className="em-preview-frame">
              <iframe ref={iframeRef} title="Email Preview" />
            </div>

            <div className="em-preview-summary">
              <h3>Resumo do envio</h3>
              <div className="em-summary-row">
                <span className="label">Template</span>
                <span className="value">{selectedTemplate?.name}</span>
              </div>
              <div className="em-summary-row">
                <span className="label">Assunto</span>
                <span className="value">{subject}</span>
              </div>
              {previewText && (
                <div className="em-summary-row">
                  <span className="label">Preview</span>
                  <span className="value">{previewText}</span>
                </div>
              )}
              {buttonURL && (
                <div className="em-summary-row">
                  <span className="label">CTA</span>
                  <span className="value">{buttonText || 'Saiba mais'} → {buttonURL}</span>
                </div>
              )}
            </div>

            <div className="em-actions">
              <button className="em-btn em-btn-secondary" onClick={() => setStep(1)}>
                Voltar e editar
              </button>
              <button
                className="em-btn em-btn-primary"
                onClick={() => setShowConfirm(true)}
              >
                Enviar email
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="em-success">
            <div className="em-success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2>Email enviado com sucesso!</h2>
            <p>O broadcast foi criado e enviado para todos os inscritos da newsletter.</p>
            <div className="em-actions" style={{ justifyContent: 'center' }}>
              <button className="em-btn em-btn-primary" onClick={handleReset}>
                Enviar outro email
              </button>
            </div>
          </div>
        )}

        </>}

        {/* Confirm dialog */}
        {showConfirm && (
          <div className="em-confirm-overlay" onClick={() => !sending && setShowConfirm(false)}>
            <div className="em-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h3>Confirmar envio</h3>
              <p>
                Tem certeza que deseja enviar este email para todos os inscritos da newsletter?
                Esta ação não pode ser desfeita.
              </p>
              <div className="em-confirm-actions">
                <button
                  className="em-btn em-btn-secondary"
                  onClick={() => setShowConfirm(false)}
                  disabled={sending}
                >
                  Cancelar
                </button>
                <button
                  className="em-btn em-btn-primary"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <span className="em-spinner" style={{ display: 'inline-block', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                      Enviando...
                    </>
                  ) : (
                    'Confirmar envio'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
