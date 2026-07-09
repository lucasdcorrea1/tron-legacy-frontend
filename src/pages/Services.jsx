import { useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './Services.css';

/* ── Data ──────────────────────────────────────────────── */

const CLIENTS = [
  { name: 'Masson Contabilidade', logo: '/clients/masson.webp', url: 'https://www.massoncontabilidade.com.br/' },
  { name: 'AutoFas Store', logo: '/clients/autofas.avif', url: 'https://autofasstore.com/' },
  { name: 'Dreamer Studios', logo: '/clients/dreamer.png', url: 'https://dreamerstudios.io/' },
  { name: 'House of Caju', logo: '/clients/houseofcaju.png', url: 'https://www.houseofcaju.com.br/' },
];

const PROBLEMS = [
  'Alternar entre 5 ferramentas diferentes',
  'Pagar R$500+/mês em assinaturas separadas',
  'Montar relatórios manuais toda semana',
  'Depender de freelancers para cada canal',
];

const SOLUTIONS = [
  'Todos os canais em uma plataforma',
  'A partir de R$0/mês — sem surpresas',
  'Métricas unificadas em tempo real',
  'Autonomia total para sua equipe',
];

const FEATURES = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>,
    title: 'Instagram',
    benefit: 'Agende posts, automatize respostas no Direct e acompanhe métricas de engajamento em tempo real.',
    tag: 'Agendamento + DMs',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    title: 'Meta Ads',
    benefit: 'Crie campanhas, defina alertas de orçamento e ative auto-boost nos seus melhores posts.',
    tag: 'Campanhas + Auto-Boost',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    title: 'Email Marketing',
    benefit: 'Dispare campanhas segmentadas, acompanhe aberturas e cliques, nutra leads automaticamente.',
    tag: 'Segmentação + Tracking',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
    title: 'Blog & SEO',
    benefit: 'Publique conteúdo otimizado, capture leads com CTAs inteligentes e meça cada resultado.',
    tag: 'Conteúdo + Analytics',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>,
    title: 'Contabilidade',
    benefit: 'Gestão de clientes, mensalidades recorrentes, serviços eventuais e importação em massa.',
    tag: 'Financeiro integrado',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    title: 'Loja 3D',
    benefit: 'Loja virtual 3D completa com catálogo de produtos, carrinho e checkout integrado.',
    tag: 'Novo',
  },
];

const STATS = [
  { value: '500+', label: 'Empresas ativas' },
  { value: '10k+', label: 'Posts agendados' },
  { value: '98%', label: 'Uptime garantido' },
  { value: '<2min', label: 'Para começar' },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: 'para sempre',
    features: ['1 membro', 'Blog completo', '5 posts/mês'],
    cta: 'Começar grátis',
    href: '/login',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '49',
    period: '/mês',
    features: ['3 membros', 'Instagram + Meta Ads', 'Auto-Boost', 'CTA Analytics', 'Contabilidade'],
    cta: 'Assinar Starter',
    href: '/assinar/starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '149',
    period: '/mês',
    popular: true,
    features: ['10 membros', 'Tudo do Starter', 'Email Marketing', 'Posts ilimitados', 'Campanhas ilimitadas'],
    cta: 'Assinar Pro',
    href: '/assinar/pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '399',
    period: '/mês',
    features: ['Membros ilimitados', 'Tudo do Pro', 'Suporte prioritário', 'SLA dedicado'],
    cta: 'Falar com vendas',
    href: '/assinar/enterprise',
  },
];

const CHECK = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/* ── Scroll reveal ────────────────────────────────────── */

function useReveal() {
  const ref = useRef(null);

  const observe = useCallback((node) => {
    ref.current = node;
    if (!node) return;
    const els = node.querySelectorAll('.rv');
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('rv-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (ref.current) observe(ref.current);
  }, [observe]);

  return observe;
}

/* ── Structured data ──────────────────────────────────── */

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
    { '@type': 'ListItem', position: 2, name: 'Plataforma', item: 'https://whodo.com.br/features' },
  ],
};

