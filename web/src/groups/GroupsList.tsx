import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { Group, SchoolClass, Subject } from '../api/types';
import { BookOpen, Plus } from 'lucide-react';

export const GroupsList: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  if (loading) return <div>Se încarcă grupurile...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Grupurile mele</h1>
          <p style={{ color: 'var(--text-muted)' }}>Materiile și grupurile de studiu la care aveți acces</p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> Grup nou
          </button>
        )}
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

      {groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Nu sunteți înscris în niciun grup de materie în acest moment.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {groups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="card"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.1s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <BookOpen size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{group.name}</h3>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Creat la: {new Date(group.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ marginTop: '1rem', alignSelf: 'flex-end', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500 }}>
                Deschide grupul &rarr;
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

