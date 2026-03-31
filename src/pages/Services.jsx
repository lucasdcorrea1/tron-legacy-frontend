import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Services.css';

const TOTAL_SECTIONS = 3;
const COOLDOWN_MS = 1000;

const FEATURES = [
  {
    num: '01',
    title: 'Instagram',
    desc: 'Agende posts, automatize respostas no Direct e acompanhe métricas de engajamento em tempo real.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Meta Ads',
    desc: 'Crie e gerencie campanhas, defina alertas de orçamento e ative auto-boost nos seus melhores posts.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Email Marketing',
    desc: 'Dispare campanhas segmentadas, acompanhe aberturas e cliques, e nutra seus leads automaticamente.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Blog & Analytics',
    desc: 'Publique conteúdo otimizado para SEO, capture leads com CTAs inteligentes e meça cada resultado.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  },
];

const STEPS = [
  { n: '1', label: 'Crie sua conta', desc: 'Cadastro gratuito em menos de 2 minutos' },
  { n: '2', label: 'Conecte seus canais', desc: 'Instagram, Meta Ads e e-mail prontos para uso' },
  { n: '3', label: 'Configure e publique', desc: 'Agende posts, crie campanhas e automações' },
  { n: '4', label: 'Acompanhe resultados', desc: 'Métricas em tempo real para decisões rápidas' },
];

export default function Services() {
  const [activeSection, setActiveSection] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  const pageRef = useRef(null);
  const svcGlowRef = useRef(null);
  const sectionsRef = useRef([]);
  const touchStartY = useRef(0);
  const isLocked = useRef(false);
  const activeSectionRef = useRef(0);

  useHorizontalPageSwipe(pageRef);

  // Mouse glow on hero
  useEffect(() => {
    const section = sectionsRef.current[0];
    const glow = svcGlowRef.current;
    if (!section || !glow) return;

    const handleMouseMove = (e) => {
      const rect = section.getBoundingClientRect();
      glow.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
      glow.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
      glow.style.opacity = '1';
    };

    const handleMouseLeave = () => {
      glow.style.opacity = '0';
    };

    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile: IntersectionObserver
  useEffect(() => {
    if (!isMobile) return;
    sectionsRef.current.forEach((s) => { if (s) s.classList.add('svc-section-visible'); });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('svc-section-visible');
            const idx = sectionsRef.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveSection(idx);
          }
        });
      },
      { threshold: 0.3 }
    );
    sectionsRef.current.forEach((s) => { if (s) observer.observe(s); });
    return () => observer.disconnect();
  }, [isMobile]);

  // Desktop: trigger first section on mount
  useEffect(() => {
    if (!isMobile) {
      setTimeout(() => { sectionsRef.current[0]?.classList.add('svc-section-visible'); }, 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToSection = useCallback((index) => {
    if (index < 0 || index >= TOTAL_SECTIONS) return;
    if (isLocked.current) return;
    isLocked.current = true;
    activeSectionRef.current = index;
    setActiveSection(index);
    sectionsRef.current[index]?.classList.add('svc-section-visible');
    setTimeout(() => { isLocked.current = false; }, COOLDOWN_MS);
  }, []);

  // Wheel
  useEffect(() => {
    if (isMobile) return;
    const container = pageRef.current;
    if (!container) return;
    const handleWheel = (e) => {
      e.preventDefault();
      if (isLocked.current) return;
      if (e.deltaY > 0) goToSection(activeSectionRef.current + 1);
      else if (e.deltaY < 0) goToSection(activeSectionRef.current - 1);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [goToSection, isMobile]);

  // Touch
  useEffect(() => {
    if (isMobile) return;
    const container = pageRef.current;
    if (!container) return;
    const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 50) return;
      if (deltaY > 0) goToSection(activeSectionRef.current + 1);
      else goToSection(activeSectionRef.current - 1);
    };
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToSection, isMobile]);

  // Keyboard
  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goToSection(activeSectionRef.current + 1); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goToSection(activeSectionRef.current - 1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToSection, isMobile]);

  const setSectionRef = useCallback((index) => (el) => { sectionsRef.current[index] = el; }, []);

  const handleDotClick = useCallback((index) => {
    if (isMobile) sectionsRef.current[index]?.scrollIntoView({ behavior: 'smooth' });
    else goToSection(index);
  }, [isMobile, goToSection]);

  const softwareLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Whodo',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      lowPrice: '0',
      highPrice: '399',
      priceCurrency: 'BRL',
    },
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

  return (
    <div className="svc" ref={pageRef}>
      <Helmet>
        <title>Funcionalidades | Instagram, Meta Ads e Email Marketing | Whodo</title>
        <meta name="description" content="Agende posts no Instagram, gerencie campanhas de Meta Ads, dispare email marketing e acompanhe resultados. Tudo em uma única plataforma." />
        <link rel="canonical" href="https://whodo.com.br/features" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/features" />
        <meta property="og:title" content="Funcionalidades | Whodo — Plataforma de Marketing Digital" />
        <meta property="og:description" content="Agende posts no Instagram, gerencie campanhas de Meta Ads, dispare email marketing e acompanhe resultados. Tudo em uma única plataforma." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Funcionalidades | Whodo — Plataforma de Marketing Digital" />
        <meta name="twitter:description" content="Agende posts no Instagram, gerencie campanhas de Meta Ads, dispare email marketing e acompanhe resultados." />
        <script type="application/ld+json">{JSON.stringify(softwareLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <Header />

      {/* Lava lamp */}
      <div className="svc-orbs" aria-hidden="true">
        <div className="svc-orb svc-orb--1" />
        <div className="svc-orb svc-orb--2" />
        <div className="svc-orb svc-orb--3" />
      </div>
      <div className="svc-glass" aria-hidden="true" />

      {/* Dots */}
      <div className="svc-dots">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            className={`svc-dot ${activeSection === i ? 'active' : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Ir para seção ${i + 1}`}
          />
        ))}
      </div>

      {/* Sections */}
      <main
        className="svc-track"
        style={isMobile ? undefined : { transform: `translateY(-${activeSection * 100}vh)` }}
      >
        {/* Section 1: Hero */}
        <section className="svc-section" ref={setSectionRef(0)}>
          <div className="svc-hero-grid" aria-hidden="true" />
          <div className="svc-hero-glow" ref={svcGlowRef} aria-hidden="true" />
          <div className="svc-hero-inner">
            <div className="svc-hero-content">
              <p className="svc-tagline svc-anim">Plataforma completa de marketing</p>
              <h1 className="svc-hero-title svc-anim" style={{ transitionDelay: '0.1s' }}>
                Tudo que você precisa para{' '}
                <span className="text-gradient">escalar seu marketing</span>
              </h1>
              <p className="svc-hero-desc svc-anim" style={{ transitionDelay: '0.2s' }}>
                Instagram, Meta Ads, Email Marketing e Blog — integrados em uma única
                plataforma para você gerenciar, automatizar e medir resultados.
              </p>
              <div className="svc-hero-actions svc-anim" style={{ transitionDelay: '0.3s' }}>
                <Link to="/login" className="svc-btn-primary">
                  Comece Grátis
                </Link>
                <button className="svc-btn-ghost" onClick={() => goToSection(1)}>
                  Ver funcionalidades
                </button>
              </div>
            </div>
          </div>
          <button className="svc-scroll-hint" onClick={() => goToSection(1)} aria-label="Rolar para próxima seção">
            <span className="svc-scroll-text">Scroll</span>
            <div className="svc-scroll-arrow" />
          </button>
        </section>

        {/* Section 2: Features */}
        <section className="svc-section svc-section-services" ref={setSectionRef(1)}>
          <div className="svc-services-inner">
            <div className="svc-services-header">
              <p className="svc-services-tagline svc-anim">Funcionalidades</p>
              <h2 className="svc-services-title svc-anim" style={{ transitionDelay: '0.1s' }}>
                Ferramentas integradas para{' '}
                <span className="text-gradient">cada canal.</span>
              </h2>
              <p className="svc-services-subtitle svc-anim" style={{ transitionDelay: '0.2s' }}>
                Do agendamento de posts ao disparo de e-mails — gerencie tudo sem sair da plataforma.
              </p>
            </div>

            <div className="svc-services-list">
              {FEATURES.map((feat, i) => (
                <div key={feat.num} className="svc-service-row svc-anim" style={{ transitionDelay: `${0.15 + i * 0.1}s` }}>
                  <span className="svc-service-num">{feat.num}</span>
                  <div className="svc-service-icon">{feat.icon}</div>
                  <div className="svc-service-text">
                    <h3>{feat.title}</h3>
                    <p>{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: How it works + CTA + Footer */}
        <section className="svc-section svc-section-cta" ref={setSectionRef(2)}>
          <div className="svc-cta-content">
            <div className="svc-cta-inner">
              <span className="svc-cta-badge svc-anim">Como funciona</span>

              <div className="svc-process svc-anim" style={{ transitionDelay: '0.1s' }}>
                {STEPS.map((step) => (
                  <div key={step.n} className="svc-process-step">
                    <span className="svc-process-num">{step.n}</span>
                    <div>
                      <strong>{step.label}</strong>
                      <span className="svc-process-desc">{step.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="svc-cta-action svc-anim" style={{ transitionDelay: '0.25s' }}>
                <h2 className="svc-cta-title">
                  Pronto para acelerar seus{' '}
                  <span className="text-gradient">resultados</span>?
                </h2>
                <p className="svc-cta-desc">
                  Comece grátis agora. Sem cartão de crédito, sem compromisso.
                </p>
                <div className="svc-cta-buttons">
                  <Link to="/login" className="svc-cta-btn-blue">
                    Criar conta grátis
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                  <Link to="/planos" className="svc-cta-btn-outline">
                    Ver planos
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
        </section>
      </main>
    </div>
  );
}
