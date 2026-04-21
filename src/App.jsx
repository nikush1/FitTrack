import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
import BottomNav from './components/BottomNav';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Diet from './pages/Diet';
import Workout from './pages/Workout';
import Weight from './pages/Weight';
import Profile from './pages/Profile';

export default function App() {
  const { user } = useAuth();
  const { error, fetchAll } = useApp();

  if (!user) return <Auth />;

  return (
    <div className="bg-bg min-h-screen">
      {error && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-danger/10 border-b border-danger/20 px-4 py-3 flex items-center justify-between backdrop-blur-ios">
          <p className="text-danger text-[13px] font-medium">{error}</p>
          <button onClick={fetchAll} className="text-danger text-[13px] font-semibold underline ml-4 flex-shrink-0">
            Retry
          </button>
        </div>
      )}
      <div className={`max-w-lg mx-auto px-4${error ? ' pt-12' : ''}`}>
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/diet"    element={<Diet />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/weight"  element={<Weight />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}
