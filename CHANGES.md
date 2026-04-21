# FitTrack — Patch Notes

## 🔴 Critical Fixes

### 1. Groq API key no longer exposed in browser
**Problem:** `VITE_GROQ_API_KEY` was bundled into the JS shipped to users — visible in DevTools.  
**Fix:** Added a Vercel serverless function at `api/groq.js` that proxies all Groq requests server-side.  
- All calls from `Diet.jsx` and `Workout.jsx` now go through `/api/groq` via `src/utils/groqClient.js`.  
- Set `GROQ_API_KEY` (no `VITE_` prefix) in **Vercel Dashboard → Settings → Environment Variables**.  
- Remove `VITE_GROQ_API_KEY` from your `.env` and Vercel env vars.

### 2. Edit button on all log entries
**Problem:** Workout and diet logs were delete-only — no way to fix AI auto-fill mistakes.  
**Fix:** Every card in Workout and Diet now has a ✎ edit button that reopens the form pre-filled.  
- `updateWorkoutLog` / `updateDietLog` Firestore helpers added.  
- Optimistic UI update so edits feel instant.

---

## 🟡 Medium Priority Fixes

### 3. Streak tolerates 1 rest day
**Problem:** A single rest day (or scheduled rest in the AI plan) zeroed the streak counter.  
**Fix:** Streak algorithm now allows 1 consecutive rest day before breaking the count — matching how most fitness trackers work.

### 4. AI plan survives page refresh
**Problem:** The generated 7-day plan disappeared on every refresh, wasting API quota.  
**Fix:** Plan is persisted in `localStorage` under `fittrack_ai_plan`. A "Clear" button lets users discard it manually.

### 5. Weight change color is goal-aware
**Problem:** Weight gain was always coloured red — punishing for users bulking.  
**Fix:**  
- **Bulk:** gain = green, loss = muted  
- **Cut:** loss = green, gain = red  
- **Maintain:** neutral white

### 6. Date parsing bug fixed
**Problem:** `new Date('2024-01-15')` parses as UTC midnight → shows previous day in local timezones.  
**Fix:** All date strings now parsed as `new Date(date + 'T00:00:00')` for local time.

---

## 🟢 New Features

### 7. Water intake tracker (Dashboard)
- Quick-add buttons: +150ml, +250ml, +350ml, +500ml with an undo button.  
- Progress bar toward daily goal (default 2500ml, configurable in Profile).  
- Stored in `localStorage` keyed by date — resets automatically each day.

### 8. Macro pie chart (Dashboard)
- Donut chart showing today's protein / carbs / fat calorie split using existing recharts dependency.  
- Only visible when at least one macro has been logged.

### 9. Edit food entries (Diet page)
- Every food log card now has a ✎ edit button alongside delete.  
- Works for both manually entered and AI photo-scanned entries.

---

## Deployment Checklist

1. **Remove** `VITE_GROQ_API_KEY` from Vercel env vars and your `.env` file.
2. **Add** `GROQ_API_KEY` (server-side) in Vercel Dashboard → Settings → Environment Variables.
3. Redeploy — Vercel auto-detects `api/groq.js` as a serverless function.
4. Optionally add `waterGoal` (in ml) to user profiles in Firestore for a custom water target.
