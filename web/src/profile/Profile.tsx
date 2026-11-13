import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../common/ThemeContext';
import { AccentColorPicker } from '../common/AccentColorPicker';
import { apiClient } from '../api/client';
import { User } from '../api/types';
import { Palette, Moon, Sun, Settings, MessageCircle, LogOut } from 'lucide-react';
import { SendMessageModal } from '../common/SendMessageModal';
import { ModalPortal } from '../common/ModalPortal';

export const Profile: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [schoolName, setSchoolName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDirectMessage, setShowDirectMessage] = useState(false);

  useEffect(() => {
    apiClient<{ name: string }>('/api/v1/admin/school')
      .then((s) => setSchoolName(s.name))
      .catch(() => setSchoolName(''));
  }, []);

  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'TEACHER' ? 'Profesor' : 'Elev';
  const fullName = `${lastName || user?.lastName || ''} ${firstName || user?.firstName || ''}`.trim() || 'Utilizator';
  const className = user?.class ? `Clasa ${user.class.name}` : (user?.role === 'ADMIN' ? 'Gestiune Centrală' : user?.role === 'TEACHER' ? 'Cadru Didactic' : 'Clasă neatribuită');
  const schoolYear = user?.class?.schoolYear ? `An școlar ${user.class.schoolYear}` : '';
  const homeroomName = user?.homeroomTeacher ? `Prof. ${user.homeroomTeacher.firstName} ${user.homeroomTeacher.lastName}` : null;

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
      setShowSettingsModal(false);
    } catch (err: any) {
      setError(err.message || 'Actualizarea profilului a eșuat.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Header profil conform șablonului: Rol (stânga) + Buton roșiatic Deconectare (dreapta) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {roleLabel}
          </span>
        </div>

        <button
          onClick={logout}
          style={{
            backgroundColor: '#ea8d83',
            color: '#6e1d16',
            fontWeight: 700,
            fontSize: '0.88rem',
            padding: '0.55rem 1.4rem',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(234, 141, 131, 0.3)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Deconectare
        </button>
      </div>

      {/* ── Corpul central al Profilului: Titlu + Rotiță Setări + Avatar mare mov + Nume + Clasă ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '0.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Profil
        </h1>

        <button
          onClick={() => setShowSettingsModal(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'none',
            border: 'none',
            color: '#1d4ed8',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '0.2rem',
            marginBottom: '1rem',
          }}
        >
          <Settings size={16} />
          <span>Setări</span>
        </button>

        {/* Avatar circular */}
        <div style={{
          width: '130px',
          height: '130px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary, #4a2559)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          marginBottom: '1.15rem',
          position: 'relative',
        }}>
          <img
            src="/avatar-purple.png"
            alt={fullName}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </div>

        {/* Nume utilizator */}
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          {fullName}
        </h2>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
          {className}
        </p>
        {schoolYear && (
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
            {schoolYear}
          </p>
        )}
      </div>

      {/* ── Panglică festivă / Ribbon dinamic în funcție de numele și culoarea aleasă de liceu ── */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0.75rem 0' }}>
        <div className="school-ribbon-dynamic">
          <span className="school-ribbon-dynamic-text">
            {schoolName || 'Liceu'}
          </span>
        </div>
      </div>

      {/* ── Secțiune Diriginte (afișat dacă utilizatorul are diriginte atribuit) ── */}
      {homeroomName && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 15px -2px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img
              src="/avatar-green.png"
              alt="Diriginte"
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'contain' }}
            />
            <div>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                <strong>Diriginte:</strong> {homeroomName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDirectMessage(true)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              gap: '2px',
              color: 'var(--text-main)',
            }}
            title="Trimite mesaj dirigintelui"
          >
            <img src="/action-chat.png" alt="Mesaj" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Mesaj</span>
          </button>
        </div>
      )}

      {/* ── Modal / Panou Setări & Personalizare Teme ── */}
      {showSettingsModal && (
        <ModalPortal>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Setări Profil & Aspect</h2>
              <button onClick={() => setShowSettingsModal(false)} className="btn btn-outline" style={{ padding: '0.25rem 0.6rem' }}>✕</button>
            </div>

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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
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
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
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

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Paletă Cromatică
                </label>
                <AccentColorPicker compact={false} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Mod Întunecat</span>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className="btn btn-outline"
                >
                  {isDarkMode ? <Moon size={16} color="var(--warning)" /> : <Sun size={16} color="var(--warning)" />}
                  <span>{isDarkMode ? 'Activ' : 'Inactiv'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-outline">
                  Închide
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Se salvează...' : 'Salvează modificările'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal Trimitere Mesaj Diriginte */}
      <SendMessageModal
        isOpen={showDirectMessage}
        onClose={() => setShowDirectMessage(false)}
        defaultRecipientName={homeroomName || 'Diriginte'}
        contextTitle={`Mesaj către diriginte (${homeroomName || 'Diriginte'})`}
      />
    </div>
  );
};
