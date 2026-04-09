import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PostFormContent } from '../pages/PostForm';
import './PostFormModal.css';

export default function PostFormModal({ isOpen, slug, onClose, onSaved }) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
      document.body.style.overflow = 'hidden';
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 280);
      document.body.style.overflow = '';
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!visible) return null;

  return createPortal(
    <div
      className={`pfm-overlay ${animating ? 'pfm-enter' : 'pfm-exit'}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pfm-modal admin-layout" onClick={(e) => e.stopPropagation()}>
        <div className="pfm-header">
          <span className="pfm-header-title">{slug ? 'Editar Post' : 'Novo Post'}</span>
          <button className="pfm-close" onClick={onClose} title="Fechar (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="pfm-scroll">
          <div className="pfm-body">
            <PostFormContent
              key={slug || '__new__'}
              slug={slug}
              onSuccess={() => { onSaved(); onClose(); }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
