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
    </nav>
  );
}
