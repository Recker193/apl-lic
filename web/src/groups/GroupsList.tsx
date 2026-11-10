import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { Group, SchoolClass, Subject } from '../api/types';
import { BookOpen, Plus, Search } from 'lucide-react';
import { useMobile } from '../common/useMobile';

// Paletă de culori pentru materii - se atribuie automat rotativ
const COLOR_PALETTE = [
  { bg: '#dba3a1', bgDark: '#4a2524', ill: '/ill-math.png' }, // roșu-roz
  { bg: '#daedd7', bgDark: '#203d24', ill: '/ill-physics.png' }, // verde
  { bg: '#bcdeed', bgDark: '#1a374a', ill: '/ill-chemistry.png' }, // albastru-cyan
  { bg: '#f8ded9', bgDark: '#4f2924', ill: '/ill-french.png' }, // piersică
  { bg: '#e8d5f2', bgDark: '#3d2547', ill: '/ill-math.png' }, // violet
  { bg: '#fff4d9', bgDark: '#4a3d1a', ill: '/ill-physics.png' }, // galben-auriu
  { bg: '#d9f2e8', bgDark: '#1a4a3d', ill: '/ill-chemistry.png' }, // turcoaz
  { bg: '#f2d9e8', bgDark: '#4a1a3d', ill: '/ill-french.png' }, // roz-magenta
];

// Generează culori pe baza hash-ului numelui materiei
const getSubjectTheme = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
};

export const GroupsList: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [groups, setGroups] = useState<Group[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const loadGroups = async () => {
    try {
      const data = await apiClient<Group[]>('/api/v1/groups');
      setGroups(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
    if (user?.role === 'ADMIN' || user?.role === 'TEACHER') {
      apiClient<SchoolClass[]>('/api/v1/classes').then(setClasses).catch(() => {});
      apiClient<Subject[]>('/api/v1/subjects').then(setSubjects).catch(() => {});
    }
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      await apiClient('/api/v1/groups', {
        method: 'POST',
        body: JSON.stringify({ name, classId, subjectId }),
      });
      setShowCreateModal(false);
      setName('');
      setClassId('');
      setSubjectId('');
      loadGroups();
    } catch (err: any) {
      setError(err.message || 'Eroare la crearea grupului.');
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) return <div>Se încarcă grupurile...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.25rem' : '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className={isMobile ? 'mobile-page-title' : ''} style={!isMobile ? { fontSize: '1.5rem', fontWeight: 700 } : {}}>
            Materii
          </h1>
          {!isMobile && (
            <p style={{ color: 'var(--text-muted)' }}>Materiile și grupurile de studiu la care aveți acces</p>
          )}
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> {isMobile ? 'Grup' : 'Grup nou'}
          </button>
        )}
      </div>

      {/* Căutare tip mobil (ca în imagine: Caută materii, lecții...) */}
      <div className="mobile-search-bar-wrap">
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1.1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8c939d',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="mobile-search-input"
            placeholder="Caută materii, lecții..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Creare grup nou</h2>
            {error && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Nume grup (ex: Informatică 10-A)
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Clasă
                </label>
                <select
                  required
                  className="input-field"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                >
                  <option value="">Alegeți clasa</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.schoolYear})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Materie
                </label>
                <select
                  required
                  className="input-field"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                >
                  <option value="">Alegeți materia</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">
                  Anulează
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Se creează...' : 'Creează grup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de materii / grupuri - dinamice din baza de date */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1.25rem',
      }}>
        {filteredGroups.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '3rem', 
            color: 'var(--text-muted)' 
          }}>
            Nu s-au găsit materii. Directorul poate adăuga materii noi din panoul de administrare.
          </div>
        ) : (
          filteredGroups.map((group) => {
            const theme = getSubjectTheme(group.name);
            return (
              <div
                key={group.id}
                className="mobile-subject-card"
                style={{
                  backgroundColor: theme.bg,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Link
                  to={`/groups/${group.id}`}
                  className="mobile-subject-info"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <h3 className="mobile-subject-title">{group.name}</h3>
                  <p className="mobile-subject-teacher">
                    {group.teacher ? `${group.teacher.firstName} ${group.teacher.lastName}` : 'Fără profesor'}
                  </p>
                </Link>

                {theme.ill && (
                  <img
                    src={theme.ill}
                    alt={group.name}
                    className="mobile-subject-illustration"
                  />
                )}

                <div className="mobile-subject-actions">
                  <Link
                    to={`/groups/${group.id}`}
                    className="mobile-subject-action-btn"
                    title="Discuții & Mesaje"
                    aria-label="Mesaje"
                  >
                    <img
                      src="/action-chat.png"
                      alt="Mesaje"
                      className="mobile-subject-action-icon"
                    />
                  </Link>

                  <Link
                    to={`/groups/${group.id}`}
                    className="mobile-subject-action-btn"
                    title="Materiale & Dosare"
                    aria-label="Dosare"
                  >
                    <img
                      src="/action-files.png"
                      alt="Dosare"
                      className="mobile-subject-action-icon"
                    />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
