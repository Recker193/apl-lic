import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Tokenul de confirmare lipsește din adresa web.');
      return;
    }

    const verify = async () => {
      try {
        await apiClient('/api/v1/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Confirmarea adresei de email a eșuat sau linkul a expirat.');
      }
    };

    verify();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          Confirmare email
        </h1>

        {status === 'loading' && <p>Se verifică tokenul de confirmare...</p>}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              Adresa de email a fost confirmată cu succes! Vă puteți autentifica acum în platformă.
            </div>
            <Link to="/login" className="btn btn-primary">Mergeți la autentificare</Link>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', fontSize: '0.875rem' }}>
              {errorMessage}
            </div>
            <Link to="/login" className="btn btn-outline">Înapoi la conectare</Link>
          </div>
        )}
      </div>
    </div>
  );
};

