export function getFitnessSuggestion({ calories, calorieGoal, protein, proteinGoal, workedOut, goal }) {
  const calRemaining = calorieGoal - calories;
  const proteinRemaining = proteinGoal - protein;

  if (!workedOut && calRemaining < 200 && goal === 'cut') {
    return "You've hit your calorie target today. Squeeze in a short workout to stay in a deficit. 🔥";
  }
  if (proteinRemaining > proteinGoal * 0.5) {
    return `You're ${proteinRemaining}g short on protein. Add a chicken breast or protein shake to hit your target. 💪`;
  }
  if (calRemaining < 0) {
    return `You're ${Math.abs(calRemaining)} kcal over today. Lighter dinner or a walk can help balance it out. 🚶`;
  }
  if (workedOut && calRemaining > 300) {
    return `Great session! You still have ${calRemaining} kcal left. Fuel your recovery with a solid meal. 🍗`;
  }
  if (!workedOut) {
    return "No workout logged yet. Even 20 minutes counts — go for it! 🏃";
  }
  if (goal === 'bulk' && calRemaining > 200) {
    return `You're ${calRemaining} kcal short of your bulk target. Add a meal or snack to maximise gains. 🥩`;
  }
  return "You're on track today. Keep the consistency going! ✅";
}
