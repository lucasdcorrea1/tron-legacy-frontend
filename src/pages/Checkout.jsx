import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import AdminLayout from '../components/AdminLayout';
import PaymentForm from '../components/PaymentForm';
import './Checkout.css';

const CHECK = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    desc: 'Para quem está começando',
    price: { monthly: 0, yearly: 0 },
    features: [
      '1 membro',
      '10 posts agendados',
      '3 regras auto-resposta',
      '1 regra auto-boost',
      '2 alertas de orçamento',
      '3 campanhas',
      'Blog',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    desc: 'Ideal para pequenos times',
    price: { monthly: 49, yearly: 39 },
    features: [
      '3 membros',
      '50 posts agendados',
      '10 regras auto-resposta',
      '5 regras auto-boost',
      '10 alertas de orçamento',
      '10 campanhas',
      'Instagram + Facebook',
      'Meta Ads + CTA Clicks',
      'Contabilidade',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    desc: 'Para operações avançadas',
    price: { monthly: 149, yearly: 119 },
    popular: true,
    features: [
      '10 membros',
      'Posts ilimitados',
      'Regras ilimitadas',
      'Campanhas ilimitadas',
      'Tudo do Starter',
      'Email Marketing',
      'Auto-boost avançado',
      'Todas as ferramentas',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    desc: 'Para grandes empresas',
    price: { monthly: 399, yearly: 319 },
    features: [
      'Membros ilimitados',
      'Tudo ilimitado',
      'Tudo do Pro',
      'Suporte prioritário',
      'SLA dedicado',
      'Gerente de conta',
      'Onboarding personalizado',
      'API dedicada',
    ],
  },
];

const PLAN_RANK = { free: 0, starter: 1, pro: 2, enterprise: 3 };

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, refreshUsage } = useOrg();
  const currentPlan = subscription?.plan_id || 'free';
  const isPending = subscription?.status === 'pending';

  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cycle, setCycle] = useState('monthly');

  const handleSelectPlan = (planId) => {
    if (planId === currentPlan || PLAN_RANK[planId] <= PLAN_RANK[currentPlan]) return;
    setSelectedPlan(planId);
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSuccess = async () => {
    await refreshUsage();
    navigate('/admin', { replace: true });
  };

  const selPlan = PLANS.find(p => p.id === selectedPlan);

  return (
    <AdminLayout>
      <div className="ck-page">
        {/* Step indicator */}
        <div className="ck-steps">
          <div className={`ck-step ${step >= 1 ? 'active' : ''}`}>
            <span className="ck-step-num">{step > 1 ? '\u2713' : '1'}</span>
            Plano
          </div>
          <div className="ck-step-line" />
          <div className={`ck-step ${step >= 2 ? 'active' : ''}`}>
            <span className="ck-step-num">2</span>
            Pagamento
          </div>
        </div>

        {/* ── STEP 1: Choose Plan ── */}
        {step === 1 && (
          <div className="ck-step-content">
            <div className="ck-header">
              <h1>Escolha o plano ideal</h1>
              <p>Escale sua operação com as ferramentas certas</p>
            </div>

            {/* Cycle toggle */}
            <div className="ck-cycle">
              <button type="button" className={cycle === 'monthly' ? 'active' : ''} onClick={() => setCycle('monthly')}>Mensal</button>
              <button type="button" className={cycle === 'yearly' ? 'active' : ''} onClick={() => setCycle('yearly')}>
                Anual <span className="ck-discount">-20%</span>
              </button>
            </div>

            {isPending && (
              <div className="ck-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Pagamento pendente. Aguarde a confirmação.
              </div>
            )}

            {/* Plan cards grid */}
            <div className="ck-grid">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlan;
                const isDowngrade = PLAN_RANK[plan.id] < PLAN_RANK[currentPlan];
                const isUpgrade = PLAN_RANK[plan.id] > PLAN_RANK[currentPlan];
                const price = plan.price[cycle];

                return (
                  <div
                    key={plan.id}
                    className={`ck-card ${plan.popular ? 'popular' : ''} ${isCurrent ? 'current' : ''} ${isDowngrade ? 'disabled' : ''}`}
                  >
                    {plan.popular && <div className="ck-card-badge">Mais popular</div>}
                    {isCurrent && <div className="ck-card-badge current">Plano atual</div>}

                    <div className="ck-card-header">
                      <h3>{plan.name}</h3>
                      <p>{plan.desc}</p>
                    </div>

                    <div className="ck-card-price">
                      {price === 0 ? (
                        <span className="ck-card-price-value">Grátis</span>
                      ) : (
                        <>
                          <span className="ck-card-price-currency">R$</span>
                          <span className="ck-card-price-value">{price}</span>
                          <span className="ck-card-price-period">/{cycle === 'monthly' ? 'mês' : 'mês'}</span>
                        </>
                      )}
                      {cycle === 'yearly' && price > 0 && (
                        <div className="ck-card-price-yearly">
                          R${price * 12}/ano — economia de R${(plan.price.monthly - price) * 12}
                        </div>
                      )}
                    </div>

                    <ul className="ck-card-features">
                      {plan.features.map((f, i) => (
                        <li key={i}>{CHECK}<span>{f}</span></li>
                      ))}
                    </ul>

                    <div className="ck-card-action">
                      {isCurrent ? (
                        <button className="ck-card-btn current" disabled>Seu plano atual</button>
                      ) : isDowngrade ? (
                        <button className="ck-card-btn" disabled>—</button>
                      ) : (
                        <button
                          className={`ck-card-btn ${plan.popular ? 'primary' : 'outline'}`}
                          onClick={() => handleSelectPlan(plan.id)}
                          disabled={isPending}
                        >
                          {isUpgrade ? `Upgrade para ${plan.name}` : `Escolher ${plan.name}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Payment ── */}
        {step === 2 && selPlan && (
          <div className="ck-step-content ck-payment-step">
            <div className="ck-header">
              <h1>Finalizar upgrade</h1>
              <p>
                <span className="ck-plan-tag">{selPlan.name}</span>
                R${selPlan.price[cycle]}/{cycle === 'monthly' ? 'mês' : 'mês (cobrado anualmente)'}
              </p>
            </div>

            <button className="ck-back" onClick={handleBack} type="button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Trocar plano
            </button>

            <div className="ck-payment-card">
              <PaymentForm
                planId={selectedPlan}
                billingCycle={cycle}
                userEmail={user?.email}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
