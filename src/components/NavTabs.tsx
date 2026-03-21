import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'PLANNER', shortLabel: 'PLANNER' },
  { path: '/habits', label: 'HABITY', shortLabel: 'HABITY' },
  { path: '/goals', label: 'CELE', shortLabel: 'CELE' },
  { path: '/shopping', label: 'ZAKUPY', shortLabel: 'ZAKUPY' },
  { path: '/food', label: 'BAZA JEDZENIA', shortLabel: 'JEDZENIE' },
] as const;

export function NavTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="nav-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.path}
          className={`nav-tab ${location.pathname === tab.path ? 'nav-tab--active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-tab-label-full">{tab.label}</span>
          <span className="nav-tab-label-short">{tab.shortLabel}</span>
        </button>
      ))}

      {/* Profile tab — visible only in mobile bottom nav */}
      <button
        className={`nav-tab nav-tab-profile ${location.pathname === '/profile' ? 'nav-tab--active' : ''}`}
        onClick={() => navigate('/profile')}
        aria-label="Profil"
      >
        <span className="nav-tab-label-full">PROFIL</span>
        <span className="nav-tab-label-short">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
      </button>
    </nav>
  );
}
