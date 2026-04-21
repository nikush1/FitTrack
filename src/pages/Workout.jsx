import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';
import { groqChat } from '../utils/groqClient';

const CATEGORIES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'];
const initialForm = { exercise: '', category: 'Chest', sets: '', reps: '', weight: '', duration: '', notes: '' };
const PLAN_STORAGE_KEY = 'fittrack_ai_plan';

const CATEGORY_COLORS = {
  Chest: 'bg-red-50 text-red-500', Back: 'bg-blue-50 text-blue-500',
  Legs: 'bg-green-50 text-green-600', Shoulders: 'bg-purple-50 text-purple-500',
  Arms: 'bg-orange-50 text-orange-500', Core: 'bg-yellow-50 text-yellow-600',
  Cardio: 'bg-pink-50 text-pink-500', 'Full Body': 'bg-indigo-50 text-indigo-500',
};

function buildPrompt(profile, latestWeight) {
  const weight = latestWeight || 'unknown';
  const goal = profile?.goal || 'maintain';
  const goalLabel = goal === 'cut' ? 'Fat Loss' : goal === 'bulk' ? 'Muscle Gain' : 'Maintenance';
  const activityLabel =
    Number(profile?.activityLevel) >= 1.9   ? 'Very Active (athlete level)' :
    Number(profile?.activityLevel) >= 1.725 ? 'Active (6-7 days/week)' :
    Number(profile?.activityLevel) >= 1.55  ? 'Moderately Active (3-5 days/week)' :
    Number(profile?.activityLevel) >= 1.375 ? 'Lightly Active (1-3 days/week)' : 'Sedentary';
  return `You are a certified personal trainer. Generate a personalised 7-day gym workout plan for this person.\n\nPROFILE:\n- Name: ${profile?.name || 'User'}\n- Age: ${profile?.age || 'unknown'} years\n- Gender: ${profile?.gender || 'unknown'}\n- Height: ${profile?.height || 'unknown'} cm\n- Weight: ${weight} ${profile?.weightUnit || 'kg'}\n- Fitness Goal: ${goalLabel}\n- Activity Level: ${activityLabel}\n\nRULES:\n1. Return ONLY valid JSON, no markdown, no explanation, no code fences.\n2. Structure: { "weeklyPlan": [ { "day": "Monday", "focus": "Chest & Triceps", "exercises": [ { "name": "Bench Press", "category": "Chest", "sets": 4, "reps": "8-10", "rest": "90s", "tip": "Keep shoulder blades retracted" } ] } ] }\n3. Include all 7 days. Rest days should have focus: "Rest & Recovery" and an empty exercises array.\n4. Match volume to goal: cut = higher reps lower weight, bulk = heavy compound lifts, maintain = balanced.\n5. Each workout day should have 4-6 exercises.\n6. Category must be one of: Chest, Back, Legs, Shoulders, Arms, Core, Cardio, Full Body.`;
}

