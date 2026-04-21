export default function ProgressBar({ value, max, color = 'bg-primary', height = 7 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isOver = value > max;

  return (
    <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height }}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${isOver ? 'bg-danger' : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
