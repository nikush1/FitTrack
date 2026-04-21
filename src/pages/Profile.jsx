import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { saveUserProfile } from '../firebase/firestore';

const GOALS = [
  { value: 'cut',      label: 'Cut',      desc: 'Lose fat',     emoji: '🔥', active: 'bg-danger/10 border-danger/30 text-danger' },
  { value: 'maintain', label: 'Maintain', desc: 'Stay lean',    emoji: '⚖️', active: 'bg-accent/10 border-accent/30 text-accent' },
  { value: 'bulk',     label: 'Bulk',     desc: 'Build muscle', emoji: '💪', active: 'bg-primary/10 border-primary/30 text-primary' },
];

const ACTIVITY_LEVELS = [
  { value: 1.2,   label: 'Sedentary',   desc: 'Little/no exercise' },
  { value: 1.375, label: 'Light',        desc: '1-3 days/week' },
  { value: 1.55,  label: 'Moderate',     desc: '3-5 days/week' },
  { value: 1.725, label: 'Active',        desc: '6-7 days/week' },
  { value: 1.9,   label: 'Very Active',   desc: 'Athlete level' },
];

function calcMacros({ weight, height, age, gender, activityLevel, goal }) {
  if (!weight || !height || !age) return null;
  const w = Number(weight), h = Number(height), a = Number(age);
  const al = Number(activityLevel) || 1.55;
  const bmr = 10 * w + 6.25 * h - 5 * a + (gender === 'female' ? -161 : 5);
  const tdee = Math.round(bmr * al);
  const calories = goal === 'cut' ? tdee - 500 : goal === 'bulk' ? tdee + 300 : tdee;
  return { calories: Math.max(1200, calories), protein: Math.round(w * 2.2) };
}

function calcBMI(weight, height) {
  if (!weight || !height) return null;
  return (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1);
}

function getBMICategory(bmi) {
  if (!bmi) return null;
  const b = Number(bmi);
  if (b < 18.5) return { label: 'Underweight', color: 'text-accent' };
  if (b < 25)   return { label: 'Normal',       color: 'text-primary' };
  if (b < 30)   return { label: 'Overweight',   color: 'text-gold' };
  return              { label: 'Obese',          color: 'text-danger' };
}

const inputClass = "w-full bg-bg border border-gray-200 rounded-ios-lg px-4 py-3 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all";
const labelClass = "text-secondary text-[13px] font-medium block mb-1.5";

