import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './Plans.css';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceYearly: 0,
    description: 'Para quem está começando',
    cta: 'Começar grátis',
    features: [
      { label: 'Membros', value: '1' },
      { label: 'Posts agendados', value: '10' },
      { label: 'Regras auto-resposta', value: '3' },
      { label: 'Regras auto-boost', value: '1' },
      { label: 'Alertas de orçamento', value: '2' },
      { label: 'Campanhas', value: '3' },
      { label: 'Publicações integradas', value: '5' },
      { label: 'Blog / Posts', value: true },
      { label: 'Instagram', value: false },
      { label: 'Meta Ads', value: false },
      { label: 'Email Marketing', value: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    priceYearly: 119,
    description: 'Para agências e equipes',
    cta: 'Assinar Pro',
    popular: true,
    features: [
      { label: 'Membros', value: '10' },
      { label: 'Posts agendados', value: 'Ilimitado' },
      { label: 'Regras auto-resposta', value: 'Ilimitado' },
      { label: 'Regras auto-boost', value: 'Ilimitado' },
      { label: 'Alertas de orçamento', value: 'Ilimitado' },
      { label: 'Campanhas', value: 'Ilimitado' },
      { label: 'Publicações integradas', value: 'Ilimitado' },
      { label: 'Blog / Posts', value: true },
      { label: 'Instagram', value: true },
      { label: 'Meta Ads', value: true },
      { label: 'Email Marketing', value: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    priceYearly: 319,
    description: 'Para grandes operações',
    cta: 'Falar com vendas',
    features: [
      { label: 'Membros', value: 'Ilimitado' },
      { label: 'Posts agendados', value: 'Ilimitado' },
      { label: 'Regras auto-resposta', value: 'Ilimitado' },
      { label: 'Regras auto-boost', value: 'Ilimitado' },
      { label: 'Alertas de orçamento', value: 'Ilimitado' },
      { label: 'Campanhas', value: 'Ilimitado' },
      { label: 'Publicações integradas', value: 'Ilimitado' },
      { label: 'Blog / Posts', value: true },
      { label: 'Instagram', value: true },
      { label: 'Meta Ads', value: true },
      { label: 'Email Marketing', value: true },
    ],
  },
];

const faqs = [
  {
    q: 'Posso trocar de plano depois?',
    a: 'Sim! Você pode fazer upgrade ou downgrade a qualquer momento. As mudanças são aplicadas imediatamente.',
  },
  {
    q: 'Existe período de teste?',
    a: 'O plano Free é gratuito para sempre. Você pode testar a plataforma sem compromisso antes de fazer um upgrade.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'Os pagamentos são processados via Asaas, com suporte a cartão de crédito, boleto e PIX. Cobrança mensal ou anual.',
  },
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim, sem multa ou fidelidade. Ao cancelar, você mantém acesso até o final do período já pago.',
  },
  {
    q: 'O que acontece se eu atingir um limite?',
    a: 'Você será notificado e poderá fazer upgrade para continuar usando o recurso. Nenhum dado é perdido.',
  },
];

export default function Plans() {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <Helmet>
        <title>Planos e Preços | Whodo</title>
        <meta name="description" content="Escolha o plano ideal para o seu negócio. Do gratuito ao enterprise, temos a solução certa para você." />
      </Helmet>

      <div className="plans-page">
        {/* Header */}
        <header className="plans-header">
          <Link to="/" className="plans-logo">
            <span className="plans-logo-icon">W</span>
            <span className="plans-logo-text">whodo</span>
          </Link>
          <Link to="/login" className="plans-login-btn">Entrar</Link>
        </header>

        {/* Hero */}
        <section className="plans-hero">
          <h1>Escolha seu plano</h1>
          <p>Comece grátis e escale conforme seu negócio cresce.</p>

          <div className="plans-toggle">
            <span className={!yearly ? 'active' : ''}>Mensal</span>
            <button
              className={`toggle-switch ${yearly ? 'on' : ''}`}
              onClick={() => setYearly(!yearly)}
              aria-label="Alternar entre mensal e anual"
            >
              <span className="toggle-knob" />
            </button>
            <span className={yearly ? 'active' : ''}>
              Anual <span className="toggle-discount">-20%</span>
            </span>
          </div>
        </section>

        {/* Cards */}
        <section className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.id} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="plan-popular-badge">Mais popular</div>}
              <div className="plan-header">
                <h2>{plan.name}</h2>
                <p className="plan-desc">{plan.description}</p>
                <div className="plan-price">
                  {plan.price === 0 ? (
                    <span className="price-amount">Grátis</span>
                  ) : (
                    <>
                      <span className="price-currency">R$</span>
                      <span className="price-amount">{yearly ? plan.priceYearly : plan.price}</span>
                      <span className="price-period">/mês</span>
                    </>
                  )}
                </div>
                {yearly && plan.price > 0 && (
                  <div className="plan-yearly-total">
                    R$ {(yearly ? plan.priceYearly : plan.price) * 12}/ano
                  </div>
                )}
              </div>

              <Link
                to={plan.price === 0 ? '/login' : '/login'}
                className={`plan-cta ${plan.popular ? 'primary' : ''}`}
              >
                {plan.cta}
              </Link>

              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f.label} className={f.value === false ? 'disabled' : ''}>
                    {f.value === false ? (
                      <svg className="feat-icon feat-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    ) : (
                      <svg className="feat-icon feat-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span className="feat-label">{f.label}</span>
                    {typeof f.value === 'string' && (
                      <span className="feat-value">{f.value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section className="plans-faq">
          <h2>Perguntas frequentes</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`faq-item ${openFaq === i ? 'open' : ''}`}
              >
                <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="plans-footer">
          <p>&copy; {new Date().getFullYear()} Whodo. Todos os direitos reservados.</p>
        </footer>
      </div>
    </>
  );
}
