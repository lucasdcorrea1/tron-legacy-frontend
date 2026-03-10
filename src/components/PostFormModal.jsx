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
      <div className="pfm-modal">
        <button className="pfm-close" onClick={onClose} title="Fechar">
          <span>&times;</span>
        </button>
        <div className="pfm-body">
          <PostFormContent
            key={slug || '__new__'}
            slug={slug}
            onSuccess={() => { onSaved(); onClose(); }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
