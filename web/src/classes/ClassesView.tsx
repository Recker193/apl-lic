import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { SchoolClass, User } from '../api/types';
import { AssetIcon } from '../common/AssetIcon';
import { ModalPortal } from '../common/ModalPortal';
import { List, Plus, Users, Calendar, Search, Trash2, UserPlus, X } from 'lucide-react';

interface ClassWithMembers extends SchoolClass {
  memberships?: Array<{
    id: string;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

export const ClassesView: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal creare clasă
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [schoolYear, setSchoolYear] = useState<string>('2026-2027');
  
  // Drawer / Detalii clasă & gestiune elevi
  const [selectedClass, setSelectedClass] = useState<ClassWithMembers | null>(null);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [studentToAdd, setStudentToAdd] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const canManage = isAdmin || isTeacher;

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await apiClient<SchoolClass[]>('/api/v1/classes');
      setClasses(data);
    } catch (err) {
      console.error('Error fetching classes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const openClassDetails = async (c: SchoolClass) => {
    setLoadingMembers(true);
    setErrorMsg('');
    try {
      const [fullClass, students] = await Promise.all([
        apiClient<ClassWithMembers>(`/api/v1/classes/${c.id}`),
        canManage ? apiClient<User[]>('/api/v1/users?role=STUDENT').catch(() => []) : Promise.resolve([]),
      ]);
      setSelectedClass(fullClass);
      setAllStudents(students);
      if (students.length > 0) {
        setStudentToAdd(students[0].id);
      }
    } catch (err: any) {
      alert(err.message || 'Eroare la încărcarea detaliilor clasei');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !studentToAdd) return;
    try {
      await apiClient(`/api/v1/classes/${selectedClass.id}/students`, {
        method: 'POST',
        body: JSON.stringify({ studentId: studentToAdd }),
      });
      // Refresh class details
      const updated = await apiClient<ClassWithMembers>(`/api/v1/classes/${selectedClass.id}`);
      setSelectedClass(updated);
    } catch (err: any) {
      alert(err.message || 'Eroare la adăugarea elevului');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    if (!window.confirm('Sigur doriți să eliminați acest elev din clasă?')) return;
    try {
      await apiClient(`/api/v1/classes/${selectedClass.id}/students/${studentId}`, {
        method: 'DELETE',
      });
      const updated = await apiClient<ClassWithMembers>(`/api/v1/classes/${selectedClass.id}`);
      setSelectedClass(updated);
    } catch (err: any) {
      alert(err.message || 'Eroare la eliminarea elevului');
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await apiClient('/api/v1/classes', {
        method: 'POST',
        body: JSON.stringify({ name, schoolYear }),
      });
      setShowAddModal(false);
      setName('');
      fetchClasses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare la crearea clasei');
    }
  };

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.schoolYear.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="bg-accent-blue" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}>
            <AssetIcon assetKey="classes" fallbackIcon={List} size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Clase Școlare</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Gestionarea claselor și a efectivelor de elevi
            </p>
          </div>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Adaugă clasă
          </button>
        )}
      </div>

      {/* Căutare */}
      <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input"
            placeholder="Caută clasă sau an școlar..."
            style={{ paddingLeft: '2.25rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista Claselor */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Se încarcă clasele...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nu a fost găsită nicio clasă.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              className="card"
              onClick={() => openClassDetails(c)}
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--primary)' }}>
                    Clasa {c.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Calendar size={13} /> An școlar: {c.schoolYear}
                  </span>
                </div>
                <div className="bg-accent-blue" style={{ padding: '0.35rem', borderRadius: '0.375rem' }}>
                  <Users size={18} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click pentru lista de elevi</span>
                <span className="badge badge-teacher" style={{ fontSize: '0.7rem' }}>Deschide</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer / Modal Elevi în Clasă */}
      {selectedClass && (
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
        }}>
          <div className="modal-inner" style={{
            padding: '1.75rem',
            maxWidth: '580px',
            width: '90%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
                  Elevi - Clasa {selectedClass.name}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  An școlar {selectedClass.schoolYear} • Total înscriși: {selectedClass.memberships?.length || 0}
                </div>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Adăugare elev în clasă (Profesor / Admin) */}
            {canManage && (
              <form onSubmit={handleAddStudent} style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: '0.5rem', alignItems: 'center' }}>
                <select
                  className="input"
                  style={{ flex: 1 }}
                  value={studentToAdd}
                  onChange={(e) => setStudentToAdd(e.target.value)}
                >
                  <option value="">Alege un elev existent...</option>
                  {allStudents
                    .filter(s => !selectedClass.memberships?.some(m => m.student.id === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.lastName} {s.firstName} ({s.email})
                      </option>
                    ))}
                </select>
                <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }} disabled={!studentToAdd}>
                  <UserPlus size={15} /> Înscrie
                </button>
              </form>
            )}

            {/* Lista de elevi */}
            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid var(--border)', borderRadius: '0.5rem' }}>
              {!selectedClass.memberships || selectedClass.memberships.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Nu există încă elevi înscriși în această clasă.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }} className="table-row-alt">
                      <th style={{ padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>#</th>
                      <th style={{ padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Elev</th>
                      <th style={{ padding: '0.625rem 0.875rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Email</th>
                      {canManage && <th style={{ padding: '0.625rem 0.875rem', width: '50px' }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClass.memberships.map((m, idx) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600, fontSize: '0.9rem' }}>
                          {m.student.lastName} {m.student.firstName}
                        </td>
                        <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {m.student.email}
                        </td>
                        {canManage && (
                          <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleRemoveStudent(m.student.id)}
                              title="Elimină din clasă"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setSelectedClass(null)}>
                Închide
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* Modal Creare Clasă (Admin) */}
      {showAddModal && (
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
        }}>
          <div className="modal-inner" style={{
            padding: '1.5rem',
            maxWidth: '420px',
            width: '90%',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Creează clasă nouă</h2>

            {errorMsg && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Nume clasă</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: 9-A, 11-B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">An școlar</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: 2026-2027"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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
        </ModalPortal>
      )}
    </div>
  );
};
