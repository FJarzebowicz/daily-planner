import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { profileApi } from '../api';

export function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      const updated = await profileApi.update({ displayName });
      updateUser(updated);
      setMsg('Profil zaktualizowany');
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await profileApi.changePassword({ oldPassword, newPassword });
      setOldPassword(''); setNewPassword('');
      setMsg('Hasło zmienione. Zaloguj się ponownie.');
      setTimeout(() => logout().then(() => navigate('/login')), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== 'DELETE') return;
    try {
      await profileApi.delete();
      await logout();
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (!user) return null;

  const initials = user.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-page">
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <button className="profile-back" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Wróć
        </button>

        <div className="profile-header">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar--initials">{initials}</div>
          )}
          <h2 className="profile-name">{user.displayName}</h2>
          <p className="profile-email">{user.email}</p>
          <span className="profile-badge">{user.authProvider === 'GOOGLE' ? 'Google' : 'Email'}</span>
        </div>

        <AnimatePresence>
          {(msg || error) && (
            <motion.p
              className={msg ? 'profile-msg' : 'auth-error'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {msg || error}
            </motion.p>
          )}
        </AnimatePresence>

        <form onSubmit={handleUpdateProfile} className="profile-section">
          <h3 className="profile-section-title">Profil</h3>
          <div className="float-field">
            <input
              id="pDisplayName"
              type="text"
              className="float-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder=" "
              required
            />
            <label htmlFor="pDisplayName" className="float-label">Nazwa wyświetlana</label>
          </div>
          <motion.button type="submit" className="profile-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Zapisz
          </motion.button>
        </form>

        {user.authProvider === 'LOCAL' && (
          <form onSubmit={handleChangePassword} className="profile-section">
            <h3 className="profile-section-title">Zmiana hasła</h3>
            <div className="float-field">
              <input
                id="oldPw"
                type="password"
                className="float-input"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder=" "
                required
              />
              <label htmlFor="oldPw" className="float-label">Obecne hasło</label>
            </div>
            <div className="float-field">
              <input
                id="newPw"
                type="password"
                className="float-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=" "
                required
                minLength={8}
              />
              <label htmlFor="newPw" className="float-label">Nowe hasło</label>
            </div>
            <motion.button type="submit" className="profile-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Zmień hasło
            </motion.button>
          </form>
        )}

        <div className="profile-section profile-danger">
          <h3 className="profile-section-title profile-section-title--danger">Strefa niebezpieczna</h3>
          {!showDelete ? (
            <motion.button
              className="profile-btn profile-btn--danger"
              onClick={() => setShowDelete(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Usuń konto
            </motion.button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="delete-confirm"
            >
              <p className="delete-warning">Ta operacja jest nieodwracalna. Wszystkie dane zostaną usunięte.</p>
              <div className="float-field">
                <input
                  id="deleteConfirm"
                  type="text"
                  className="float-input"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="deleteConfirm" className="float-label">Wpisz DELETE aby potwierdzić</label>
              </div>
              <div className="delete-actions">
                <motion.button
                  className="profile-btn profile-btn--danger"
                  disabled={deleteConfirm !== 'DELETE'}
                  onClick={handleDelete}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Potwierdzam usunięcie
                </motion.button>
                <button className="profile-btn profile-btn--cancel" onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}>
                  Anuluj
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
