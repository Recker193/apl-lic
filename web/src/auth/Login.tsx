import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';
import { User } from '../api/types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await apiClient<User>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Autentificare eșuată. Verificați credențialele.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setResendMessage('');
    if (!email) {
      setError('Introduceți adresa de email pentru a retrimite confirmarea.');
      return;
    }
    setResending(true);
    try {
      await apiClient('/api/v1/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResendMessage(
        'Dacă există un cont neconfirmat cu această adresă, emailul de confirmare a fost retrimis.',
      );
    } catch (err: any) {
      setError(err.message || 'Trimiterea emailului de confirmare a eșuat.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--bg-main)' }}>
      <div className="card card-interactive animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <img
            src="/logo.png"
            alt="Oktapod Logo"
            style={{ width: '56px', height: '56px', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, textAlign: 'center', color: 'var(--primary)' }}>
            Oktapod
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>
            Autentificare în contul tău școlar
          </p>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {resendMessage && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              backgroundColor: 'var(--bg-success-subtle, #dcfce7)',
              color: 'var(--success, #166534)',
            }}
          >
            {resendMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Adresă de email
            </label>
            <input
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nume@liceu.ro"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Parolă
            </label>
            <input
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Se procesează...' : 'Conectare'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/forgot-password">Ați uitat parola?</Link>
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              color: 'var(--primary)',
              cursor: 'pointer',
            }}
          >
            {resending ? 'Se trimite...' : 'Nu ați primit emailul de confirmare? Retrimiteți-l'}
          </button>
          <span style={{ color: 'var(--text-muted)' }}>
            Ai primit o invitație? <Link to="/register">Activează contul</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

