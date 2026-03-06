import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import { instagramLeads } from '../services/api';
import './InstagramLeads.css';

export default function InstagramLeads() {
  const toast = useToast();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [stats, setStats] = useState(null);

  // Tag editor
  const [editingLead, setEditingLead] = useState(null);
  const [editTags, setEditTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [savingTags, setSavingTags] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await instagramLeads.list({
        page, limit, search: search || undefined,
        tag: tagFilter || undefined, source: sourceFilter || undefined,
      });
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast, page, limit, search, tagFilter, sourceFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await instagramLeads.stats();
      setStats(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);
  useEffect(() => { loadStats(); }, [loadStats]);

  // Search with debounce via page reset
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      await instagramLeads.exportCSV();
      toast.success('Download iniciado');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Tag editor
  const openTagEditor = (lead) => {
    setEditingLead(lead);
    setEditTags([...(lead.tags || [])]);
    setTagInput('');
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !editTags.includes(t)) {
      setEditTags(prev => [...prev, t]);
    }
    setTagInput('');
  };

  const removeTag = (idx) => {
    setEditTags(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const saveTags = async () => {
    if (!editingLead) return;
    setSavingTags(true);
    try {
      await instagramLeads.updateTags(editingLead.id, editTags);
      setLeads(prev => prev.map(l =>
        l.id === editingLead.id ? { ...l, tags: editTags } : l
      ));
      toast.success('Tags atualizadas');
      setEditingLead(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingTags(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  // Gather unique tags from current leads for filter dropdown
  const allTags = [...new Set(leads.flatMap(l => l.tags || []))].sort();

  return (
    <AdminLayout>
      <div className="leads-page">
        <div className="page-header">
          <h1>Leads Instagram</h1>
          <p>Pessoas que interagiram via auto-resposta</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="leads-stats">
            <div className="leads-stat-card purple">
              <span className="leads-stat-value">{stats.total}</span>
              <span className="leads-stat-label">Total de Leads</span>
            </div>
            <div className="leads-stat-card green">
              <span className="leads-stat-value">{stats.new_this_week}</span>
              <span className="leads-stat-label">Novos esta semana</span>
            </div>
            {stats.by_source && Object.entries(stats.by_source).map(([src, count]) => (
              <div className="leads-stat-card" key={src}>
                <span className="leads-stat-value">{count}</span>
                <span className="leads-stat-label">Via {src === 'comment' ? 'Comentário' : 'DM'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="leads-toolbar">
          <input
            type="text"
            className="leads-search"
            placeholder="Buscar por username..."
            value={search}
            onChange={handleSearchChange}
          />
          <select
            className="leads-filter-select"
            value={sourceFilter}
            onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
          >
            <option value="">Todas fontes</option>
            <option value="comment">Comentário</option>
            <option value="dm">DM</option>
          </select>
          {allTags.length > 0 && (
            <select
              className="leads-filter-select"
              value={tagFilter}
              onChange={e => { setTagFilter(e.target.value); setPage(1); }}
            >
              <option value="">Todas tags</option>
              {allTags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          <button className="leads-btn leads-btn-secondary" onClick={handleExport}>
            Exportar CSV
          </button>
        </div>

        {/* Leads list */}
        {loading ? (
          <div className="leads-loading">
            <div className="leads-spinner" />
            Carregando leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="leads-empty">
            <p>Nenhum lead encontrado.</p>
            <p style={{ fontSize: '0.8rem' }}>Leads são criados automaticamente quando o auto-reply envia DMs.</p>
          </div>
        ) : (
          <div className="leads-list">
            {leads.map(lead => (
              <div key={lead.id} className="leads-card">
                <div className="leads-card-header">
                  <span className="leads-username">
                    <span className="leads-username-at">@</span>
                    {lead.sender_username || lead.sender_ig_id}
                  </span>
                  <span className="leads-interaction-count">
                    {lead.interaction_count} interaç{lead.interaction_count === 1 ? 'ão' : 'ões'}
                  </span>
                </div>
                <div className="leads-card-body">
                  <div className="leads-card-row">
                    <span className="leads-card-label">Fontes:</span>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {(lead.sources || []).map(s => (
                        <span key={s} className={`leads-source-badge leads-source-${s}`}>
                          {s === 'comment' ? 'Comentário' : 'DM'}
                        </span>
                      ))}
                    </div>
                  </div>
                  {lead.rules_triggered && lead.rules_triggered.length > 0 && (
                    <div className="leads-card-row">
                      <span className="leads-card-label">Regras:</span>
                      <div className="leads-rules-triggered">
                        {lead.rules_triggered.map((r, i) => (
                          <span key={i} className="leads-rule-chip">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="leads-card-row">
                    <span className="leads-card-label">Tags:</span>
                    <div className="leads-tags">
                      {(lead.tags || []).map((t, i) => (
                        <span key={i} className="leads-tag">{t}</span>
                      ))}
                      <button
                        className="leads-tag-add-btn"
                        onClick={() => openTagEditor(lead)}
                      >
                        + tag
                      </button>
                    </div>
                  </div>
                  <div className="leads-card-row">
                    <span className="leads-card-label">Primeira:</span>
                    <span className="leads-card-value">
                      {new Date(lead.first_interaction).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="leads-card-row">
                    <span className="leads-card-label">Última:</span>
                    <span className="leads-card-value">
                      {new Date(lead.last_interaction).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="leads-pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Anterior
            </button>
            <span>Página {page} de {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Próxima
            </button>
          </div>
        )}

        {/* Tag Editor Modal */}
        {editingLead && (
          <div className="leads-modal-overlay" onClick={() => setEditingLead(null)}>
            <div className="leads-modal" onClick={e => e.stopPropagation()}>
              <h3>Tags — @{editingLead.sender_username || editingLead.sender_ig_id}</h3>
              <div className="leads-modal-input-row">
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Adicionar tag (Enter)"
                />
                <button className="leads-btn leads-btn-secondary leads-btn-sm" onClick={addTag}>
                  +
                </button>
              </div>
              <div className="leads-modal-tags">
                {editTags.map((t, i) => (
                  <span key={i} className="leads-modal-tag">
                    {t}
                    <button className="leads-modal-tag-remove" onClick={() => removeTag(i)}>
                      &times;
                    </button>
                  </span>
                ))}
                {editTags.length === 0 && (
                  <span style={{ color: '#71717a', fontSize: '0.8rem' }}>Nenhuma tag</span>
                )}
              </div>
              <div className="leads-modal-actions">
                <button className="leads-btn leads-btn-secondary" onClick={() => setEditingLead(null)}>
                  Cancelar
                </button>
                <button className="leads-btn leads-btn-primary" onClick={saveTags} disabled={savingTags}>
                  {savingTags ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
