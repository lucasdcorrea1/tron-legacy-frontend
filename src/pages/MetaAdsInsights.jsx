import { useState, useEffect } from 'react';
import { metaAds } from '../services/api';
import './MetaAdsInsights.css';

const LEVELS = [
  { value: 'account', label: 'Conta' },
  { value: 'campaign', label: 'Campanha' },
  { value: 'adset', label: 'Conjunto' },
  { value: 'ad', label: 'Anuncio' },
];

export default function MetaAdsInsights({ adAccountId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState('account');
  const [dateStart, setDateStart] = useState(
    new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  );
  const [dateStop, setDateStop] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [sortKey, setSortKey] = useState('spend');
  const [sortDir, setSortDir] = useState(-1);

  useEffect(() => {
    loadInsights();
  }, [level, dateStart, dateStop, adAccountId]);

  const loadInsights = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await metaAds.getInsights({ level, date_start: dateStart, date_stop: dateStop, ad_account_id: adAccountId || undefined });
      setData(result?.data || []);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const parseNum = (val) => {
    if (val === undefined || val === null) return 0;
    return parseFloat(val) || 0;
  };

  const totals = data.reduce((acc, row) => ({
    impressions: acc.impressions + parseNum(row.impressions),
    reach: acc.reach + parseNum(row.reach),
    clicks: acc.clicks + parseNum(row.clicks),
    spend: acc.spend + parseNum(row.spend),
    ctr: acc.ctr + parseNum(row.ctr),
    cpc: acc.cpc + parseNum(row.cpc),
    cpm: acc.cpm + parseNum(row.cpm),
  }), { impressions: 0, reach: 0, clicks: 0, spend: 0, ctr: 0, cpc: 0, cpm: 0 });

  // Average CTR, CPC, CPM when multiple rows
  const rowCount = data.length || 1;
  const avgCtr = totals.ctr / rowCount;
  const avgCpc = totals.cpc / rowCount;
  const avgCpm = totals.cpm / rowCount;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d * -1);
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = parseNum(a[sortKey]);
    const bVal = parseNum(b[sortKey]);
    return (aVal - bVal) * sortDir;
  });

  const exportCSV = () => {
    if (data.length === 0) return;

    const headers = ['Nome', 'Impressoes', 'Alcance', 'Cliques', 'Gasto', 'CTR', 'CPC', 'CPM'];
    const rows = sortedData.map(row => {
      const name = row.campaign_name || row.adset_name || row.ad_name || '-';
      return [
        name,
        parseNum(row.impressions),
        parseNum(row.reach),
        parseNum(row.clicks),
        parseNum(row.spend).toFixed(2),
        parseNum(row.ctr).toFixed(2),
        parseNum(row.cpc).toFixed(2),
        parseNum(row.cpm).toFixed(2),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meta_ads_insights_${level}_${dateStart}_${dateStop}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatNumber = (n) => Number(n).toLocaleString('pt-BR');
  const formatCurrency = (n) => `R$ ${parseNum(n).toFixed(2)}`;

  return (
    <div className="mads-insights">
      {/* Filters */}
      <div className="mads-insights-filters">
        <div className="mads-insights-levels">
          {LEVELS.map(l => (
            <button
              key={l.value}
              className={`mads-level-btn ${level === l.value ? 'active' : ''}`}
              onClick={() => setLevel(l.value)}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="mads-insights-dates">
          <input
            type="date"
            value={dateStart}
            onChange={e => setDateStart(e.target.value)}
          />
          <span>ate</span>
          <input
            type="date"
            value={dateStop}
            onChange={e => setDateStop(e.target.value)}
          />
        </div>

        <button className="mads-btn secondary small" onClick={exportCSV} disabled={data.length === 0}>
          Exportar CSV
        </button>
      </div>

      {error && <div className="mads-error">{error}</div>}

      {/* Summary cards */}
      <div className="mads-insights-cards">
        <div className="mads-insight-card">
          <span className="mads-insight-label">Gasto Total</span>
          <span className="mads-insight-value spend">{formatCurrency(totals.spend)}</span>
        </div>
        <div className="mads-insight-card">
          <span className="mads-insight-label">Impressoes</span>
          <span className="mads-insight-value">{formatNumber(totals.impressions)}</span>
        </div>
        <div className="mads-insight-card">
          <span className="mads-insight-label">Cliques</span>
          <span className="mads-insight-value">{formatNumber(totals.clicks)}</span>
        </div>
        <div className="mads-insight-card">
          <span className="mads-insight-label">Alcance</span>
          <span className="mads-insight-value">{formatNumber(totals.reach)}</span>
        </div>
        <div className="mads-insight-card">
          <span className="mads-insight-label">CTR</span>
          <span className="mads-insight-value">{avgCtr.toFixed(2)}%</span>
        </div>
        <div className="mads-insight-card">
          <span className="mads-insight-label">CPC</span>
          <span className="mads-insight-value">{formatCurrency(avgCpc)}</span>
        </div>
        <div className="mads-insight-card">
          <span className="mads-insight-label">CPM</span>
          <span className="mads-insight-value">{formatCurrency(avgCpm)}</span>
        </div>
      </div>

      {/* Data table */}
      {loading ? (
        <div className="mads-loading">
          <span className="ig-spinner" />
          Carregando insights...
        </div>
      ) : data.length === 0 ? (
        <div className="mads-empty">
          <p>Nenhum dado disponivel para o periodo selecionado</p>
        </div>
      ) : (
        <div className="mads-table-wrapper">
          <table className="mads-table">
            <thead>
              <tr>
                {level !== 'account' && (
                  <th onClick={() => handleSort('campaign_name')}>Nome</th>
                )}
                <th onClick={() => handleSort('impressions')}>
                  Impressoes {sortKey === 'impressions' ? (sortDir > 0 ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('reach')}>
                  Alcance {sortKey === 'reach' ? (sortDir > 0 ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('clicks')}>
                  Cliques {sortKey === 'clicks' ? (sortDir > 0 ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('spend')}>
                  Gasto {sortKey === 'spend' ? (sortDir > 0 ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('ctr')}>
                  CTR {sortKey === 'ctr' ? (sortDir > 0 ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('cpc')}>
                  CPC {sortKey === 'cpc' ? (sortDir > 0 ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => handleSort('cpm')}>
                  CPM {sortKey === 'cpm' ? (sortDir > 0 ? '↑' : '↓') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr key={i}>
                  {level !== 'account' && (
                    <td className="mads-cell-name">
                      {row.campaign_name || row.adset_name || row.ad_name || '-'}
                    </td>
                  )}
                  <td>{formatNumber(row.impressions)}</td>
                  <td>{formatNumber(row.reach)}</td>
                  <td>{formatNumber(row.clicks)}</td>
                  <td className="mads-cell-spend">{formatCurrency(row.spend)}</td>
                  <td>{parseNum(row.ctr).toFixed(2)}%</td>
                  <td>{formatCurrency(row.cpc)}</td>
                  <td>{formatCurrency(row.cpm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
