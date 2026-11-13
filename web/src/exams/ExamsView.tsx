import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Exam, Group } from '../api/types';
import { AssetIcon } from '../common/AssetIcon';
import { formatDateTime24 } from '../common/dateUtils';
import { ModalPortal } from '../common/ModalPortal';
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Search, BookOpen, AlertCircle } from 'lucide-react';

export const ExamsView: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal Creare Examen / Test
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const groupsList = await apiClient<Group[]>('/api/v1/groups').catch(() => []);
      setGroups(groupsList);
      if (groupsList.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupsList[0].id);
      }

      // Fetch exams from each group and aggregate
      const examArrays = await Promise.all(
        groupsList.map((g) =>
          apiClient<Exam[]>(`/api/v1/groups/${g.id}/exams`).catch(() => [] as Exam[])
        )
      );
      // Deduplicate by exam id
      const examMap = new Map<string, Exam>();
      examArrays.flat().forEach((ex) => examMap.set(ex.id, ex));
      setExams(Array.from(examMap.values()).sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      ));
    } catch (err) {
      console.error('Error loading exams', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedGroupId) return;

    try {
      await apiClient(`/api/v1/groups/${selectedGroupId}/exams`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setScheduledAt('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare la programarea testului');
    }
  };

  const handleCancelExam = async (examId: string) => {
    if (!window.confirm('Sigur doriți să anulați acest examen/test?')) return;
    try {
      await apiClient(`/api/v1/exams/${examId}`, { method: 'DELETE' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Eroare la anularea testului');
    }
  };

  const filteredExams = exams.filter((ex) =>
    ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="bg-danger-subtle" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}>
            <AssetIcon assetKey="exams" fallbackIcon={CalendarIcon} size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Teste & Examene</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Calendarul sesiunilor de evaluare, tezelor și testelor anunțate
            </p>
          </div>
        </div>

        {isTeacherOrAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Programează test
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
            placeholder="Caută după titlu sau detalii..."
            style={{ paddingLeft: '2.25rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Listă Examene */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Se încarcă testele...
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Niciun test sau examen programat în această perioadă.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredExams.map((ex) => (
            <div key={ex.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '4px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>{ex.title}</h3>
                {isTeacherOrAdmin && (
                  <button
                    onClick={() => handleCancelExam(ex.id)}
                    title="Anulează testul"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.75 }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {ex.description && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {ex.description}
                </p>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} /> {formatDateTime24(ex.scheduledAt)}
                </span>
                <span className="badge badge-student" style={{ fontSize: '0.75rem' }}>
                  Programat
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Programare Examen */}
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
            maxWidth: '440px',
            width: '90%',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Programează un test / examen</h2>

            {errorMsg && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">Grup / Materie</label>
                <select
                  className="input"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  required
                >
                  <option value="">Alege grupul</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Titlu test</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Lucrare scrisă semestrială (Teză)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Data și ora susținerii</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Descriere / Materie vizată (opțional)</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Capitole incluse, cerințe..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Anulează
                </button>
                <button type="submit" className="btn btn-primary">
                  Programează
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

