import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './Services.css';

const services = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    ),
    title: 'Sites & Landing Pages',
    description: 'Do design ao deploy — sites rápidos, responsivos e otimizados pra converter.',
    tags: ['Design responsivo', 'SEO', 'Performance', 'CMS'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    title: 'Sistemas Web',
    description: 'Plataformas que automatizam sua operação e eliminam planilhas.',
    tags: ['Dashboards', 'CRUD', 'Relatórios', 'Integrações'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
    ),
    title: 'Apps Mobile',
    description: 'Aplicativos para iOS e Android que seus usuários vão querer usar.',
    tags: ['UI/UX', 'Push notifications', 'Offline', 'App Store'],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Automação & APIs',
    description: 'Conecte tudo, elimine retrabalho e deixe a máquina trabalhar por você.',
    tags: ['APIs', 'Webhooks', 'Bots', 'ETL'],
  },
];

export default function Services() {
  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Desenvolvimento de Software',
    provider: {
      '@type': 'Organization',
      name: 'Whodo',
      url: 'https://whodo.com.br',
      logo: { '@type': 'ImageObject', url: 'https://whodo.com.br/favicon.svg' },
    },
    areaServed: { '@type': 'Country', name: 'Brasil' },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Serviços de Desenvolvimento',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.description },
      })),
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://whodo.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Serviços', item: 'https://whodo.com.br/servicos' },
    ],
  };

  return (
    <div className="svc">
      <Helmet>
        <title>Serviços de Desenvolvimento de Software | Whodo</title>
        <meta name="description" content="Desenvolvimento de sites, sistemas web, apps mobile e automação sob medida. Consultoria gratuita." />
        <link rel="canonical" href="https://whodo.com.br/servicos" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/servicos" />
        <meta property="og:title" content="Serviços de Desenvolvimento de Software | Whodo" />
        <meta property="og:description" content="Desenvolvimento de sites, sistemas web, apps mobile e automação sob medida. Consultoria gratuita." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Serviços de Desenvolvimento de Software | Whodo" />
        <meta name="twitter:description" content="Desenvolvimento de sites, sistemas web, apps mobile e automação sob medida. Consultoria gratuita." />
        <script type="application/ld+json">{JSON.stringify(serviceLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      {/* Lava lamp orbs + frosted glass — same as Home */}
      <div className="svc-orbs">
        <div className="svc-orb svc-orb--1" />
        <div className="svc-orb svc-orb--2" />
        <div className="svc-orb svc-orb--3" />
      </div>
      <div className="svc-glass" />

      <Header />

      {/* Hero */}
      <section className="svc-hero">
        <div className="svc-hero-inner">
          <span className="svc-tagline">O que fazemos</span>
          <h1 className="svc-title">
            Seu problema vira <span className="text-gradient">software</span>
          </h1>
          <p className="svc-subtitle">
            Entendemos o desafio, desenhamos a solução e entregamos rodando.
            <br />Sem enrolação.
          </p>
          <a
            href="https://wa.me/5516999493490?text=Oi!%20Vi%20a%20p%C3%A1gina%20de%20servi%C3%A7os%20e%20quero%20marcar%20uma%20conversa."
            target="_blank"
            rel="noopener noreferrer"
            className="svc-hero-cta"
          >
            Marcar uma conversa
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </section>

      {/* Services */}
      <section className="svc-cards">
        <div className="svc-cards-inner">
          {services.map((s, i) => (
            <div key={s.title} className="svc-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="svc-card-icon">{s.icon}</div>
              <div className="svc-card-body">
                <h2 className="svc-card-title">{s.title}</h2>
                <p className="svc-card-desc">{s.description}</p>
                <div className="svc-card-tags">
                  {s.tags.map((t) => (
                    <span key={t} className="svc-tag">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How — minimal */}
      <section className="svc-how">
        <div className="svc-how-inner">
          <h2 className="svc-how-title">
            Como funciona
          </h2>
          <div className="svc-steps">
            <div className="svc-step">
              <span className="svc-step-num">1</span>
              <p><strong>Conversa</strong> — você conta o problema, a gente escuta.</p>
            </div>
            <div className="svc-step">
              <span className="svc-step-num">2</span>
              <p><strong>Proposta</strong> — escopo, prazo e valor claros.</p>
            </div>
            <div className="svc-step">
              <span className="svc-step-num">3</span>
              <p><strong>Entregas</strong> — sprints semanais, você acompanha tudo.</p>
            </div>
            <div className="svc-step">
              <span className="svc-step-num">4</span>
              <p><strong>No ar</strong> — deploy, treinamento e suporte.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="svc-final">
        <div className="svc-final-inner">
          <span className="svc-final-badge">Sem compromisso</span>
          <h2 className="svc-final-title">
            Bora conversar sobre o seu <span className="text-gradient">projeto</span>?
          </h2>
          <p className="svc-final-desc">
            15 minutos. Sem custo. Você sai com clareza sobre o que precisa — mesmo que não feche com a gente.
          </p>
          <a
            href="https://wa.me/5516999493490?text=Oi!%20Quero%20marcar%20uma%20conversa%20sobre%20um%20projeto."
            target="_blank"
            rel="noopener noreferrer"
            className="svc-final-btn"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Marcar conversa no WhatsApp
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
          <p className="svc-final-sub">Resposta em minutos.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="svc-footer">
        <div className="svc-footer-inner">
          <Link to="/" className="svc-footer-brand">whodo</Link>
          <div className="svc-footer-links">
            <Link to="/blog">Blog</Link>
            <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
          <p className="svc-footer-copy">&copy; {new Date().getFullYear()} Whodo Group LTDA - CNPJ 59.704.711/0001-90</p>
        </div>
      </footer>
    </div>
  );
}
