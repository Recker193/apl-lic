import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { TimetableEntry, DayOfWeek, SchoolClass, Subject, User } from '../api/types';
import { AssetIcon } from '../common/AssetIcon';
import { TimePicker24 } from '../common/TimePicker24';
import { Clock, Plus, Trash2, Printer, Settings2 } from 'lucide-react';

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'Luni' },
  { key: 'TUESDAY', label: 'Marți' },
  { key: 'WEDNESDAY', label: 'Miercuri' },
  { key: 'THURSDAY', label: 'Joi' },
  { key: 'FRIDAY', label: 'Vineri' },
];

export interface PeriodSlot {
  period: number;
  label: string;
  start: string;
  end: string;
}

const DEFAULT_MORNING_SLOTS: PeriodSlot[] = [
  { period: 1, label: 'Ora 1', start: '08:00', end: '08:50' },
  { period: 2, label: 'Ora 2', start: '09:00', end: '09:50' },
  { period: 3, label: 'Ora 3', start: '10:00', end: '10:50' },
  { period: 4, label: 'Ora 4', start: '11:00', end: '11:50' },
  { period: 5, label: 'Ora 5', start: '12:00', end: '12:50' },
  { period: 6, label: 'Ora 6', start: '13:00', end: '13:50' },
  { period: 7, label: 'Ora 7', start: '14:00', end: '14:50' },
];

const DEFAULT_AFTERNOON_SLOTS: PeriodSlot[] = [
  { period: 1, label: 'Ora 1 (După-amiază)', start: '13:00', end: '13:50' },
  { period: 2, label: 'Ora 2 (După-amiază)', start: '14:00', end: '14:50' },
  { period: 3, label: 'Ora 3 (După-amiază)', start: '15:00', end: '15:50' },
  { period: 4, label: 'Ora 4 (După-amiază)', start: '16:00', end: '16:50' },
  { period: 5, label: 'Ora 5 (După-amiază)', start: '17:00', end: '17:50' },
  { period: 6, label: 'Ora 6 (După-amiază)', start: '18:00', end: '18:50' },
  { period: 7, label: 'Ora 7 (După-amiază)', start: '19:00', end: '19:50' },
];

