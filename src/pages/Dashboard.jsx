import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';
import { getFitnessSuggestion } from '../utils/fitnessSuggestion';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const WATER_PRESETS = [150, 250, 350, 500];

function StatCard({ value, label, color = 'text-label', unit }) {
  return (
    <div className="bg-card rounded-ios-xl shadow-ios p-4 text-center animate-fade-in">
      <p className={`text-2xl font-bold font-display tracking-tight ${color}`}>{value}</p>
      {unit && <p className="text-[11px] text-muted mt-0.5">{unit}</p>}
      <p className="text-[12px] text-secondary mt-1 font-medium">{label}</p>
    </div>
  );
}

function MacroRow({ label, g, color, dotColor }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className="text-secondary text-[13px] flex-1">{label}</span>
      <span className={`text-[13px] font-semibold font-mono ${color}`}>{g}g</span>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const {
    todayCalories, todayProtein, todayCarbs, todayFat,
    calorieGoal, proteinGoal, waterGoal,
    todayWorkouts, weightLogs, streak, loading,
    waterMl, addWater,
  } = useApp();

  const name = profile?.name || user?.displayName || 'Athlete';
  const firstName = name.split(' ')[0];
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1]?.weight : null;

  const suggestion = getFitnessSuggestion({
    calories: todayCalories, calorieGoal,
    protein: todayProtein, proteinGoal,
    workedOut: todayWorkouts.length > 0,
    goal: profile?.goal || 'maintain',
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const hasMacros = todayProtein > 0 || todayCarbs > 0 || todayFat > 0;
  const macroPie = [
    { name: 'Protein', value: todayProtein * 4, color: '#30D158' },
    { name: 'Carbs',   value: todayCarbs   * 4, color: '#FF9F0A' },
    { name: 'Fat',     value: todayFat     * 9, color: '#FF453A' },
  ].filter(m => m.value > 0);

  const waterPct = Math.min(100, Math.round((waterMl / waterGoal) * 100));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28 space-y-3 animate-fade-in">
      {/* Header */}
      <div className="pt-8 pb-1">
        <p className="text-secondary text-[13px] font-medium">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h1 className="text-label font-display text-[28px] font-bold tracking-tight mt-0.5">
          {greeting}, {firstName} 👋
        </h1>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="bg-gradient-to-r from-[#FF9F0A]/10 to-[#FF6B00]/10 border border-[#FF9F0A]/20 rounded-ios-xl p-4 flex items-center gap-3 shadow-ios-sm">
          <div className="w-10 h-10 rounded-ios bg-[#FF9F0A]/15 flex items-center justify-center">
            <span className="text-xl">🔥</span>
          </div>
          <div>
            <p className="text-label font-semibold text-[15px]">{streak}-day streak</p>
            <p className="text-secondary text-[13px]">Keep the momentum going</p>
          </div>
          <span className="ml-auto text-[#FF9F0A] text-[13px] font-semibold">{streak}d</span>
        </div>
      )}

      {/* AI Tip */}
      <div className="bg-gradient-to-r from-accent/8 to-[#5E5CE6]/8 border border-accent/15 rounded-ios-xl p-4 shadow-ios-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
          <p className="text-accent text-[11px] font-semibold uppercase tracking-wider">Today's Tip</p>
        </div>
        <p className="text-label text-[14px] leading-relaxed">{suggestion}</p>
      </div>

      {/* Calories Card */}
      <div className="bg-card rounded-ios-xl shadow-ios p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="sf-icon bg-[#30D158]/12">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M13 2L4.09 12.26C3.67 12.76 4.02 13.5 4.67 13.5H11L10.34 21.5C10.28 22.1 11.04 22.4 11.41 21.93L20.5 11.26C20.89 10.76 20.52 10 19.87 10H14L14.68 2.5C14.74 1.9 13.97 1.61 13.61 2.09" fill="#30D158"/>
              </svg>
            </div>
            <span className="text-label font-semibold text-[16px]">Calories</span>
          </div>
          <span className="text-secondary text-[13px] font-mono">
            <span className={todayCalories > calorieGoal ? 'text-danger font-semibold' : 'text-label font-semibold'}>
              {todayCalories}
            </span>
            <span className="text-muted"> / {calorieGoal} kcal</span>
          </span>
        </div>
        <ProgressBar value={todayCalories} max={calorieGoal} color="bg-primary" height={8} />
        <div className="flex justify-between text-[12px] text-muted mt-2">
          <span>{Math.max(0, calorieGoal - todayCalories)} kcal remaining</span>
          <span>{Math.round((todayCalories / calorieGoal) * 100)}%</span>
        </div>
      </div>

      {/* Protein Card */}
      <div className="bg-card rounded-ios-xl shadow-ios p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="sf-icon bg-accent/10">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <circle cx="12" cy="12" r="9" stroke="#0A84FF" strokeWidth="1.8"/>
                <text x="12" y="16" textAnchor="middle" fill="#0A84FF" fontSize="9" fontWeight="700" fontFamily="sans-serif">P</text>
              </svg>
            </div>
            <span className="text-label font-semibold text-[16px]">Protein</span>
          </div>
          <span className="text-secondary text-[13px] font-mono">
            <span className="text-label font-semibold">{todayProtein}g</span>
            <span className="text-muted"> / {proteinGoal}g</span>
          </span>
        </div>
        <ProgressBar value={todayProtein} max={proteinGoal} color="bg-accent" height={8} />
      </div>

      {/* Macro Pie */}
      {hasMacros && (
        <div className="bg-card rounded-ios-xl shadow-ios p-5">
          <p className="text-label font-semibold text-[16px] mb-4">Macro Split</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={macroPie} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                  {macroPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1C1C1E', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12, padding: '6px 10px' }}
                  formatter={(v, name) => [`${Math.round(v)} kcal`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              <MacroRow label="Protein" g={todayProtein} color="text-primary" dotColor="bg-primary" />
              <MacroRow label="Carbs"   g={todayCarbs}   color="text-gold"   dotColor="bg-gold" />
              <MacroRow label="Fat"     g={todayFat}     color="text-danger"  dotColor="bg-danger" />
            </div>
          </div>
        </div>
      )}

      {/* Water */}
      <div className="bg-card rounded-ios-xl shadow-ios p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="sf-icon bg-[#0A84FF]/10">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M12 2C12 2 5 9.5 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 9.5 12 2 12 2Z" fill="#0A84FF" fillOpacity="0.85"/>
              </svg>
            </div>
            <span className="text-label font-semibold text-[16px]">Water</span>
          </div>
          <span className="text-secondary text-[13px] font-mono">
            <span className={`font-semibold ${waterMl >= waterGoal ? 'text-accent' : 'text-label'}`}>
              {waterMl >= 1000 ? `${(waterMl / 1000).toFixed(1)}L` : `${waterMl}ml`}
            </span>
            <span className="text-muted"> / {waterGoal >= 1000 ? `${(waterGoal / 1000).toFixed(1)}L` : `${waterGoal}ml`}</span>
          </span>
        </div>
        <ProgressBar value={waterMl} max={waterGoal} color="bg-accent" height={8} />
        <div className="flex gap-2 mt-3 flex-wrap">
          {WATER_PRESETS.map(ml => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              className="flex-1 min-w-[60px] py-2 rounded-ios bg-accent/8 text-accent text-[12px] font-semibold border border-accent/15 hover:bg-accent/15 transition-colors active:scale-95"
            >
              +{ml}ml
            </button>
          ))}
          <button
            onClick={() => addWater(-250)}
            disabled={waterMl === 0}
            className="px-3 py-2 rounded-ios bg-gray-100 text-secondary text-[12px] font-semibold hover:text-danger transition-colors disabled:opacity-30 active:scale-95"
          >
            ↩
          </button>
        </div>
        {waterMl >= waterGoal && (
          <p className="text-primary text-[12px] font-semibold text-center mt-2">🎉 Goal reached!</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={todayWorkouts.length} label="Exercises" />
        <StatCard value={streak} label="Day streak" color="text-gold" />
        <StatCard value={latestWeight ?? '—'} label="Weight" unit={profile?.weightUnit || 'kg'} />
      </div>

      {/* Today's Workouts */}
      {todayWorkouts.length > 0 && (
        <div className="bg-card rounded-ios-xl shadow-ios overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-label font-semibold text-[16px]">Today's Exercises</p>
          </div>
          {todayWorkouts.map((w, i) => (
            <div key={w.id} className={`flex items-center justify-between px-5 py-3.5 ${i < todayWorkouts.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-ios bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-[11px] font-bold">✓</span>
                </div>
                <span className="text-label text-[14px] font-medium">{w.exercise}</span>
              </div>
              <span className="text-secondary text-[13px] font-mono">
                {w.sets && w.reps ? `${w.sets}×${w.reps}` : ''}
                {w.weight ? ` · ${w.weight}kg` : ''}
                {w.duration ? `${w.duration}min` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
