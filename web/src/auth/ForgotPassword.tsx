import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch {
      // Păstrăm comportamentul generic indiferent dacă emailul există sau nu
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
          Recuperare parolă
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Introduceți emailul asociat contului dvs.
        </p>

        {submitted ? (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              Dacă adresa există în sistem, ați primit un link securizat pentru resetarea parolei. Verificați căsuța de email.
            </div>
            <Link to="/login" className="btn btn-outline">Înapoi la conectare</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Email
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
              {loading ? 'Se trimite...' : 'Trimite instrucțiuni'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              <Link to="/login">Înapoi la conectare</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

