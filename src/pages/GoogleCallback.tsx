import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      loginWithGoogle(code)
        .then(() => navigate('/'))
        .catch((err) => setError(err.message || 'Google login failed'));
    } else {
      setError('Missing authorization code');
    }
  }, [searchParams, loginWithGoogle, navigate]);

  if (error) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="auth-error" style={{ padding: 24 }}>{error}</p>
          <button className="auth-submit" onClick={() => navigate('/login')} style={{ margin: '0 24px 24px' }}>
            Wróć do logowania
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ padding: 48, textAlign: 'center' }}>
        <p>Logowanie przez Google...</p>
      </div>
    </div>
  );
}
