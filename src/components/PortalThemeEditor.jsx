import { useState, useEffect, useMemo } from 'react';
import './PortalThemeEditor.css';

// System defaults must mirror systemDefaultTheme in portal_theme.go
const SYSTEM_DEFAULTS = {
  brand_name:        'Painel Financeiro',
  logo_url:          '',
  primary_color:     '#4f46e5',
  success_color:     '#10b981',
  danger_color:      '#ef4444',
  bg_color:          '#fafbff',
  surface_color:     '#ffffff',
  text_color:        '#0f172a',
  text_muted_color:  '#64748b',
};

const COLOR_FIELDS = [
  { key: 'primary_color',    label: 'Primária',         hint: 'Botões, links, accent' },
  { key: 'success_color',    label: 'Receita',          hint: 'Verde — entradas, positivo' },
  { key: 'danger_color',     label: 'Despesa',          hint: 'Vermelho — saídas, negativo' },
  { key: 'bg_color',         label: 'Fundo',            hint: 'Cor do background' },
  { key: 'surface_color',    label: 'Superfície',       hint: 'Cards, surfaces' },
  { key: 'text_color',       label: 'Texto',            hint: 'Cor primária do texto' },
  { key: 'text_muted_color', label: 'Texto secundário', hint: 'Labels, hints' },
];

/**
 * Reusable theme editor. Used in two scopes:
 *  - "org"    — saving as the default for all EndClients
 *  - "client" — saving as the override for one specific EndClient
 */
