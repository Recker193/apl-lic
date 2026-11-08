import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { TimetableEntry, DayOfWeek, SchoolClass, Subject } from '../api/types';
import { AssetIcon } from '../common/AssetIcon';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'Luni' },
  { key: 'TUESDAY', label: 'Marți' },
  { key: 'WEDNESDAY', label: 'Miercuri' },
  { key: 'THURSDAY', label: 'Joi' },
  { key: 'FRIDAY', label: 'Vineri' },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const DEFAULT_HOURS: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:50' },
  2: { start: '09:00', end: '09:50' },
  3: { start: '10:00', end: '10:50' },
  4: { start: '11:00', end: '11:50' },
  5: { start: '12:00', end: '12:50' },
  6: { start: '13:00', end: '13:50' },
  7: { start: '14:00', end: '14:50' },
};

export const TimetableView: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state for adding entry (admin)
  const [formClassId, setFormClassId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formDay, setFormDay] = useState<DayOfWeek>('MONDAY');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('08:50');
  const [formRoom, setFormRoom] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isAdmin = user?.role === 'ADMIN';

  // Load initial options
  useEffect(() => {
    const initData = async () => {
      try {
        const cls = await apiClient<SchoolClass[]>('/api/v1/classes');
        setClasses(cls);
        if (cls.length > 0 && !selectedClassId) {
          setSelectedClassId(cls[0].id);
        }
        if (isAdmin) {
          const subs = await apiClient<Subject[]>('/api/v1/subjects');
          setSubjects(subs);
        }
      } catch (err) {
        console.error('Error fetching initial classes/subjects', err);
      }
    };
    initData();
  }, [isAdmin]);

  // Load entries
  const fetchEntries = async () => {
    setLoading(true);
    try {
      if (isAdmin && selectedClassId) {
        const data = await apiClient<TimetableEntry[]>(`/api/v1/timetable/class/${selectedClassId}`);
        setEntries(data);
      } else {
        const data = await apiClient<TimetableEntry[]>('/api/v1/timetable/me');
        setEntries(data);
      }
    } catch (err) {
      console.error('Failed to load timetable entries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedClassId, isAdmin]);

  const handlePeriodChange = (p: number) => {
    setFormPeriod(p);
    if (DEFAULT_HOURS[p]) {
      setFormStartTime(DEFAULT_HOURS[p].start);
      setFormEndTime(DEFAULT_HOURS[p].end);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await apiClient('/api/v1/timetable', {
        method: 'POST',
        body: JSON.stringify({
          classId: formClassId || selectedClassId,
          subjectId: formSubjectId,
          teacherId: formTeacherId,
          dayOfWeek: formDay,
          period: Number(formPeriod),
          startTime: formStartTime,
          endTime: formEndTime,
          room: formRoom || undefined,
        }),
      });
      setShowAddModal(false);
      setFormRoom('');
      fetchEntries();
    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare la adăugarea orei în orar');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Sigur doriți să ștergeți această oră?')) return;
    try {
      await apiClient(`/api/v1/timetable/${id}`, { method: 'DELETE' });
      fetchEntries();
    } catch (err: any) {
      alert(err.message || 'Eroare la ștergerea orei');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem', color: 'var(--primary)' }}>
            <AssetIcon assetKey="timetable" fallbackIcon={Clock} size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Orar Școlar</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {isAdmin ? 'Vizualizare și administrare orar pe clase' : 'Programul săptămânal al cursurilor'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAdmin && (
            <>
              <select
                className="input"
                style={{ width: 'auto', minWidth: '180px' }}
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Clasa {c.name} ({c.schoolYear})
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setFormClassId(selectedClassId);
                  setShowAddModal(true);
                }}
              >
                <Plus size={16} /> Adaugă oră
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grid Timetable */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Se încarcă orarul...
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '0.75rem', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', width: '100px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ora</th>
                {DAYS.map((d) => (
                  <th key={d.key} style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => {
                const hourRange = DEFAULT_HOURS[p] || { start: `0${7+p}:00`, end: `0${7+p}:50` };
                return (
                  <tr key={p} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem', verticalAlign: 'top', backgroundColor: '#fafbfc' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ora {p}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hourRange.start} - {hourRange.end}</div>
                    </td>
                    {DAYS.map((d) => {
                      const entry = entries.find((e) => e.dayOfWeek === d.key && e.period === p);
                      return (
                        <td key={d.key} style={{ padding: '0.75rem', verticalAlign: 'top', width: '18%' }}>
                          {entry ? (
                            <div style={{
                              backgroundColor: '#f1f5f9',
                              borderLeft: '4px solid var(--primary)',
                              borderRadius: '0.375rem',
                              padding: '0.5rem 0.75rem',
                              position: 'relative'
                            }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                {entry.subject?.name || 'Materie'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Prof. {entry.teacher?.firstName} {entry.teacher?.lastName}
                              </div>
                              {entry.room && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.2rem', fontWeight: 500 }}>
                                  Sala: {entry.room}
                                </div>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  title="Șterge oră"
                                  style={{
                                    position: 'absolute',
                                    top: '0.35rem',
                                    right: '0.35rem',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--danger)',
                                    opacity: 0.7,
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div style={{ height: '54px', border: '1px dashed #e2e8f0', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>-</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Adăugare Oră (Admin Only) */}
      {showAddModal && (
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
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Adaugă oră în orar</h2>

            {errorMsg && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateEntry} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">Clasă</label>
                <select
                  className="input"
                  value={formClassId}
                  onChange={(e) => setFormClassId(e.target.value)}
                  required
                >
                  <option value="">Selectează clasa</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.schoolYear})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Materie</label>
                <select
                  className="input"
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  required
                >
                  <option value="">Selectează materia</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">ID Profesor (UUID)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Introduceți UUID-ul profesorului"
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Ziua săptămânii</label>
                  <select
                    className="input"
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                  >
                    {DAYS.map((d) => (
                      <option key={d.key} value={d.key}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Număr oră (1-7)</label>
                  <select
                    className="input"
                    value={formPeriod}
                    onChange={(e) => handlePeriodChange(Number(e.target.value))}
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>Ora {p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Ora început</label>
                  <input
                    type="time"
                    className="input"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Ora sfârșit</label>
                  <input
                    type="time"
                    className="input"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Sală (opțional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Sala 104, Laborator Info"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Anulează
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

