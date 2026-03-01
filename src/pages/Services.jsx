import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Services.css';

const TOTAL_SECTIONS = 3;
const COOLDOWN_MS = 1000;

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

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Desenvolvimento de Soluções Digitais',
    provider: { '@type': 'Organization', name: 'Whodo', url: 'https://whodo.com.br' },
    areaServed: { '@type': 'Country', name: 'Brasil' },
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
    <div className="svc" ref={pageRef}>
      <Helmet>
        <title>Desenvolvimento de Software sob medida | Sites, Sistemas e Apps | Whodo</title>
        <meta name="description" content="Desenvolvimento de sites, sistemas de gestão, aplicativos mobile e automação de processos. Soluções digitais sob medida para empresas de todos os portes." />
        <link rel="canonical" href="https://whodo.com.br/servicos" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/servicos" />
        <meta property="og:title" content="Desenvolvimento de Software sob medida | Whodo" />
        <meta property="og:description" content="Desenvolvimento de sites, sistemas de gestão, aplicativos mobile e automação de processos. Soluções digitais sob medida para empresas de todos os portes." />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Desenvolvimento de Software sob medida | Whodo" />
        <meta name="twitter:description" content="Desenvolvimento de sites, sistemas de gestão, aplicativos mobile e automação de processos. Soluções digitais sob medida para empresas de todos os portes." />
        <script type="application/ld+json">{JSON.stringify(serviceLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <Header />

      {/* Lava lamp */}
      <div className="svc-orbs">
        <div className="svc-orb svc-orb--1" />
        <div className="svc-orb svc-orb--2" />
        <div className="svc-orb svc-orb--3" />
      </div>
      <div className="svc-glass" />

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
      <div
        className="svc-track"
        style={isMobile ? undefined : { transform: `translateY(-${activeSection * 100}vh)` }}
      >
        {/* ── Seção 1: Hero ── */}
        <section className="svc-section" ref={setSectionRef(0)}>
          <div className="svc-hero-grid" />
          <div className="svc-hero-glow" ref={svcGlowRef} />
          <div className="svc-hero-inner">
            <div className="svc-hero-content">
              <p className="svc-tagline svc-anim">Soluções sob medida</p>
              <h1 className="svc-hero-title svc-anim" style={{ transitionDelay: '0.1s' }}>
                Transformamos desafios em{' '}
                <span className="text-gradient">resultados digitais</span>
              </h1>
              <p className="svc-hero-desc svc-anim" style={{ transitionDelay: '0.2s' }}>
                Desenvolvemos soluções completas — do diagnóstico à entrega.
                Sites, sistemas, aplicativos e automações para empresas de todos os portes.
              </p>
              <div className="svc-hero-actions svc-anim" style={{ transitionDelay: '0.3s' }}>
                <a
                  href="https://wa.me/5516999493490?text=Oi!%20Vi%20a%20p%C3%A1gina%20de%20servi%C3%A7os%20e%20quero%20marcar%20uma%20conversa."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="svc-btn-primary"
                >
                  Solicitar consultoria
                </a>
                <button className="svc-btn-ghost" onClick={() => goToSection(1)}>
                  Ver serviços
                </button>
              </div>
            </div>
          </div>
          <div className="svc-scroll-hint" onClick={() => goToSection(1)}>
            <span className="svc-scroll-text">Scroll</span>
            <div className="svc-scroll-arrow" />
          </div>
        </section>

        {/* ── Seção 2: Serviços ── */}
        <section className="svc-section svc-section-services" ref={setSectionRef(1)}>
          <div className="svc-services-inner">
            <div className="svc-services-header">
              <p className="svc-services-tagline svc-anim">O que desenvolvemos</p>
              <h2 className="svc-services-title svc-anim" style={{ transitionDelay: '0.1s' }}>
                Cada negócio tem um desafio.{' '}
                <span className="text-gradient">Nós construímos a solução.</span>
              </h2>
              <p className="svc-services-subtitle svc-anim" style={{ transitionDelay: '0.2s' }}>
                Do escopo pontual ao projeto completo com equipe dedicada — a estrutura se adapta à sua necessidade.
              </p>
            </div>

            <div className="svc-services-list">
              {[
                {
                  num: '01',
                  title: 'Presença Digital',
                  desc: 'Sites institucionais, lojas virtuais e landing pages para posicionar sua marca e gerar resultados online.',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
                    </svg>
                  ),
                },
                {
                  num: '02',
                  title: 'Sistemas de Gestão',
                  desc: 'Plataformas sob medida para organizar operações, centralizar dados e dar visibilidade ao negócio.',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                  ),
                },
                {
                  num: '03',
                  title: 'Aplicativos Mobile',
                  desc: 'Apps nativos para iOS e Android com foco em experiência do usuário e performance.',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
                    </svg>
                  ),
                },
                {
                  num: '04',
                  title: 'Automação de Processos',
                  desc: 'Integração entre sistemas e fluxos inteligentes que eliminam tarefas repetitivas.',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                    </svg>
                  ),
                },
              ].map((svc, i) => (
                <div key={svc.num} className="svc-service-row svc-anim" style={{ transitionDelay: `${0.15 + i * 0.1}s` }}>
                  <span className="svc-service-num">{svc.num}</span>
                  <div className="svc-service-icon">{svc.icon}</div>
                  <div className="svc-service-text">
                    <h3>{svc.title}</h3>
                    <p>{svc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Seção 3: Processo + CTA + Footer ── */}
        <section className="svc-section svc-section-cta" ref={setSectionRef(2)}>
          <div className="svc-cta-content">
            <div className="svc-cta-inner">
              <span className="svc-cta-badge svc-anim">Como funciona</span>

              <div className="svc-process svc-anim" style={{ transitionDelay: '0.1s' }}>
                {[
                  { n: '1', label: 'Diagnóstico', desc: 'Entendemos o cenário e os objetivos' },
                  { n: '2', label: 'Proposta', desc: 'Escopo, cronograma e investimento claros' },
                  { n: '3', label: 'Desenvolvimento', desc: 'Entregas semanais com acompanhamento' },
                  { n: '4', label: 'Entrega', desc: 'Deploy, treinamento e suporte contínuo' },
                ].map((step) => (
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
                  Vamos conversar sobre o seu <span className="text-gradient">projeto</span>?
                </h2>
                <p className="svc-cta-desc">
                  Uma conversa de 15 minutos, sem custo e sem compromisso.
                </p>
                <a
                  href="https://wa.me/5516999493490?text=Oi!%20Quero%20marcar%20uma%20conversa%20sobre%20um%20projeto."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="svc-cta-btn"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Agendar conversa
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
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
      </div>
    </div>
  );
}
