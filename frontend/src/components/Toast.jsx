import React, { useState, useCallback } from 'react';

const ToastContext = React.createContext();

export const useToast = () => React.useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration) => {
    addToast(message, 'error', duration);
  }, [addToast]);

  const warning = useCallback((message, duration) => {
    addToast(message, 'warning', duration);
  }, [addToast]);

  const info = useCallback((message, duration) => {
    addToast(message, 'info', duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999, maxWidth: '400px' }}>
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ toast, onClose }) => {
  const colors = {
    success: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', color: '#22c55e', icon: '✓' },
    error: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444', icon: '✕' },
    warning: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#FBBF24', icon: '⚠' },
    info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6', icon: 'i' },
  };

  const style = colors[toast.type];

  return (
    <div style={{
      background: style.bg,
      border: `1px solid ${style.border}`,
      color: style.color,
      padding: '1rem',
      borderRadius: '10px',
      marginBottom: '0.75rem',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
      animation: 'slideIn 0.3s ease-out',
    }}>
      <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{style.icon}</span>
      <span style={{ flex: 1, fontSize: '0.9rem' }}>{toast.message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: style.color, cursor: 'pointer', fontSize: '1.2rem' }}>
        ×
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
