import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portal } from '../services/api';
import './PortalDashboard.css';

// ── Formatters ───────────────────────────────────────────────────────

const fmtMoney = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtMoneyCompact = (v) => {
  const abs = Math.abs(v || 0);
  if (abs >= 1e6) return `R$ ${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `R$ ${(v / 1e3).toFixed(1)}k`;
  return fmtMoney(v);
};

const fmtPct = (v) => {
  if (v == null) return '—';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}%`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const fmtMonth = (s) => {
  if (!s) return '';
  const [y, m] = s.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
};

const greetingFor = (name) => {
  const h = new Date().getHours();
  const first = (name || '').split(' ')[0];
  const period = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return first ? `${period}, ${first}` : period;
};

// ── Period presets ───────────────────────────────────────────────────

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const PERIODS = [
  { key: '7d',  label: '7 dias',     from: () => daysAgoISO(7),    to: todayISO },
  { key: 'mtd', label: 'Este mês',   from: monthStartISO,           to: todayISO },
  { key: '30d', label: '30 dias',    from: () => daysAgoISO(30),   to: todayISO },
  { key: '90d', label: '90 dias',    from: () => daysAgoISO(90),   to: todayISO },
];

// ── Icons (inline SVG, no deps) ──────────────────────────────────────

const Icon = {
  trendUp: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  trendDown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  arrowIn: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  arrowOut: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="17" x2="7" y2="7"/><polyline points="17 7 17 17 7 17"/></svg>,
};

// ══════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════

export default function PortalDashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(null);
  const [summary, setSummary] = useState(null);
  const [cashflow, setCashflow] = useState([]);
  const [categories, setCategories] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState('');
  const [period, setPeriod] = useState('mtd');

  // Apply resolved theme to CSS variables on the root element of the page.
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    const map = {
      '--pd-bg-0':         theme.bg_color,
      '--pd-bg-1':         theme.bg_color,
      '--pd-bg-elev':      theme.surface_color,
      '--pd-text':         theme.text_color,
      '--pd-text-muted':   theme.text_muted_color,
      '--pd-primary':      theme.primary_color,
      '--pd-success':      theme.success_color,
      '--pd-danger':       theme.danger_color,
    };
    const prev = {};
    Object.entries(map).forEach(([k, v]) => {
      if (!v) return;
      prev[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, v);
    });
    return () => {
      Object.entries(prev).forEach(([k, v]) => {
        if (v) root.style.setProperty(k, v); else root.style.removeProperty(k);
      });
    };
  }, [theme]);

  const range = useMemo(() => {
    const p = PERIODS.find((x) => x.key === period) || PERIODS[1];
    return { from: p.from(), to: p.to() };
  }, [period]);

  useEffect(() => {
    if (!portal.getToken()) {
      navigate('/portal/login', { replace: true });
      return;
    }
    portal.me()
      .then((s) => {
        setSession(s);
        if (!s.has_conta_azul) {
          navigate('/portal/conectar', { replace: true });
          return null;
        }
        return s;
      })
      .then((s) => { if (s) loadAll(s, range, true); })
      .catch(() => navigate('/portal/login', { replace: true }));
    portal.theme().then(setTheme).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when period changes (after session is loaded)
  useEffect(() => {
    if (session?.has_conta_azul) loadAll(session, range, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadAll = async (s, { from, to }, initial) => {
    if (initial) setLoading(true); else setRefreshing(true);
    setErr('');
    const access = s.dashboard_access || [];
    try {
      const tasks = [];
      if (access.some((k) => ['revenue', 'expense', 'profit'].includes(k))) {
        tasks.push(portal.dashboardSummary({ from, to, compare: true }).then(setSummary).catch(() => {}));
      }
      if (access.includes('cashflow')) {
        tasks.push(portal.dashboardCashflow().then((r) => setCashflow(r.points || [])).catch(() => {}));
      }
      if (access.includes('categories')) {
        tasks.push(portal.dashboardCategories({ from, to }).then((r) => setCategories(r.items || [])).catch(() => {}));
      }
      if (access.includes('upcoming')) {
        tasks.push(portal.dashboardUpcoming({ days: 30 }).then((r) => setUpcoming(r.items || [])).catch(() => {}));
      }
      await Promise.all(tasks);
    } catch (e) {
      setErr(e.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await portal.logout();
    navigate('/portal/login', { replace: true });
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Desconectar sua Conta Azul? Você precisará autorizar novamente para ver os dados.')) return;
    try {
      await portal.contaAzulDisconnect();
      navigate('/portal/conectar', { replace: true });
    } catch (e) {
      setErr(e.message || 'Falha ao desconectar');
    }
  };

  if (!session) {
    return (
      <div className="pd-shell" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="pd-skel" style={{ width: 180, height: 14 }} />
      </div>
    );
  }

  const access = session.dashboard_access || [];
  const initials = (session.name || 'C').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="pd-shell">
      <header className="pd-header">
        <div className="pd-header-brand">
          {theme?.logo_url ? (
            <img
              src={theme.logo_url}
              alt={theme?.brand_name || 'logo'}
              style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain', background: 'var(--pd-bg-elev)' }}
            />
          ) : (
            <span className="pd-brand-dot">{(theme?.brand_name || 'W')[0]}</span>
          )}
          <span>{theme?.brand_name || 'Painel Financeiro'}</span>
        </div>
        <div className="pd-header-actions">
          <button
            className={`pd-icon-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => loadAll(session, range, false)}
            title="Atualizar dados"
          >
            {Icon.refresh}
          </button>
          <button className="pd-link-btn" onClick={handleDisconnect}>
            {Icon.link} Desconectar
          </button>
          <div className="pd-user-pill">
            <span>{session.name}</span>
            <div className="pd-avatar">{initials}</div>
          </div>
          <button className="pd-link-btn danger" onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="pd-main">
        <div className="pd-hero">
          <div className="pd-greeting">
            <h1>{greetingFor(session.name)}</h1>
            <p>Resumo da saúde financeira do seu negócio.</p>
          </div>
          <div className="pd-period" role="tablist">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                role="tab"
                aria-selected={period === p.key}
                className={`pd-period-btn ${period === p.key ? 'active' : ''}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {err && <div className="pd-error">{err}</div>}

        {/* KPIs */}
        <div className="pd-kpi-grid">
          {access.includes('revenue') && (
            <KpiCard
              label="Receita"
              variant="revenue"
              value={summary?.total_revenue}
              delta={summary?.compare?.revenue_change_pct}
              loading={loading}
            />
          )}
          {access.includes('expense') && (
            <KpiCard
              label="Despesa"
              variant="expense"
              value={summary?.total_expense}
              delta={summary?.compare?.expense_change_pct}
              loading={loading}
              invertDelta
            />
          )}
          {access.includes('profit') && (
            <KpiCard
              label="Lucro"
              variant="profit"
              value={summary?.profit}
              delta={summary?.compare?.profit_change_pct}
              loading={loading}
            />
          )}
        </div>

        {/* Open balances */}
        {(access.includes('revenue') || access.includes('expense')) && summary && (
          <div className="pd-open-strip">
            {access.includes('revenue') && (
              <div className="pd-open-cell">
                <div className="pd-open-emoji in">{Icon.arrowIn}</div>
                <div>
                  <div className="label">A receber em aberto</div>
                  <div className="value">{fmtMoney(summary.open_receivable)}</div>
                </div>
              </div>
            )}
            {access.includes('expense') && (
              <div className="pd-open-cell">
                <div className="pd-open-emoji out">{Icon.arrowOut}</div>
                <div>
                  <div className="label">A pagar em aberto</div>
                  <div className="value">{fmtMoney(summary.open_payable)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cashflow */}
        {access.includes('cashflow') && (
          <section className="pd-section">
            <div className="pd-section-head">
              <div>
                <h3>Fluxo de Caixa</h3>
                <span className="hint">Últimos 6 meses</span>
              </div>
              <div className="pd-chart-legend">
                <span><span className="pd-dot green"/> Receita</span>
                <span><span className="pd-dot red"/> Despesa</span>
              </div>
            </div>
            {cashflow.length === 0 ? <EmptyHint label="Sem movimentação registrada no período." />
              : <CashflowChart points={cashflow} />}
          </section>
        )}

        {/* Categories */}
        {access.includes('categories') && (
          <section className="pd-section">
            <div className="pd-section-head">
              <div>
                <h3>Top Categorias DRE</h3>
                <span className="hint">Distribuição por categoria no período</span>
              </div>
            </div>
            {categories.length === 0 ? <EmptyHint label="Sem categorias para mostrar no período." />
              : (
                <ul className="pd-cat-list">
                  {categories.slice(0, 8).map((c, i) => (
                    <li key={c.category_id + i} className="pd-cat-row">
                      <span className="pd-cat-name">
                        <span className={`pd-dot ${c.kind === 'revenue' ? 'green' : 'red'}`} />
                        <span>{c.name}</span>
                        <span className="pd-cat-kind">{c.kind === 'revenue' ? 'Receita' : 'Despesa'}</span>
                      </span>
                      <span className="pd-cat-meta">
                        <span className="pd-cat-pct">{c.percentage.toFixed(1)}%</span>
                        <span className="pd-cat-amount">{fmtMoneyCompact(c.amount)}</span>
                      </span>
                      <div className="bar">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${Math.min(100, c.percentage)}%`,
                            background: c.kind === 'revenue' ? 'var(--pd-success)' : 'var(--pd-danger)',
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </section>
        )}

        {/* Upcoming */}
        {access.includes('upcoming') && (
          <section className="pd-section">
            <div className="pd-section-head">
              <div>
                <h3>Próximos Vencimentos</h3>
                <span className="hint">Próximos 30 dias</span>
              </div>
            </div>
            {upcoming.length === 0 ? <EmptyHint label="Nenhum vencimento nos próximos 30 dias." />
              : (
                <table className="pd-table">
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Tipo</th>
                      <th>Vencimento</th>
                      <th style={{ textAlign: 'right' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.slice(0, 12).map((u) => (
                      <tr key={u.id}>
                        <td>{u.description || <span style={{ color: 'var(--pd-text-dim)' }}>(sem descrição)</span>}</td>
                        <td>
                          <span className={`pd-tag ${u.kind === 'receivable' ? 'receivable' : 'payable'}`}>
                            {u.kind === 'receivable' ? 'A receber' : 'A pagar'}
                          </span>
                        </td>
                        <td>{fmtDate(u.due_date)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="pd-money">{fmtMoney(u.amount)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </section>
        )}
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════

function KpiCard({ label, value, delta, variant, loading, invertDelta }) {
  let deltaClass = 'flat';
  let trend = null;
  if (delta != null && Math.abs(delta) > 0.01) {
    const isPositive = invertDelta ? delta < 0 : delta > 0;
    deltaClass = isPositive ? 'up' : 'down';
    trend = isPositive ? Icon.trendUp : Icon.trendDown;
  }

  return (
    <div className={`pd-card pd-kpi pd-kpi-${variant}`}>
      <div className="pd-kpi-label">
        <span className={`pd-kpi-accent ${variant}`} />
        <span>{label}</span>
      </div>

      {loading ? (
        <>
          <div className="pd-skel pd-skel-value" />
          <div className="pd-skel pd-skel-delta" />
        </>
      ) : (
        <>
          <div className="pd-kpi-value">{fmtMoney(value)}</div>
          {delta != null && (
            <div className={`pd-kpi-delta ${deltaClass}`}>
              {trend}
              <span>{fmtPct(delta)}</span>
              <span className="pd-kpi-delta-suffix">vs período anterior</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CashflowChart({ points }) {
  const W = 900;
  const H = 240;
  const padL = 50, padR = 16, padT = 16, padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const maxVal = Math.max(1, ...points.flatMap((p) => [p.revenue, p.expense]));

  // 4 grid lines
  const gridSteps = 4;
  const gridYs = Array.from({ length: gridSteps + 1 }, (_, i) => padT + (innerH * i) / gridSteps);

  // Area path for revenue + expense
  const buildPath = (key) => {
    if (points.length === 0) return '';
    const step = innerW / Math.max(points.length - 1, 1);
    const pts = points.map((p, i) => {
      const x = padL + i * step;
      const y = padT + innerH - (p[key] / maxVal) * innerH;
      return [x, y];
    });
    const start = pts[0];
    const line = pts.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
    const area = `${line} L ${pts[pts.length - 1][0]} ${padT + innerH} L ${start[0]} ${padT + innerH} Z`;
    return { line, area, pts };
  };

  const rev = buildPath('revenue');
  const exp = buildPath('expense');
  const step = innerW / Math.max(points.length - 1, 1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pd-chart" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="pd-grad-rev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pd-success)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--pd-success)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pd-grad-exp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pd-danger)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--pd-danger)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid */}
      <g className="grid">
        {gridYs.map((y, i) => (
          <line key={i} x1={padL} x2={W - padR} y1={y} y2={y} />
        ))}
      </g>

      {/* Y axis labels */}
      <g className="axis">
        {gridYs.map((y, i) => {
          const v = maxVal * (1 - i / gridSteps);
          return (
            <text key={i} x={padL - 8} y={y + 4} textAnchor="end">
              {fmtMoneyCompact(v)}
            </text>
          );
        })}
      </g>

      {/* Areas */}
      {rev.area && <path d={rev.area} fill="url(#pd-grad-rev)" />}
      {exp.area && <path d={exp.area} fill="url(#pd-grad-exp)" />}

      {/* Lines */}
      {rev.line && <path d={rev.line} fill="none" stroke="var(--pd-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {exp.line && <path d={exp.line} fill="none" stroke="var(--pd-danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

      {/* Points */}
      {rev.pts && rev.pts.map(([x, y], i) => (
        <circle key={`r-${i}`} cx={x} cy={y} r="3.5" fill="var(--pd-bg-elev)" stroke="var(--pd-success)" strokeWidth="2" />
      ))}
      {exp.pts && exp.pts.map(([x, y], i) => (
        <circle key={`e-${i}`} cx={x} cy={y} r="3.5" fill="var(--pd-bg-elev)" stroke="var(--pd-danger)" strokeWidth="2" />
      ))}

      {/* X axis */}
      <g className="axis">
        {points.map((p, i) => {
          const x = padL + i * step;
          return (
            <text key={p.date} x={x} y={H - 10} textAnchor="middle">
              {fmtMonth(p.date)}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

function EmptyHint({ label }) {
  return <div className="pd-empty">{label}</div>;
}
