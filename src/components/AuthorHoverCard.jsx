import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getImageUrl } from '../services/api';
import './AuthorHoverCard.css';

const socialMeta = {
  instagram: { label: 'Instagram', color: '#E4405F' },
  twitter: { label: 'X / Twitter', color: '#1DA1F2' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2' },
  github: { label: 'GitHub', color: '#f0f0f0' },
  website: { label: 'Website', color: '#a78bfa' },
};

const socialIcons = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

const SocialIcon = ({ type, url }) => {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ahc-social-link"
      onClick={(e) => e.stopPropagation()}
    >
      {socialIcons[type]}
    </a>
  );
};

/* ── Modal (portal) ── */
function AuthorModal({ name, avatar, bio, coverImage, social, onClose }) {
  const [closing, setClosing] = useState(false);
  const socialEntries = social
    ? Object.entries(socialMeta).filter(([key]) => social[key])
    : [];

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && handleClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  return createPortal(
    <div className={`ahc-overlay ${closing ? 'ahc-overlay--out' : ''}`} onClick={handleClose}>
      <div className={`ahc-modal ${closing ? 'ahc-modal--out' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="ahc-modal-close" onClick={handleClose} aria-label="Fechar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Cover with gradient overlay */}
        <div className="ahc-modal-cover">
          {coverImage ? (
            <img src={getImageUrl(coverImage)} alt="" />
          ) : (
            <div className="ahc-cover-placeholder" />
          )}
          <div className="ahc-modal-cover-fade" />
        </div>

        {/* Avatar hero */}
        <div className="ahc-modal-avatar-hero">
          <div className="ahc-modal-avatar-ring">
            {avatar ? (
              <img src={getImageUrl(avatar)} alt={name} className="ahc-modal-avatar" />
            ) : (
              <div className="ahc-modal-avatar-placeholder">
                {name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="ahc-modal-info">
          <h3 className="ahc-modal-name">{name || 'Autor'}</h3>
          {bio && <p className="ahc-modal-bio">{bio}</p>}

          {socialEntries.length > 0 && (
            <div className="ahc-modal-socials">
              {socialEntries.map(([key, { label, color }], i) => (
                <a
                  key={key}
                  href={social[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ahc-modal-social-btn"
                  style={{ '--btn-accent': color, '--btn-i': i }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="ahc-modal-social-icon">{socialIcons[key]}</span>
                  <span className="ahc-modal-social-label">{label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Main component ── */
export default function AuthorHoverCard({ name, avatar, bio, coverImage, social, children }) {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [position, setPosition] = useState('below');
  const triggerRef = useRef(null);
  const cardRef = useRef(null);
  const timeoutRef = useRef(null);

  const hasSocial = social && (social.instagram || social.twitter || social.linkedin || social.github || social.website);

  const show = useCallback(() => {
    if (modalOpen) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setPosition(spaceBelow < 300 ? 'above' : 'below');
      }
      setVisible(true);
    }, 300);
  }, [modalOpen]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 200);
  }, []);

  const openModal = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    clearTimeout(timeoutRef.current);
    setVisible(false);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  if (isMobile) {
    return (
      <>
        <span className="ahc-trigger" onClick={openModal}>{children}</span>
        {modalOpen && (
          <AuthorModal
            name={name} avatar={avatar} bio={bio}
            coverImage={coverImage} social={social}
            onClose={closeModal}
          />
        )}
      </>
    );
  }

  return (
    <>
      <span
        className="ahc-trigger"
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={openModal}
      >
        {children}
        {visible && (
          <div
            ref={cardRef}
            className={`ahc-card ahc-${position}`}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <div className="ahc-cover">
              {coverImage ? (
                <img src={getImageUrl(coverImage)} alt="" className="ahc-cover-img" />
              ) : (
                <div className="ahc-cover-placeholder" />
              )}
            </div>
            <div className="ahc-body">
              <div className="ahc-avatar-row">
                {avatar ? (
                  <img src={getImageUrl(avatar)} alt={name} className="ahc-avatar" />
                ) : (
                  <div className="ahc-avatar-placeholder">
                    {name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <h4 className="ahc-name">{name || 'Autor'}</h4>
              {bio && <p className="ahc-bio">{bio}</p>}
              {hasSocial && (
                <div className="ahc-socials">
                  <SocialIcon type="instagram" url={social.instagram} />
                  <SocialIcon type="twitter" url={social.twitter} />
                  <SocialIcon type="linkedin" url={social.linkedin} />
                  <SocialIcon type="github" url={social.github} />
                  <SocialIcon type="website" url={social.website} />
                </div>
              )}
              <div className="ahc-expand-hint">Clique para ver perfil completo</div>
            </div>
          </div>
        )}
      </span>

      {modalOpen && (
        <AuthorModal
          name={name} avatar={avatar} bio={bio}
          coverImage={coverImage} social={social}
          onClose={closeModal}
        />
      )}
    </>
  );
}
