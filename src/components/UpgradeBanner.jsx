import { Link } from 'react-router-dom';

const FEATURE_LABELS = {
  instagram: 'Instagram',
  meta_ads: 'Meta Ads',
  auto_boost: 'Auto Boost',
  cta_analytics: 'CTA Analytics',
  email_marketing: 'Email Marketing',
};

const FEATURE_MIN_PLAN = {
  instagram: 'Starter',
  meta_ads: 'Starter',
  auto_boost: 'Starter',
  cta_analytics: 'Starter',
  email_marketing: 'Pro',
};

export default function UpgradeBanner({ feature }) {
  const label = FEATURE_LABELS[feature] || feature;
  const minPlan = FEATURE_MIN_PLAN[feature] || 'superior';

  return (
    <div style={{
      maxWidth: 480,
      margin: '3rem auto',
      textAlign: 'center',
      padding: '3rem 2rem',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
    }}>
      <div style={{
        width: 56,
        height: 56,
        margin: '0 auto 1.25rem',
        background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(59,130,246,0.08))',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fafafa', margin: '0 0 0.5rem' }}>
        {label} requer o plano {minPlan}
      </h2>
      <p style={{ color: '#a1a1aa', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
        Faça upgrade do seu plano para desbloquear {label} e outras funcionalidades avançadas.
      </p>
      <Link
        to="/planos"
        style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
          borderRadius: 10,
          color: 'white',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          transition: 'all 0.2s',
        }}
      >
        Ver planos
      </Link>
    </div>
  );
}
