import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { CustomCursor } from './components/CustomCursor'
import './index.css'
import App from './App'
import { AuthPage } from './pages/AuthPage'
import { GoogleCallback } from './pages/GoogleCallback'
import { ProfilePage } from './pages/ProfilePage'
import { ShoppingPage } from './pages/ShoppingPage'
import { FoodDatabasePage } from './pages/FoodDatabasePage'
import { HabitsPage } from './pages/HabitsPage'
import { GoalsPage } from './pages/GoalsPage'
import { WeeklyPage } from './pages/WeeklyPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app loading">Ładowanie...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app loading">Ładowanie...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CustomCursor />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/shopping" element={<ProtectedRoute><ShoppingPage /></ProtectedRoute>} />
          <Route path="/food" element={<ProtectedRoute><FoodDatabasePage /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><HabitsPage /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
          <Route path="/week" element={<ProtectedRoute><WeeklyPage /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><App /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
