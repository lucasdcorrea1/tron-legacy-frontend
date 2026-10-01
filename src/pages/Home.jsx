import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { blog, getImageUrl } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import Header from '../components/Header';

// Decorative WebGL layer (three + three-fluid-fx, ~500 KB). Lazy-loaded so it
// never blocks the hero's first paint.
const FluidParticles = lazy(() => import('../components/FluidParticles'));
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Home.css';

const TOTAL_SECTIONS = 4;

const COOLDOWN_MS = 1000;

// Live store preview URL. In local dev we point at the running store
// (localhost:5174); in production builds we embed the deployed store.
const STORE_URL = import.meta.env.DEV
  ? 'http://localhost:5174/'
  : 'https://ecommerce.lucas-dcorrea1.workers.dev/';

const STORE_HOST = (() => {
  try {
    return new URL(STORE_URL).host;
  } catch {
    return STORE_URL;
  }
})();

// Index of the store-demo section within the sections track.
const DEMO_SECTION = 2;

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);
  // Store preview: only mount the iframe once the demo section is reached
  // (so the heavy store never loads on first paint), and only let the pointer
  // reach it after an explicit click (so wheel scroll isn't trapped).
  const [loadStore, setLoadStore] = useState(false);
  const [storeActive, setStoreActive] = useState(false);

  const homeRef = useRef(null);
  const heroGlowRef = useRef(null);
  const sectionsRef = useRef([]);
  const touchStartY = useRef(0);
  const isLocked = useRef(false);
  const activeSectionRef = useRef(0);

  useHorizontalPageSwipe(homeRef);

  // Mouse glow on hero
  useEffect(() => {
    const section = sectionsRef.current[0];
    const glow = heroGlowRef.current;
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

  // Mount the store iframe the first time the demo section becomes active.
  useEffect(() => {
    if (activeSection === DEMO_SECTION) setLoadStore(true);
  }, [activeSection]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile: IntersectionObserver for animations + active dot sync
  useEffect(() => {
    if (!isMobile) return;
    // On mobile, make all existing sections visible immediately for initial render
    sectionsRef.current.forEach((section) => {
      if (section) section.classList.add('section-visible');
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
            const idx = sectionsRef.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveSection(idx);
          }
        });
      },
      { threshold: 0.3 }
    );
    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [isMobile]);

  useEffect(() => {
    fetchPosts();
    // Desktop: trigger first section animation on mount
    if (!isMobile) {
      setTimeout(() => {
        sectionsRef.current[0]?.classList.add('section-visible');
      }, 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToSection = useCallback((index) => {
    if (index < 0 || index >= TOTAL_SECTIONS) return;
    if (isLocked.current) return;

    isLocked.current = true;
    activeSectionRef.current = index;
    setActiveSection(index);

    // Trigger entry animation
    sectionsRef.current[index]?.classList.add('section-visible');

    // Unlock after transition completes
    setTimeout(() => {
      isLocked.current = false;
    }, COOLDOWN_MS);
  }, []);

  // Wheel — hijack, one tick = one section (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const container = homeRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      const activeEl = sectionsRef.current[activeSectionRef.current];
      if (activeEl) {
        const atTop = activeEl.scrollTop <= 0;
        const atBottom = Math.ceil(activeEl.scrollTop + activeEl.clientHeight) >= activeEl.scrollHeight;
        // Content overflows the section — let it scroll natively until it hits an edge
        if (e.deltaY > 0 && !atBottom) return;
        if (e.deltaY < 0 && !atTop) return;
      }

      e.preventDefault();
      if (isLocked.current) return;

      if (e.deltaY > 0) {
        goToSection(activeSectionRef.current + 1);
      } else if (e.deltaY < 0) {
        goToSection(activeSectionRef.current - 1);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [goToSection, isMobile]);

  // Touch — swipe up/down (desktop only, mobile uses native scroll)
  useEffect(() => {
    if (isMobile) return;
    const container = homeRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 50) return;

      const activeEl = sectionsRef.current[activeSectionRef.current];
      if (activeEl) {
        const atTop = activeEl.scrollTop <= 0;
        const atBottom = Math.ceil(activeEl.scrollTop + activeEl.clientHeight) >= activeEl.scrollHeight;
        if (deltaY > 0 && !atBottom) return;
        if (deltaY < 0 && !atTop) return;
      }

      if (deltaY > 0) {
        goToSection(activeSectionRef.current + 1);
      } else {
        goToSection(activeSectionRef.current - 1);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToSection, isMobile]);

  // Keyboard — arrows / page keys (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToSection(activeSectionRef.current + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToSection(activeSectionRef.current - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToSection, isMobile]);

  const setSectionRef = useCallback((index) => (el) => {
    sectionsRef.current[index] = el;
  }, []);

  const handleDotClick = useCallback((index) => {
    if (isMobile) {
      sectionsRef.current[index]?.scrollIntoView({ behavior: 'smooth' });
    } else {
      goToSection(index);
    }
  }, [isMobile, goToSection]);

  const fetchPosts = async () => {
    try {
      const data = await blog.list({ page: 1, limit: 3 });
      setPosts(data.posts || []);
    } catch (err) {
      // ignore fetch error
    } finally {
      setLoadingPosts(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="home" ref={homeRef}>
      <Helmet>
        <title>Whodo - Sua loja online pronta + marketing automático</title>
        <meta name="description" content="A Whodo cria seu e-commerce e cuida de todo o marketing — posts, Meta Ads, e-mail e automações, integrados. Você vende, a gente coloca pra rodar." />
        <link rel="canonical" href="https://whodo.com.br/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/" />
        <meta property="og:title" content="Whodo - Sua loja online pronta + marketing automático" />
        <meta property="og:description" content="A Whodo cria seu e-commerce e cuida de todo o marketing — posts, Meta Ads, e-mail e automações, integrados. Você vende, a gente coloca pra rodar." />
        <meta property="og:image" content="https://whodo.com.br/teste-image-home.png" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Whodo - Sua loja online pronta + marketing automático" />
        <meta name="twitter:description" content="Sua loja online pronta + marketing automático integrado. Você vende, a Whodo coloca pra rodar." />
        <meta name="twitter:image" content="https://whodo.com.br/teste-image-home.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Whodo',
          url: 'https://whodo.com.br',
          description: 'Criação de e-commerce com marketing automático integrado: posts, Meta Ads, e-mail e automações.',
          logo: { '@type': 'ImageObject', url: 'https://whodo.com.br/favicon.svg' },
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+55-16-99949-3490',
            contactType: 'customer service',
            areaServed: 'BR',
            availableLanguage: 'Portuguese',
          },
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Ribeirão Preto',
            addressRegion: 'SP',
            addressCountry: 'BR',
          },
          areaServed: {
            '@type': 'Country',
            name: 'Brazil',
          },
          sameAs: [
            'https://wa.me/5516999493490',
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Whodo',
          url: 'https://whodo.com.br',
          inLanguage: 'pt-BR',
          publisher: { '@type': 'Organization', name: 'Whodo' },
        })}</script>
      </Helmet>
      <Header />

      {/* Lava lamp */}
      <div className="home-orbs" aria-hidden="true">
        <div className="home-orb home-orb--1" />
        <div className="home-orb home-orb--2" />
        <div className="home-orb home-orb--3" />
      </div>
      {/* Frosted glass over orbs */}
      <div className="home-glass" aria-hidden="true" />

      {/* GPGPU fluid particle field (three-fluid-fx) — crisp layer above the glass */}
      {/* Effect runs across all sections; page content (z-index 2) stays in
          front of the canvas (z-index 1), so cards remain readable over it. */}
      <Suspense fallback={null}>
        <FluidParticles interactionRef={homeRef} />
      </Suspense>

      {/* Scroll Indicator Dots */}
      <div className="scroll-dots">
        {Array.from({ length: TOTAL_SECTIONS }, (_, i) => i).map((i) => (
          <button
            key={i}
            className={`scroll-dot ${activeSection === i ? 'active' : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Ir para seção ${i + 1}`}
          />
        ))}
      </div>

      {/* Sections Track — slides via translateY */}
      <main
        className="sections-track"
        style={isMobile ? undefined : { transform: `translateY(-${activeSection * 100}vh)` }}
      >
        {/* Tela 1 - Hero */}
        <section className="section-snap" ref={setSectionRef(0)}>
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-glow" ref={heroGlowRef} aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-content">
              <p className="hero-tagline animate-item">Loja + marketing, feito pra você</p>
              <h1 className="hero-title animate-item" style={{ transitionDelay: '0.1s' }}>
                Sua loja online pronta e o marketing no <span className="text-gradient">automático</span>
              </h1>
              <p className="hero-description animate-item" style={{ transitionDelay: '0.2s' }}>
                A Whodo cria seu e-commerce e toca toda a estratégia — Instagram, Meta Ads,
                e-mail e automações. Você acompanha os resultados; a gente faz o trabalho.
              </p>
              <div className="hero-actions animate-item" style={{ transitionDelay: '0.3s' }}>
                <a
                  href={`https://wa.me/5516999493490?text=${encodeURIComponent('Olá! Quero criar minha loja com a Whodo')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Quero minha loja
                </a>
                <button type="button" onClick={() => goToSection(1)} className="btn-ghost">
                  Ver planos
                </button>
              </div>
            </div>
            {/* Hero image hidden — the galaxy effect stands alone on the right. */}
          </div>
          <button className="scroll-hint" onClick={() => goToSection(1)} aria-label="Rolar para próxima seção">
            <span className="scroll-hint-text">Scroll</span>
            <div className="scroll-hint-arrow"></div>
          </button>
        </section>

        {/* Tela 2 - Planos */}
        <section className="section-snap section-cta-footer" ref={setSectionRef(1)}>
          <div className="cta-footer-content">
            <div className="cta-inner">
              <span className="audit-badge animate-item">Planos</span>
              <h2 className="cta-title animate-item" style={{ transitionDelay: '0.05s' }}>
                Sua loja + marketing,<br />
                num plano <span className="text-gradient">só</span>
              </h2>
              <p className="cta-description animate-item" style={{ transitionDelay: '0.1s' }}>
                Loja pronta pra vender e marketing no automático. Sem taxa de setup. Cancele quando quiser.
              </p>

              <div className="home-plans animate-item" style={{ transitionDelay: '0.2s' }}>
                <div className="home-plan-card">
                  <div className="home-plan-header">
                    <h3>Essencial</h3>
                    <p className="home-plan-desc">Pra tirar a loja do papel</p>
                  </div>
                  <div className="home-plan-pricing">
                    <span className="home-plan-amount">R$199</span>
                    <span className="home-plan-period">/mês</span>
                  </div>
                  <a href={`https://wa.me/5516999493490?text=${encodeURIComponent('Olá! Quero o plano Essencial (Loja + Marketing)')}`} target="_blank" rel="noopener noreferrer" className="home-plan-btn">Quero o Essencial</a>
                  <div className="home-plan-divider" />
                  <ul className="home-plan-features">
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Loja online pronta e hospedada</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Pagamentos Pix, boleto e cartão</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Catálogo de produtos</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Posts agendados + 1 rede social</li>
                  </ul>
                </div>

                <div className="home-plan-card popular">
                  <span className="home-plan-badge">Mais escolhido</span>
                  <div className="home-plan-header">
                    <h3>Pro</h3>
                    <p className="home-plan-desc">Pra vender e escalar de verdade</p>
                  </div>
                  <div className="home-plan-pricing">
                    <span className="home-plan-amount">R$499</span>
                    <span className="home-plan-period">/mês</span>
                  </div>
                  <a href={`https://wa.me/5516999493490?text=${encodeURIComponent('Olá! Quero o plano Pro (Loja + Marketing)')}`} target="_blank" rel="noopener noreferrer" className="home-plan-btn primary">
                    Quero o Pro
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </a>
                  <div className="home-plan-divider" />
                  <ul className="home-plan-features">
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Tudo do Essencial</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Produtos ilimitados</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Instagram + Meta Ads + E-mail</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Automações e recuperação de carrinho</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Campanhas gerenciadas pela Whodo</li>
                  </ul>
                </div>

                <div className="home-plan-card">
                  <div className="home-plan-header">
                    <h3>Enterprise</h3>
                    <p className="home-plan-desc">Pra operações que querem mais</p>
                  </div>
                  <div className="home-plan-pricing">
                    <span className="home-plan-amount">R$999</span>
                    <span className="home-plan-period">/mês</span>
                  </div>
                  <a href={`https://wa.me/5516999493490?text=${encodeURIComponent('Olá! Quero o plano Enterprise (Loja + Marketing)')}`} target="_blank" rel="noopener noreferrer" className="home-plan-btn">Falar com a gente</a>
                  <div className="home-plan-divider" />
                  <ul className="home-plan-features">
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Tudo do Pro</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Gestão de tráfego dedicada</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Integrações (ERP/Bling, Conta Azul)</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Suporte prioritário + gerente de conta</li>
                  </ul>
                </div>
              </div>

              <div className="home-plans-trust animate-item" style={{ transitionDelay: '0.25s' }}>
                <span>Sem fidelidade</span>
                <span className="trust-dot" />
                <span>PIX, boleto ou cartão</span>
                <span className="trust-dot" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tela 3 - Demo da loja (preview ao vivo) */}
        <section className="section-snap section-demo" ref={setSectionRef(DEMO_SECTION)}>
          <div className="section-inner demo-inner">
            <div className="section-header section-header--compact">
              <span className="demo-badge animate-item">Demonstração</span>
              <h2 className="section-title animate-item" style={{ transitionDelay: '0.05s' }}>
                Veja uma loja <span className="text-gradient">de verdade</span>
              </h2>
              <p className="section-description animate-item" style={{ transitionDelay: '0.1s' }}>
                Essa é uma loja real feita pela Whodo — navegue, abra um produto, use o
                carrinho. É exatamente o que a gente entrega pra você.
              </p>
            </div>

            <div className="store-mock animate-item" style={{ transitionDelay: '0.2s' }}>
              <div className="store-mock-bar">
                <span className="store-dot store-dot--red" />
                <span className="store-dot store-dot--yellow" />
                <span className="store-dot store-dot--green" />
                <span className="store-mock-url">{STORE_HOST}</span>
                <a
                  href={STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-mock-open"
                  aria-label="Abrir loja em nova aba"
                >
                  Abrir em nova aba
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
              <div className="store-mock-viewport">
                {loadStore ? (
                  <>
                    <iframe
                      src={STORE_URL}
                      title="Loja de demonstração Whodo"
                      className="store-iframe"
                      loading="lazy"
                      style={{ pointerEvents: storeActive ? 'auto' : 'none' }}
                    />
                    {!storeActive && (
                      <button
                        type="button"
                        className="store-activate"
                        onClick={() => setStoreActive(true)}
                      >
                        <span className="store-activate-pill">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          Clique para navegar na loja
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className="store-activate store-activate--load"
                    onClick={() => { setLoadStore(true); setStoreActive(true); }}
                  >
                    <span className="store-activate-pill">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Carregar loja de demonstração
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="section-cta animate-item" style={{ transitionDelay: '0.3s' }}>
              <a
                href={`https://wa.me/5516999493490?text=${encodeURIComponent('Olá! Vi a loja de demonstração e quero a minha')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Quero uma loja assim
              </a>
            </div>
          </div>
        </section>

        {/* Tela 4 - Blog */}
        <section className="section-snap section-blog" ref={setSectionRef(3)}>
          <div className="section-inner">
            <div className="section-header section-header--compact">
              <h2 className="section-title animate-item">Blog</h2>
            </div>

            {loadingPosts ? (
              <div className="loading">
                <div className="loading-spinner"></div>
                <span>Carregando posts...</span>
              </div>
            ) : posts.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">&#9997;</span>
                <p>Nenhum post publicado ainda.</p>
              </div>
            ) : (
              <div className="blog-cards-grid">
                {posts.map((post, index) => (
                  <Link
                    to={`/blog/${post.slug}`}
                    key={post._id || post.id}
                    className="blog-card animate-card"
                    style={{ transitionDelay: `${index * 0.07}s` }}
                  >
                    <div className="blog-card-image">
                      {(post.cover_images && post.cover_images.length > 0) || post.cover_image ? (
                        <ImageCarousel
                          images={post.cover_images}
                          legacyImage={post.cover_image}
                          size="card"
                          alt={post.title}
                          showControls={post.cover_images && post.cover_images.length > 1}
                        />
                      ) : (
                        <div className="post-image-placeholder">
                          {post.title.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="blog-card-content">
                      {post.category && <span className="post-category">{post.category}</span>}
                      <h3 className="blog-card-title">{post.title}</h3>
                      {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
                      <div className="post-meta-row">
                        <span className="meta-item">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {formatDate(post.published_at || post.created_at)}
                        </span>
                        {post.reading_time && (
                          <span className="meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            {post.reading_time} min
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="section-cta animate-item" style={{ transitionDelay: '0.25s' }}>
              <Link to="/blog" className="btn-outline">Ver todos os posts</Link>
            </div>
          </div>
          <footer className="footer-compact">
            <div className="footer-compact-inner">
              <Link to="/" className="footer-brand-compact">whodo</Link>
              <div className="footer-links-compact">
                <Link to="/blog">Blog</Link>
                <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
              <p className="footer-copy">&copy; {new Date().getFullYear()} Whodo Group LTDA - CNPJ 59.704.711/0001-90</p>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
