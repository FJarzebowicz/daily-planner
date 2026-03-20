import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { authApi } from '../api';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    try {
      const { url } = await authApi.googleUrl();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    }
  }

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="auth-header">
          <motion.h1
            className="auth-title"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Daily Planner
          </motion.h1>
          <motion.p
            className="auth-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {mode === 'login' ? 'Witaj z powrotem' : 'Stwórz konto'}
          </motion.p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Logowanie
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Rejestracja
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            onSubmit={handleSubmit}
            className="auth-form"
            initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
            transition={{ duration: 0.25 }}
          >
            {mode === 'register' && (
              <div className="float-field">
                <input
                  id="displayName"
                  type="text"
                  className="float-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder=" "
                  required
                />
                <label htmlFor="displayName" className="float-label">Nazwa</label>
              </div>
            )}

            <div className="float-field">
              <input
                id="email"
                type="email"
                className="float-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
              />
              <label htmlFor="email" className="float-label">Email</label>
            </div>

            <div className="float-field">
              <input
                id="password"
                type="password"
                className="float-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
                minLength={8}
              />
              <label htmlFor="password" className="float-label">Hasło</label>
            </div>

            {mode === 'register' && (
              <p className="auth-hint">Min. 8 znaków, 1 wielka litera, 1 cyfra</p>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  className="auth-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="auth-submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {submitting ? 'Ładowanie...' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="auth-divider">
          <span>lub</span>
        </div>

        <motion.button
          className="auth-google"
          onClick={handleGoogle}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Zaloguj przez Google
        </motion.button>
      </motion.div>
    </div>
  );
}
