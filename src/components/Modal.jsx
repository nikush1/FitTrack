import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children }) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (open) {
      // Save current scroll position
      scrollYRef.current = window.scrollY;
      // Fix body in place instead of overflow:hidden (prevents iOS scroll-to-top jump)
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll'; // keep scrollbar width stable
    } else {
      // Restore body and scroll position
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet — flex column with explicit max height so inner scroll works */}
      <div
        className="relative w-full max-w-lg animate-slide-up"
        style={{ maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}
      >
        <div
          className="bg-card rounded-t-[28px] shadow-ios-lg"
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            flex: 1,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-9 h-1 bg-subtle rounded-full" />
          </div>

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-label font-semibold text-[17px]">{title}</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-secondary hover:bg-gray-200 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          )}

          {/* Scrollable content — flex-1 + min-h-0 is required for overflow-y-auto to work inside flex */}
          <div
            style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
            className="px-5 py-4"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
