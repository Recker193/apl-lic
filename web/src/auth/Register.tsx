import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

export const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Tokenul de invitație lipsește din link.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await apiClient('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          token,
          firstName,
          lastName,
          password,
        }),
      });
      setSuccess(true);
      // Nu mai redirectăm automat - lăsăm utilizatorul să citească mesajul
    } catch (err: any) {
      setError(err.message || 'Înregistrarea a eșuat. Verificați tokenul de invitație.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'var(--bg-main)' }}>
      <div className="card card-interactive animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <img
            src="/logo.png"
            alt="Oktapod Logo"
            style={{ width: '50px', height: '50px', objectFit: 'contain' }}
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, textAlign: 'center', color: 'var(--primary)' }}>
            Oktapod
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>
            Finalizare înregistrare cont pe baza invitației
          </p>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-success-subtle, #dcfce7)', color: 'var(--success, #166534)', borderRadius: '0.375rem', textAlign: 'center' }}>
              <strong>✅ Contul a fost creat cu succes!</strong>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>
                Vă rugăm să verificați emailul pentru a confirma adresa înainte de a vă conecta.
              </p>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Nu ați primit emailul? Verificați folderul Spam sau așteptați 1-2 minute.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ textAlign: 'center' }}>
              Mergeți la autentificare
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {!token && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
                Atenție: Nu a fost găsit niciun token în URL. Asigurați-vă că ați accesat linkul complet din email.
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Prenume
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Nume de familie
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Alegeți o parolă (minim 8 caractere)
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading || !token} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Se înregistrează...' : 'Activează contul'}
            </button>

            <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
              <Link to="/login">Înapoi la conectare</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

