import { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import { instagramAutoReply, API_URL } from '../services/api';
import './InstagramAutoReply.css';

export function InstagramAutoReplyContent() {
  const toast = useToast();
  const [tab, setTab] = useState('rules');

  // Rules state
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(20);
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [logTriggerFilter, setLogTriggerFilter] = useState('');

  // ── Load rules ──
  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const data = await instagramAutoReply.listRules();
      setRules(data.rules || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRulesLoading(false);
    }
  }, [toast]);

  // ── Load logs ──
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await instagramAutoReply.listLogs({
        page: logsPage,
        limit: logsLimit,
        status: logStatusFilter || undefined,
        trigger_type: logTriggerFilter || undefined,
      });
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLogsLoading(false);
    }
  }, [toast, logsPage, logsLimit, logStatusFilter, logTriggerFilter]);

  useEffect(() => { loadRules(); }, [loadRules]);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab, loadLogs]);

  // ── Toggle rule ──
  const handleToggle = async (id) => {
    try {
      const data = await instagramAutoReply.toggleRule(id);
      setRules(prev => prev.map(r => r.id === id ? { ...r, active: data.active } : r));
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Delete rule ──
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await instagramAutoReply.deleteRule(deleteConfirm);
      setRules(prev => prev.filter(r => r.id !== deleteConfirm));
      toast.success('Regra removida');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ── Trigger type helpers ──
  const triggerLabel = (type) => {
    switch (type) {
      case 'comment': return 'Comentário';
      case 'dm': return 'DM';
      case 'both': return 'Ambos';
      default: return type;
    }
  };

  const triggerClass = (type) => `ar-trigger-badge ar-trigger-${type}`;

  const statusLabel = (s) => {
    switch (s) {
      case 'sent': return 'Enviado';
      case 'failed': return 'Falhou';
      case 'skipped_cooldown': return 'Cooldown';
      case 'no_match': return 'Sem regra';
      default: return s;
    }
  };

  const totalPages = Math.ceil(logsTotal / logsLimit);

  return (
      <div className="ar-page">
        <div className="page-header">
          <h1>Auto-Resposta Instagram</h1>
          <p>Configure respostas automáticas para comentários e DMs</p>
        </div>

        {/* Tabs */}
        <div className="ar-tabs">
          <button
            className={`ar-tab ${tab === 'rules' ? 'active' : ''}`}
            onClick={() => setTab('rules')}
          >
            Regras
            {rules.length > 0 && (
              <span className="ar-tab-count">{rules.length}</span>
            )}
          </button>
          <button
            className={`ar-tab ${tab === 'logs' ? 'active' : ''}`}
            onClick={() => setTab('logs')}
          >
            Histórico
          </button>
          <button
            className={`ar-tab ${tab === 'live' ? 'active' : ''}`}
            onClick={() => setTab('live')}
          >
            Ao Vivo
          </button>
        </div>

        {/* ── Rules Tab ── */}
        {tab === 'rules' && (
          <>
            <div className="ar-rules-header">
              <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
                {rules.filter(r => r.active).length} regra(s) ativa(s)
              </span>
              <button
                className="ar-btn ar-btn-primary"
                onClick={() => { setEditingRule(null); setShowForm(true); }}
              >
                + Nova Regra
              </button>
            </div>

            {rulesLoading ? (
              <div className="ar-loading">
                <div className="ar-spinner" />
                Carregando regras...
              </div>
            ) : rules.length === 0 ? (
              <div className="ar-empty">
                <p>Nenhuma regra configurada.</p>
                <button
                  className="ar-btn ar-btn-primary"
                  onClick={() => { setEditingRule(null); setShowForm(true); }}
                >
                  Criar primeira regra
                </button>
              </div>
            ) : (
              rules.map(rule => (
                <div
                  key={rule.id}
                  className={`ar-rule-card ${!rule.active ? 'inactive' : ''}`}
                >
                  <div className="ar-rule-header">
                    <span className="ar-rule-name">{rule.name}</span>
                    <div className="ar-rule-actions">
                      <label className="ar-toggle">
                        <input
                          type="checkbox"
                          checked={rule.active}
                          onChange={() => handleToggle(rule.id)}
                        />
                        <span className="ar-toggle-slider" />
                      </label>
                      <button
                        className="ar-btn ar-btn-secondary ar-btn-sm"
                        onClick={() => { setEditingRule(rule); setShowForm(true); }}
                      >
                        Editar
                      </button>
                      <button
                        className="ar-btn ar-btn-danger ar-btn-sm"
                        onClick={() => setDeleteConfirm(rule.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <div className="ar-rule-body">
                    <div className="ar-rule-row">
                      <span className="ar-rule-label">Trigger:</span>
                      <span className={triggerClass(rule.trigger_type)}>
                        {triggerLabel(rule.trigger_type)}
                      </span>
                    </div>
                    <div className="ar-rule-row">
                      <span className="ar-rule-label">Keywords:</span>
                      <div className="ar-keywords">
                        {rule.keywords.map((kw, i) => (
                          <span key={i} className="ar-keyword">{kw}</span>
                        ))}
                      </div>
                    </div>
                    <div className="ar-rule-row">
                      <span className="ar-rule-label">Resposta DM:</span>
                      <span className="ar-rule-value message">
                        {rule.response_message}
                      </span>
                    </div>
                    {rule.comment_reply && (
                      <div className="ar-rule-row">
                        <span className="ar-rule-label">Reply público:</span>
                        <span className="ar-rule-value message">
                          {rule.comment_reply}
                        </span>
                      </div>
                    )}
                    {rule.post_ids && rule.post_ids.length > 0 && (
                      <div className="ar-rule-row">
                        <span className="ar-rule-label">Posts:</span>
                        <span className="ar-rule-value">
                          {rule.post_ids.length} post(s) específico(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Logs Tab ── */}
        {tab === 'logs' && (
          <>
            <div className="ar-log-filters">
              {['', 'sent', 'failed', 'skipped_cooldown'].map(s => (
                <button
                  key={s}
                  className={`ar-btn ar-btn-sm ${logStatusFilter === s ? 'ar-btn-primary' : 'ar-btn-secondary'}`}
                  onClick={() => { setLogStatusFilter(s); setLogsPage(1); }}
                >
                  {s === '' ? 'Todos' : statusLabel(s)}
                </button>
              ))}
              <span style={{ width: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0.25rem' }} />
              {['', 'comment', 'dm'].map(t => (
                <button
                  key={t}
                  className={`ar-btn ar-btn-sm ${logTriggerFilter === t ? 'ar-btn-primary' : 'ar-btn-secondary'}`}
                  onClick={() => { setLogTriggerFilter(t); setLogsPage(1); }}
                >
                  {t === '' ? 'Todos tipos' : triggerLabel(t)}
                </button>
              ))}
            </div>

            {logsLoading ? (
              <div className="ar-loading">
                <div className="ar-spinner" />
                Carregando histórico...
              </div>
            ) : logs.length === 0 ? (
              <div className="ar-empty">
                <p>Nenhum registro encontrado.</p>
              </div>
            ) : (
              <>
                <div className="ar-log-table-wrap">
                  <table className="ar-log-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Regra</th>
                        <th>Tipo</th>
                        <th>Usuário</th>
                        <th>Texto</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => (
                        <tr key={log.id}>
                          <td title={new Date(log.created_at).toLocaleString()}>
                            {new Date(log.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td>{log.rule_name}</td>
                          <td>
                            <span className={triggerClass(log.trigger_type)}>
                              {triggerLabel(log.trigger_type)}
                            </span>
                          </td>
                          <td title={log.sender_ig_id}>
                            {log.sender_username || log.sender_ig_id?.slice(0, 10)}
                          </td>
                          <td title={log.trigger_text}>{log.trigger_text}</td>
                          <td>
                            <span className={`ar-status ar-status-${log.status}`}>
                              {statusLabel(log.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="ar-pagination">
                    <button
                      disabled={logsPage <= 1}
                      onClick={() => setLogsPage(p => p - 1)}
                    >
                      Anterior
                    </button>
                    <span>Página {logsPage} de {totalPages}</span>
                    <button
                      disabled={logsPage >= totalPages}
                      onClick={() => setLogsPage(p => p + 1)}
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Live Tab ── */}
        {tab === 'live' && (
          <LiveFeed statusLabel={statusLabel} triggerLabel={triggerLabel} />
        )}

        {/* ── Rule Form Modal ── */}
        {showForm && (
          <RuleFormModal
            rule={editingRule}
            onClose={() => { setShowForm(false); setEditingRule(null); }}
            onSaved={() => { setShowForm(false); setEditingRule(null); loadRules(); }}
            toast={toast}
          />
        )}

        {/* ── Delete Confirm ── */}
        {deleteConfirm && (
          <div className="ar-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="ar-confirm-dialog" onClick={e => e.stopPropagation()}>
              <h3>Excluir regra?</h3>
              <p>Esta ação não pode ser desfeita. A regra deixará de funcionar imediatamente.</p>
              <div className="ar-confirm-actions">
                <button className="ar-btn ar-btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Cancelar
                </button>
                <button className="ar-btn ar-btn-danger" onClick={handleDelete}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default function InstagramAutoReply() {
  return (
    <AdminLayout>
      <InstagramAutoReplyContent />
    </AdminLayout>
  );
}

// ─── Live Feed Component ─────────────────────────────────────────────

function LiveFeed({ statusLabel, triggerLabel }) {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const feedRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const es = new EventSource(
      `${API_URL}/api/v1/admin/instagram/autoreply/live?token=${token}`
    );
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data);
        setEvents(prev => [...prev.slice(-49), evt]);
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const statusIcon = (s) => {
    switch (s) {
      case 'sent': return '\u2705';
      case 'failed': return '\u274C';
      case 'skipped_cooldown': return '\u23F3';
      case 'no_match': return '\uD83D\uDD0D';
      default: return '';
    }
  };

  return (
    <>
      <div className="ar-live-header">
        <div className="ar-live-status">
          <span className={`ar-live-dot ${connected ? 'connected' : 'disconnected'}`} />
          <span>{connected ? 'Conectado' : 'Desconectado'}</span>
        </div>
        <button
          className="ar-btn ar-btn-secondary ar-btn-sm"
          onClick={() => setEvents([])}
          disabled={events.length === 0}
        >
          Limpar
        </button>
      </div>

      <div className="ar-live-feed" ref={feedRef}>
        {events.length === 0 ? (
          <div className="ar-live-empty">
            <div className="ar-live-empty-icon">{'\uD83D\uDCE1'}</div>
            <p>Aguardando eventos...</p>
            <span>Quando alguém comentar ou enviar DM com uma keyword ativa, o evento aparece aqui em tempo real.</span>
          </div>
        ) : (
          events.map((evt, i) => (
            <div key={i} className={`ar-live-event ar-live-event-${evt.status}`}>
              <div className="ar-live-event-header">
                <span className="ar-live-event-time">[{formatTime(evt.timestamp)}]</span>
                <span className="ar-live-event-type">
                  {evt.type === 'comment' ? triggerLabel('comment') : triggerLabel('dm')}
                </span>
                <span className={`ar-status ar-status-${evt.status}`}>
                  {statusIcon(evt.status)} {statusLabel(evt.status)}
                </span>
              </div>
              <div className="ar-live-event-body">
                <div className="ar-live-event-sender">
                  {evt.sender ? `@${evt.sender}` : 'Usuário'}{' '}
                  {evt.type === 'comment' ? 'comentou' : 'enviou'}{' '}
                  <span className="ar-live-event-text">"{evt.trigger_text}"</span>
                </div>
                <div className="ar-live-event-details">
                  <span>Regra: <strong>{evt.rule_name}</strong></span>
                  {evt.comment_reply && (
                    <span>Reply: "{evt.comment_reply}"</span>
                  )}
                  <span>DM: "{evt.response}"</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ─── Rule Form Modal ─────────────────────────────────────────────────

const RULE_PRESETS = [
  {
    label: 'Lead Magnet',
    icon: '\uD83E\uDDF2',
    name: 'Lead Magnet',
    triggerType: 'both',
    keywords: ['quero', 'link', 'eu quero'],
    commentReply: 'Enviamos o link por DM, @{{username}}! \uD83D\uDE80',
    responseMessage: 'Oi {{username}}! Aqui está o link que você pediu \uD83D\uDE09',
  },
  {
    label: 'Promoção',
    icon: '\uD83C\uDFF7\uFE0F',
    name: 'Promoção',
    triggerType: 'both',
    keywords: ['promo', 'desconto', 'cupom'],
    commentReply: 'Enviamos o cupom por DM, @{{username}}! \uD83C\uDF89',
    responseMessage: 'Oi {{username}}! Aqui está seu cupom exclusivo \uD83C\uDF81',
  },
  {
    label: 'Produto',
    icon: '\uD83D\uDED2',
    name: 'Produto',
    triggerType: 'both',
    keywords: ['preço', 'comprar', 'quanto'],
    commentReply: 'Enviamos os detalhes por DM, @{{username}}! \u2728',
    responseMessage: 'Oi {{username}}! Aqui estão os detalhes do produto \uD83D\uDCE6',
  },
];

function RuleFormModal({ rule, onClose, onSaved, toast }) {
  const [name, setName] = useState(rule?.name || '');
  const [triggerType, setTriggerType] = useState(rule?.trigger_type || 'both');
  const [keywords, setKeywords] = useState(rule?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [responseMessage, setResponseMessage] = useState(rule?.response_message || '');
  const [commentReply, setCommentReply] = useState(rule?.comment_reply || '');
  const [postIds, setPostIds] = useState(rule?.post_ids?.join(', ') || '');
  const [saving, setSaving] = useState(false);

  const applyPreset = (preset) => {
    setName(preset.name);
    setTriggerType(preset.triggerType);
    setKeywords(preset.keywords);
    setCommentReply(preset.commentReply);
    setResponseMessage(preset.responseMessage);
  };

  const insertVariable = (setter, varName) => {
    setter(prev => prev + varName);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords(prev => [...prev, kw]);
    }
    setKeywordInput('');
  };

  const removeKeyword = (idx) => {
    setKeywords(prev => prev.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Auto-add pending keyword text
    const finalKeywords = [...keywords];
    const pendingKw = keywordInput.trim();
    if (pendingKw && !finalKeywords.includes(pendingKw)) {
      finalKeywords.push(pendingKw);
      setKeywords(finalKeywords);
      setKeywordInput('');
    }

    if (!name) { toast.warning('Nome da regra é obrigatório'); return; }
    if (finalKeywords.length === 0) { toast.warning('Adicione pelo menos uma keyword'); return; }
    if (!responseMessage) { toast.warning('Mensagem de resposta é obrigatória'); return; }

    setSaving(true);
    try {
      const data = {
        name,
        trigger_type: triggerType,
        keywords: finalKeywords,
        response_message: responseMessage,
        comment_reply: (triggerType === 'comment' || triggerType === 'both') ? commentReply : '',
        post_ids: postIds ? postIds.split(',').map(s => s.trim()).filter(Boolean) : [],
      };

      if (rule) {
        await instagramAutoReply.updateRule(rule.id, data);
        toast.success('Regra atualizada');
      } else {
        await instagramAutoReply.createRule(data);
        toast.success('Regra criada');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ar-modal-overlay" onClick={onClose}>
      <div className="ar-modal" onClick={e => e.stopPropagation()}>
        <h3>{rule ? 'Editar Regra' : 'Nova Regra'}</h3>

        {/* Presets — only when creating */}
        {!rule && (
          <div className="ar-presets">
            <span className="ar-presets-label">Templates rápidos:</span>
            <div className="ar-presets-row">
              {RULE_PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  className="ar-preset-btn"
                  onClick={() => applyPreset(p)}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ar-form-group">
            <label>Nome da regra</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Promoção Black Friday"
            />
          </div>

          <div className="ar-form-group">
            <label>Tipo de trigger</label>
            <select value={triggerType} onChange={e => setTriggerType(e.target.value)}>
              <option value="both">Comentário + DM</option>
              <option value="comment">Apenas comentário</option>
              <option value="dm">Apenas DM</option>
            </select>
          </div>

          <div className="ar-form-group">
            <label>
              Keywords <span className="ar-label-hint">(pressione Enter para adicionar)</span>
            </label>
            <div className="ar-keywords-input-row">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: QUERO"
              />
              <button type="button" className="ar-btn ar-btn-secondary ar-btn-sm" onClick={addKeyword}>
                +
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="ar-keywords-list">
                {keywords.map((kw, i) => (
                  <span key={i} className="ar-keyword-removable">
                    {kw}
                    <button type="button" className="ar-keyword-remove" onClick={() => removeKeyword(i)}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="ar-form-group">
            <label>Mensagem de resposta (DM)</label>
            <div className="ar-var-buttons">
              <button type="button" className="ar-var-btn" onClick={() => insertVariable(setResponseMessage, '{{username}}')}>{'{{username}}'}</button>
              <button type="button" className="ar-var-btn" onClick={() => insertVariable(setResponseMessage, '{{keyword}}')}>{'{{keyword}}'}</button>
            </div>
            <textarea
              value={responseMessage}
              onChange={e => setResponseMessage(e.target.value)}
              placeholder="A mensagem que será enviada via DM..."
            />
          </div>

          {/* Comment reply — only for comment/both triggers */}
          {(triggerType === 'comment' || triggerType === 'both') && (
            <div className="ar-form-group">
              <label>
                Resposta pública ao comentário <span className="ar-label-hint">(opcional)</span>
              </label>
              <div className="ar-var-buttons">
                <button type="button" className="ar-var-btn" onClick={() => insertVariable(setCommentReply, '{{username}}')}>{'{{username}}'}</button>
                <button type="button" className="ar-var-btn" onClick={() => insertVariable(setCommentReply, '{{keyword}}')}>{'{{keyword}}'}</button>
              </div>
              <textarea
                value={commentReply}
                onChange={e => setCommentReply(e.target.value)}
                placeholder="Ex: Enviamos o link por DM, @{{username}}! 🚀"
              />
              <span className="ar-field-help">Se preenchido, responde publicamente ao comentário E envia o DM</span>
            </div>
          )}

          <div className="ar-form-group">
            <label>
              Post IDs <span className="ar-label-hint">(opcional, separados por vírgula)</span>
            </label>
            <input
              type="text"
              value={postIds}
              onChange={e => setPostIds(e.target.value)}
              placeholder="Deixe vazio para todos os posts"
            />
          </div>

          <div className="ar-modal-actions">
            <button type="button" className="ar-btn ar-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="ar-btn ar-btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : rule ? 'Salvar' : 'Criar Regra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
