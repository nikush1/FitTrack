import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  addDietLog, getDietLogs, deleteDietLog, updateDietLog,
  addWorkoutLog, getWorkoutLogs, deleteWorkoutLog, updateWorkoutLog,
  addWeightLog, getWeightLogs, deleteWeightLog,
} from '../firebase/firestore';
import { format } from 'date-fns';

const AppContext = createContext();

const byDateDesc = (a, b) => {
  const ta = a.createdAt?.toMillis?.() ?? new Date(a.date || 0).getTime();
  const tb = b.createdAt?.toMillis?.() ?? new Date(b.date || 0).getTime();
  return tb - ta;
};
const byDateAsc = (a, b) => {
  const ta = a.createdAt?.toMillis?.() ?? new Date(a.date || 0).getTime();
  const tb = b.createdAt?.toMillis?.() ?? new Date(b.date || 0).getTime();
  return ta - tb;
};

export function AppProvider({ children }) {
  const { user, profile } = useAuth();

  const [dietLogs, setDietLogs]       = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [weightLogs, setWeightLogs]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  // Water intake stored in localStorage (lightweight, no Firestore needed)
  const today = format(new Date(), 'yyyy-MM-dd');
  const WATER_KEY = `fittrack_water_${today}`;
  const [waterMl, setWaterMl] = useState(() => {
    try { return Number(localStorage.getItem(WATER_KEY)) || 0; } catch { return 0; }
  });

  const addWater = (ml) => {
    setWaterMl(prev => {
      const next = Math.max(0, prev + ml);
      try { localStorage.setItem(WATER_KEY, String(next)); } catch {}
      return next;
    });
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [diet, workout, weight] = await Promise.all([
        getDietLogs(user.uid),
        getWorkoutLogs(user.uid),
        getWeightLogs(user.uid),
      ]);
      setDietLogs([...diet].sort(byDateDesc));
      setWorkoutLogs([...workout].sort(byDateDesc));
      setWeightLogs([...weight].sort(byDateAsc));
    } catch (err) {
      console.error('Firestore fetch error:', err);
      setError('Failed to load your data. Check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchAll();
    else { setDietLogs([]); setWorkoutLogs([]); setWeightLogs([]); }
  }, [user, fetchAll]);

  // ── Diet ───────────────────────────────────────────────────────────────────
  const addDiet = async (data) => {
    const now = new Date();
    const tempId = `tmp_${Date.now()}`;
    const optimistic = { id: tempId, userId: user.uid, ...data, date: today, createdAt: { toMillis: () => now.getTime() } };
    setDietLogs(prev => [optimistic, ...prev]);
    try {
      const ref = await addDietLog(user.uid, { ...data, date: today });
      setDietLogs(prev => prev.map(d => d.id === tempId ? { ...d, id: ref.id } : d));
    } catch (err) {
      setDietLogs(prev => prev.filter(d => d.id !== tempId));
      throw new Error('Failed to save food. Please try again.');
    }
  };

  const removeDiet = async (id) => {
    setDietLogs(prev => prev.filter(d => d.id !== id));
    try { await deleteDietLog(id); } catch { await fetchAll(); }
  };

  const updateDiet = async (id, data) => {
    setDietLogs(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    try { await updateDietLog(id, data); } catch { await fetchAll(); throw new Error('Failed to update food.'); }
  };

  // ── Workout ────────────────────────────────────────────────────────────────
  const addWorkout = async (data) => {
    const now = new Date();
    const tempId = `tmp_${Date.now()}`;
    const optimistic = { id: tempId, userId: user.uid, ...data, date: today, createdAt: { toMillis: () => now.getTime() } };
    setWorkoutLogs(prev => [optimistic, ...prev]);
    try {
      const ref = await addWorkoutLog(user.uid, { ...data, date: today });
      setWorkoutLogs(prev => prev.map(w => w.id === tempId ? { ...w, id: ref.id } : w));
    } catch (err) {
      setWorkoutLogs(prev => prev.filter(w => w.id !== tempId));
      throw new Error('Failed to save workout. Please try again.');
    }
  };

  const removeWorkout = async (id) => {
    setWorkoutLogs(prev => prev.filter(w => w.id !== id));
    try { await deleteWorkoutLog(id); } catch { await fetchAll(); }
  };

  const updateWorkout = async (id, data) => {
    setWorkoutLogs(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
    try { await updateWorkoutLog(id, data); } catch { await fetchAll(); throw new Error('Failed to update workout.'); }
  };

  // ── Weight ─────────────────────────────────────────────────────────────────
  const addWeight = async (data) => {
    const now = new Date();
    const tempId = `tmp_${Date.now()}`;
    const optimistic = { id: tempId, userId: user.uid, ...data, date: today, createdAt: { toMillis: () => now.getTime() } };
    setWeightLogs(prev => [...prev, optimistic].sort(byDateAsc));
    try {
      const ref = await addWeightLog(user.uid, { ...data, date: today });
      setWeightLogs(prev => prev.map(w => w.id === tempId ? { ...w, id: ref.id } : w));
    } catch (err) {
      setWeightLogs(prev => prev.filter(w => w.id !== tempId));
      throw new Error('Failed to save weight. Please try again.');
    }
  };

  const removeWeight = async (id) => {
    setWeightLogs(prev => prev.filter(w => w.id !== id));
    try { await deleteWeightLog(id); } catch { await fetchAll(); }
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const todayDiet     = dietLogs.filter(d => d.date === today);
  const todayWorkouts = workoutLogs.filter(w => w.date === today);
  const todayCalories = todayDiet.reduce((s, d) => s + (Number(d.calories) || 0), 0);
  const todayProtein  = todayDiet.reduce((s, d) => s + (Number(d.protein) || 0), 0);
  const todayCarbs    = todayDiet.reduce((s, d) => s + (Number(d.carbs) || 0), 0);
  const todayFat      = todayDiet.reduce((s, d) => s + (Number(d.fat) || 0), 0);

  const calorieGoal = profile?.calorieGoal || 2000;
  const proteinGoal = profile?.proteinGoal || 150;
  const waterGoal   = profile?.waterGoal   || 2500; // ml
  const userGoal    = profile?.goal || 'maintain';

  // ── Streak — tolerates 1 rest day so bulk/rest-day schedules don't reset ──
  const streak = (() => {
    const workoutDates = [...new Set(workoutLogs.map(w => w.date))].sort().reverse();
    if (workoutDates.length === 0) return 0;
    let count = 0;
    let skipped = 0; // allow 1 rest day in a row
    const cursor = new Date();
    let cursorStr = format(cursor, 'yyyy-MM-dd');

    for (let i = 0; i < 60; i++) {
      if (workoutDates.includes(cursorStr)) {
        count++;
        skipped = 0;
      } else {
        if (skipped < 1 && count > 0) {
          skipped++;
        } else {
          break;
        }
      }
      cursor.setDate(cursor.getDate() - 1);
      cursorStr = format(cursor, 'yyyy-MM-dd');
    }
    return count;
  })();

  return (
    <AppContext.Provider value={{
      dietLogs, workoutLogs, weightLogs,
      todayDiet, todayWorkouts, todayCalories, todayProtein, todayCarbs, todayFat,
      calorieGoal, proteinGoal, waterGoal, userGoal,
      waterMl, addWater,
      streak, loading, error, today,
      addDiet, removeDiet, updateDiet,
      addWorkout, removeWorkout, updateWorkout,
      addWeight, removeWeight,
      fetchAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