export default function PortalThemeEditor({
  open, scope, scopeLabel, initial, fallback, onClose, onSave, onClear,
}) {
  // `initial` = only the fields explicitly set at this scope (may be sparse)
  // `fallback` = what to show in the preview when a field is empty.
  //   For scope="org":    fallback = SYSTEM_DEFAULTS
  //   For scope="client": fallback = resolved org theme (org + system)
  const [draft, setDraft] = useState(() => ({ ...(initial || {}) }));
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setDraft({ ...(initial || {}) }); }, [open, initial]);

  // Effective values for the preview = draft || fallback || system
  const effective = useMemo(() => ({
    ...SYSTEM_DEFAULTS,
    ...(fallback || {}),
    ...Object.fromEntries(Object.entries(draft || {}).filter(([, v]) => v && String(v).trim() !== '')),
  }), [draft, fallback]);

  if (!open) return null;

  const setField = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Send only fields the user explicitly set (preserves "inherit from above")
      const payload = Object.fromEntries(
        Object.entries(draft || {}).filter(([, v]) => v != null && String(v).trim() !== '')
      );
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(scope === 'client'
      ? 'Limpar override deste cliente? Ele volta a usar o tema padrão da empresa.'
      : 'Resetar o tema padrão da empresa para os valores do sistema?')) return;
    setSaving(true);
    try {
      await onClear();
    } finally {
      setSaving(false);
    }
  };

  const previewVars = {
    '--pte-bg':         effective.bg_color,
    '--pte-surface':    effective.surface_color,
    '--pte-text':       effective.text_color,
    '--pte-text-muted': effective.text_muted_color,
    '--pte-primary':    effective.primary_color,
    '--pte-success':    effective.success_color,
    '--pte-danger':     effective.danger_color,
  };

  return (
    <div className="cac-modal-overlay" onClick={onClose}>
      <div className="cac-modal pte-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pte-head">
          <h2>
            Tema do Portal
            <span className="pte-scope">{scope === 'org' ? 'Empresa' : 'Cliente'}</span>
          </h2>
          <p>
            {scope === 'org'
              ? 'Configurações aplicadas a todos os clientes da empresa por padrão. Cada cliente pode ter overrides próprios.'
              : <>Override específico para <strong>{scopeLabel}</strong>. Campos vazios herdam do tema da empresa.</>}
          </p>
        </div>

        <div className="pte-body">
          <div className="pte-form">
            <Field label="Nome da marca" hint={scope === 'client' ? `Empresa: ${fallback?.brand_name || SYSTEM_DEFAULTS.brand_name}` : 'Aparece no header do portal'}>
              <input
                className="cac-bare"
                value={draft.brand_name || ''}
                onChange={(e) => setField('brand_name', e.target.value)}
                placeholder={fallback?.brand_name || SYSTEM_DEFAULTS.brand_name}
              />
            </Field>

            <Field label="Logo (URL)" hint="https://...png — recomendado quadrado">
              <input
                className="cac-bare"
                value={draft.logo_url || ''}
                onChange={(e) => setField('logo_url', e.target.value)}
                placeholder={fallback?.logo_url || 'https://...'}
              />
              <div className="pte-logo-drop" style={{ marginTop: 8 }}>
                <div
                  className="pte-logo-thumb"
                  style={{ backgroundImage: (draft.logo_url || fallback?.logo_url) ? `url("${draft.logo_url || fallback?.logo_url}")` : undefined }}
                >
                  {!(draft.logo_url || fallback?.logo_url) && 'Logo'}
                </div>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--cac-text-muted)', lineHeight: 1.5 }}>
                  Hospede a imagem em qualquer CDN e cole o link aqui. Suporta png/svg/jpg.
                </div>
              </div>
            </Field>

            <div style={{ height: 18 }} />

            {COLOR_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <div className="pte-color-row">
                  <div
                    className="pte-swatch"
                    style={{ backgroundColor: effective[f.key] }}
                    title={effective[f.key]}
                  />
                  <input
                    className="cac-bare"
                    value={draft[f.key] || ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={fallback?.[f.key] || SYSTEM_DEFAULTS[f.key]}
                  />
                  <input
                    type="color"
                    value={effective[f.key] || '#000000'}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                </div>
              </Field>
            ))}
          </div>

          <div className="pte-preview">
            <div className="pte-preview-label">Preview ao vivo</div>
            <div className="pte-preview-canvas" style={previewVars}>
              <div className="pte-preview-header">
                <div className="pte-preview-brand">
                  <div
                    className="pte-preview-logo"
                    style={effective.logo_url ? { backgroundImage: `url("${effective.logo_url}")`, background: `url("${effective.logo_url}") center/contain no-repeat` } : undefined}
                  >
                    {!effective.logo_url && (effective.brand_name || 'P')[0]}
                  </div>
                  <span>{effective.brand_name || SYSTEM_DEFAULTS.brand_name}</span>
                </div>
                <div className="pte-preview-pills">
                  <span className="pte-preview-pill">7d</span>
                  <span className="pte-preview-pill on">Este mês</span>
                  <span className="pte-preview-pill">30d</span>
                </div>
              </div>

              <div className="pte-preview-body">
                <div className="pte-preview-kpis">
                  <div className="pte-preview-kpi">
                    <div className="kl"><span className="accent" style={{ background: effective.success_color }}/>Receita</div>
                    <div className="kv">R$ 48.250</div>
                    <div className="kd" style={{ background: hexAlpha(effective.success_color, 0.14), color: effective.success_color }}>↑ 12,3%</div>
                  </div>
                  <div className="pte-preview-kpi">
                    <div className="kl"><span className="accent" style={{ background: effective.danger_color }}/>Despesa</div>
                    <div className="kv">R$ 31.180</div>
                    <div className="kd" style={{ background: hexAlpha(effective.danger_color, 0.14), color: effective.danger_color }}>↓ 4,1%</div>
                  </div>
                  <div className="pte-preview-kpi">
                    <div className="kl"><span className="accent" style={{ background: effective.primary_color }}/>Lucro</div>
                    <div className="kv">R$ 17.070</div>
                    <div className="kd" style={{ background: hexAlpha(effective.primary_color, 0.14), color: effective.primary_color }}>↑ 28,6%</div>
                  </div>
                </div>

                <div className="pte-preview-row" style={{ color: effective.text_muted_color }}>
                  <span>Próximos vencimentos</span>
                  <span style={{ color: effective.text_color, fontWeight: 700 }}>5 itens</span>
                </div>

                <div className="pte-preview-cta">Conectar Conta Azul</div>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--cac-text-muted)', lineHeight: 1.5 }}>
              {scope === 'org'
                ? 'Esse é o tema padrão. Cada cliente pode ter um override próprio.'
                : 'Esse override só vale para esse cliente. Os outros continuam com o tema padrão da empresa.'}
            </div>
          </div>
        </div>

        <div className="pte-foot">
          <div className="left">
            {onClear && (
              <button type="button" className="cac-btn cac-btn-ghost" onClick={handleClear} disabled={saving}>
                {scope === 'client' ? 'Limpar override' : 'Resetar p/ sistema'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="cac-btn cac-btn-ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="button" className="cac-btn cac-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar tema'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 12.5, marginBottom: 6, letterSpacing: '-0.01em' }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: 'var(--cac-text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function hexAlpha(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(0,0,0,${alpha})`;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
