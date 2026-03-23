import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'PLANNER', shortLabel: 'PLANNER' },
  { path: '/week', label: 'TYDZIEŃ', shortLabel: 'TYDZIEŃ' },
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
      >
        <span className="nav-tab-label-full">PROFIL</span>
        <span className="nav-tab-label-short">PROFIL</span>
      </button>
    </nav>
  );
}
