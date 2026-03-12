import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ctaAnalytics } from '../services/api';
import './CTAAnalytics.css';

export default function CTAAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ctaAnalytics.get(days);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const maxDaily = data?.daily_clicks?.length
    ? Math.max(...data.daily_clicks.map(d => d.count), 1)
    : 1;

  return (
    <AdminLayout>
      <div className="cta-analytics">
        <div className="cta-analytics-header">
          <div>
            <h1>CTA Clicks</h1>
            <p className="cta-analytics-subtitle">Rastreamento de cliques nos banners de produto</p>
          </div>
          <div className="cta-analytics-filters">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                className={`cta-filter-btn ${days === d ? 'active' : ''}`}
                onClick={() => setDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton variant="content" />
        ) : !data ? (
          <div className="cta-loading">Erro ao carregar dados</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="cta-kpis">
              <div className="cta-kpi-card">
                <span className="cta-kpi-label">Total de cliques</span>
                <span className="cta-kpi-value">{data.total_clicks}</span>
              </div>
              <div className="cta-kpi-card">
                <span className="cta-kpi-label">Hoje</span>
                <span className="cta-kpi-value cta-kpi-highlight">{data.clicks_today}</span>
              </div>
              <div className="cta-kpi-card">
                <span className="cta-kpi-label">Últimos 7 dias</span>
                <span className="cta-kpi-value">{data.clicks_week}</span>
              </div>
              <div className="cta-kpi-card">
                <span className="cta-kpi-label">Posts com cliques</span>
                <span className="cta-kpi-value">{data.top_posts.length}</span>
              </div>
            </div>

            {/* Daily Chart */}
            {data.daily_clicks.length > 0 && (
              <div className="cta-section">
                <h2 className="cta-section-title">Cliques por dia</h2>
                <div className="cta-chart">
                  {data.daily_clicks.map((d, i) => (
                    <div key={i} className="cta-chart-col">
                      <span className="cta-chart-count">{d.count || ''}</span>
                      <div
                        className="cta-chart-bar"
                        style={{ height: `${Math.max((d.count / maxDaily) * 100, 2)}%` }}
                      />
                      <span className="cta-chart-label">{d.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Posts Table */}
            <div className="cta-section">
              <h2 className="cta-section-title">Posts com mais cliques</h2>
              {data.top_posts.length === 0 ? (
                <p className="cta-empty">Nenhum clique registrado ainda.</p>
              ) : (
                <div className="cta-table-wrap">
                  <table className="cta-table">
                    <thead>
                      <tr>
                        <th>Post</th>
                        <th>Views</th>
                        <th>Cliques</th>
                        <th>Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_posts.map((p, i) => (
                        <tr key={i}>
                          <td className="cta-table-title">
                            <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                              {p.title}
                            </a>
                          </td>
                          <td>{p.view_count.toLocaleString('pt-BR')}</td>
                          <td className="cta-table-clicks">{p.cta_click_count}</td>
                          <td>
                            <span className="cta-rate-badge">{p.click_rate}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Clicks */}
            <div className="cta-section">
              <h2 className="cta-section-title">Cliques recentes</h2>
              {data.recent_clicks.length === 0 ? (
                <p className="cta-empty">Nenhum clique ainda.</p>
              ) : (
                <div className="cta-recent-list">
                  {data.recent_clicks.map((c, i) => (
                    <div key={i} className="cta-recent-item">
                      <div className="cta-recent-dot" />
                      <div className="cta-recent-info">
                        <span className="cta-recent-cta">{c.cta}</span>
                        <span className="cta-recent-post">{c.post_title || c.slug}</span>
                      </div>
                      <div className="cta-recent-meta">
                        <span className="cta-recent-ip">{c.ip}</span>
                        <span className="cta-recent-time">{c.created_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