async function generatePlanGroq(profile, latestWeight) {
  const data = await groqChat({
    model: 'llama-3.3-70b-versatile', temperature: 0.7, max_tokens: 2000,
    messages: [
      { role: 'system', content: 'You are a certified personal trainer. Always respond with valid JSON only.' },
      { role: 'user', content: buildPrompt(profile, latestWeight) },
    ],
  });
  const text = data.choices?.[0]?.message?.content || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

const DAY_EMOJIS = { Monday: '💪', Tuesday: '🏃', Wednesday: '🔥', Thursday: '⚡', Friday: '🎯', Saturday: '🏋️', Sunday: '😴' };

function AiPlan({ onLogExercise }) {
  const { profile } = useAuth();
  const { weightLogs } = useApp();
  const { addToast } = useToast();
  const [plan, setPlan] = useState(() => {
    try { const s = localStorage.getItem(PLAN_STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [openDay, setOpenDay] = useState(null);
  const [loggingId, setLoggingId] = useState(null);

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1]?.weight : null;
  const hasProfile = !!(profile?.age && profile?.height && profile?.goal);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generatePlanGroq(profile, latestWeight);
      const weeklyPlan = result.weeklyPlan;
      setPlan(weeklyPlan);
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(weeklyPlan));
      setOpenDay(weeklyPlan.find(d => d.exercises?.length > 0)?.day || null);
      addToast('Plan generated!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to generate plan. Try again.', 'error');
    } finally { setLoading(false); }
  };

  const handleLog = async (ex) => {
    setLoggingId(ex.name);
    try {
      await onLogExercise({ exercise: ex.name, category: ex.category, sets: ex.sets || null, reps: null, weight: null, duration: null, notes: ex.reps ? `${ex.reps} reps • ${ex.rest || ''} rest` : '' });
      addToast(`${ex.name} logged!`, 'success');
    } catch { addToast('Failed to log. Try again.', 'error'); }
    finally { setLoggingId(null); }
  };

  const goalStyle = { cut: 'bg-danger/10 text-danger border-danger/25', bulk: 'bg-primary/10 text-primary border-primary/25', maintain: 'bg-accent/10 text-accent border-accent/25' }[profile?.goal || 'maintain'];
  const goalEmoji = { cut: '🔥', bulk: '💪', maintain: '⚖️' }[profile?.goal || 'maintain'];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-ios-xl shadow-ios p-5 space-y-4">
        <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Your Profile</p>
        {hasProfile ? (
          <>
            <div className="flex flex-wrap gap-2">
              <span className={`text-[12px] px-3 py-1 rounded-full border font-semibold ${goalStyle}`}>{goalEmoji} {profile.goal === 'cut' ? 'Fat Loss' : profile.goal === 'bulk' ? 'Muscle Gain' : 'Maintenance'}</span>
              {profile.age    && <span className="text-[12px] px-3 py-1 rounded-full bg-gray-100 text-secondary font-medium">{profile.age} yrs</span>}
              {profile.height && <span className="text-[12px] px-3 py-1 rounded-full bg-gray-100 text-secondary font-medium">{profile.height} cm</span>}
              {latestWeight   && <span className="text-[12px] px-3 py-1 rounded-full bg-gray-100 text-secondary font-medium">{latestWeight} {profile?.weightUnit || 'kg'}</span>}
            </div>
            <button onClick={handleGenerate} disabled={loading}
              className="w-full py-3.5 rounded-ios-lg bg-accent text-white font-semibold text-[15px] shadow-ios-blue transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating your plan…</>
                : plan ? '🔄 Regenerate Plan' : '✨ Generate My Plan'}
            </button>
          </>
        ) : (
          <div className="text-center py-6 space-y-2">
            <p className="text-4xl">👤</p>
            <p className="text-label text-[15px] font-semibold">Complete your profile first</p>
            <p className="text-secondary text-[13px] leading-relaxed">Add your age, height, and goal in the Profile tab to get a personalised plan.</p>
          </div>
        )}
      </div>

      {plan && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Your 7-Day Plan</p>
            <button onClick={() => { setPlan(null); localStorage.removeItem(PLAN_STORAGE_KEY); }}
              className="text-secondary text-[13px] hover:text-danger transition-colors font-medium">Clear</button>
          </div>
          {plan.map((day) => {
            const isRest = !day.exercises || day.exercises.length === 0;
            const isOpen = openDay === day.day;
            return (
              <div key={day.day} className="bg-card rounded-ios-xl shadow-ios overflow-hidden">
                <button onClick={() => !isRest && setOpenDay(isOpen ? null : day.day)}
                  className={`w-full flex items-center gap-4 px-5 py-4 transition-colors ${!isRest ? 'active:bg-gray-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-ios flex items-center justify-center text-[18px] flex-shrink-0 ${isRest ? 'bg-gray-100' : 'bg-accent/10'}`}>
                    {DAY_EMOJIS[day.day] || '💪'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className={`font-semibold text-[15px] ${isRest ? 'text-muted' : 'text-label'}`}>{day.focus}</p>
                    <p className="text-secondary text-[12px]">{day.day}{!isRest && ` · ${day.exercises.length} exercises`}</p>
                  </div>
                  {!isRest && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-muted transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}>
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>

                {isOpen && !isRest && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
                    {day.exercises.map((ex, i) => (
                      <div key={i} className="bg-bg rounded-ios-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-label font-semibold text-[14px]">{ex.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${CATEGORY_COLORS[ex.category] || 'bg-gray-100 text-gray-500'}`}>{ex.category}</span>
                              {ex.sets && <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold font-mono">{ex.sets} × {ex.reps}</span>}
                              {ex.rest && <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold font-mono">{ex.rest}</span>}
                            </div>
                          </div>
                          <button onClick={() => handleLog(ex)} disabled={loggingId === ex.name}
                            className="flex-shrink-0 text-[13px] px-3.5 py-2 rounded-ios bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50 active:scale-95">
                            {loggingId === ex.name ? '…' : '+ Log'}
                          </button>
                        </div>
                        {ex.tip && (
                          <p className="text-[12px] text-gold bg-gold/8 rounded-ios px-3 py-2 leading-relaxed mt-2">💡 {ex.tip}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WorkoutCard({ w, onRemove, onEdit }) {
  const catColor = CATEGORY_COLORS[w.category] || 'bg-gray-100 text-gray-500';
  return (
    <div className="bg-card rounded-ios-xl shadow-ios p-4 flex items-start gap-3 animate-fade-in">
      <div className={`w-9 h-9 rounded-ios flex items-center justify-center flex-shrink-0 mt-0.5 ${catColor}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
          <rect x="1" y="10" width="3" height="4" rx="1.5" fill="currentColor" stroke="none"/>
          <rect x="4" y="8" width="3" height="8" rx="1.5" fill="currentColor" stroke="none"/>
          <rect x="7" y="11" width="10" height="2" rx="1" fill="currentColor" stroke="none"/>
          <rect x="17" y="8" width="3" height="8" rx="1.5" fill="currentColor" stroke="none"/>
          <rect x="20" y="10" width="3" height="4" rx="1.5" fill="currentColor" stroke="none"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label font-semibold text-[15px]">{w.exercise}</p>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {w.sets && w.reps && <span className="text-primary text-[12px] font-mono font-semibold">{w.sets} × {w.reps}</span>}
          {w.weight && <span className="text-accent text-[12px] font-mono">{w.weight} kg</span>}
          {w.duration && <span className="text-gold text-[12px] font-mono">{w.duration} min</span>}
          {w.notes && <span className="text-secondary text-[12px] truncate max-w-[140px]">{w.notes}</span>}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(w)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-muted hover:text-accent hover:bg-accent/10 transition-colors active:scale-90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button onClick={() => onRemove(w.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-muted hover:text-danger hover:bg-danger/10 transition-colors active:scale-90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

const inputClass = "w-full bg-bg border border-gray-200 rounded-ios-lg px-4 py-3 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all";

export default function Workout() {
  const { workoutLogs, todayWorkouts, addWorkout, removeWorkout, updateWorkout, today } = useApp();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('today');

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleOpenAdd = () => { setEditingId(null); setForm(initialForm); setOpen(true); };
  const handleOpenEdit = (w) => {
    setEditingId(w.id);
    setForm({ exercise: w.exercise || '', category: w.category || 'Chest', sets: w.sets != null ? String(w.sets) : '', reps: w.reps != null ? String(w.reps) : '', weight: w.weight != null ? String(w.weight) : '', duration: w.duration != null ? String(w.duration) : '', notes: w.notes || '' });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.exercise.trim()) return;
    setSaving(true);
    try {
      const data = { exercise: form.exercise.trim(), category: form.category, sets: Number(form.sets) || null, reps: Number(form.reps) || null, weight: Number(form.weight) || null, duration: Number(form.duration) || null, notes: form.notes };
      if (editingId) { await updateWorkout(editingId, data); addToast('Exercise updated!', 'success'); }
      else { await addWorkout(data); addToast('Exercise logged!', 'success'); }
      setForm(initialForm); setEditingId(null); setOpen(false);
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const displayLogs = tab === 'today' ? todayWorkouts : workoutLogs;
  const grouped = tab === 'history' ? displayLogs.reduce((acc, w) => { const d = w.date || 'Unknown'; if (!acc[d]) acc[d] = []; acc[d].push(w); return acc; }, {}) : null;

  const TABS = [{ key: 'today', label: 'Today' }, { key: 'history', label: 'History' }, { key: 'ai', label: '✨ AI Plan' }];

  return (
    <div className="pb-28 space-y-4 animate-fade-in">
      <div className="pt-8 flex items-center justify-between">
        <h1 className="text-label font-display text-[28px] font-bold tracking-tight">Workout</h1>
        {tab !== 'ai' && (
          <button onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-accent text-white text-[14px] font-semibold shadow-ios-blue active:scale-95 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Log set
          </button>
        )}
      </div>

      {tab !== 'ai' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-ios-xl shadow-ios p-4">
            <p className="text-[24px] font-bold text-label font-mono">{todayWorkouts.length}</p>
            <p className="text-secondary text-[12px] mt-0.5 font-medium">Exercises today</p>
          </div>
          <div className="bg-card rounded-ios-xl shadow-ios p-4">
            <p className="text-[24px] font-bold text-label font-mono">{todayWorkouts.reduce((s, w) => s + (w.sets || 0), 0)}</p>
            <p className="text-secondary text-[12px] mt-0.5 font-medium">Total sets</p>
          </div>
        </div>
      )}

      {/* Segment Control */}
      <div className="flex gap-1.5 bg-gray-100 rounded-ios-lg p-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-[13px] font-semibold rounded-ios transition-all duration-200 ${tab === t.key ? 'bg-card text-label shadow-ios-sm' : 'text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ai'
        ? <AiPlan onLogExercise={addWorkout} />
        : displayLogs.length === 0
          ? <EmptyState icon="💪" title="No workouts logged" subtitle={tab === 'today' ? "Tap '+ Log set' to start tracking" : 'No history yet'} />
          : tab === 'today'
            ? <div className="space-y-2">{displayLogs.map(w => <WorkoutCard key={w.id} w={w} onRemove={removeWorkout} onEdit={handleOpenEdit} />)}</div>
            : (
              <div className="space-y-5">
                {Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0])).map(([date, items]) => (
                  <div key={date}>
                    <p className="text-secondary text-[13px] font-semibold mb-2 px-1">
                      {date === today ? 'Today' : format(new Date(date + 'T00:00:00'), 'EEEE, d MMMM yyyy')}
                    </p>
                    <div className="space-y-2">{items.map(w => <WorkoutCard key={w.id} w={w} onRemove={removeWorkout} onEdit={handleOpenEdit} />)}</div>
                  </div>
                ))}
              </div>
            )
      }

      <Modal open={open} onClose={() => { setOpen(false); setEditingId(null); setForm(initialForm); }} title={editingId ? 'Edit Exercise' : 'Log Exercise'}>
        <div className="space-y-3">
          <input type="text" placeholder="Exercise name (e.g. Bench Press)" value={form.exercise} onChange={set('exercise')} className={inputClass} />
          <select value={form.category} onChange={set('category')}
            className="w-full bg-bg border border-gray-200 rounded-ios-lg px-4 py-3 text-label text-[15px] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all appearance-none">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <input type="number" placeholder="Sets" value={form.sets} onChange={set('sets')} className="w-full bg-bg border border-gray-200 rounded-ios-lg px-3 py-3 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-center" />
              <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-muted">sets</span>
            </div>
            <div className="relative">
              <input type="number" placeholder="Reps" value={form.reps} onChange={set('reps')} className="w-full bg-bg border border-gray-200 rounded-ios-lg px-3 py-3 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-center" />
              <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-muted">reps</span>
            </div>
            <div className="relative">
              <input type="number" placeholder="0" value={form.weight} onChange={set('weight')} className="w-full bg-bg border border-gray-200 rounded-ios-lg px-3 py-3 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-center" />
              <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-muted">kg</span>
            </div>
          </div>
          <input type="number" placeholder="Duration (minutes, optional)" value={form.duration} onChange={set('duration')} className={inputClass} />
          <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={set('notes')} className={inputClass} />
          <button onClick={handleSave} disabled={saving || !form.exercise.trim()}
            className="w-full py-3.5 rounded-ios-lg bg-accent text-white font-semibold text-[15px] shadow-ios-blue disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Exercise'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
