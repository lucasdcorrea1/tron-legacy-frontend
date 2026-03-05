import { useState, useEffect } from 'react';

const styles = {
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'rgba(9, 9, 11, 0.95)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(168, 85, 247, 0.15)',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    animation: 'cookieSlideUp 0.3s ease-out',
  },
  text: {
    color: '#d4d4d8',
    fontSize: '0.8125rem',
    lineHeight: 1.5,
    maxWidth: '600px',
  },
  link: {
    color: '#c084fc',
    textDecoration: 'underline',
  },
  buttons: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0,
  },
  accept: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#fff',
    background: '#a855f7',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  reject: {
    padding: '0.5rem 1.25rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#d4d4d8',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
    if (typeof window.loadTrackingScripts === 'function') {
      window.loadTrackingScripts();
    }
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`@keyframes cookieSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      <div style={styles.banner} role="region" aria-label="Consentimento de cookies">
        <p style={styles.text}>
          Usamos cookies para analytics e personalizar sua experiencia.
        </p>
        <div style={styles.buttons}>
          <button style={styles.reject} onClick={reject}>Recusar</button>
          <button style={styles.accept} onClick={accept}>Aceitar</button>
        </div>
      </div>
    </>
  );
}
