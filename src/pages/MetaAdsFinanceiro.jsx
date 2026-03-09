import { useState, useEffect } from 'react';
import { metaAds } from '../services/api';
import './MetaAdsFinanceiro.css';

const PERIODS = [
  { value: 7, label: '7 dias' },
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
];

export default function MetaAdsFinanceiro() {
  const [campaigns, setCampaigns] = useState([]);
  const [insights, setInsights] = useState([]);
  const [dailyData, setDailyData] = useState([]);
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

      const [campaignsRes, insightsRes] = await Promise.all([
        metaAds.listCampaigns(),
        metaAds.getInsights({ level: 'campaign', date_start: dateStart, date_stop: dateStop }),
      ]);

      const campaignList = campaignsRes?.data || campaignsRes || [];
      const insightsList = insightsRes?.data || [];

      setCampaigns(Array.isArray(campaignList) ? campaignList : []);
      setInsights(insightsList);

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
          <div className="mads-fin-chart">
            <div className="mads-fin-chart-y">
              <span>{formatCurrency(maxSpend)}</span>
              <span>{formatCurrency(maxSpend / 2)}</span>
              <span>R$ 0</span>
            </div>
            <div className="mads-fin-chart-bars">
              {dailyData.map((d, i) => (
                <div key={i} className="mads-fin-bar-col" title={`${d.date}: ${formatCurrency(d.spend)}`}>
                  <div
                    className="mads-fin-bar"
                    style={{ height: `${Math.max((d.spend / maxSpend) * 100, 1)}%` }}
                  />
                  {(i % Math.max(Math.floor(dailyData.length / 7), 1) === 0 || i === dailyData.length - 1) && (
                    <span className="mads-fin-bar-label">{d.date.slice(5)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
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
