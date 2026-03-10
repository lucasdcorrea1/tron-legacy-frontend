import { useState, useEffect, useRef, useCallback } from 'react';
import { metaAds } from '../services/api';
import './MetaAdsFinanceiro.css';

const PERIODS = [
  { value: 7, label: '7 dias' },
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
];

function SpendChart({ data, maxSpend, formatCurrency }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const padding = { top: 20, right: 16, bottom: 32, left: 60 };
  const width = 800;
  const height = 240;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const n = data.length;
  const xStep = n > 1 ? chartW / (n - 1) : chartW;

  // Y-axis ticks (4 lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    value: maxSpend * f,
    y: padding.top + chartH * (1 - f),
  }));

  // Build path
  const points = data.map((d, i) => {
    const x = padding.left + (n > 1 ? i * xStep : xStep / 2);
    const y = padding.top + chartH * (1 - d.spend / maxSpend);
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  // X-axis labels — show ~6 evenly spaced
  const labelCount = Math.min(6, n);
  const labelStep = Math.max(1, Math.floor((n - 1) / (labelCount - 1)));
  const xLabels = [];
  for (let i = 0; i < n; i += labelStep) xLabels.push(i);
  if (xLabels[xLabels.length - 1] !== n - 1) xLabels.push(n - 1);

  const formatDate = (dateStr) => {
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const idx = Math.round((mouseX - padding.left) / xStep);
    const clamped = Math.max(0, Math.min(n - 1, idx));
    setHover(clamped);
  }, [n, xStep]);

  return (
    <div className="mads-area-chart" onMouseLeave={() => setHover(null)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
      >
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padding.left} y1={t.y} x2={width - padding.right} y2={t.y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <text x={padding.left - 8} y={t.y + 4} textAnchor="end" className="mads-chart-label">
              {formatCurrency(t.value)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#spendGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i} cx={p.x} cy={p.y} r={hover === i ? 5 : 2.5}
            fill={hover === i ? '#60a5fa' : '#3b82f6'}
            stroke={hover === i ? '#1e3a5f' : 'none'}
            strokeWidth="2"
          />
        ))}

        {/* X labels */}
        {xLabels.map(i => (
          <text key={i} x={points[i].x} y={height - 6} textAnchor="middle" className="mads-chart-label">
            {formatDate(data[i].date)}
          </text>
        ))}

        {/* Hover vertical line */}
        {hover !== null && points[hover] && (
          <line
            x1={points[hover].x} y1={padding.top}
            x2={points[hover].x} y2={padding.top + chartH}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hover !== null && points[hover] && (
        <div
          className="mads-chart-tooltip"
          style={{ left: `${(points[hover].x / width) * 100}%`, top: `${(points[hover].y / height) * 100}%` }}
        >
          <span className="mads-chart-tooltip-date">{formatDate(data[hover].date)}</span>
          <span className="mads-chart-tooltip-value">{formatCurrency(data[hover].spend)}</span>
        </div>
      )}
    </div>
  );
}

