import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'PLANNER' },
  { path: '/habits', label: 'HABITY' },
  { path: '/goals', label: 'CELE' },
  { path: '/shopping', label: 'ZAKUPY' },
  { path: '/food', label: 'BAZA JEDZENIA' },
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
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
