import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function Weight() {
  const { weightLogs, addWeight, removeWeight, userGoal } = useApp();
  const { profile } = useAuth();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const unit = profile?.weightUnit || 'kg';

  const handleAdd = async () => {
    if (!weight) return;
    setSaving(true);
    try {
      await addWeight({ weight: Number(weight) });
      setWeight(''); setOpen(false);
      addToast('Weight logged!', 'success');
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const chartData = weightLogs.map(w => ({
    date: w.date ? format(new Date(w.date), 'd MMM') : '',
    weight: w.weight,
  }));

  const weights = weightLogs.map(w => w.weight);
  const min = weights.length ? Math.min(...weights) : 0;
  const max = weights.length ? Math.max(...weights) : 0;
  const latest = weights.length ? weights[weights.length - 1] : null;
  const change = weights.length >= 2 ? (weights[weights.length - 1] - weights[0]).toFixed(1) : null;

  const changeColor = change === null ? 'text-label' :
    userGoal === 'bulk' ? (Number(change) > 0 ? 'text-primary' : 'text-muted') :
    userGoal === 'cut'  ? (Number(change) < 0 ? 'text-primary' : 'text-danger') : 'text-label';

  return (
    <div className="pb-28 space-y-4 animate-fade-in">
      <div className="pt-8 flex items-center justify-between">
        <h1 className="text-label font-display text-[28px] font-bold tracking-tight">Weight</h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-accent text-white text-[14px] font-semibold shadow-ios-blue active:scale-95 transition-transform"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          Log weight
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { val: latest ?? '—', label: `Current`, sub: unit },
          { val: change !== null ? (Number(change) > 0 ? `+${change}` : change) : '—', label: 'Change', sub: unit, color: changeColor },
          { val: weightLogs.length, label: 'Entries', sub: 'total' },
        ].map(({ val, label, sub, color }) => (
          <div key={label} className="bg-card rounded-ios-xl shadow-ios p-4 text-center">
            <p className={`text-[22px] font-bold font-mono tracking-tight ${color || 'text-label'}`}>{val}</p>
            <p className="text-muted text-[11px] mt-0.5">{sub}</p>
            <p className="text-secondary text-[12px] mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {chartData.length > 1 ? (
        <div className="bg-card rounded-ios-xl shadow-ios p-5">
          <p className="text-label font-semibold text-[16px] mb-4">Progress</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F2F2F7" />
              <XAxis dataKey="date" tick={{ fill: '#8E8E93', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[Math.floor(min - 2), Math.ceil(max + 2)]}
                tick={{ fill: '#8E8E93', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{ background: '#1C1C1E', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12, padding: '8px 12px' }}
                itemStyle={{ color: '#30D158' }}
              />
              <Line type="monotone" dataKey="weight" stroke="#30D158" strokeWidth={2.5}
                dot={{ fill: '#30D158', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#30D158' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState icon="📊" title="Not enough data" subtitle="Log at least 2 entries to see your progress chart" />
      )}

      {weightLogs.length > 0 && (
        <div className="bg-card rounded-ios-xl shadow-ios overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-label font-semibold text-[16px]">History</p>
          </div>
          {[...weightLogs].reverse().map((w, i) => (
            <div key={w.id} className={`flex items-center justify-between px-5 py-3.5 ${i < weightLogs.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-ios bg-primary/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" className="w-4 h-4">
                    <circle cx="12" cy="12" r="9"/>
                    <path d="M12 8v4l3 3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <span className="text-label text-[15px] font-semibold font-mono">{w.weight} {unit}</span>
                  <p className="text-muted text-[12px]">
                    {w.date ? format(new Date(w.date), 'EEE, d MMM yyyy') : ''}
                  </p>
                </div>
              </div>
              <button onClick={() => removeWeight(w.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-muted hover:text-danger hover:bg-danger/10 transition-colors text-xs active:scale-90">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Log Weight">
        <div className="space-y-3">
          <div className="relative">
            <input
              type="number" step="0.1" placeholder={`Weight in ${unit}`} value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="w-full bg-bg border border-gray-200 rounded-ios-lg px-4 py-3.5 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-[14px] font-medium">{unit}</span>
          </div>
          <button onClick={handleAdd} disabled={saving || !weight}
            className="w-full py-3.5 rounded-ios-lg bg-accent text-white font-semibold text-[15px] shadow-ios-blue disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? 'Saving…' : 'Add Entry'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
