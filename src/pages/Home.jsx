import { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { blog, getImageUrl } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import Header from '../components/Header';
import useHorizontalPageSwipe from '../hooks/useHorizontalPageSwipe';
import './Home.css';

const TOTAL_SECTIONS = 4;

// Dados dos clientes
const CLIENTS = [
  { name: 'Masson Contabilidade', logo: '/clients/masson.webp', url: 'https://www.massoncontabilidade.com.br/' },
  { name: 'AutoFas Store', logo: '/clients/autofas.avif', url: 'https://autofasstore.com/' },
  { name: 'Dreamer Studios', logo: '/clients/dreamer.png', url: 'https://dreamerstudios.io/' },
  { name: 'House of Caju', logo: '/clients/houseofcaju.png', url: 'https://www.houseofcaju.com.br/' },
];
const COOLDOWN_MS = 1000;

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

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
        <title>Whodo - A plataforma que acelera seu marketing digital</title>
        <meta name="description" content="Agende posts, automatize respostas e gerencie campanhas no Instagram, Meta Ads e Email Marketing. Tudo em um só lugar." />
        <link rel="canonical" href="https://whodo.com.br/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://whodo.com.br/" />
        <meta property="og:title" content="Whodo - A plataforma que acelera seu marketing digital" />
        <meta property="og:description" content="Agende posts, automatize respostas e gerencie campanhas no Instagram, Meta Ads e Email Marketing. Tudo em um só lugar." />
        <meta property="og:image" content="https://whodo.com.br/teste-image-home.png" />
        <meta property="og:locale" content="pt_BR" />
        <meta property="og:site_name" content="Whodo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Whodo - A plataforma que acelera seu marketing digital" />
        <meta name="twitter:description" content="Agende posts, automatize respostas e gerencie campanhas. Tudo em um só lugar." />
        <meta name="twitter:image" content="https://whodo.com.br/teste-image-home.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Whodo',
          url: 'https://whodo.com.br',
          description: 'Plataforma de marketing digital: agende posts, automatize respostas e gerencie campanhas.',
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

      {/* Scroll Indicator Dots */}
      <div className="scroll-dots">
        {[0, 1, 2, 3].map((i) => (
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
              <p className="hero-tagline animate-item">Seu marketing no piloto automático</p>
              <h1 className="hero-title animate-item" style={{ transitionDelay: '0.1s' }}>
                Alavanque seus resultados com o <span className="text-gradient">Whodo</span>
              </h1>
              <p className="hero-description animate-item" style={{ transitionDelay: '0.2s' }}>
                Agende posts, automatize respostas e gerencie campanhas no Instagram,
                Meta Ads e Email Marketing. Tudo em um só lugar.
              </p>
              <div className="hero-actions animate-item" style={{ transitionDelay: '0.3s' }}>
                <Link to="/login" className="btn-primary">
                  Comece Grátis
                </Link>
                <Link to="/onboarding" className="btn-ghost">
                  Ver Planos
                </Link>
              </div>
            </div>
            <div className="hero-visual animate-item" style={{ transitionDelay: '0.2s' }}>
              <picture>
                <source srcSet="/teste-image-home.webp" type="image/webp" />
                <img
                  src="/teste-image-home.png"
                  alt="Digital Innovation"
                  className="hero-image"
                  width="960"
                  height="536"
                  fetchPriority="high"
                />
              </picture>
            </div>
          </div>
          <button className="scroll-hint" onClick={() => goToSection(1)} aria-label="Rolar para próxima seção">
            <span className="scroll-hint-text">Scroll</span>
            <div className="scroll-hint-arrow"></div>
          </button>
        </section>

        {/* Tela 2 - Blog */}
        <section className="section-snap section-blog" ref={setSectionRef(1)}>
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
        </section>

        {/* Tela 3 - Clientes */}
        <section className="section-snap section-clients" ref={setSectionRef(2)}>
          <div className="section-inner">
            <div className="section-header">
              <span className="clients-badge animate-item">Parceiros</span>
              <h2 className="section-title animate-item" style={{ transitionDelay: '0.05s' }}>
                Quem confia no <span className="text-gradient">Whodo</span>
              </h2>
              <p className="section-description animate-item" style={{ transitionDelay: '0.1s' }}>
                Empresas que escolheram acelerar seus resultados com nossa plataforma
              </p>
            </div>

            <div className="clients-carousel animate-item" style={{ transitionDelay: '0.15s' }}>
              <div className="clients-track">
                {/* Duplicamos os logos para criar o efeito infinito */}
                {[...CLIENTS, ...CLIENTS, ...CLIENTS].map((client, index) => (
                  <a
                    key={`${client.name}-${index}`}
                    href={client.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="client-logo-wrapper"
                    title={client.name}
                  >
                    <img
                      src={client.logo}
                      alt={client.name}
                      className="client-logo"
                      loading="lazy"
                    />
                  </a>
                ))}
              </div>
            </div>

            <div className="clients-cta animate-item" style={{ transitionDelay: '0.25s' }}>
              <p className="clients-cta-text">Quer fazer parte dessa lista?</p>
              <Link to="/login" className="btn-primary">
                Comece agora
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Tela 4 - CTA + Footer */}
        <section className="section-snap section-cta-footer" ref={setSectionRef(3)}>
          <div className="cta-footer-content">
            <div className="cta-inner">
              <span className="audit-badge animate-item">Planos</span>
              <h2 className="cta-title animate-item" style={{ transitionDelay: '0.05s' }}>
                Invista no crescimento<br />
                do seu <span className="text-gradient">negócio</span>
              </h2>
              <p className="cta-description animate-item" style={{ transitionDelay: '0.1s' }}>
                Comece grátis. Escale sem limites. Cancele quando quiser.
              </p>

              <div className="home-plans animate-item" style={{ transitionDelay: '0.2s' }}>
                <div className="home-plan-card">
                  <div className="home-plan-top">
                    <h3>Free</h3>
                    <div className="home-plan-price"><span>R$0</span><small>/mês</small></div>
                  </div>
                  <ul>
                    <li>1 membro</li>
                    <li>10 posts agendados</li>
                    <li>3 regras auto-resposta</li>
                    <li>Blog ilimitado</li>
                  </ul>
                  <Link to="/login" className="home-plan-btn">Começar grátis</Link>
                </div>

                <div className="home-plan-card popular">
                  <span className="home-plan-badge">Mais escolhido</span>
                  <div className="home-plan-top">
                    <h3>Pro</h3>
                    <div className="home-plan-price"><span>R$149</span><small>/mês</small></div>
                  </div>
                  <ul>
                    <li>10 membros da equipe</li>
                    <li>Posts e campanhas ilimitados</li>
                    <li>Instagram + Meta Ads</li>
                    <li>Email Marketing completo</li>
                  </ul>
                  <Link to="/onboarding" className="home-plan-btn primary">
                    Começar agora
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                </div>

                <div className="home-plan-card">
                  <div className="home-plan-top">
                    <h3>Enterprise</h3>
                    <div className="home-plan-price"><span>R$399</span><small>/mês</small></div>
                  </div>
                  <ul>
                    <li>Membros ilimitados</li>
                    <li>Tudo do Pro incluso</li>
                    <li>Suporte prioritário</li>
                    <li>SLA dedicado</li>
                  </ul>
                  <Link to="/onboarding" className="home-plan-btn">Falar com vendas</Link>
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
