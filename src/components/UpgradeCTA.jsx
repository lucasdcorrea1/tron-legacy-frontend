import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import './UpgradeCTA.css';

const PLAN_RANK = { free: 0, starter: 1, pro: 2, enterprise: 3 };

const UPGRADE_DATA = {
  free: {
    title: 'Desbloqueie todo o potencial da plataforma',
    subtitle: 'Você está no plano Free. Faça upgrade e acesse ferramentas poderosas.',
    features: [
      { icon: '📸', label: 'Instagram + Meta Ads', plan: 'starter' },
      { icon: '🤖', label: 'Auto-resposta e Auto-Boost', plan: 'starter' },
      { icon: '📊', label: 'CTA Analytics', plan: 'starter' },
      { icon: '📧', label: 'Email Marketing', plan: 'pro' },
    ],
    cta: 'Começar com Starter — R$49/mês',
    recommended: 'starter',
  },
  starter: {
    title: 'Leve sua operação para o próximo nível',
    subtitle: 'Remova todos os limites e acesse Email Marketing completo.',
    features: [
      { icon: '♾️', label: 'Posts e campanhas ilimitados', plan: 'pro' },
      { icon: '📧', label: 'Email Marketing completo', plan: 'pro' },
      { icon: '👥', label: 'Até 10 membros na equipe', plan: 'pro' },
      { icon: '🚀', label: 'Tudo sem limites', plan: 'pro' },
    ],
    cta: 'Upgrade para Pro — R$149/mês',
    recommended: 'pro',
  },
  pro: {
    title: 'Escale sem limites com o Enterprise',
    subtitle: 'Membros ilimitados, suporte prioritário e SLA dedicado.',
    features: [
      { icon: '👥', label: 'Membros ilimitados', plan: 'enterprise' },
      { icon: '🎯', label: 'Suporte prioritário', plan: 'enterprise' },
      { icon: '📋', label: 'SLA dedicado', plan: 'enterprise' },
      { icon: '⚡', label: 'Tudo do Pro incluso', plan: 'enterprise' },
    ],
    cta: 'Upgrade para Enterprise — R$399/mês',
    recommended: 'enterprise',
  },
};

export default function UpgradeCTA() {
  const navigate = useNavigate();
  const { subscription, usage } = useOrg();
  const currentPlan = subscription?.plan_id || 'free';

  // Don't show for enterprise users
  if (currentPlan === 'enterprise') return null;

  const data = UPGRADE_DATA[currentPlan];
  if (!data) return null;

  // Calculate usage warnings for current plan
  const usageWarnings = [];
  if (usage) {
    const checks = [
      { key: 'members', label: 'membros', limitKey: 'max_members' },
      { key: 'scheduled_posts', label: 'posts agendados', limitKey: 'max_scheduled_posts' },
      { key: 'auto_reply_rules', label: 'regras auto-resposta', limitKey: 'max_auto_reply_rules' },
      { key: 'campaigns', label: 'campanhas', limitKey: 'max_campaigns' },
    ];
    for (const c of checks) {
      const current = usage.usage?.[c.key] || 0;
      const max = usage.limits?.[c.limitKey];
      if (max > 0 && current >= max * 0.8) {
        usageWarnings.push(`${current}/${max} ${c.label}`);
      }
    }
  }

  return (
    <div className="upgrade-cta">
      <div className="upgrade-cta-content">
        <div className="upgrade-cta-text">
          <div className="upgrade-cta-badge">
            {currentPlan.toUpperCase()} PLAN
          </div>
          <h2>{data.title}</h2>
          <p>{data.subtitle}</p>

          {usageWarnings.length > 0 && (
            <div className="upgrade-cta-warning">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Você está perto do limite: {usageWarnings.join(', ')}
            </div>
          )}
        </div>

        <div className="upgrade-cta-features">
          {data.features.map((f, i) => (
            <div key={i} className="upgrade-cta-feature">
              <span className="upgrade-cta-feature-icon">{f.icon}</span>
              <span>{f.label}</span>
              <span className="upgrade-cta-feature-plan">{f.plan}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="upgrade-cta-btn" onClick={() => navigate('/admin/checkout')}>
        {data.cta}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </button>
    </div>
  );
}