export const TimetableView: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Intervalele orare configurate pentru clasa curentă
  const [customSlots, setCustomSlots] = useState<PeriodSlot[]>(() => {
    const saved = localStorage.getItem('hssa_slots_global');
    return saved ? JSON.parse(saved) : DEFAULT_MORNING_SLOTS;
  });

  // Modal adăugare / modificare oră din chenar
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [targetDay, setTargetDay] = useState<DayOfWeek>('MONDAY');
  const [targetPeriod, setTargetPeriod] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('08:50');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal configurare intervale / adăugare oră nouă de curs în schemă (ex: dimineața vs după-amiaza)
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotStart, setNewSlotStart] = useState('07:30');
  const [newSlotEnd, setNewSlotEnd] = useState('08:20');

  const isAdmin = user?.role === 'ADMIN';

  // Load slots per class when class changes
  useEffect(() => {
    if (!selectedClassId) return;
    const key = `hssa_slots_${selectedClassId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setCustomSlots(JSON.parse(saved));
    } else {
      // Daca nu exista specific, preluam cel global sau dimineata
      const global = localStorage.getItem('hssa_slots_global');
      setCustomSlots(global ? JSON.parse(global) : DEFAULT_MORNING_SLOTS);
    }
  }, [selectedClassId]);

  const saveSlots = (newSlots: PeriodSlot[]) => {
    setCustomSlots(newSlots);
    if (selectedClassId) {
      localStorage.setItem(`hssa_slots_${selectedClassId}`, JSON.stringify(newSlots));
    }
    localStorage.setItem('hssa_slots_global', JSON.stringify(newSlots));
  };

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

  // Click pe un slot gol
  const handleOpenSlot = (day: DayOfWeek, slot: PeriodSlot) => {
    if (!isAdmin) return;
    setTargetDay(day);
    setTargetPeriod(slot.period);
    setFormStartTime(slot.start);
    setFormEndTime(slot.end);
    setFormSubjectId(subjects.length > 0 ? subjects[0].id : '');
    setFormTeacherId(teachers.length > 0 ? teachers[0].id : '');
    setFormRoom('');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await apiClient('/api/v1/timetable', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          subjectId: formSubjectId,
          teacherId: formTeacherId,
          dayOfWeek: targetDay,
          period: targetPeriod,
          startTime: formStartTime,
          endTime: formEndTime,
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

  // Administrare intervale orare (Add/Remove or Shift preset)
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const nextPeriod = customSlots.length > 0 ? Math.max(...customSlots.map(s => s.period)) + 1 : 1;
    const label = newSlotLabel.trim() || `Ora ${nextPeriod}`;
    const updated = [...customSlots, { period: nextPeriod, label, start: newSlotStart, end: newSlotEnd }];
    saveSlots(updated);
    setNewSlotLabel('');
  };

  const handleRemoveSlot = (period: number) => {
    if (customSlots.length <= 1) {
      alert('Trebuie să păstrați cel puțin o oră în orar.');
      return;
    }
    const updated = customSlots.filter(s => s.period !== period);
    saveSlots(updated);
  };

  const applyPreset = (preset: 'MORNING' | 'AFTERNOON') => {
    if (preset === 'MORNING') {
      saveSlots(DEFAULT_MORNING_SLOTS);
    } else {
      saveSlots(DEFAULT_AFTERNOON_SLOTS);
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Orar Școlar Flexibil</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {isAdmin 
                ? `Administrare orar Clasa ${currentClassName || ''} (Dimineața / După-amiaza configurabil)` 
                : 'Programul săptămânal al cursurilor'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handlePrint} title="Tipărește orarul">
            <Printer size={16} /> Printează
          </button>

          {isAdmin && (
            <>
              <button 
                className="btn btn-outline" 
                onClick={() => setShowConfigModal(true)}
                title="Configurează intervalele orare ale clasei (7:30 - 20:30, schimburi)"
              >
                <Settings2 size={16} /> Setare Intervale & Schimb
              </button>

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
            </>
          )}
        </div>
      </div>

      {/* Grid Timetable Dinamic */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Se încarcă orarul...
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-card)', borderRadius: '0.75rem', border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', width: '130px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Interval</th>
                {DAYS.map((d) => (
                  <th key={d.key} style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customSlots.map((slot) => {
                return (
                  <tr key={slot.period} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem', verticalAlign: 'middle', backgroundColor: 'var(--bg-main)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{slot.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{slot.start} - {slot.end}</div>
                    </td>
                    {DAYS.map((d) => {
                      const entry = entries.find((e) => e.dayOfWeek === d.key && e.period === slot.period);
                      return (
                        <td key={d.key} style={{ padding: '0.5rem', verticalAlign: 'top', width: '18%' }}>
                          {entry ? (
                            <div style={{
                              backgroundColor: 'var(--bg-subtle)',
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
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  {entry.startTime} - {entry.endTime}
                                </span>
                                {entry.room && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 500 }}>
                                    {entry.room}
                                  </span>
                                )}
                              </div>
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
                            <button
                              onClick={() => handleOpenSlot(d.key, slot)}
                              style={{
                                width: '100%',
                                height: '58px',
                                border: '1px dashed var(--border)',
                                borderRadius: '0.375rem',
                                background: 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary)';
                                e.currentTarget.style.color = 'var(--primary)';
                                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                              title={`Adaugă oră: ${d.label}, ${slot.label} (${slot.start} - ${slot.end})`}
                            >
                              <Plus size={14} /> Adaugă
                            </button>
                          ) : (
                            <div style={{ height: '58px', border: '1px dashed var(--border)', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
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

      {/* Modal Adăugare Oră în Chenar */}
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
            backgroundColor: 'var(--bg-card)',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '440px',
            width: '90%',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Adaugă oră în orar
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500, marginBottom: '1rem', backgroundColor: 'var(--bg-hover)', padding: '0.5rem 0.75rem', borderRadius: '0.375rem' }}>
              {DAYS.find(d => d.key === targetDay)?.label} • Ora {targetPeriod}
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
                    <option key={s.id} value={s.id}>{s.name}</option>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Ora început (24h)</label>
                  <TimePicker24
                    value={formStartTime}
                    onChange={setFormStartTime}
                  />
                </div>
                <div>
                  <label className="label">Ora sfârșit (24h)</label>
                  <TimePicker24
                    value={formEndTime}
                    onChange={setFormEndTime}
                  />
                </div>
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

      {/* Modal Configurare Intervale & Schimb (Dimineață / După-amiază) */}
      {showConfigModal && (
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
            backgroundColor: 'var(--bg-card)',
            borderRadius: '0.75rem',
            padding: '1.75rem',
            maxWidth: '560px',
            width: '90%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Configurare Intervale Orare & Schimburi
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Alege un schimb prestabilit sau adaugă/șterge ore individuale cu orice interval (ex: 07:30 - 20:30).
              </p>
            </div>

            {/* Presets rapide */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="btn btn-outline"
                style={{ fontSize: '0.8rem' }}
                onClick={() => applyPreset('MORNING')}
              >
                Preset: Cursuri de Dimineață (08:00 - 14:50)
              </button>
              <button 
                type="button" 
                className="btn btn-outline"
                style={{ fontSize: '0.8rem' }}
                onClick={() => applyPreset('AFTERNOON')}
              >
                Preset: Cursuri de După-amiază (13:00 - 19:50)
              </button>
            </div>

            {/* Lista orelor curente din tabel */}
            <div style={{ overflowY: 'auto', maxHeight: '240px', border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Denumire</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Început</th>
                    <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>Sfârșit</th>
                    <th style={{ padding: '0.5rem 0.75rem', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {customSlots.map((s) => (
                    <tr key={s.period} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600, fontSize: '0.85rem' }}>{s.label}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>{s.start}</td>
                      <td style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>{s.end}</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(s.period)}
                          title="Elimină acest rând de oră"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Adăugare slot nou personalizat */}
            <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-main)', padding: '0.875rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Adaugă un rând de oră personalizat:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr auto', gap: '0.5rem', alignItems: 'end' }}>
                <div>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Etichetă</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ex: Ora 8"
                    value={newSlotLabel}
                    onChange={(e) => setNewSlotLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Început (24h)</label>
                  <TimePicker24
                    value={newSlotStart}
                    onChange={setNewSlotStart}
                  />
                </div>
                <div>
                  <label className="label" style={{ fontSize: '0.75rem' }}>Sfârșit (24h)</label>
                  <TimePicker24
                    value={newSlotEnd}
                    onChange={setNewSlotEnd}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem' }}>
                  <Plus size={16} /> Adaugă
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => setShowConfigModal(false)}
              >
                Gata / Aplică în Orar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
