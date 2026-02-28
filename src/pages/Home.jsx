import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { blog, getImageUrl } from '../services/api';
import ImageCarousel from '../components/ImageCarousel';
import Header from '../components/Header';
import './Home.css';

const TOTAL_SECTIONS = 3;
const COOLDOWN_MS = 1000;

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  const homeRef = useRef(null);
  const sectionsRef = useRef([]);
  const touchStartY = useRef(0);
  const isLocked = useRef(false);
  const activeSectionRef = useRef(0);

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

      {/* Lava lamp */}
      <div className="home-orbs">
        <div className="home-orb home-orb--1" />
        <div className="home-orb home-orb--2" />
        <div className="home-orb home-orb--3" />
      </div>
      {/* Frosted glass over orbs */}
      <div className="home-glass" />

      {/* Scroll Indicator Dots */}
      <div className="scroll-dots">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            className={`scroll-dot ${activeSection === i ? 'active' : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Ir para seção ${i + 1}`}
          />
        ))}
      </div>

      {/* Sections Track — slides via translateY */}
      <div
        className="sections-track"
        style={isMobile ? undefined : { transform: `translateY(-${activeSection * 100}vh)` }}
      >
        {/* Tela 1 - Hero */}
        <section className="section-snap" ref={setSectionRef(0)}>
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
                          size="banner"
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
              <span className="audit-badge animate-item">Auditoria gratuita</span>
              <h2 className="cta-title animate-item" style={{ transitionDelay: '0.05s' }}>
                Descubra onde seu negócio<br />
                está <span className="text-gradient">perdendo dinheiro</span>
              </h2>
              <p className="cta-description animate-item" style={{ transitionDelay: '0.1s' }}>
                Analisamos sua operação de graça e mostramos exatamente o que está travando seu crescimento.
              </p>

              <div className="audit-benefits animate-item" style={{ transitionDelay: '0.2s' }}>
                <div className="audit-benefit">
                  <span className="audit-benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </span>
                  <span className="audit-benefit-text">Processos que consomem tempo</span>
                </div>
                <div className="audit-benefit">
                  <span className="audit-benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </span>
                  <span className="audit-benefit-text">Gargalos que custam dinheiro</span>
                </div>
                <div className="audit-benefit">
                  <span className="audit-benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </span>
                  <span className="audit-benefit-text">Ações práticas de melhoria</span>
                </div>
                <div className="audit-benefit">
                  <span className="audit-benefit-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </span>
                  <span className="audit-benefit-text">Relatório personalizado</span>
                </div>
              </div>

              <div className="audit-cta-wrapper animate-item" style={{ transitionDelay: '0.3s' }}>
                <a
                  href="https://wa.me/5516999493490?text=Oi!%20Quero%20a%20auditoria%20gratuita"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="audit-cta-btn"
                >
                  Quero minha auditoria gratuita
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </a>
                <p className="audit-reassurance">Sem compromisso. Sem custo. Leva 15 minutos.</p>
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
      </div>
    </div>
  );
}
