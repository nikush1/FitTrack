import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const typeStyle = {
    success: 'bg-[#1C1C1E] text-white',
    error:   'bg-[#1C1C1E] text-white',
    info:    'bg-[#1C1C1E] text-white',
  };

  const typeIcon = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
  };

  const iconColor = {
    success: 'text-primary',
    error:   'text-danger',
    info:    'text-accent',
  };

  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${typeStyle[t.type]} flex items-center gap-2.5 px-4 py-3 rounded-ios-xl shadow-ios-lg animate-slide-down max-w-sm w-full pointer-events-auto`}
          >
            <span className={`text-sm font-bold ${iconColor[t.type]}`}>{typeIcon[t.type]}</span>
            <span className="text-sm font-medium flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