/* ── Component ────────────────────────────────────────── */

export default function Services() {
  const pageRef = useReveal();

  return (
    <div className="pf" ref={pageRef}>
      <Helmet>
        <title>Plataforma | Instagram, Meta Ads e Email Marketing | Whodo</title>
        <meta name="description" content="Agende posts no Instagram, gerencie campanhas de Meta Ads, dispare email marketing e acompanhe resultados. Tudo em uma única plataforma." />
        <link rel="canonical" href="https://whodo.com.br/features" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/features" />
        <meta property="og:title" content="Plataforma | Whodo — Marketing Digital Integrado" />
        <meta property="og:description" content="Agende posts no Instagram, gerencie campanhas de Meta Ads, dispare email marketing e acompanhe resultados." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <script type="application/ld+json">{JSON.stringify(softwareLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <Header />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="pf-hero">
        <div className="pf-hero-orb pf-hero-orb--1" aria-hidden="true" />
        <div className="pf-hero-orb pf-hero-orb--2" aria-hidden="true" />
        <div className="pf-hero-line" aria-hidden="true" />
        <div className="pf-wrap">
          <span className="pf-chip rv">Mais de 500 empresas já usam</span>
          <h1 className="pf-hero-h rv" style={{ transitionDelay: '.06s' }}>
            Pare de improvisar.<br />
            <em className="pf-grad">Comece a escalar.</em>
          </h1>
          <p className="pf-hero-sub rv" style={{ transitionDelay: '.12s' }}>
            Instagram, Meta Ads, Email Marketing, Blog, Contabilidade e Loja&nbsp;3D
            — integrados para você gerenciar, automatizar e medir resultados de verdade.
          </p>
          <div className="pf-hero-actions rv" style={{ transitionDelay: '.18s' }}>
            <Link to="/assinar/pro" className="pf-btn pf-btn--solid">
              Começar agora — é grátis
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
            <a href="#planos" className="pf-btn pf-btn--ghost">Ver planos e preços</a>
          </div>
          <p className="pf-hero-social rv" style={{ transitionDelay: '.26s' }}>
            Usado por <strong>Masson</strong>, <strong>AutoFas</strong>, <strong>Dreamer&nbsp;Studios</strong> e mais
          </p>
        </div>
      </section>

      {/* ── Logo marquee ─────────────────────────────── */}
      <section className="pf-marquee rv">
        <p className="pf-marquee-label">Empresas que confiam no Whodo</p>
        <div className="pf-marquee-mask">
          <div className="pf-marquee-track">
            {[...CLIENTS, ...CLIENTS, ...CLIENTS, ...CLIENTS].map((c, i) => (
              <a key={`${c.name}-${i}`} href={c.url} target="_blank" rel="noopener noreferrer" className="pf-marquee-item" title={c.name}>
                <img src={c.logo} alt={c.name} loading="lazy" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ───────────────────────────── */}
      <section className="pf-contrast">
        <div className="pf-wrap">
          <span className="pf-chip rv">Por que o Whodo?</span>
          <h2 className="pf-h2 rv" style={{ transitionDelay: '.04s' }}>
            Chega de malabarismo<br /><em className="pf-grad">entre ferramentas.</em>
          </h2>
          <div className="pf-contrast-row">
            <div className="pf-contrast-card pf-contrast-card--pain rv" style={{ transitionDelay: '.08s' }}>
              <span className="pf-tag pf-tag--red">Antes do Whodo</span>
              <ul>
                {PROBLEMS.map((p, i) => (
                  <li key={i}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pf-contrast-arrow rv" style={{ transitionDelay: '.12s' }} aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>

            <div className="pf-contrast-card pf-contrast-card--win rv" style={{ transitionDelay: '.16s' }}>
              <span className="pf-tag pf-tag--green">Com o Whodo</span>
              <ul>
                {SOLUTIONS.map((s, i) => (
                  <li key={i}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────── */}
      <section className="pf-stats">
        <div className="pf-wrap">
          <div className="pf-stats-row">
            {STATS.map((s, i) => (
              <div key={i} className="pf-stat rv" style={{ transitionDelay: `${i * .06}s` }}>
                <span className="pf-stat-val">{s.value}</span>
                <span className="pf-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────── */}
      <section className="pf-features" id="funcionalidades">
        <div className="pf-wrap">
          <span className="pf-chip rv">Funcionalidades</span>
          <h2 className="pf-h2 rv" style={{ transitionDelay: '.04s' }}>
            Tudo que você precisa,<br /><em className="pf-grad">nada que você não precisa.</em>
          </h2>
          <div className="pf-feat-grid">
            {FEATURES.map((f, i) => (
              <article key={i} className="pf-feat rv" style={{ transitionDelay: `${i * .05}s` }}>
                <div className="pf-feat-icon">{f.icon}</div>
                <div className="pf-feat-body">
                  <div className="pf-feat-head">
                    <h3>{f.title}</h3>
                    <span className="pf-feat-tag">{f.tag}</span>
                  </div>
                  <p>{f.benefit}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────── */}
      <section className="pf-pricing" id="planos">
        <div className="pf-wrap">
          <span className="pf-chip rv">Planos</span>
          <h2 className="pf-h2 rv" style={{ transitionDelay: '.04s' }}>
            Preço justo,<br /><em className="pf-grad">sem surpresas.</em>
          </h2>
          <p className="pf-pricing-sub rv" style={{ transitionDelay: '.08s' }}>
            Sem fidelidade. Sem taxa de setup. Cancele quando quiser.
          </p>

          <div className="pf-plan-grid">
            {PLANS.map((p, i) => (
              <div key={p.id} className={`pf-plan rv${p.popular ? ' pf-plan--pop' : ''}`} style={{ transitionDelay: `${i * .06}s` }}>
                {p.popular && <span className="pf-plan-badge">Mais escolhido</span>}
                <h3 className="pf-plan-name">{p.name}</h3>
                <div className="pf-plan-price">
                  <span className="pf-plan-curr">R$</span>
                  <span className="pf-plan-val">{p.price}</span>
                  <span className="pf-plan-per">{p.period}</span>
                </div>
                <ul className="pf-plan-list">
                  {p.features.map((f, j) => <li key={j}>{CHECK}{f}</li>)}
                </ul>
                <Link to={p.href} className={`pf-plan-cta${p.popular ? ' pf-plan-cta--pop' : ''}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="pf-cta">
        <div className="pf-cta-glow" aria-hidden="true" />
        <div className="pf-wrap">
          <h2 className="pf-cta-h rv">
            Pronto para escalar seus <em className="pf-grad">resultados</em>?
          </h2>
          <p className="pf-cta-sub rv" style={{ transitionDelay: '.04s' }}>
            Comece grátis. Sem cartão de crédito. Leva menos de 2&nbsp;minutos.
          </p>
          <div className="pf-cta-actions rv" style={{ transitionDelay: '.08s' }}>
            <Link to="/assinar/pro" className="pf-btn pf-btn--solid pf-btn--lg">
              Criar conta grátis
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
          <div className="pf-trust rv" style={{ transitionDelay: '.14s' }}>
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
      <footer className="pf-footer">
        <div className="pf-wrap pf-footer-inner">
          <Link to="/" className="pf-footer-brand">whodo</Link>
          <div className="pf-footer-links">
            <Link to="/blog">Blog</Link>
            <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <Link to="/privacidade">Privacidade</Link>
          </div>
          <p className="pf-footer-copy">&copy; {new Date().getFullYear()} Whodo Group LTDA — CNPJ 59.704.711/0001-90</p>
        </div>
      </footer>
    </div>
  );
}