export default function MetaAdsFinanceiro() {
  const [campaigns, setCampaigns] = useState([]);
  const [insights, setInsights] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [accountFinance, setAccountFinance] = useState(null);
  const [opportunityScore, setOpportunityScore] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [expandedRec, setExpandedRec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(30);
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState(-1);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const dateStop = new Date().toISOString().slice(0, 10);
      const dateStart = new Date(Date.now() - period * 86400000).toISOString().slice(0, 10);

      const [campaignsRes, insightsRes, financeRes, recsRes] = await Promise.allSettled([
        metaAds.listCampaigns(),
        metaAds.getInsights({ level: 'campaign', date_start: dateStart, date_stop: dateStop }),
        metaAds.getAccountFinance(),
        metaAds.getAccountRecommendations(),
      ]);

      const campaignList = campaignsRes.status === 'fulfilled' ? (campaignsRes.value?.data || campaignsRes.value || []) : [];
      const insightsList = insightsRes.status === 'fulfilled' ? (insightsRes.value?.data || []) : [];

      setCampaigns(Array.isArray(campaignList) ? campaignList : []);
      setInsights(insightsList);

      if (financeRes.status === 'fulfilled' && financeRes.value) {
        setAccountFinance(financeRes.value);
      }

      if (recsRes.status === 'fulfilled' && recsRes.value) {
        setOpportunityScore(recsRes.value.opportunity_score ?? null);
        setRecommendations(recsRes.value.recommendations || []);
      }

      // Build daily spend data from campaign insights with daily breakdown
      await loadDailyData(dateStart, dateStop);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyData = async (dateStart, dateStop) => {
    try {
      // Get account-level daily insights
      const days = [];
      const start = new Date(dateStart);
      const stop = new Date(dateStop);

      // Request insights day by day would be slow, so try to get the full range
      // and parse date_start/date_stop from each entry
      const result = await metaAds.getInsights({
        level: 'account',
        date_start: dateStart,
        date_stop: dateStop,
        time_increment: 1,
      });

      const data = result?.data || [];

      // If we got a single aggregated entry, distribute evenly for the chart
      if (data.length <= 1) {
        const totalSpend = data.length === 1 ? parseNum(data[0].spend) : 0;
        const numDays = Math.ceil((stop - start) / 86400000) || 1;
        const dailyAvg = totalSpend / numDays;
        const current = new Date(start);
        while (current <= stop) {
          days.push({
            date: current.toISOString().slice(0, 10),
            spend: dailyAvg,
          });
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Multiple entries - use them as-is
        data.forEach(entry => {
          days.push({
            date: entry.date_start || entry.date || '',
            spend: parseNum(entry.spend),
          });
        });
      }

      setDailyData(days);
    } catch {
      setDailyData([]);
    }
  };

  const parseNum = (val) => {
    if (val === undefined || val === null) return 0;
    return parseFloat(val) || 0;
  };

  const formatCurrency = (n) => `R$ ${parseNum(n).toFixed(2)}`;
  const formatNumber = (n) => Number(n).toLocaleString('pt-BR');

  // Summary calculations
  const totalSpend = insights.reduce((sum, r) => sum + parseNum(r.spend), 0);
  const totalClicks = insights.reduce((sum, r) => sum + parseNum(r.clicks), 0);
  const totalReach = insights.reduce((sum, r) => sum + parseNum(r.reach), 0);
  const totalImpressions = insights.reduce((sum, r) => sum + parseNum(r.impressions), 0);

  // Budget from campaigns
  const totalBudget = (Array.isArray(campaigns) ? campaigns : []).reduce((sum, c) => {
    const daily = parseNum(c.daily_budget);
    const lifetime = parseNum(c.lifetime_budget);
    if (lifetime > 0) return sum + lifetime / 100;
    if (daily > 0) return sum + (daily / 100) * period;
    return sum;
  }, 0);

  const balance = totalBudget - totalSpend;
  const costPerClick = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const costPerReach = totalReach > 0 ? (totalSpend / totalReach) * 1000 : 0;

  // Chart calculations
  const maxSpend = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.spend), 0.01) : 1;

  // Sorting
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d * -1);
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  const sortedInsights = [...insights].sort((a, b) => {
    const aVal = parseNum(a[sortKey]);
    const bVal = parseNum(b[sortKey]);
    return (aVal - bVal) * sortDir;
  });

  // Best/worst per metric
  const getBestWorst = (key) => {
    if (insights.length < 2) return { best: null, worst: null };
    const sorted = [...insights].sort((a, b) => parseNum(b[key]) - parseNum(a[key]));
    return {
      best: sorted[0]?.campaign_name || sorted[0]?.campaign_id,
      worst: sorted[sorted.length - 1]?.campaign_name || sorted[sorted.length - 1]?.campaign_id,
    };
  };

  const sortArrow = (key) => sortKey === key ? (sortDir > 0 ? ' ↑' : ' ↓') : '';

  if (loading) {
    return (
      <div className="mads-loading">
        <span className="ig-spinner" />
        Carregando dados financeiros...
      </div>
    );
  }

  return (
    <div className="mads-fin">
      {error && <div className="mads-error">{error}</div>}

      {/* Opportunity Score + Recommendations */}
      {(opportunityScore !== null || recommendations.length > 0) && (
        <div className="mads-opp-section">
          <div className="mads-opp-header">
            <div className="mads-opp-gauge">
              <svg viewBox="0 0 120 120" className="mads-opp-svg">
                <circle
                  cx="60" cy="60" r="52"
                  fill="none" stroke="#27272a" strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke={
                    (opportunityScore || 0) > 70 ? '#22c55e'
                      : (opportunityScore || 0) > 30 ? '#f59e0b'
                        : '#ef4444'
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${((opportunityScore || 0) / 100) * 326.73} 326.73`}
                  transform="rotate(-90 60 60)"
                />
                <text x="60" y="54" textAnchor="middle" className="mads-opp-score-text">
                  {Math.round(opportunityScore || 0)}
                </text>
                <text x="60" y="72" textAnchor="middle" className="mads-opp-score-label">
                  /100
                </text>
              </svg>
            </div>
            <div className="mads-opp-info">
              <h3 className="mads-section-title">Pontuacao de Oportunidade</h3>
              {recommendations.length > 0 ? (
                <p className="mads-opp-desc">
                  Aplicar {recommendations.length} recomendacao(oes) pode aumentar
                  sua pontuacao em ate{' '}
                  <strong>
                    {recommendations.reduce((sum, r) => sum + (r.opportunity_score_lift || 0), 0)} pontos
                  </strong>
                </p>
              ) : (
                <p className="mads-opp-desc">Nenhuma recomendacao disponivel no momento</p>
              )}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="mads-recs-list">
              <h4 className="mads-recs-title">Recomendacoes</h4>
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`mads-rec-card ${expandedRec === i ? 'expanded' : ''}`}
                  onClick={() => setExpandedRec(expandedRec === i ? null : i)}
                >
                  <div className="mads-rec-row">
                    <span className="mads-rec-badge">+{rec.opportunity_score_lift || 0} pts</span>
                    <span className="mads-rec-type">{(rec.type || '').replace(/_/g, ' ')}</span>
                    <span className="mads-rec-expand">{expandedRec === i ? '−' : '+'}</span>
                  </div>
                  {expandedRec === i && (
                    <div className="mads-rec-details">
                      {rec.body && <p className="mads-rec-body">{rec.body}</p>}
                      {rec.lift_estimate && (
                        <p className="mads-rec-lift">Resultado esperado: {rec.lift_estimate}</p>
                      )}
                      {rec.url && (
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mads-rec-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver no Ads Manager →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account finance overview */}
      {accountFinance && (
        <div className="mads-acct-finance">
          <div className="mads-acct-finance-header">
            <h3 className="mads-section-title">Conta: {accountFinance.name || 'Meta Ads'}</h3>
            <span className={`mads-acct-status ${accountFinance.account_status === 1 ? 'active' : 'inactive'}`}>
              {accountFinance.account_status === 1 ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <div className="mads-acct-finance-grid">
            <div className="mads-fin-card cap">
              <span className="mads-fin-card-label">Limite da Conta</span>
              <span className="mads-fin-card-value">
                {accountFinance.has_spend_cap ? formatCurrency(accountFinance.spend_cap) : 'Sem limite'}
              </span>
              <span className="mads-fin-card-sub">{accountFinance.currency || 'BRL'}</span>
            </div>
            <div className="mads-fin-card spent">
              <span className="mads-fin-card-label">Total Gasto (Conta)</span>
              <span className="mads-fin-card-value">{formatCurrency(accountFinance.amount_spent)}</span>
              <span className="mads-fin-card-sub">acumulado total</span>
            </div>
            <div className="mads-fin-card remaining">
              <span className="mads-fin-card-label">Saldo Disponivel</span>
              <span className="mads-fin-card-value">
                {accountFinance.has_spend_cap ? formatCurrency(accountFinance.remaining) : '∞'}
              </span>
              <span className="mads-fin-card-sub">
                {accountFinance.has_spend_cap
                  ? `${accountFinance.spend_cap > 0 ? Math.round((accountFinance.remaining / accountFinance.spend_cap) * 100) : 0}% restante`
                  : 'sem limite definido'}
              </span>
            </div>
            <div className="mads-fin-card today">
              <span className="mads-fin-card-label">Gasto Hoje</span>
              <span className="mads-fin-card-value">{formatCurrency(accountFinance.spend_today)}</span>
              <span className="mads-fin-card-sub">este mes: {formatCurrency(accountFinance.spend_this_month)}</span>
            </div>
          </div>
          {accountFinance.has_spend_cap && (
            <div className="mads-acct-spend-bar-wrapper">
              <div className="mads-acct-spend-bar-bg">
                <div
                  className="mads-acct-spend-bar-fill"
                  style={{ width: `${Math.min((accountFinance.amount_spent / accountFinance.spend_cap) * 100, 100)}%` }}
                />
              </div>
              <span className="mads-acct-spend-bar-text">
                {formatCurrency(accountFinance.amount_spent)} / {formatCurrency(accountFinance.spend_cap)}
                {' '}({Math.round((accountFinance.amount_spent / accountFinance.spend_cap) * 100)}%)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Period selector */}
      <div className="mads-fin-period">
        {PERIODS.map(p => (
          <button
            key={p.value}
            className={`mads-level-btn ${period === p.value ? 'active' : ''}`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="mads-fin-cards">
        <div className="mads-fin-card spend">
          <span className="mads-fin-card-label">Gasto Total</span>
          <span className="mads-fin-card-value">{formatCurrency(totalSpend)}</span>
          <span className="mads-fin-card-sub">nos ultimos {period} dias</span>
        </div>
        <div className="mads-fin-card budget">
          <span className="mads-fin-card-label">Orcamento Alocado</span>
          <span className="mads-fin-card-value">{formatCurrency(totalBudget)}</span>
          <span className="mads-fin-card-sub">{campaigns.length} campanha(s)</span>
        </div>
        <div className="mads-fin-card balance">
          <span className="mads-fin-card-label">Saldo Restante</span>
          <span className="mads-fin-card-value">{formatCurrency(balance)}</span>
          <span className="mads-fin-card-sub">{totalBudget > 0 ? Math.round((balance / totalBudget) * 100) : 0}% disponivel</span>
        </div>
        <div className="mads-fin-card roi">
          <span className="mads-fin-card-label">Custo por Clique</span>
          <span className="mads-fin-card-value">{formatCurrency(costPerClick)}</span>
          <span className="mads-fin-card-sub">CPM: {formatCurrency(costPerReach)}</span>
        </div>
      </div>

      {/* Spend chart */}
      <div className="mads-fin-chart-section">
        <h3 className="mads-section-title">Gastos ao Longo do Tempo</h3>
        {dailyData.length === 0 ? (
          <div className="mads-empty"><p>Sem dados de gastos para o periodo</p></div>
        ) : (
          <SpendChart data={dailyData} maxSpend={maxSpend} formatCurrency={formatCurrency} />
        )}
      </div>

      {/* Comparison table */}
      <div className="mads-fin-table-section">
        <h3 className="mads-section-title">Comparativo por Campanha</h3>
        {insights.length === 0 ? (
          <div className="mads-empty"><p>Nenhuma campanha com dados no periodo</p></div>
        ) : (
          <div className="mads-table-wrapper">
            <table className="mads-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('campaign_name')}>Nome{sortArrow('campaign_name')}</th>
                  <th onClick={() => handleSort('spend')}>Gasto{sortArrow('spend')}</th>
                  <th onClick={() => handleSort('reach')}>Alcance{sortArrow('reach')}</th>
                  <th onClick={() => handleSort('impressions')}>Impressoes{sortArrow('impressions')}</th>
                  <th onClick={() => handleSort('clicks')}>Cliques{sortArrow('clicks')}</th>
                  <th onClick={() => handleSort('ctr')}>CTR{sortArrow('ctr')}</th>
                  <th onClick={() => handleSort('cpc')}>CPC{sortArrow('cpc')}</th>
                  <th onClick={() => handleSort('cpm')}>CPM{sortArrow('cpm')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedInsights.map((row, i) => {
                  const name = row.campaign_name || row.campaign_id || '-';
                  const ctrBw = getBestWorst('ctr');
                  const cpcBw = getBestWorst('cpc');
                  const isBestCtr = ctrBw.best === name;
                  const isWorstCtr = ctrBw.worst === name;
                  const isBestCpc = cpcBw.best === name;
                  const isWorstCpc = cpcBw.worst === name;

                  return (
                    <tr key={i}>
                      <td className="mads-cell-name">{name}</td>
                      <td className="mads-cell-spend">{formatCurrency(row.spend)}</td>
                      <td>{formatNumber(row.reach)}</td>
                      <td>{formatNumber(row.impressions)}</td>
                      <td>{formatNumber(row.clicks)}</td>
                      <td className={isBestCtr ? 'mads-cell-best' : isWorstCtr ? 'mads-cell-worst' : ''}>
                        {parseNum(row.ctr).toFixed(2)}%
                      </td>
                      <td className={isBestCpc ? 'mads-cell-best' : isWorstCpc ? 'mads-cell-worst' : ''}>
                        {formatCurrency(row.cpc)}
                      </td>
                      <td>{formatCurrency(row.cpm)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="mads-fin-totals-row">
                  <td><strong>Total</strong></td>
                  <td className="mads-cell-spend"><strong>{formatCurrency(totalSpend)}</strong></td>
                  <td><strong>{formatNumber(totalReach)}</strong></td>
                  <td><strong>{formatNumber(totalImpressions)}</strong></td>
                  <td><strong>{formatNumber(totalClicks)}</strong></td>
                  <td><strong>{totalClicks > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'}%</strong></td>
                  <td><strong>{formatCurrency(costPerClick)}</strong></td>
                  <td><strong>{formatCurrency(costPerReach)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
