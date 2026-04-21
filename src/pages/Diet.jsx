import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';
import { groqChat } from '../utils/groqClient';

/* ─── Region autocomplete data ─────────────────────────────────────────── */
const REGIONS = [
  // Indian States
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
  'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  // Union Territories
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli',
  'Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
  // Major Indian cities
  'Mumbai','Bangalore','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad',
  'Jaipur','Surat','Lucknow','Kanpur','Nagpur','Indore','Thane','Bhopal',
  'Visakhapatnam','Patna','Vadodara','Raipur','Bhilai','Bilaspur','Durg',
  'Raigarh','Korba','Jagdalpur',
  // Countries
  'India','United States','United Kingdom','United Arab Emirates','Canada',
  'Australia','Germany','France','Singapore','Japan','Saudi Arabia',
  'Qatar','Kuwait','Bahrain','Oman','Bangladesh','Pakistan','Sri Lanka',
  'Nepal','Malaysia','South Africa','Nigeria','Kenya','New Zealand',
];

/* ─── Region autocomplete component ────────────────────────────────────── */
function RegionInput({ value, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    if (val.trim().length >= 1) {
      const q = val.toLowerCase();
      setSuggestions(
        REGIONS.filter(r => r.toLowerCase().startsWith(q)).slice(0, 6)
      );
      setOpen(true);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };

  const pick = (r) => {
    onChange(r);
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        placeholder="State / City / Country (e.g. Chhattisgarh)"
        value={value}
        onChange={handleChange}
        onFocus={() => value.length >= 1 && suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
        className="w-full bg-bg border border-gray-200 rounded-ios-lg px-3 py-2.5 text-label text-[14px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-gray-200 rounded-ios-lg shadow-ios-lg z-50 overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => pick(s)}
              className="w-full text-left px-4 py-2.5 text-label text-[14px] hover:bg-gray-50 active:bg-gray-100 border-b border-gray-100 last:border-0 transition-colors"
            >
              <span className="text-accent font-semibold">{s.slice(0, value.length)}</span>
              <span>{s.slice(value.length)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── AI generation ─────────────────────────────────────────────────────── */
const initialForm = { foodName: '', calories: '', protein: '', carbs: '', fat: '' };

async function generateAIDietPlan({ calorieGoal, proteinGoal, weight, height, age, gender, goal, activityLevel, dietPreference, monthlyBudget, currency, region }) {
  const dietType = dietPreference === 'non-veg'
    ? 'non-vegetarian (can include chicken, fish, eggs, meat)'
    : 'strictly vegetarian (no meat, no fish, no eggs)';
  const goalLabel = goal === 'cut' ? 'fat loss / calorie deficit' : goal === 'bulk' ? 'muscle gain / calorie surplus' : 'maintenance';
  const budgetLine = monthlyBudget ? `\n- Monthly food budget: ${currency || ''}${monthlyBudget} — prioritise affordable locally available foods` : '';
  const regionLine = region ? `\n- Region: ${region} — use foods common and affordable in this area` : '';

  const prompt = `You are an expert sports nutritionist. Create a personalised FULL 7-DAY meal plan.

USER PROFILE:
- Diet: ${dietType}
- Goal: ${goalLabel}
- Daily calories: ${calorieGoal} kcal
- Daily protein: ${proteinGoal}g
- Weight: ${weight ? weight + 'kg' : 'unknown'}, Height: ${height ? height + 'cm' : 'unknown'}
- Age: ${age || 'unknown'}, Gender: ${gender}, Activity: ${activityLevel}${budgetLine}${regionLine}

RULES:
1. Return ONLY valid JSON — no markdown, no code fences, no explanation.
2. Vary meals across days. Do NOT repeat the same meals every day.
3. Each day: exactly 5 meals — Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner.
4. Keep item objects small.
${monthlyBudget ? '5. All foods must be budget-friendly and locally available in the specified region.' : ''}

Exact JSON format:
{
  "summary": "one sentence about this weekly plan",
  "avgCalories": <int>,
  "avgProtein": <int>,
  "avgCarbs": <int>,
  "avgFat": <int>,
  "estimatedDailyCost": "e.g. ₹150-200" or null,
  "days": [
    {
      "day": "Monday",
      "totalCalories": <int>,
      "totalProtein": <int>,
      "meals": [
        {
          "name": "Breakfast",
          "time": "7:30 AM",
          "mealCalories": <int>,
          "mealProtein": <int>,
          "items": [
            { "food": "name", "qty": "100g", "cal": <int>, "pro": <int> }
          ]
        }
      ]
    }
  ],
  "tips": ["tip1", "tip2", "tip3"]
}
Include all 7 days: Monday through Sunday.`;

  const res = await groqChat({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 6000,
    temperature: 0.75,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.choices?.[0]?.message?.content || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

async function analyzePhotoWithGroq(base64Image, mimeType) {
  const res = await groqChat({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: 512,
    temperature: 0.2,
    messages: [{ role: 'user', content: [
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
      { type: 'text', text: 'You are a nutrition expert. Analyze this food photo.\nRespond ONLY with valid JSON:\n{"foodName":"name","calories":<int>,"protein":<int>,"carbs":<int>,"fat":<int>,"confidence":"high"|"medium"|"low","note":"brief note"}' },
    ]}],
  });
  const text = res.choices?.[0]?.message?.content || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const MEAL_ICONS = ['🌅','🍎','☀️','🌙','🌃'];
const inputClass = 'w-full bg-bg border border-gray-200 rounded-ios-lg px-4 py-3 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all';

/* ─── FoodCard ──────────────────────────────────────────────────────────── */
function FoodCard({ item, today, onEdit, onRemove }) {
  return (
    <div className="bg-card rounded-ios-xl shadow-ios p-4 flex items-center gap-3 animate-fade-in">
      <div className="w-9 h-9 rounded-ios bg-primary/10 flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#30D158" fillOpacity="0.2"/>
          <circle cx="12" cy="12" r="4" fill="#30D158"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label font-semibold text-[15px] truncate">{item.foodName}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="text-primary text-[12px] font-semibold font-mono">{item.calories} kcal</span>
          {item.protein > 0 && <span className="text-accent text-[12px] font-mono">{item.protein}g P</span>}
          {item.carbs > 0   && <span className="text-gold text-[12px] font-mono">{item.carbs}g C</span>}
          {item.fat > 0     && <span className="text-danger text-[12px] font-mono">{item.fat}g F</span>}
          {item.date && item.date !== today && <span className="text-muted text-[12px]">{format(new Date(item.date + 'T00:00:00'), 'd MMM')}</span>}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(item)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-muted hover:text-accent hover:bg-accent/10 transition-colors active:scale-90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button onClick={() => onRemove(item.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-muted hover:text-danger hover:bg-danger/10 transition-colors active:scale-90">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function Diet() {
  const { todayDiet, dietLogs, todayCalories, todayProtein, calorieGoal, proteinGoal, addDiet, removeDiet, updateDiet, today, weightLogs } = useApp();
  const { profile } = useAuth();
  const { addToast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState('today');
  const [analyzing, setAnalyzing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [aiNote, setAiNote] = useState('');
  const [aiConfidence, setAiConfidence] = useState('');
  const fileInputRef = useRef(null);

  // AI plan
  const [aiPlan, setAiPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [expandedMeal, setExpandedMeal] = useState(null);

  // Budget & region
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [region, setRegion] = useState('');

  const latestWeight = weightLogs?.length > 0 ? weightLogs[weightLogs.length - 1]?.weight : null;
  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setAiPlan(null);
    try {
      const plan = await generateAIDietPlan({
        calorieGoal, proteinGoal,
        weight: latestWeight,
        height: profile?.height,
        age: profile?.age,
        gender: profile?.gender || 'male',
        goal: profile?.goal || 'maintain',
        activityLevel: profile?.activityLevel || 1.55,
        dietPreference: profile?.dietPreference || 'veg',
        monthlyBudget: monthlyBudget || null,
        currency,
        region: region || null,
      });
      setAiPlan(plan);
      setSelectedDay(0);
      setExpandedMeal(null);
    } catch {
      addToast('Could not generate plan. Try again.', 'error');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      setPhotoPreview(dataUrl); setOpen(true); setForm(initialForm); setAiNote(''); setAiConfidence(''); setAnalyzing(true);
      try {
        const result = await analyzePhotoWithGroq(base64, mimeType);
        setForm({ foodName: result.foodName || '', calories: String(result.calories || ''), protein: String(result.protein || ''), carbs: String(result.carbs || ''), fat: String(result.fat || '') });
        setAiNote(result.note || ''); setAiConfidence(result.confidence || '');
      } catch { addToast('Could not analyze photo. Fill in details manually.', 'error'); setPhotoPreview(null); }
      finally { setAnalyzing(false); e.target.value = ''; }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenManual = () => { setEditingId(null); setPhotoPreview(null); setAiNote(''); setAiConfidence(''); setForm(initialForm); setOpen(true); };
  const handleOpenEdit = (item) => {
    setEditingId(item.id); setPhotoPreview(null); setAiNote(''); setAiConfidence('');
    setForm({ foodName: item.foodName || '', calories: String(item.calories || ''), protein: String(item.protein || ''), carbs: String(item.carbs || ''), fat: String(item.fat || '') });
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false); setEditingId(null); setPhotoPreview(null);
    setAiNote(''); setAiConfidence(''); setForm(initialForm); setAnalyzing(false);
  };

  const handleAdd = async () => {
    if (!form.foodName.trim() || !form.calories) return;
    setSaving(true);
    try {
      const data = { foodName: form.foodName.trim(), calories: Number(form.calories), protein: Number(form.protein) || 0, carbs: Number(form.carbs) || 0, fat: Number(form.fat) || 0 };
      if (editingId) { await updateDiet(editingId, data); addToast('Food updated!', 'success'); }
      else { await addDiet(data); addToast('Food logged!', 'success'); }
      handleClose();
    } catch (err) { addToast(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const confidenceColor = { high: 'text-primary', medium: 'text-gold', low: 'text-danger' }[aiConfidence] || 'text-muted';
  const displayLogs = tab === 'today' ? todayDiet : dietLogs;
  const remaining = calorieGoal - todayCalories;
  const isOver = remaining < 0;
  const currentDayData = aiPlan?.days?.[selectedDay];

  return (
    <div className="pb-28 space-y-4 animate-fade-in">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="pt-8 flex items-center justify-between">
        <h1 className="text-label font-display text-[28px] font-bold tracking-tight">Diet</h1>
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-card border border-gray-200 shadow-ios text-label text-[14px] font-semibold active:scale-95 transition-transform">
            <span>📷</span><span className="text-[13px]">Scan</span>
          </button>
          <button onClick={handleOpenManual}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-accent text-white text-[14px] font-semibold shadow-ios-blue active:scale-95 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
            </svg>
            Log food
          </button>
        </div>
      </div>

      {/* Calorie Summary */}
      <div className="bg-card rounded-ios-xl shadow-ios p-5">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p className="text-[22px] font-bold text-label font-mono">{todayCalories}</p>
            <p className="text-secondary text-[12px] mt-0.5 font-medium">Eaten</p>
          </div>
          <div>
            <p className="text-[22px] font-bold text-primary font-mono">{calorieGoal}</p>
            <p className="text-secondary text-[12px] mt-0.5 font-medium">Goal</p>
          </div>
          <div>
            <p className={`text-[22px] font-bold font-mono ${isOver ? 'text-danger' : 'text-label'}`}>{Math.abs(remaining)}</p>
            <p className={`text-[12px] mt-0.5 font-medium ${isOver ? 'text-danger' : 'text-secondary'}`}>{isOver ? 'Over' : 'Left'}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-secondary font-medium">Calories</span>
              <span className="text-label font-mono font-semibold">{todayCalories} / {calorieGoal}</span>
            </div>
            <ProgressBar value={todayCalories} max={calorieGoal} color="bg-primary" height={7} />
          </div>
          <div>
            <div className="flex justify-between text-[13px] mb-1.5">
              <span className="text-secondary font-medium">Protein</span>
              <span className="text-label font-mono font-semibold">{todayProtein}g / {proteinGoal}g</span>
            </div>
            <ProgressBar value={todayProtein} max={proteinGoal} color="bg-accent" height={7} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-gray-100 rounded-ios-lg p-1">
        {[{ key: 'today', label: 'Today' }, { key: 'history', label: 'History' }, { key: 'ai plan', label: '✨ AI Plan' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-[13px] font-semibold rounded-ios transition-all duration-200 ${tab === t.key ? 'bg-card text-label shadow-ios-sm' : 'text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── AI PLAN TAB ── */}
      {tab === 'ai plan' && (
        <div className="space-y-3">

          {/* Config card */}
          <div className="bg-card rounded-ios-xl shadow-ios p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-label font-semibold text-[16px]">7-Day AI Diet Plan</p>
                <p className="text-secondary text-[13px] mt-0.5">Full week, varied daily meals</p>
              </div>
              <span className={`text-[12px] px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 ${profile?.dietPreference === 'non-veg' ? 'text-danger bg-danger/10 border-danger/25' : 'text-primary bg-primary/10 border-primary/25'}`}>
                {profile?.dietPreference === 'non-veg' ? '🍗 Non-Veg' : '🥦 Veg'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Calories', val: calorieGoal, unit: 'kcal', color: 'text-primary' },
                { label: 'Protein',  val: `${proteinGoal}g`, unit: '', color: 'text-accent' },
                { label: 'Goal',     val: profile?.goal || 'maintain', unit: '', color: 'text-label' },
              ].map(m => (
                <div key={m.label} className="bg-bg rounded-ios-lg p-3 text-center">
                  <p className={`font-mono font-bold text-[16px] capitalize ${m.color}`}>{m.val}{m.unit}</p>
                  <p className="text-muted text-[11px] mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Budget & Region */}
            <div className="space-y-2.5">
              <p className="text-secondary text-[12px] font-semibold uppercase tracking-wider">
                Budget & Location <span className="text-muted normal-case font-normal">(optional)</span>
              </p>
              <div className="flex gap-2">
                <div className="relative w-24 flex-shrink-0">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full appearance-none bg-bg border border-gray-200 rounded-ios-lg px-3 py-2.5 text-label text-[14px] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all pr-6"
                  >
                    {['₹','$','£','€','AED','৳','¥'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <input
                  type="number"
                  placeholder="Monthly budget"
                  value={monthlyBudget}
                  onChange={e => setMonthlyBudget(e.target.value)}
                  className="flex-1 bg-bg border border-gray-200 rounded-ios-lg px-3 py-2.5 text-label text-[14px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <RegionInput value={region} onChange={setRegion} />
            </div>

            <button onClick={handleGeneratePlan} disabled={generatingPlan}
              className="w-full py-3.5 rounded-ios-lg bg-accent text-white font-semibold text-[15px] shadow-ios-blue transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
              {generatingPlan
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating 7-day plan…</>
                : aiPlan ? '🔄 Regenerate Plan' : '✨ Generate 7-Day Plan'}
            </button>
          </div>

          {/* Plan output */}
          {aiPlan && (
            <div className="space-y-3">

              {/* Summary */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-ios-xl p-4">
                <p className="text-primary text-[11px] font-semibold uppercase tracking-wider mb-1.5">Weekly Plan Summary</p>
                <p className="text-label text-[14px] leading-relaxed">{aiPlan.summary}</p>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[
                    { label: 'Avg Cal',    value: aiPlan.avgCalories, unit: '',  color: 'text-primary' },
                    { label: 'Protein',    value: aiPlan.avgProtein,  unit: 'g', color: 'text-accent' },
                    { label: 'Carbs',      value: aiPlan.avgCarbs,    unit: 'g', color: 'text-gold' },
                    { label: 'Fat',        value: aiPlan.avgFat,      unit: 'g', color: 'text-danger' },
                  ].map(m => (
                    <div key={m.label} className="bg-card/80 rounded-ios p-2 text-center">
                      <p className={`font-mono font-bold text-[13px] ${m.color}`}>{m.value}{m.unit}</p>
                      <p className="text-muted text-[9px] mt-0.5 leading-tight">{m.label}</p>
                    </div>
                  ))}
                </div>
                {aiPlan.estimatedDailyCost && (
                  <div className="flex items-center gap-2 mt-3 bg-card/70 rounded-ios px-3 py-2">
                    <span className="text-[14px]">💰</span>
                    <p className="text-label text-[13px]">Est. daily cost: <span className="font-semibold text-primary">{aiPlan.estimatedDailyCost}</span></p>
                  </div>
                )}
              </div>

              {/* Day selector — horizontally scrollable */}
              <div className="bg-card rounded-ios-xl shadow-ios p-3">
                <div className="flex gap-1.5 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: '2px' }}>
                  {DAYS.map((day, i) => {
                    const d = aiPlan.days?.[i];
                    const active = selectedDay === i;
                    return (
                      <button
                        key={day}
                        onClick={() => { setSelectedDay(i); setExpandedMeal(null); }}
                        className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-ios-lg transition-all duration-200 min-w-[52px] ${active ? 'bg-accent text-white shadow-ios-blue' : 'bg-bg text-secondary hover:bg-gray-100'}`}
                      >
                        <span className={`text-[11px] font-semibold ${active ? 'text-white/80' : 'text-muted'}`}>{DAY_SHORT[i]}</span>
                        <span className={`text-[13px] font-bold font-mono mt-0.5 ${active ? 'text-white' : 'text-label'}`}>{d?.totalCalories ?? '—'}</span>
                        <span className={`text-[9px] ${active ? 'text-white/70' : 'text-muted'}`}>kcal</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected day meals */}
              {currentDayData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-label font-semibold text-[15px]">{currentDayData.day}</p>
                    <div className="flex gap-3 text-[12px]">
                      <span className="text-primary font-mono font-semibold">{currentDayData.totalCalories} kcal</span>
                      <span className="text-accent font-mono">{currentDayData.totalProtein}g protein</span>
                    </div>
                  </div>

                  {currentDayData.meals?.map((meal, i) => (
                    <div key={i} className="bg-card rounded-ios-xl shadow-ios overflow-hidden">
                      <button
                        onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}
                        className="w-full flex items-center gap-3 p-4 active:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-ios bg-primary/10 flex items-center justify-center text-[18px] flex-shrink-0">
                          {MEAL_ICONS[i] || '🍽️'}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-label font-semibold text-[15px]">{meal.name}</p>
                          <p className="text-secondary text-[12px]">{meal.time}</p>
                        </div>
                        <div className="text-right mr-2">
                          <p className="text-primary font-mono text-[14px] font-bold">{meal.mealCalories} kcal</p>
                          <p className="text-accent font-mono text-[12px]">{meal.mealProtein}g P</p>
                        </div>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className={`w-4 h-4 text-muted transition-transform duration-200 flex-shrink-0 ${expandedMeal === i ? 'rotate-90' : ''}`}>
                          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {expandedMeal === i && (
                        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
                          {meal.items?.map((item, j) => (
                            <div key={j} className="flex items-center justify-between gap-3 bg-bg rounded-ios px-3 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-label text-[13px] font-medium">{item.food}</p>
                                <p className="text-secondary text-[12px] mt-0.5">{item.qty}</p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0 text-[12px] font-mono">
                                <span className="text-primary font-semibold">{item.cal} kcal</span>
                                <span className="text-accent">{item.pro}g P</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              {aiPlan.tips?.length > 0 && (
                <div className="bg-card rounded-ios-xl shadow-ios p-4 space-y-2.5">
                  <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">Nutrition Tips</p>
                  {aiPlan.tips.map((tip, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-accent text-[10px] font-bold">✓</span>
                      </div>
                      <p className="text-label text-[13px] leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── LOG TABS ── */}
      {tab !== 'ai plan' && (
        displayLogs.length === 0
          ? <EmptyState icon="🥗" title="No food logged" subtitle={tab === 'today' ? "Tap '📷 Scan' to log from a photo, or '+ Log food' to add manually" : 'No history yet'} />
          : <div className="space-y-2">{displayLogs.map(item => <FoodCard key={item.id} item={item} today={today} onEdit={handleOpenEdit} onRemove={removeDiet} />)}</div>
      )}

      {/* ── MODAL ── */}
      <Modal open={open} onClose={handleClose} title={photoPreview ? '📷 Food Detected' : editingId ? 'Edit Food' : 'Log Food'}>
        <div className="space-y-3">
          {photoPreview && (
            <div className="relative rounded-ios-lg overflow-hidden">
              <img src={photoPreview} alt="Food" className="w-full h-40 object-cover" />
              {analyzing && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-white text-[13px] font-medium">Analysing food…</p>
                </div>
              )}
            </div>
          )}
          {!analyzing && aiConfidence && (
            <div className="bg-gray-50 border border-gray-200 rounded-ios-lg px-4 py-3 flex gap-2.5">
              <span className="text-[18px]">🤖</span>
              <div>
                <p className="text-label text-[13px] font-medium">
                  AI estimate — <span className={confidenceColor}>{aiConfidence} confidence</span>
                </p>
                {aiNote && <p className="text-secondary text-[12px] mt-0.5">{aiNote}</p>}
                <p className="text-muted text-[12px] mt-0.5">Review and adjust values if needed.</p>
              </div>
            </div>
          )}
          <input type="text" placeholder="Food name (e.g. Chicken breast)" value={form.foodName} onChange={set('foodName')} disabled={analyzing} className={inputClass + (analyzing ? ' opacity-40' : '')} />
          <div className="grid grid-cols-2 gap-2">
            {[{ k: 'calories', label: 'Calories *' }, { k: 'protein', label: 'Protein (g)' }, { k: 'carbs', label: 'Carbs (g)' }, { k: 'fat', label: 'Fat (g)' }].map(({ k, label }) => (
              <div key={k}>
                <label className="text-secondary text-[11px] font-semibold block mb-1">{label}</label>
                <input type="number" placeholder="0" value={form[k]} onChange={set(k)} disabled={analyzing}
                  className="w-full bg-bg border border-gray-200 rounded-ios-lg px-3 py-2.5 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all" />
              </div>
            ))}
          </div>
          <button onClick={handleAdd} disabled={saving || analyzing || !form.foodName.trim() || !form.calories}
            className="w-full py-3.5 rounded-ios-lg bg-accent text-white font-semibold text-[15px] shadow-ios-blue disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? 'Saving…' : analyzing ? 'Analysing…' : editingId ? 'Save Changes' : 'Add Food'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
