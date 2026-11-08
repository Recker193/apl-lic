import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { 
  Group, 
  GroupMember, 
  Announcement, 
  Assignment, 
  Exam, 
  Material 
} from '../api/types';
import { formatDateTime24 } from '../common/dateUtils';
import { 
  Megaphone, 
  FileText, 
  CheckSquare, 
  FolderDown, 
  Users, 
  Settings, 
  Plus, 
  Pin,
  Upload
} from 'lucide-react';

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState<'announcements' | 'assignments' | 'exams' | 'materials' | 'members' | 'settings'>('announcements');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sub-resource lists
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // Permissions in this group
  const isTeacherOrAdmin = user?.role === 'ADMIN' || group?.teacherId === user?.id;
  const currentMember = members.find((m) => m.userId === user?.id);
  const canPostAnnouncements = isTeacherOrAdmin || Boolean(currentMember?.canPost);

  // Forms / Modals
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announcePinned, setAnnouncePinned] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDesc, setAssignDesc] = useState('');
  const [assignDue, setAssignDue] = useState('');

  const [showExamModal, setShowExamModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDesc, setExamDesc] = useState('');
  const [examDate, setExamDate] = useState('');

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matFile, setMatFile] = useState<File | null>(null);

  // Settings
  const [groupName, setGroupName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    try {
      const g = await apiClient<Group>(`/api/v1/groups/${id}`);
      setGroup(g);
      setGroupName(g.name);

      const m = await apiClient<GroupMember[]>(`/api/v1/groups/${id}/members`);
      setMembers(m);

      const [aData, asData, exData, matData] = await Promise.all([
        apiClient<any>(`/api/v1/groups/${id}/announcements`).catch(() => ({ items: [] })),
        apiClient<Assignment[]>(`/api/v1/groups/${id}/assignments`).catch(() => []),
        apiClient<Exam[]>(`/api/v1/groups/${id}/exams`).catch(() => []),
        apiClient<Material[]>(`/api/v1/groups/${id}/materials`).catch(() => []),
      ]);

      setAnnouncements(aData.items || aData || []);
      setAssignments(asData);
      setExams(exData);
      setMaterials(matData);
    } catch (err: any) {
      setError(err.message || 'Nu s-a putut încărca grupul.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  // Handlers
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/api/v1/groups/${id}/announcements`, {
        method: 'POST',
        body: JSON.stringify({
          title: announceTitle,
          content: announceContent,
          isPinned: announcePinned,
        }),
      });
      setShowAnnounceModal(false);
      setAnnounceTitle('');
      setAnnounceContent('');
      setAnnouncePinned(false);
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/api/v1/groups/${id}/assignments`, {
        method: 'POST',
        body: JSON.stringify({
          title: assignTitle,
          description: assignDesc,
          dueAt: new Date(assignDue).toISOString(),
        }),
      });
      setShowAssignModal(false);
      setAssignTitle('');
      setAssignDesc('');
      setAssignDue('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateProgress = async (assignmentId: string, status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await apiClient(`/api/v1/assignments/${assignmentId}/progress/me`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/api/v1/groups/${id}/exams`, {
        method: 'POST',
        body: JSON.stringify({
          title: examTitle,
          description: examDesc,
          scheduledAt: new Date(examDate).toISOString(),
        }),
      });
      setShowExamModal(false);
      setExamTitle('');
      setExamDesc('');
      setExamDate('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matFile) return;

    try {
      const formData = new FormData();
      formData.append('title', matTitle);
      if (matDesc) formData.append('description', matDesc);
      formData.append('file', matFile);

      await apiClient(`/api/v1/groups/${id}/materials`, {
        method: 'POST',
        body: formData,
      });

      setShowMaterialModal(false);
      setMatTitle('');
      setMatDesc('');
      setMatFile(null);
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleCanPost = async (memberUserId: string, currentVal: boolean) => {
    try {
      await apiClient(`/api/v1/groups/${id}/members/${memberUserId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ canPost: !currentVal }),
      });
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await apiClient(`/api/v1/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: groupName }),
      });
      alert('Grupul a fost actualizat!');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) return <div>Se încarcă detaliile grupului...</div>;
  if (error || !group) return <div className="card" style={{ color: 'var(--danger)' }}>{error || 'Grupul nu a fost găsit.'}</div>;

  return (
    <div>
      {/* Header Grup */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{group.name}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Membri înscriși: {members.length} | Rolul tău: {isTeacherOrAdmin ? 'Profesor / Admin' : 'Elev'}
        </p>
      </div>

      {/* Tabs Nav */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('announcements')}
          className="btn"
          style={{
            borderBottom: activeTab === 'announcements' ? '2px solid var(--primary)' : 'none',
            borderRadius: 0,
            color: activeTab === 'announcements' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'announcements' ? 600 : 400,
          }}
        >
          <Megaphone size={16} /> Anunțuri ({announcements.length})
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className="btn"
          style={{
            borderBottom: activeTab === 'assignments' ? '2px solid var(--primary)' : 'none',
            borderRadius: 0,
            color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'assignments' ? 600 : 400,
          }}
        >
          <CheckSquare size={16} /> Teme ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className="btn"
          style={{
            borderBottom: activeTab === 'exams' ? '2px solid var(--primary)' : 'none',
            borderRadius: 0,
            color: activeTab === 'exams' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'exams' ? 600 : 400,
          }}
        >
          <FileText size={16} /> Teste / Examene ({exams.length})
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className="btn"
          style={{
            borderBottom: activeTab === 'materials' ? '2px solid var(--primary)' : 'none',
            borderRadius: 0,
            color: activeTab === 'materials' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'materials' ? 600 : 400,
          }}
        >
          <FolderDown size={16} /> Materiale ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className="btn"
          style={{
            borderBottom: activeTab === 'members' ? '2px solid var(--primary)' : 'none',
            borderRadius: 0,
            color: activeTab === 'members' ? 'var(--primary)' : 'var(--text-main)',
            fontWeight: activeTab === 'members' ? 600 : 400,
          }}
        >
          <Users size={16} /> Membri ({members.length})
        </button>

        {isTeacherOrAdmin && (
          <button
            onClick={() => setActiveTab('settings')}
            className="btn"
            style={{
              borderBottom: activeTab === 'settings' ? '2px solid var(--primary)' : 'none',
              borderRadius: 0,
              color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: activeTab === 'settings' ? 600 : 400,
            }}
          >
            <Settings size={16} /> Setări
          </button>
        )}
      </div>

      {/* TAB 1: ANUNTURI */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {canPostAnnouncements && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={() => setShowAnnounceModal(true)} className="btn btn-primary">
                <Plus size={16} /> Adaugă anunț
              </button>
            </div>
          )}

          {showAnnounceModal && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Anunț nou</h3>
              <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Titlul anunțului"
                  className="input-field"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Conținutul anunțului..."
                  className="input-field"
                  value={announceContent}
                  onChange={(e) => setAnnounceContent(e.target.value)}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={announcePinned}
                    onChange={(e) => setAnnouncePinned(e.target.checked)}
                  />
                  Fixează în partea de sus a listei (Pin)
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowAnnounceModal(false)} className="btn btn-outline">
                    Anulează
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Publică anunțul
                  </button>
                </div>
              </form>
            </div>
          )}

          {announcements.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nu există niciun anunț publicat în acest grup.
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="card" style={{ borderColor: a.isPinned ? 'var(--primary)' : 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {a.isPinned && <Pin size={16} color="var(--primary)" />}
                    {a.title}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ whiteSpace: 'pre-line', fontSize: '0.875rem', color: '#334155' }}>{a.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: TEME */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isTeacherOrAdmin && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={() => setShowAssignModal(true)} className="btn btn-primary">
                <Plus size={16} /> Temă nouă
              </button>
            </div>
          )}

          {showAssignModal && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Creare temă</h3>
              <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Titlu temă"
                  className="input-field"
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                />
                <textarea
                  required
                  rows={3}
                  placeholder="Cerințe și instrucțiuni..."
                  className="input-field"
                  value={assignDesc}
                  onChange={(e) => setAssignDesc(e.target.value)}
                />
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Termen limită</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={assignDue}
                    onChange={(e) => setAssignDue(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-outline">
                    Anulează
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Salvează tema
                  </button>
                </div>
              </form>
            </div>
          )}

          {assignments.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nu sunt teme în lucru pentru acest grup.
            </div>
          ) : (
            assignments.map((as) => (
              <div key={as.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{as.title}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Termen limită: {formatDateTime24(as.dueAt)}
                    </p>
                  </div>

                  {user?.role === 'STUDENT' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progres personal:</span>
                      <select
                        className="input-field"
                        style={{ width: 'auto', padding: '0.25rem 0.5rem' }}
                        value={as.progress?.status || 'TODO'}
                        onChange={(e) => handleUpdateProgress(as.id, e.target.value as any)}
                      >
                        <option value="TODO">De făcut</option>
                        <option value="IN_PROGRESS">În lucru</option>
                        <option value="COMPLETED">Finalizată</option>
                      </select>
                    </div>
                  )}
                </div>
                <p style={{ whiteSpace: 'pre-line', fontSize: '0.875rem', color: '#334155' }}>{as.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: TESTE / EXAMENE */}
      {activeTab === 'exams' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isTeacherOrAdmin && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={() => setShowExamModal(true)} className="btn btn-primary">
                <Plus size={16} /> Programează test
              </button>
            </div>
          )}

          {showExamModal && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Programare test</h3>
              <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Denumire test (ex: Teză semestrială)"
                  className="input-field"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                />
                <textarea
                  rows={2}
                  placeholder="Materie evaluată sau instrucțiuni..."
                  className="input-field"
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                />
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Data și ora susținerii</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowExamModal(false)} className="btn btn-outline">
                    Anulează
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Programează
                  </button>
                </div>
              </form>
            </div>
          )}

          {exams.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nu există teste programate.
            </div>
          ) : (
            exams.map((ex) => (
              <div key={ex.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{ex.title}</h3>
                  <span className={`badge ${ex.status === 'CANCELLED' ? 'badge-admin' : 'badge-teacher'}`}>
                    {ex.status === 'CANCELLED' ? 'Anulat' : 'Programat'}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                  Data: {formatDateTime24(ex.scheduledAt)}
                </p>
                {ex.description && <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{ex.description}</p>}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: MATERIALE DIDACTICE */}
      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isTeacherOrAdmin && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button onClick={() => setShowMaterialModal(true)} className="btn btn-primary">
                <Upload size={16} /> Încarcă material
              </button>
            </div>
          )}

          {showMaterialModal && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Încărcare material didactic</h3>
              <form onSubmit={handleUploadMaterial} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  required
                  placeholder="Titlu material (ex: Sinteză Capitol 1)"
                  className="input-field"
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Descriere opțională..."
                  className="input-field"
                  value={matDesc}
                  onChange={(e) => setMatDesc(e.target.value)}
                />
                <input
                  type="file"
                  required
                  className="input-field"
                  onChange={(e) => setMatFile(e.target.files?.[0] || null)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setShowMaterialModal(false)} className="btn btn-outline">
                    Anulează
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Încarcă fișierul
                  </button>
                </div>
              </form>
            </div>
          )}

          {materials.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Nu au fost încărcate materiale didactice.
            </div>
          ) : (
            materials.map((m) => (
              <div key={m.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{m.title}</h3>
                  {m.description && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{m.description}</p>}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Fișier: {m.fileName} ({Math.round(m.fileSize / 1024)} KB)
                  </p>
                </div>
                <a
                  href={`/api/v1/materials/${m.id}/file`}
                  className="btn btn-outline"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FolderDown size={16} /> Descarcă
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: MEMBRI */}
      {activeTab === 'members' && (
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Membrii grupului</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>
                    {m.user.firstName} {m.user.lastName}
                  </span>
                  <span className={`badge badge-${m.user.role.toLowerCase()}`} style={{ marginLeft: '0.5rem' }}>
                    {m.user.role}
                  </span>
                </div>

                {isTeacherOrAdmin && m.user.role === 'STUDENT' && (
                  <button
                    onClick={() => handleToggleCanPost(m.userId, m.canPost)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    {m.canPost ? 'Poate posta (Revocă)' : 'Doar citire (Permite postare)'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SETARI */}
      {activeTab === 'settings' && isTeacherOrAdmin && (
        <div className="card" style={{ maxWidth: '500px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Setări grup</h3>
          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Nume grup
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <button type="submit" disabled={savingSettings} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              {savingSettings ? 'Se salvează...' : 'Salvează modificările'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