export default function Profile() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const { weightLogs, waterMl, addWater } = useApp();
  const [form, setForm] = useState({ name: '', calorieGoal: 2000, proteinGoal: 150, goal: 'maintain', weightUnit: 'kg', height: '', age: '', gender: 'male', activityLevel: 1.55, dietPreference: 'veg', waterGoal: 2500 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoCalculated, setAutoCalculated] = useState(false);

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1]?.weight : null;

  useEffect(() => {
    if (profile) setForm({
      name: profile.name || user?.displayName || '',
      calorieGoal: profile.calorieGoal || 2000,
      proteinGoal: profile.proteinGoal || 150,
      goal: profile.goal || 'maintain',
      weightUnit: profile.weightUnit || 'kg',
      height: profile.height || '',
      age: profile.age || '',
      gender: profile.gender || 'male',
      activityLevel: profile.activityLevel || 1.55,
      dietPreference: profile.dietPreference || 'veg',
      waterGoal: profile.waterGoal || 2500,
    });
  }, [profile, user]);

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));
  const setVal = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleAutoCalc = () => {
    const macros = calcMacros({ weight: latestWeight, height: form.height, age: form.age, gender: form.gender, activityLevel: form.activityLevel, goal: form.goal });
    if (!macros) return;
    setForm(prev => ({ ...prev, calorieGoal: macros.calories, proteinGoal: macros.protein }));
    setAutoCalculated(true);
    setTimeout(() => setAutoCalculated(false), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveUserProfile(user.uid, { ...form, calorieGoal: Number(form.calorieGoal), proteinGoal: Number(form.proteinGoal), waterGoal: Number(form.waterGoal) || 2500, height: Number(form.height) || null, age: Number(form.age) || null, activityLevel: Number(form.activityLevel) });
      await refreshProfile();
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  const bmi = calcBMI(latestWeight, form.height);
  const bmiCat = getBMICategory(bmi);
  const canAutoCalc = !!(form.height && form.age && latestWeight);
  const currentGoal = GOALS.find(g => g.value === form.goal);

  return (
    <div className="pb-28 space-y-4 animate-fade-in">
      <div className="pt-8">
        <h1 className="text-label font-display text-[28px] font-bold tracking-tight">Profile</h1>
      </div>

      {/* Avatar */}
      <div className="bg-card rounded-ios-xl shadow-ios p-5 flex items-center gap-4">
        <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-accent to-[#5E5CE6] flex items-center justify-center text-[24px] font-bold text-white flex-shrink-0 shadow-ios-blue">
          {(form.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-label font-semibold text-[17px] truncate">{form.name || 'Your Name'}</p>
          <p className="text-secondary text-[13px] truncate">{user?.email}</p>
          {currentGoal && (
            <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full border font-semibold mt-1 ${currentGoal.active}`}>
              {currentGoal.emoji} {currentGoal.label}
            </span>
          )}
        </div>
      </div>

      {/* BMI */}
      {bmi && bmiCat && (
        <div className="bg-card rounded-ios-xl shadow-ios p-5">
          <p className="text-muted text-[11px] font-semibold uppercase tracking-wider mb-3">Body Stats</p>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div>
              <p className={`text-[22px] font-bold font-mono ${bmiCat.color}`}>{bmi}</p>
              <p className="text-muted text-[11px] mt-0.5">BMI</p>
              <p className={`text-[11px] font-semibold mt-0.5 ${bmiCat.color}`}>{bmiCat.label}</p>
            </div>
            <div>
              <p className="text-[22px] font-bold font-mono text-label">{latestWeight}</p>
              <p className="text-muted text-[11px] mt-0.5">{form.weightUnit}</p>
            </div>
            {form.height && (
              <div>
                <p className="text-[22px] font-bold font-mono text-label">{form.height}</p>
                <p className="text-muted text-[11px] mt-0.5">cm</p>
              </div>
            )}
          </div>
          <div className="h-2 rounded-full overflow-hidden flex gap-px">
            <div className="flex-1 bg-accent/40 rounded-l-full" />
            <div className="flex-1 bg-primary/60" />
            <div className="flex-1 bg-gold/50" />
            <div className="flex-1 bg-danger/50 rounded-r-full" />
          </div>
          <div className="flex justify-between text-[10px] text-muted mt-1.5">
            <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
          </div>
        </div>
      )}

      {/* Fitness Goal */}
      <div className="bg-card rounded-ios-xl shadow-ios p-5">
        <p className="text-muted text-[11px] font-semibold uppercase tracking-wider mb-3">Fitness Goal</p>
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map(g => (
            <button key={g.value} onClick={() => setVal('goal', g.value)}
              className={`p-3 rounded-ios-lg text-center border-2 transition-all active:scale-95 ${form.goal === g.value ? g.active : 'border-gray-100 text-secondary hover:border-gray-200'}`}>
              <p className="text-[20px] mb-1">{g.emoji}</p>
              <p className="font-semibold text-[13px]">{g.label}</p>
              <p className="text-[11px] mt-0.5 opacity-60">{g.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Body Info */}
      <div className="bg-card rounded-ios-xl shadow-ios p-5 space-y-4">
        <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Body Info</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Name</label>
            <input type="text" value={form.name} onChange={set('name')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input type="number" value={form.age} onChange={set('age')} placeholder="e.g. 22" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Height (cm)</label>
            <input type="number" value={form.height} onChange={set('height')} placeholder="e.g. 175" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <div className="flex gap-1.5 bg-bg rounded-ios-lg p-1 border border-gray-200">
              {['male', 'female'].map(g => (
                <button key={g} onClick={() => setVal('gender', g)}
                  className={`flex-1 py-2 rounded-ios text-[13px] font-semibold transition-all capitalize ${form.gender === g ? 'bg-card shadow-ios-sm text-label' : 'text-muted'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>Weight Unit</label>
          <div className="flex gap-1.5 bg-bg rounded-ios-lg p-1 border border-gray-200">
            {['kg', 'lbs'].map(u => (
              <button key={u} onClick={() => setVal('weightUnit', u)}
                className={`flex-1 py-2 rounded-ios text-[13px] font-semibold transition-all ${form.weightUnit === u ? 'bg-card shadow-ios-sm text-label' : 'text-muted'}`}>
                {u}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>Diet Preference</label>
          <div className="flex gap-1.5 bg-bg rounded-ios-lg p-1 border border-gray-200">
            {[{ value: 'veg', label: '🥦 Veg' }, { value: 'non-veg', label: '🍗 Non-Veg' }].map(d => (
              <button key={d.value} onClick={() => setVal('dietPreference', d.value)}
                className={`flex-1 py-2 rounded-ios text-[13px] font-semibold transition-all ${form.dietPreference === d.value ? 'bg-card shadow-ios-sm text-label' : 'text-muted'}`}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Level */}
      <div className="bg-card rounded-ios-xl shadow-ios overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Activity Level</p>
        </div>
        {ACTIVITY_LEVELS.map((al, i) => (
          <button key={al.value} onClick={() => setVal('activityLevel', al.value)}
            className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-100 last:border-0 transition-colors active:bg-gray-50 ${Number(form.activityLevel) === al.value ? 'bg-accent/5' : ''}`}>
            <span className={`font-medium text-[15px] ${Number(form.activityLevel) === al.value ? 'text-accent' : 'text-label'}`}>{al.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-secondary text-[13px]">{al.desc}</span>
              {Number(form.activityLevel) === al.value && (
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3 h-3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Nutrition Goals */}
      <div className="bg-card rounded-ios-xl shadow-ios p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Nutrition Goals</p>
          <button onClick={handleAutoCalc} disabled={!canAutoCalc}
            className={`text-[12px] px-3 py-1.5 rounded-full font-semibold transition-all ${autoCalculated ? 'bg-primary/15 text-primary' : canAutoCalc ? 'bg-accent/10 text-accent hover:bg-accent/15' : 'bg-gray-100 text-muted cursor-not-allowed'}`}>
            {autoCalculated ? '✓ Calculated' : '⚡ Auto-calc'}
          </button>
        </div>
        {!canAutoCalc && (
          <p className="text-secondary text-[13px] bg-gray-50 rounded-ios px-3 py-2.5">
            💡 Add height, age, and a weight log to auto-calculate
          </p>
        )}
        <div>
          <label className={labelClass}>Daily Calories</label>
          <div className="relative">
            <input type="number" value={form.calorieGoal} onChange={set('calorieGoal')} className={inputClass + ' pr-14'} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-[13px]">kcal</span>
          </div>
        </div>
        <div>
          <label className={labelClass}>Daily Protein</label>
          <div className="relative">
            <input type="number" value={form.proteinGoal} onChange={set('proteinGoal')} className={inputClass + ' pr-10'} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-[13px]">g</span>
          </div>
        </div>
        <div>
          <label className={labelClass}>Daily Water Goal</label>
          <div className="relative">
            <input type="number" value={form.waterGoal} onChange={set('waterGoal')} className={inputClass + ' pr-10'} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-[13px]">ml</span>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className={`w-full py-3.5 rounded-ios-lg font-semibold text-[15px] transition-all disabled:opacity-50 active:scale-[0.98] ${saved ? 'bg-primary/10 text-primary border border-primary/25' : 'bg-accent text-white shadow-ios-blue hover:bg-[#0074e0]'}`}>
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Profile'}
        </button>
      </div>

      {/* Sign out */}
      <button onClick={logout}
        className="w-full py-3.5 rounded-ios-lg bg-danger/8 text-danger text-[15px] font-semibold border border-danger/20 hover:bg-danger/12 transition-colors active:scale-[0.98]">
        Sign Out
      </button>
    </div>
  );
}
