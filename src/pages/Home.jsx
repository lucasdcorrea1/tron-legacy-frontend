import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { blog, getImageUrl } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import Header from '../components/Header';
import './Home.css';

const TOTAL_SECTIONS = 3;
const COOLDOWN_MS = 1200;

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeSection, setActiveSection] = useState(0);

  const homeRef = useRef(null);
  const sectionsRef = useRef([]);
  const touchStartY = useRef(0);
  const isLocked = useRef(false);

  useEffect(() => {
    fetchPosts();
    // Trigger first section animation on mount
    setTimeout(() => {
      sectionsRef.current[0]?.classList.add('section-visible');
    }, 100);
  }, []);

  const goToSection = useCallback((index) => {
    if (index < 0 || index >= TOTAL_SECTIONS) return;
    if (isLocked.current) return;

    isLocked.current = true;
    setActiveSection(index);

    // Trigger entry animation
    sectionsRef.current[index]?.classList.add('section-visible');

    // Unlock after transition completes
    setTimeout(() => {
      isLocked.current = false;
    }, COOLDOWN_MS);
  }, []);

  // Wheel — hijack, one tick = one section
  useEffect(() => {
    const container = homeRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      if (isLocked.current) return;

      if (e.deltaY > 0) {
        goToSection(activeSection + 1);
      } else if (e.deltaY < 0) {
        goToSection(activeSection - 1);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [activeSection, goToSection]);

  // Touch — swipe up/down
  useEffect(() => {
    const container = homeRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 50) return;

      if (deltaY > 0) {
        goToSection(activeSection + 1);
      } else {
        goToSection(activeSection - 1);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeSection, goToSection]);

  // Keyboard — arrows / page keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        goToSection(activeSection + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goToSection(activeSection - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, goToSection]);

  const setSectionRef = useCallback((index) => (el) => {
    sectionsRef.current[index] = el;
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await blog.list({ page: 1, limit: 3 });
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Erro ao carregar posts:', err);
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
      <Header />

      {/* Scroll Indicator Dots */}
      <div className="scroll-dots">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            className={`scroll-dot ${activeSection === i ? 'active' : ''}`}
            onClick={() => goToSection(i)}
            aria-label={`Ir para seção ${i + 1}`}
          />
        ))}
      </div>

      {/* Sections Track — slides via translateY */}
      <div
        className="sections-track"
        style={{ transform: `translateY(-${activeSection * 100}vh)` }}
      >
        {/* Tela 1 - Hero */}
        <section className="section-snap" ref={setSectionRef(0)}>
          <div className="hero-glow"></div>
          <div className="hero-inner">
            <div className="hero-content">
              <p className="hero-tagline animate-item">Do conceito à realidade</p>
              <h1 className="hero-title animate-item" style={{ transitionDelay: '0.1s' }}>
                Transforme suas ideias em <span className="text-gradient">soluções digitais</span>
              </h1>
              <p className="hero-description animate-item" style={{ transitionDelay: '0.2s' }}>
                Desenvolvemos tecnologia sob medida para impulsionar seu negócio.
                Websites, apps e sistemas que fazem a diferença.
              </p>
              <div className="hero-actions animate-item" style={{ transitionDelay: '0.3s' }}>
                <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Fale Conosco
                </a>
                <Link to="/blog" className="btn-ghost">
                  Ver Blog
                </Link>
              </div>
            </div>
            <div className="hero-visual animate-item" style={{ transitionDelay: '0.2s' }}>
              <img
                src="/teste-image-home.png"
                alt="Digital Innovation"
                className="hero-image"
              />
            </div>
          </div>
          <div className="scroll-hint" onClick={() => goToSection(1)}>
            <span className="scroll-hint-text">Scroll</span>
            <div className="scroll-hint-arrow"></div>
          </div>
        </section>

        {/* Tela 2 - Blog */}
        <section className="section-snap section-blog" ref={setSectionRef(1)}>
          <div className="section-inner">
            <div className="section-header">
              <p className="section-tagline animate-item">Blog</p>
              <h2 className="section-title animate-item" style={{ transitionDelay: '0.1s' }}>Tron Legacy</h2>
              <p className="section-description animate-item" style={{ transitionDelay: '0.15s' }}>
                Artigos, tutoriais e novidades sobre tecnologia
              </p>
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
                    style={{ transitionDelay: `${0.2 + index * 0.15}s` }}
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

            <div className="section-cta animate-item" style={{ transitionDelay: '0.5s' }}>
              <Link to="/blog" className="btn-outline">Ver todos os posts</Link>
            </div>
          </div>
        </section>

        {/* Tela 3 - CTA + Footer */}
        <section className="section-snap section-cta-footer" ref={setSectionRef(2)}>
          <div className="cta-footer-content">
            <div className="cta-inner">
              <h2 className="cta-title animate-item">Pronto para começar?</h2>
              <p className="cta-description animate-item" style={{ transitionDelay: '0.1s' }}>
                Código 100% customizado para o seu negócio. Escolha o escopo e a gente constrói.
              </p>

              <div className="pricing-grid">
                {/* Site Sob Medida */}
                <div className="pricing-card animate-card" style={{ transitionDelay: '0.2s' }}>
                  <div className="pricing-header">
                    <h3 className="pricing-name">Site Sob Medida</h3>
                    <div className="pricing-price-wrapper">
                      <span className="pricing-price-label">a partir de</span>
                      <span className="pricing-price">R$ 2.500</span>
                    </div>
                  </div>
                  <ul className="pricing-features">
                    <li>Site institucional ou landing page</li>
                    <li>Design exclusivo e responsivo</li>
                    <li>SEO técnico configurado</li>
                    <li>Entrega em até 15 dias</li>
                  </ul>
                  <a href="https://wa.me/5516999493490?text=Olá!%20Tenho%20interesse%20em%20um%20Site%20Sob%20Medida" target="_blank" rel="noopener noreferrer" className="pricing-cta btn-ghost">
                    Solicitar Orçamento
                  </a>
                </div>

                {/* Aplicação Web (featured) */}
                <div className="pricing-card featured animate-card" style={{ transitionDelay: '0.35s' }}>
                  <span className="pricing-badge">Mais Procurado</span>
                  <div className="pricing-header">
                    <h3 className="pricing-name">Aplicação Web</h3>
                    <div className="pricing-price-wrapper">
                      <span className="pricing-price-label">a partir de</span>
                      <span className="pricing-price">R$ 8.000</span>
                    </div>
                  </div>
                  <ul className="pricing-features">
                    <li>Sistema web completo com backend</li>
                    <li>Painel admin personalizado</li>
                    <li>Banco de dados e API REST</li>
                    <li>Autenticação e permissões</li>
                    <li>Deploy e hospedagem configurados</li>
                    <li>30 dias de suporte pós-entrega</li>
                  </ul>
                  <a href="https://wa.me/5516999493490?text=Olá!%20Tenho%20interesse%20em%20uma%20Aplicação%20Web%20customizada" target="_blank" rel="noopener noreferrer" className="pricing-cta btn-primary">
                    Quero Minha Aplicação
                  </a>
                </div>

                {/* Software House */}
                <div className="pricing-card animate-card" style={{ transitionDelay: '0.5s' }}>
                  <span className="pricing-badge premium">Enterprise</span>
                  <div className="pricing-header">
                    <h3 className="pricing-name">Software House</h3>
                    <div className="pricing-price-wrapper">
                      <span className="pricing-price">Sob consulta</span>
                    </div>
                  </div>
                  <ul className="pricing-features">
                    <li>Projeto completo web + mobile</li>
                    <li>Arquitetura escalável sob medida</li>
                    <li>Integrações com APIs e ERPs</li>
                    <li>Equipe dedicada ao seu projeto</li>
                    <li>CI/CD e infraestrutura DevOps</li>
                    <li>Consultoria técnica contínua</li>
                    <li>Manutenção e evolução do sistema</li>
                  </ul>
                  <a href="https://wa.me/5516999493490?text=Olá!%20Preciso%20de%20um%20projeto%20de%20software%20completo%20(Software%20House)" target="_blank" rel="noopener noreferrer" className="pricing-cta btn-ghost">
                    Fale com a Equipe
                  </a>
                </div>
              </div>
            </div>
          </div>
          <footer className="footer-compact">
            <div className="footer-compact-inner">
              <div className="footer-brand-compact">
                <Link to="/" className="logo">
                  <span className="logo-mark">W</span>
                  <span className="logo-text">whodo</span>
                </Link>
              </div>
              <div className="footer-links-compact">
                <Link to="/blog">Blog</Link>
                <a href="https://wa.me/5516999493490" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
              <p className="footer-copy">&copy; {new Date().getFullYear()} Whodo Group LTDA - CNPJ 59.704.711/0001-90</p>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
