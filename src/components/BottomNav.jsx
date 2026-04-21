import { NavLink } from 'react-router-dom';

const tabs = [
  {
    to: '/',
    label: 'Home',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="1.8" className="w-6 h-6">
        <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    to: '/diet',
    label: 'Diet',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="1.8" className="w-6 h-6">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeLinecap="round"/>
        <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round" stroke={active ? 'white' : 'currentColor'} fill="none" strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    to: '/workout',
    label: 'Workout',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <rect x="1" y="10" width="3" height="4" rx="1.5" strokeLinecap="round" fill={active ? 'currentColor' : 'none'}/>
        <rect x="4" y="8" width="3" height="8" rx="1.5" strokeLinecap="round" fill={active ? 'currentColor' : 'none'}/>
        <rect x="7" y="11" width="10" height="2" rx="1" fill={active ? 'currentColor' : 'none'}/>
        <rect x="17" y="8" width="3" height="8" rx="1.5" strokeLinecap="round" fill={active ? 'currentColor' : 'none'}/>
        <rect x="20" y="10" width="3" height="4" rx="1.5" strokeLinecap="round" fill={active ? 'currentColor' : 'none'}/>
      </svg>
    ),
  },
  {
    to: '/weight',
    label: 'Weight',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" fill="none" stroke={active ? '#0A84FF' : 'currentColor'}/>
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke={active ? 'none' : 'currentColor'} strokeWidth="1.8" className="w-6 h-6">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" fill="none" stroke={active ? 'white' : 'currentColor'} strokeWidth="1.8"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 ios-blur safe-area-pb">
      <div className="flex justify-around max-w-lg mx-auto px-1 pt-2 pb-1">
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 px-3 min-w-[56px] transition-all duration-200 ${
                isActive ? 'text-accent' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {icon(isActive)}
                </span>
                <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-accent font-semibold' : 'text-muted'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
