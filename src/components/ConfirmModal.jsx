import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import './ConfirmModal.css';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(({ title, message, confirmText, cancelText, variant }) => {
    return new Promise((resolve) => {
      setState({ title, message, confirmText, cancelText, variant, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  // Close on Escape
  useEffect(() => {
    if (!state) return;
    const handler = (e) => { if (e.key === 'Escape') handleCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="confirm-overlay" onClick={handleCancel}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-icon ${state.variant || 'warning'}`}>
              {state.variant === 'danger' ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              )}
            </div>
            <h3 className="confirm-title">{state.title || 'Confirmação'}</h3>
            <p className="confirm-message">{state.message}</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={handleCancel}>
                {state.cancelText || 'Cancelar'}
              </button>
              <button className={`confirm-btn ${state.variant || 'primary'}`} onClick={handleConfirm} autoFocus>
                {state.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider');
  return confirm;
}
