import { useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './Services.css';

/* ── Data ──────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>,
    title: 'Instagram',
    desc: 'Agende posts, automatize respostas no Direct e acompanhe metricas de engajamento em tempo real.',
    tag: 'Agendamento + DMs',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    title: 'Meta Ads',
    desc: 'Crie campanhas, defina alertas de orcamento e ative auto-boost nos seus melhores posts.',
    tag: 'Campanhas + Auto-Boost',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    title: 'Email Marketing',
    desc: 'Dispare campanhas segmentadas, acompanhe aberturas e cliques, nutra leads automaticamente.',
    tag: 'Segmentacao + Tracking',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
    title: 'Blog & SEO',
    desc: 'Publique conteudo otimizado, capture leads com CTAs inteligentes e meca cada resultado.',
    tag: 'Conteudo + Analytics',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
    title: 'Contabilidade',
    desc: 'Gestao de clientes, mensalidades recorrentes, servicos eventuais e importacao em massa.',
    tag: 'Financeiro integrado',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    title: '3D Store',
    desc: 'Loja virtual 3D completa com catalogo de produtos, carrinho e checkout integrado.',
    tag: 'Novo',
  },
];

const STATS = [
  { value: '500+', label: 'Empresas ativas' },
  { value: '10k+', label: 'Posts agendados' },
  { value: '98%', label: 'Uptime garantido' },
  { value: '<2min', label: 'Para comecar' },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'para sempre',
    features: ['1 membro', 'Blog completo', '5 posts/mes'],
    cta: 'Comecar gratis',
    href: '/login',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '49',
    period: '/mes',
    features: ['3 membros', 'Instagram + Meta Ads', 'Auto-Boost', 'CTA Analytics', 'Contabilidade'],
    cta: 'Assinar Starter',
    href: '/assinar/starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '149',
    period: '/mes',
    popular: true,
    features: ['10 membros', 'Tudo do Starter', 'Email Marketing', 'Posts ilimitados', 'Campanhas ilimitadas'],
    cta: 'Assinar Pro',
    href: '/assinar/pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '399',
    period: '/mes',
    features: ['Membros ilimitados', 'Tudo do Pro', 'Suporte prioritario', 'SLA dedicado'],
    cta: 'Assinar Enterprise',
    href: '/assinar/enterprise',
  },
];

const CHECK = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

/* ── Scroll reveal hook ────────────────────────────────── */

function useReveal() {
  const ref = useRef(null);

  const observe = useCallback((node) => {
    ref.current = node;
    if (!node) return;
    const els = node.querySelectorAll('.rv');
    if (!els.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('rv-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (ref.current) observe(ref.current);
  }, [observe]);

  return observe;
}

/* ── Structured data ───────────────────────────────────── */

const softwareLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Whodo',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'AggregateOffer', lowPrice: '0', highPrice: '399', priceCurrency: 'BRL' },
  provider: { '@type': 'Organization', name: 'Whodo', url: 'https://whodo.com.br' },
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://whodo.com.br' },
    { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://whodo.com.br/features' },
  ],
};

/* ── Component ─────────────────────────────────────────── */

export default function Services() {
  const pageRef = useReveal();

  return (
    <div className="ft" ref={pageRef}>
      <Helmet>
        <title>Funcionalidades | Instagram, Meta Ads e Email Marketing | Whodo</title>
        <meta name="description" content="Agende posts no Instagram, gerencie campanhas de Meta Ads, dispare email marketing e acompanhe resultados. Tudo em uma unica plataforma." />
        <link rel="canonical" href="https://whodo.com.br/features" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/features" />
        <meta property="og:title" content="Funcionalidades | Whodo — Plataforma de Marketing Digital" />
        <meta property="og:description" content="Agende posts no Instagram, gerencie campanhas de Meta Ads, dispare email marketing e acompanhe resultados." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <script type="application/ld+json">{JSON.stringify(softwareLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <Header />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="ft-hero">
        <div className="ft-hero-bg" aria-hidden="true" />
        <div className="ft-wrap">
          <p className="ft-pill rv">Plataforma completa de marketing</p>
          <h1 className="ft-hero-h rv" style={{ animationDelay: '.08s' }}>
            Uma plataforma.<br />
            <span className="ft-grad">Todos os canais.</span>
          </h1>
          <p className="ft-hero-sub rv" style={{ animationDelay: '.16s' }}>
            Instagram, Meta Ads, Email Marketing, Blog, Contabilidade e Loja 3D — integrados para voce gerenciar, automatizar e medir resultados.
          </p>
          <div className="ft-hero-ctas rv" style={{ animationDelay: '.24s' }}>
            <Link to="/assinar/pro" className="ft-btn-main">
              Comecar agora
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <a href="#planos" className="ft-btn-ghost">Ver planos</a>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────── */}
      <section className="ft-stats">
        <div className="ft-wrap">
          <div className="ft-stats-row">
            {STATS.map((s, i) => (
              <div key={i} className="ft-stat rv" style={{ animationDelay: `${i * .07}s` }}>
                <span className="ft-stat-val">{s.value}</span>
                <span className="ft-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="ft-features" id="funcionalidades">
        <div className="ft-wrap">
          <p className="ft-pill rv">Funcionalidades</p>
          <h2 className="ft-section-h rv">Tudo que voce precisa,<br /><span className="ft-grad">nada que voce nao precisa.</span></h2>
          <div className="ft-feat-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="ft-feat-card rv" style={{ animationDelay: `${i * .06}s` }}>
                <div className="ft-feat-icon">{f.icon}</div>
                <div className="ft-feat-body">
                  <div className="ft-feat-top">
                    <h3>{f.title}</h3>
                    <span className="ft-feat-tag">{f.tag}</span>
                  </div>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────── */}
      <section className="ft-pricing" id="planos">
        <div className="ft-wrap">
          <p className="ft-pill rv">Planos</p>
          <h2 className="ft-section-h rv">Preco justo,<br /><span className="ft-grad">sem surpresas.</span></h2>
          <p className="ft-pricing-sub rv">Sem fidelidade. Sem taxa de setup. Cancele quando quiser.</p>

          <div className="ft-plan-grid">
            {PLANS.map((p, i) => (
              <div key={p.id} className={`ft-plan rv ${p.popular ? 'ft-plan--pop' : ''}`} style={{ animationDelay: `${i * .07}s` }}>
                {p.popular && <span className="ft-plan-badge">Mais escolhido</span>}
                <h3 className="ft-plan-name">{p.name}</h3>
                <div className="ft-plan-price">
                  <span className="ft-plan-currency">R$</span>
                  <span className="ft-plan-value">{p.price}</span>
                  <span className="ft-plan-period">{p.period}</span>
                </div>
                <ul className="ft-plan-list">
                  {p.features.map((f, j) => <li key={j}>{CHECK}{f}</li>)}
                </ul>
                <Link
                  to={p.href}
                  className={`ft-plan-cta ${p.popular ? 'ft-plan-cta--pop' : ''}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="ft-final">
        <div className="ft-final-glow" aria-hidden="true" />
        <div className="ft-wrap">
          <h2 className="ft-final-h rv">
            Pronto para escalar seus <span className="ft-grad">resultados</span>?
          </h2>
          <p className="ft-final-sub rv">Comece gratis. Sem cartao de credito. Leva menos de 2 minutos.</p>
          <div className="ft-final-ctas rv">
            <Link to="/assinar/pro" className="ft-btn-main ft-btn-lg">
              Criar conta gratis
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
          <div className="ft-trust rv">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Dados seguros
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Sem fidelidade
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              Cancele quando quiser
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="ft-footer">
        <div className="ft-wrap ft-footer-inner">
          <Link to="/" className="ft-footer-brand">whodo</Link>
          <div className="ft-footer-links">
            <Link to="/blog">Blog</Link>
            <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <Link to="/privacidade">Privacidade</Link>
          </div>
          <p className="ft-footer-copy">&copy; {new Date().getFullYear()} Whodo Group LTDA — CNPJ 59.704.711/0001-90</p>
        </div>
      </footer>
    </div>
  );
}
