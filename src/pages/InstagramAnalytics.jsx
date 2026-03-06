import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useToast } from '../components/Toast';
import { instagramAnalytics } from '../services/api';
import './InstagramAnalytics.css';

export default function InstagramAnalytics() {
  const toast = useToast();
  const [tab, setTab] = useState('autoreply');

  // Auto-reply analytics
  const [arData, setArData] = useState(null);
  const [arLoading, setArLoading] = useState(false);
  const [arDays, setArDays] = useState(30);

  // Engagement report
  const [engData, setEngData] = useState(null);
  const [engLoading, setEngLoading] = useState(false);

  const loadAutoReply = useCallback(async () => {
    setArLoading(true);
    try {
      const data = await instagramAnalytics.autoreply(arDays);
      setArData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setArLoading(false);
    }
  }, [toast, arDays]);

  const loadEngagement = useCallback(async () => {
    setEngLoading(true);
    try {
      const data = await instagramAnalytics.engagement();
      setEngData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEngLoading(false);
    }
  }, [toast]);

  useEffect(() => { if (tab === 'autoreply') loadAutoReply(); }, [tab, loadAutoReply]);
  useEffect(() => { if (tab === 'engagement') loadEngagement(); }, [tab, loadEngagement]);

  const engRateClass = (rate) => {
    if (rate >= 3) return 'analytics-eng-high';
    if (rate >= 1) return 'analytics-eng-mid';
    return 'analytics-eng-low';
  };

  return (
    <AdminLayout>
      <div className="analytics-page">
        <div className="page-header">
          <h1>Analytics Instagram</h1>
          <p>Métricas de auto-resposta e engajamento dos posts</p>
        </div>

        <div className="analytics-tabs">
          <button
            className={`analytics-tab ${tab === 'autoreply' ? 'active' : ''}`}
            onClick={() => setTab('autoreply')}
          >
            Auto-Resposta
          </button>
          <button
            className={`analytics-tab ${tab === 'engagement' ? 'active' : ''}`}
            onClick={() => setTab('engagement')}
          >
            Engajamento
          </button>
        </div>

        {/* ── Auto-Reply Tab ── */}
        {tab === 'autoreply' && (
          <>
            <div className="analytics-toolbar">
              <select
                className="analytics-select"
                value={arDays}
                onChange={e => setArDays(Number(e.target.value))}
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={90}>Últimos 90 dias</option>
              </select>
            </div>

            {arLoading ? (
              <div className="analytics-loading">
                <div className="analytics-spinner" />
                Carregando métricas...
              </div>
            ) : !arData ? (
              <div className="analytics-empty">Nenhum dado disponível.</div>
            ) : (
              <>
                {/* Stats cards */}
                <div className="analytics-stats">
                  <div className="analytics-stat-card green">
                    <span className="analytics-stat-value">{arData.total_sent}</span>
                    <span className="analytics-stat-label">Enviados</span>
                  </div>
                  <div className="analytics-stat-card red">
                    <span className="analytics-stat-value">{arData.total_failed}</span>
                    <span className="analytics-stat-label">Falharam</span>
                  </div>
                  <div className="analytics-stat-card yellow">
                    <span className="analytics-stat-value">{arData.total_skipped}</span>
                    <span className="analytics-stat-label">Cooldown</span>
                  </div>
                  <div className="analytics-stat-card purple">
                    <span className="analytics-stat-value">{arData.success_rate.toFixed(1)}%</span>
                    <span className="analytics-stat-label">Taxa Sucesso</span>
                  </div>
                </div>

                <div className="analytics-grid-2">
                  {/* Top rules */}
                  <div className="analytics-card">
                    <h3 className="analytics-card-title">Top Regras</h3>
                    {arData.top_rules.length === 0 ? (
                      <div className="analytics-empty" style={{ padding: '1rem' }}>Sem dados</div>
                    ) : (
                      <div className="analytics-ranking-list">
                        {arData.top_rules.map((r, i) => {
                          const maxCount = arData.top_rules[0]?.count || 1;
                          return (
                            <div key={i} className="analytics-ranking-item">
                              <span className="analytics-ranking-name">{r.rule_name}</span>
                              <div className="analytics-ranking-bar-wrap">
                                <div
                                  className="analytics-ranking-bar-fill"
                                  style={{ width: `${(r.count / maxCount) * 100}%` }}
                                />
                              </div>
                              <span className="analytics-ranking-count">{r.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top keywords */}
                  <div className="analytics-card">
                    <h3 className="analytics-card-title">Top Keywords</h3>
                    {arData.top_keywords.length === 0 ? (
                      <div className="analytics-empty" style={{ padding: '1rem' }}>Sem dados</div>
                    ) : (
                      <div className="analytics-ranking-list">
                        {arData.top_keywords.map((k, i) => {
                          const maxCount = arData.top_keywords[0]?.count || 1;
                          return (
                            <div key={i} className="analytics-ranking-item">
                              <span className="analytics-ranking-name">{k.keyword}</span>
                              <div className="analytics-ranking-bar-wrap">
                                <div
                                  className="analytics-ranking-bar-fill"
                                  style={{ width: `${(k.count / maxCount) * 100}%` }}
                                />
                              </div>
                              <span className="analytics-ranking-count">{k.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Daily trend */}
                {arData.daily_trend.length > 0 && (
                  <div className="analytics-section">
                    <h3 className="analytics-section-title">Tendência Diária</h3>
                    <DailyTrendChart data={arData.daily_trend} />
                  </div>
                )}

                {/* Hourly distribution */}
                {arData.hourly_distribution.length > 0 && (
                  <div className="analytics-section">
                    <h3 className="analytics-section-title">Distribuição por Hora</h3>
                    <HourlyGrid data={arData.hourly_distribution} />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Engagement Tab ── */}
        {tab === 'engagement' && (
          <>
            <div className="analytics-toolbar">
              <button
                className="analytics-btn analytics-btn-secondary"
                onClick={loadEngagement}
                disabled={engLoading}
              >
                {engLoading ? 'Carregando...' : 'Atualizar dados'}
              </button>
            </div>

            {engLoading ? (
              <div className="analytics-loading">
                <div className="analytics-spinner" />
                Buscando dados do Instagram...
              </div>
            ) : !engData ? (
              <div className="analytics-empty">
                <p>Clique em "Atualizar dados" para buscar o relatório de engajamento.</p>
                <p style={{ fontSize: '0.8rem' }}>Os dados são buscados diretamente da API do Instagram.</p>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="analytics-stats">
                  <div className="analytics-stat-card blue">
                    <span className="analytics-stat-value">{engData.total_posts}</span>
                    <span className="analytics-stat-label">Posts</span>
                  </div>
                  <div className="analytics-stat-card purple">
                    <span className="analytics-stat-value">
                      {engData.followers_count.toLocaleString('pt-BR')}
                    </span>
                    <span className="analytics-stat-label">Seguidores</span>
                  </div>
                  <div className="analytics-stat-card">
                    <span className="analytics-stat-value">{engData.avg_likes.toFixed(0)}</span>
                    <span className="analytics-stat-label">Média Likes</span>
                  </div>
                  <div className="analytics-stat-card">
                    <span className="analytics-stat-value">{engData.avg_comments.toFixed(0)}</span>
                    <span className="analytics-stat-label">Média Comentários</span>
                  </div>
                  <div className="analytics-stat-card green">
                    <span className="analytics-stat-value">{engData.avg_engagement_rate.toFixed(2)}%</span>
                    <span className="analytics-stat-label">Eng. Médio</span>
                  </div>
                </div>

                {/* Best posting hours */}
                {engData.best_posting_hours.length > 0 && (
                  <div className="analytics-section">
                    <h3 className="analytics-section-title">Melhores Horários para Postar</h3>
                    <div className="analytics-ranking-list">
                      {engData.best_posting_hours.slice(0, 6).map((h, i) => {
                        const maxEng = engData.best_posting_hours[0]?.avg_engagement || 1;
                        return (
                          <div key={i} className="analytics-ranking-item">
                            <span className="analytics-ranking-name">{String(h.hour).padStart(2, '0')}:00</span>
                            <div className="analytics-ranking-bar-wrap">
                              <div
                                className="analytics-ranking-bar-fill"
                                style={{ width: `${(h.avg_engagement / maxEng) * 100}%` }}
                              />
                            </div>
                            <span className="analytics-ranking-count">
                              {h.avg_engagement.toFixed(2)}% ({h.post_count})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Posts grid */}
                {engData.posts.length > 0 && (
                  <div className="analytics-section">
                    <h3 className="analytics-section-title">Posts Recentes</h3>
                    <div className="analytics-posts-grid">
                      {engData.posts.map(post => (
                        <div key={post.id} className="analytics-post-card">
                          {post.media_url && post.media_type !== 'VIDEO' && (
                            <img
                              className="analytics-post-thumb"
                              src={post.media_url}
                              alt=""
                              loading="lazy"
                            />
                          )}
                          {post.media_type === 'VIDEO' && (
                            <div className="analytics-post-thumb" style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#71717a', fontSize: '0.85rem'
                            }}>
                              Video
                            </div>
                          )}
                          <div className="analytics-post-info">
                            {post.caption && (
                              <p className="analytics-post-caption">{post.caption}</p>
                            )}
                            <div className="analytics-post-metrics">
                              <div className="analytics-post-metric">
                                <span className="analytics-post-metric-value">{post.like_count}</span>
                                <span className="analytics-post-metric-label">Likes</span>
                              </div>
                              <div className="analytics-post-metric">
                                <span className="analytics-post-metric-value">{post.comments_count}</span>
                                <span className="analytics-post-metric-label">Coment.</span>
                              </div>
                              <div className="analytics-post-metric">
                                <span className={`analytics-eng-badge ${engRateClass(post.engagement_rate)}`}>
                                  {post.engagement_rate.toFixed(2)}%
                                </span>
                                <span className="analytics-post-metric-label">Eng.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// ─── Pure CSS Daily Trend Chart ──────────────────────────────────────

function DailyTrendChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => Math.max(d.sent, d.failed)), 1);

  return (
    <>
      <div className="analytics-daily-chart">
        {data.map((d, i) => (
          <div key={i} className="analytics-daily-group" title={`${d.date}: ${d.sent} enviados, ${d.failed} falhas`}>
            <div
              className="analytics-daily-bar-sent"
              style={{ height: `${(d.sent / maxVal) * 100}%` }}
            />
            <div
              className="analytics-daily-bar-failed"
              style={{ height: `${(d.failed / maxVal) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="analytics-daily-labels">
        {data.map((d, i) => (
          <span key={i} className="analytics-daily-label">
            {d.date.slice(5)}
          </span>
        ))}
      </div>
      <div className="analytics-daily-legend">
        <span>
          <span className="analytics-daily-legend-dot" style={{ background: '#22c55e' }} />
          Enviados
        </span>
        <span>
          <span className="analytics-daily-legend-dot" style={{ background: '#ef4444' }} />
          Falhas
        </span>
      </div>
    </>
  );
}

// ─── Hourly Grid (24h) ──────────────────────────────────────────────

function HourlyGrid({ data }) {
  // Build a full 24-hour array
  const hourMap = {};
  data.forEach(h => { hourMap[h.hour] = h.count; });
  const maxCount = Math.max(...data.map(h => h.count), 1);

  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: hourMap[i] || 0,
  }));

  const cellBg = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.02)';
    const intensity = count / maxCount;
    const alpha = 0.15 + intensity * 0.5;
    return `rgba(168, 85, 247, ${alpha})`;
  };

  return (
    <div className="analytics-hourly-grid">
      {hours.map(h => (
        <div
          key={h.hour}
          className="analytics-hour-cell"
          style={{ background: cellBg(h.count) }}
          title={`${String(h.hour).padStart(2, '0')}h: ${h.count} envios`}
        >
          <span className="analytics-hour-cell-label">{String(h.hour).padStart(2, '0')}h</span>
          {h.count > 0 && (
            <span className="analytics-hour-cell-value">{h.count}</span>
          )}
        </div>
      ))}
    </div>
  );
}
