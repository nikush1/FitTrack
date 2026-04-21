import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(''); setMessage(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else if (mode === 'signup') {
        if (!form.name.trim()) throw new Error('Name is required.');
        await signup(form.email, form.password, form.name);
      } else {
        await resetPassword(form.email);
        setMessage('Reset email sent. Check your inbox.');
      }
    } catch (err) {
      const msg = err.code ? err.code.replace('auth/', '').replace(/-/g, ' ') : err.message;
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try { await loginWithGoogle(); }
    catch { setError('Google sign-in failed. Try again.'); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full bg-bg border border-gray-200 rounded-ios-lg px-4 py-3.5 text-label text-[15px] placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all";

  return (
    <div className="min-h-screen bg-bg flex flex-col overflow-hidden">
      {/* Top gradient decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-12">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-primary to-[#28B14C] shadow-ios-btn mb-5">
            <svg viewBox="0 0 32 32" className="w-9 h-9">
              <rect x="1" y="12" width="4" height="8" rx="2" fill="white" fillOpacity="0.8"/>
              <rect x="5" y="10" width="3" height="12" rx="1.5" fill="white" fillOpacity="0.9"/>
              <rect x="8" y="14" width="16" height="4" rx="2" fill="white"/>
              <rect x="24" y="10" width="3" height="12" rx="1.5" fill="white" fillOpacity="0.9"/>
              <rect x="27" y="12" width="4" height="8" rx="2" fill="white" fillOpacity="0.8"/>
            </svg>
          </div>
          <h1 className="text-label font-display text-[32px] font-bold tracking-tight">FitTrack</h1>
          <p className="text-secondary text-[15px] mt-1.5">
            {mode === 'login'  && 'Welcome back'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset'  && 'Reset your password'}
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-card rounded-ios-xl shadow-ios-lg p-5 space-y-3">
          {/* Google */}
          {mode !== 'reset' && (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-ios-lg border border-gray-200 text-label text-[15px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-muted text-[12px]">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </>
          )}

          {mode === 'signup' && (
            <input type="text" placeholder="Full name" value={form.name} onChange={set('name')} className={inputClass} />
          )}

          <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} className={inputClass} />

          {mode !== 'reset' && (
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={set('password')}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className={inputClass + ' pr-12'}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4.5 h-4.5">
                  {showPw
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2.5 bg-danger/8 border border-danger/20 rounded-ios-lg px-4 py-3">
              <span className="text-danger text-base font-bold">!</span>
              <p className="text-danger text-[13px] font-medium">{error}</p>
            </div>
          )}
          {message && (
            <div className="flex items-center gap-2.5 bg-primary/8 border border-primary/20 rounded-ios-lg px-4 py-3">
              <span className="text-primary text-base font-bold">✓</span>
              <p className="text-primary text-[13px] font-medium">{message}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 rounded-ios-lg bg-accent text-white font-semibold text-[15px] shadow-ios-blue hover:bg-[#0074e0] transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Please wait…
                </span>
              : mode === 'login'  ? 'Sign In'
              : mode === 'signup' ? 'Create Account'
              : 'Send Reset Email'}
          </button>

          <div className="text-center text-[13px] text-secondary space-y-1.5 pt-1">
            {mode === 'login' && (
              <>
                <p>
                  No account?{' '}
                  <button onClick={() => { setMode('signup'); setError(''); }} className="text-accent font-semibold">
                    Sign up free
                  </button>
                </p>
                <p>
                  <button onClick={() => { setMode('reset'); setError(''); }} className="text-muted hover:text-secondary transition-colors">
                    Forgot password?
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p>
                Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} className="text-accent font-semibold">Sign in</button>
              </p>
            )}
            {mode === 'reset' && (
              <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-accent font-semibold">
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        {/* Feature chips */}
        {mode === 'signup' && (
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {['📸 AI Food Scanner', '🔥 Streaks', '💪 Workout Logs', '📊 Weight Charts'].map(f => (
              <span key={f} className="text-[12px] text-secondary bg-card px-3 py-1.5 rounded-full border border-gray-200 shadow-ios-sm font-medium">{f}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
