import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { TimetableEntry, DayOfWeek, SchoolClass, Subject, User } from '../api/types';
import { AssetIcon } from '../common/AssetIcon';
import { Clock, Plus, Trash2, Printer } from 'lucide-react';

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
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [targetDay, setTargetDay] = useState<DayOfWeek>('MONDAY');
  const [targetPeriod, setTargetPeriod] = useState<number>(1);
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
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
          const [subs, usersList] = await Promise.all([
            apiClient<Subject[]>('/api/v1/subjects').catch(() => []),
            apiClient<User[]>('/api/v1/users?role=TEACHER').catch(() => []),
          ]);
          setSubjects(subs);
          setTeachers(usersList);
        }
      } catch (err) {
        console.error('Error fetching initial data', err);
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

  const handleOpenSlot = (day: DayOfWeek, period: number) => {
    if (!isAdmin) return;
    setTargetDay(day);
    setTargetPeriod(period);
    setFormSubjectId(subjects.length > 0 ? subjects[0].id : '');
    setFormTeacherId(teachers.length > 0 ? teachers[0].id : '');
    setFormRoom('');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const hours = DEFAULT_HOURS[targetPeriod] || { start: '08:00', end: '08:50' };
    try {
      await apiClient('/api/v1/timetable', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          subjectId: formSubjectId,
          teacherId: formTeacherId,
          dayOfWeek: targetDay,
          period: targetPeriod,
          startTime: hours.start,
          endTime: hours.end,
          room: formRoom || undefined,
        }),
      });
      setShowAddModal(false);
      fetchEntries();
    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare la salvarea orei');
    }
  };

  const handleDeleteEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Sigur doriți să ștergeți această oră din orar?')) return;
    try {
      await apiClient(`/api/v1/timetable/${id}`, { method: 'DELETE' });
      fetchEntries();
    } catch (err: any) {
      alert(err.message || 'Eroare la ștergerea orei');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const currentClassName = classes.find(c => c.id === selectedClassId)?.name;

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
              {isAdmin ? `Administrare orar Clasa ${currentClassName || ''}` : 'Programul săptămânal al cursurilor'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={handlePrint} title="Tipărește orarul">
            <Printer size={16} /> Printează
          </button>
          {isAdmin && (
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
                <th style={{ padding: '1rem', width: '110px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ora</th>
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
                    <td style={{ padding: '0.875rem', verticalAlign: 'middle', backgroundColor: '#fafbfc' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ora {p}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{hourRange.start} - {hourRange.end}</div>
                    </td>
                    {DAYS.map((d) => {
                      const entry = entries.find((e) => e.dayOfWeek === d.key && e.period === p);
                      return (
                        <td key={d.key} style={{ padding: '0.5rem', verticalAlign: 'top', width: '18%' }}>
                          {entry ? (
                            <div style={{
                              backgroundColor: '#f1f5f9',
                              borderLeft: '4px solid var(--primary)',
                              borderRadius: '0.375rem',
                              padding: '0.5rem 0.625rem',
                              position: 'relative'
                            }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                                {entry.subject?.name || 'Materie'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                Prof. {entry.teacher?.firstName} {entry.teacher?.lastName}
                              </div>
                              {entry.room && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.2rem', fontWeight: 500 }}>
                                  Sala: {entry.room}
                                </div>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={(ev) => handleDeleteEntry(entry.id, ev)}
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
                          ) : isAdmin ? (
                            /* Slot gol cu buton direct de adaugare */
                            <button
                              onClick={() => handleOpenSlot(d.key, p)}
                              style={{
                                width: '100%',
                                height: '58px',
                                border: '1px dashed #cbd5e1',
                                borderRadius: '0.375rem',
                                background: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.color = 'var(--primary)';
                                e.currentTarget.style.backgroundColor = '#eff6ff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#cbd5e1';
                                e.currentTarget.style.color = '#94a3b8';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title={`Adaugă oră: ${d.label}, Ora ${p}`}
                            >
                              <Plus size={14} /> Adaugă
                            </button>
                          ) : (
                            <div style={{ height: '58px', border: '1px dashed #e2e8f0', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

      {/* Modal Adăugare Oră Directă (Slot preselectat) */}
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
            maxWidth: '420px',
            width: '90%',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Adaugă oră în orar
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500, marginBottom: '1rem', backgroundColor: '#eff6ff', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {DAYS.find(d => d.key === targetDay)?.label} • Ora {targetPeriod} ({DEFAULT_HOURS[targetPeriod]?.start} - {DEFAULT_HOURS[targetPeriod]?.end})
            </div>

            {errorMsg && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateEntry} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
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
                <label className="label">Profesor</label>
                <select
                  className="input"
                  value={formTeacherId}
                  onChange={(e) => setFormTeacherId(e.target.value)}
                  required
                >
                  <option value="">Selectează profesorul</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Sală (opțional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Sala 104, Laborator Chimie"
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
                  Salvează în orar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
