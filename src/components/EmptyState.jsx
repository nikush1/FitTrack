export default function EmptyState({ icon = '📋', title, subtitle, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="text-label font-semibold text-[17px] mb-1">{title}</p>
      {subtitle && <p className="text-secondary text-[14px] mb-5 leading-relaxed max-w-xs">{subtitle}</p>}
      {action && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold shadow-ios-blue transition-all active:scale-95"
        >
          {action}
        </button>
      )}
    </div>
  );
}
