import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Subject } from '../api/types';
import { AssetIcon } from '../common/AssetIcon';
import { BookOpen, Plus, Search, BookMarked, UserCheck } from 'lucide-react';
import { useMobile } from '../common/useMobile';
import { SendMessageModal } from '../common/SendMessageModal';
import { ModalPortal } from '../common/ModalPortal';

export const SubjectsView: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [editSubjectTeacher, setEditSubjectTeacher] = useState<{
    open: boolean;
    subjectId: string;
    subjectName: string;
    groupId?: string;
    currentTeacherId?: string;
  }>({
    open: false,
    subjectId: '',
    subjectName: '',
  });
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [updatingTeacher, setUpdatingTeacher] = useState(false);
  const [messageTarget, setMessageTarget] = useState<{
    open: boolean;
    recipientName: string;
    recipientEmail?: string;
    contextTitle: string;
  }>({
    open: false,
    recipientName: '',
    contextTitle: '',
  });

  const isAdmin = user?.role === 'ADMIN';

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const [subjectsData, teachersData] = await Promise.all([
        apiClient<Subject[]>('/api/v1/subjects'),
        apiClient<any[]>('/api/v1/users/teachers').catch(() => []),
      ]);
      setSubjects(subjectsData);
      setTeachersList(teachersData);
    } catch (err) {
      console.error('Error fetching subjects and teachers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await apiClient('/api/v1/subjects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setShowAddModal(false);
      setName('');
      fetchSubjects();
    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare la crearea materiei');
    }
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;
    setUpdatingTeacher(true);
    try {
      if (editSubjectTeacher.groupId) {
        // Actualizăm profesorul titular al grupului de studiu
        await apiClient(`/api/v1/groups/${editSubjectTeacher.groupId}`, {
          method: 'PATCH',
          body: JSON.stringify({ teacherId: selectedTeacherId }),
        });
      } else {
        // Dacă materia nu are încă grupuri create, creăm un grup asociat primei clase sau general
        const classes = await apiClient<any[]>('/api/v1/classes').catch(() => []);
        if (classes.length > 0) {
          await apiClient('/api/v1/groups', {
            method: 'POST',
            body: JSON.stringify({
              subjectId: editSubjectTeacher.subjectId,
              classId: classes[0].id,
              name: `${editSubjectTeacher.subjectName} - ${classes[0].name}`,
              teacherId: selectedTeacherId,
            }),
          });
        }
      }
      setEditSubjectTeacher({ open: false, subjectId: '', subjectName: '' });
      fetchSubjects();
      alert('Profesorul a fost actualizat cu succes pentru această materie!');
    } catch (err: any) {
      alert(err.message || 'Eroare la actualizarea profesorului');
    } finally {
      setUpdatingTeacher(false);
    }
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="mobile-page-title">Materii</h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Disciplinele de studiu predate în unitatea de învățământ
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Adaugă materie
          </button>
        )}
      </div>

      {/* Căutare — stil mobil (search bar proeminent) */}
      <div className="mobile-search-bar-wrap">
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
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

      {/* Grid Materii */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Se încarcă materiile și corpul profesoral...
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nu a fost găsită nicio materie.
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((s) => {
            const relevantTeacher =
              s.groups?.find((g) => user?.class?.id && g.classId === user.class.id)?.teacher ||
              s.groups?.[0]?.teacher;
            const teacherName = relevantTeacher
              ? `Prof. ${relevantTeacher.firstName} ${relevantTeacher.lastName}`
              : 'Profesor titular asignat';

            return (
              <div key={s.id} className="mobile-subject-card">
                <div className="mobile-subject-info">
                  <h3 className="mobile-subject-title">{s.name}</h3>
                  <p className="mobile-subject-teacher">
                    {teacherName}
                  </p>
                </div>

                <div className="mobile-subject-actions">
                  {isAdmin && (
                    <button
                      type="button"
                      className="mobile-subject-action-btn"
                      title="Schimbă profesorul materiei"
                      aria-label="Schimbă profesorul"
                      onClick={() => {
                        setSelectedTeacherId(relevantTeacher?.id || (teachersList[0]?.id || ''));
                        setEditSubjectTeacher({
                          open: true,
                          subjectId: s.id,
                          subjectName: s.name,
                          groupId: s.groups?.[0]?.id,
                          currentTeacherId: relevantTeacher?.id,
                        });
                      }}
                    >
                      <UserCheck size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="mobile-subject-action-btn"
                    title={`Trimite mesaj către ${teacherName}`}
                    aria-label="Mesaje"
                    onClick={() =>
                      setMessageTarget({
                        open: true,
                        recipientName: teacherName,
                        recipientEmail: relevantTeacher?.email,
                        contextTitle: `Mesaj pentru ${s.name}`,
                      })
                    }
                  >
                    <img src="/action-chat.png" alt="Mesaje" className="mobile-subject-action-icon" />
                  </button>
                  <button type="button" className="mobile-subject-action-btn" title="Dosare & Resurse" aria-label="Dosare">
                    <img src="/action-files.png" alt="Dosare" className="mobile-subject-action-icon" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((s) => {
            const relevantTeacher =
              s.groups?.find((g) => user?.class?.id && g.classId === user.class.id)?.teacher ||
              s.groups?.[0]?.teacher;
            const teacherName = relevantTeacher
              ? `Prof. ${relevantTeacher.firstName} ${relevantTeacher.lastName}`
              : 'Cadru didactic asignat';

            return (
              <div
                key={s.id}
                className="card card-interactive"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: 1 }}>
                  <div
                    className="bg-accent-blue"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BookMarked size={22} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserCheck size={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {teacherName}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {isAdmin && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                      title="Schimbă profesorul titular al materiei"
                      onClick={() => {
                        setSelectedTeacherId(relevantTeacher?.id || (teachersList[0]?.id || ''));
                        setEditSubjectTeacher({
                          open: true,
                          subjectId: s.id,
                          subjectName: s.name,
                          groupId: s.groups?.[0]?.id,
                          currentTeacherId: relevantTeacher?.id,
                        });
                      }}
                    >
                      <UserCheck size={15} />
                      <span>Schimbă prof.</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    title={`Trimite mesaj către ${teacherName}`}
                    onClick={() =>
                      setMessageTarget({
                        open: true,
                        recipientName: teacherName,
                        recipientEmail: relevantTeacher?.email,
                        contextTitle: `Mesaj pentru ${s.name}`,
                      })
                    }
                  >
                    <img src="/action-chat.png" alt="Mesaj" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <span>Mesaj</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Trimitere Mesaj non-anonim */}
      <SendMessageModal
        isOpen={messageTarget.open}
        onClose={() => setMessageTarget((prev) => ({ ...prev, open: false }))}
        defaultRecipientName={messageTarget.recipientName}
        defaultRecipientEmail={messageTarget.recipientEmail}
        contextTitle={messageTarget.contextTitle}
      />

      {/* Modal Adăugare Materie */}
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Adaugă o nouă materie</h2>

            {errorMsg && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Nume materie</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Matematică, Limba Română, Fizică"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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

