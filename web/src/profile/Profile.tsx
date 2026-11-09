import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../common/ThemeContext';
import { AccentColorPicker } from '../common/AccentColorPicker';
import { apiClient } from '../api/client';
import { User } from '../api/types';
import { Palette, Moon, Sun } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await apiClient<User>('/api/v1/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName }),
      });
      setUser(updated);
      setMessage('Profilul a fost actualizat cu succes.');
    } catch (err: any) {
      setError(err.message || 'Actualizarea profilului a eșuat.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Profilul meu</h1>

      <div className="card">
        {message && (
          <div className="bg-success-subtle" style={{ padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {message}
          </div>
        )}
        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Adresă de email (gestionată de liceu)
            </label>
            <input
              type="text"
              disabled
              className="input-field"
              value={user?.email || ''}
              style={{ backgroundColor: 'var(--bg-subtle)', cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Rol atribuit
            </label>
            <input
              type="text"
              disabled
              className="input-field"
              value={user?.role || ''}
              style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

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

          <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Se salvează...' : 'Actualizează profilul'}
          </button>
        </form>
      </div>

      {/* Secțiunea de Personalizare Aspect & Culori */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Palette size={20} color="var(--primary)" /> Personalizare Aspect & Culori
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Personalizează atmosfera din Oktapod alegând paleta de culori și tema preferată.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Culoare de accent a interfeței
            </label>
            <AccentColorPicker compact={false} />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Mod Întunecat (Dark Mode)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Comută între aspectul luminos și cel întunecat
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="btn btn-outline"
              style={{ gap: '0.5rem' }}
            >
              {isDarkMode ? <Moon size={16} color="var(--warning)" /> : <Sun size={16} color="var(--warning)" />}
              <span>{isDarkMode ? 'Activ' : 'Inactiv'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
