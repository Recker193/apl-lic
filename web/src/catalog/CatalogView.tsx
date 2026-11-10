import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { 
  Group, 
  Term, 
  GradeEntry, 
  AbsenceEntry, 
  GroupMember,
  User,
  Subject
} from '../api/types';
import { 
  GraduationCap, 
  Award, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  XCircle,
  FileSpreadsheet,
  Printer,
  Trash2,
  Calendar,
  Search,
  BookOpen
} from 'lucide-react';
import { AssetIcon } from '../common/AssetIcon';

export const CatalogView: React.FC = () => {
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // Lista globală de elevi din școală (pentru dropdown & administrare)
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');

  // Date
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [absences, setAbsences] = useState<AbsenceEntry[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state (Adăugare Notă)
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [gradeValue, setGradeValue] = useState<number>(10);
  const [gradeType, setGradeType] = useState<string>('TEST');
  const [gradeComment, setGradeComment] = useState('');

  // Modal / Form state (Adăugare Absență - cu Materie)
  const [showAddAbsence, setShowAddAbsence] = useState(false);
  const [absenceStudentId, setAbsenceStudentId] = useState('');
  const [absenceGroupId, setAbsenceGroupId] = useState('');
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // Inițializare trimestre, grupuri și elevi
  useEffect(() => {
    const init = async () => {
      try {
        const [termsList, groupsList, studentsList] = await Promise.all([
          apiClient<Term[]>('/api/v1/terms').catch(() => []),
          apiClient<Group[]>('/api/v1/groups').catch(() => []),
          isTeacherOrAdmin ? apiClient<User[]>('/api/v1/users?role=STUDENT').catch(() => []) : Promise.resolve([]),
        ]);
        setTerms(termsList);
        if (termsList.length > 0) {
          const openTerm = termsList.find((t) => t.status === 'OPEN') || termsList[0];
          setSelectedTermId(openTerm.id);
        }
        setGroups(groupsList);
        if (groupsList.length > 0) {
          setSelectedGroupId(groupsList[0].id);
        }
        setAllStudents(studentsList);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isTeacherOrAdmin]);

  // Încărcare date catalog
  const loadCatalogData = async () => {
    if (!user) return;
    try {
      const queryTerm = selectedTermId ? `?termId=${selectedTermId}` : '';
      if (user.role === 'STUDENT') {
        const [myGrades, myAbsences] = await Promise.all([
          apiClient<GradeEntry[]>(`/api/v1/students/${user.id}/grades${queryTerm}`).catch(() => []),
          apiClient<AbsenceEntry[]>(`/api/v1/students/${user.id}/absences${queryTerm}`).catch(() => []),
        ]);
        setGrades(myGrades);
        setAbsences(myAbsences);
      } else {
        // Dacă este ales un elev specific din dropdown
        if (selectedStudentFilter !== 'ALL') {
          const [sGrades, sAbsences] = await Promise.all([
            apiClient<GradeEntry[]>(`/api/v1/students/${selectedStudentFilter}/grades${queryTerm}`).catch(() => []),
            apiClient<AbsenceEntry[]>(`/api/v1/students/${selectedStudentFilter}/absences${queryTerm}`).catch(() => []),
          ]);
          setGrades(sGrades);
          setAbsences(sAbsences);
        } else if (selectedGroupId) {
          const [groupGrades, groupAbsences, members] = await Promise.all([
            apiClient<GradeEntry[]>(`/api/v1/groups/${selectedGroupId}/grades${queryTerm}`).catch(() => []),
            apiClient<AbsenceEntry[]>(`/api/v1/groups/${selectedGroupId}/absences${queryTerm}`).catch(() => []),
            apiClient<GroupMember[]>(`/api/v1/groups/${selectedGroupId}/members`).catch(() => []),
          ]);
          setGrades(groupGrades);
          setAbsences(groupAbsences);
          setGroupMembers(members.filter((m) => m.membershipRole === 'STUDENT'));
        }
      }
    } catch (e) {
      console.error('Error fetching catalog data', e);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, [selectedGroupId, selectedTermId, selectedStudentFilter, user?.role]);

  // Handler Adăugare Notă
  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    const gId = targetGroupId || selectedGroupId;
    if (!gId || !targetStudentId) return;

    try {
      await apiClient(`/api/v1/groups/${gId}/grades`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: targetStudentId,
          termId: selectedTermId,
          value: Number(gradeValue),
          type: gradeType,
          comment: gradeComment || undefined,
          gradedAt: new Date().toISOString(),
        }),
      });
      setShowAddGrade(false);
      setGradeComment('');
      loadCatalogData();
    } catch (err: any) {
      alert(err.message || 'Eroare la adăugarea notei');
    }
  };

  // Handler Anulare / Ștergere Notă
  const handleVoidGrade = async (gradeId: string) => {
    const reason = prompt('Motivul anulării notei:');
    if (!reason) return;
    try {
      await apiClient(`/api/v1/grades/${gradeId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });
      loadCatalogData();
    } catch (err: any) {
      alert(err.message || 'Eroare la anularea notei');
    }
  };

  // Handler Adăugare Absență (asociată cu o materie/grup)
  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceStudentId) return;

    try {
      await apiClient('/api/v1/absences', {
        method: 'POST',
        body: JSON.stringify({
          studentId: absenceStudentId,
          groupId: absenceGroupId || undefined,
          date: new Date(absenceDate).toISOString(),
        }),
      });
      setShowAddAbsence(false);
      loadCatalogData();
    } catch (err: any) {
      alert(err.message || 'Eroare la înregistrarea absenței');
    }
  };

  // Handler Motivare Absență
  const handleExcuseAbsence = async (absenceId: string) => {
    const reason = prompt('Motivul motivării (ex: Scutire medicală):');
    if (!reason) return;

    try {
      await apiClient(`/api/v1/absences/${absenceId}/excuse`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      loadCatalogData();
    } catch (err: any) {
      alert(err.message || 'Eroare la motivarea absenței');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calcule statistice
  const averageGrade = grades.length > 0 
    ? (grades.reduce((acc, curr) => acc + curr.value, 0) / grades.length).toFixed(2)
    : '-';
  const unexcusedCount = absences.filter((a) => a.status === 'UNEXCUSED').length;
  const excusedCount = absences.filter((a) => a.status === 'EXCUSED').length;

  const [activeCatalogTab, setActiveCatalogTab] = useState<'note' | 'sumar' | 'observatii' | 'mesagerie' | 'motivari'>('note');

  // Calculează datele dinamice per materie/grup
  const subjectData = groups.map((group) => {
    const groupGrades = grades.filter((g) => g.group?.id === group.id);
    const groupAbsences = absences.filter((a) => a.group?.id === group.id);
    const average = groupGrades.length > 0 
      ? (groupGrades.reduce((acc, g) => acc + g.value, 0) / groupGrades.length).toFixed(1)
      : '-';
    const unexcused = groupAbsences.filter((a) => a.status === 'UNEXCUSED').length;
    const excused = groupAbsences.filter((a) => a.status === 'EXCUSED').length;

    return {
      name: group.subject?.name || group.name,
      teacher: group.teacher ? `${group.teacher.lastName || ''} ${group.teacher.firstName || ''}`.trim().toUpperCase() : 'N/A',
      notes: groupGrades.map((g) => `${g.value} / ${new Date(g.gradedAt).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })}`),
      absences: groupAbsences.map((a) => `${new Date(a.date).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })} .`),
      media: average,
      nemotivate: unexcused,
      motivate: excused,
    };
  });

  const studentDisplayName = user?.role === 'STUDENT'
    ? `${user.lastName || ''} ${user.firstName || ''}`.trim().toUpperCase()
    : user ? `${user.lastName || ''} ${user.firstName || ''}`.trim().toUpperCase() : 'UTILIZATOR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header oficial Catalog */}
      <div className="catalog-vianu-header-row">
        <div>
          <h1 className="catalog-student-heading">
            <span>{studentDisplayName}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </h1>
        </div>

        <div className="catalog-top-actions">
          <button type="button" className="catalog-blue-btn">Trimite-ne un mesaj</button>
          <button type="button" className="catalog-blue-btn">Setări SMS/Mail</button>
          <button type="button" className="catalog-blue-btn">Notificare SMS</button>
          <button type="button" className="catalog-blue-btn" onClick={handlePrint}>Descarcă situația școlară (PDF)</button>
        </div>
      </div>

      {/* Tabs Catalog */}
      <div className="catalog-tabs-bar">
        <button 
          type="button" 
          className={`catalog-tab-item ${activeCatalogTab === 'note' ? 'active' : ''}`}
          onClick={() => setActiveCatalogTab('note')}
        >
          Note
        </button>
        <button 
          type="button" 
          className={`catalog-tab-item ${activeCatalogTab === 'sumar' ? 'active' : ''}`}
          onClick={() => setActiveCatalogTab('sumar')}
        >
          Sumar
        </button>
        <button 
          type="button" 
          className={`catalog-tab-item ${activeCatalogTab === 'observatii' ? 'active' : ''}`}
          onClick={() => setActiveCatalogTab('observatii')}
        >
          Observații
        </button>
        <button 
          type="button" 
          className={`catalog-tab-item ${activeCatalogTab === 'mesagerie' ? 'active' : ''}`}
          onClick={() => setActiveCatalogTab('mesagerie')}
        >
          Mesagerie
        </button>
        <button 
          type="button" 
          className={`catalog-tab-item ${activeCatalogTab === 'motivari' ? 'active' : ''}`}
          onClick={() => setActiveCatalogTab('motivari')}
        >
          Motivări
        </button>
      </div>

      {/* Card Grid dinamic pentru materii */}
      <div className="catalog-subjects-grid">
        {subjectData.length > 0 ? subjectData.map((subj, idx) => (
          <div key={idx} className="catalog-card-container">
            <div className="catalog-card-header">
              <h3 className="catalog-card-subject-name">{subj.name}</h3>
              <p className="catalog-card-teacher-name">{subj.teacher}</p>
            </div>
            <div className="catalog-card-subheaders">
              <div>Note</div>
              <div>Absențe</div>
            </div>
            <div className="catalog-card-body">
              <div className="catalog-card-notes-col">
                {subj.notes.map((n, i) => (
                  <div key={i}>{n}</div>
                ))}
              </div>
              <div className="catalog-card-absences-col">
                {subj.absences.map((a, i) => (
                  <div key={i}>{a}</div>
                ))}
              </div>
            </div>
            <div className="catalog-card-footer">
              <span className="catalog-footer-media">Media: {subj.media}</span>
              <div className="catalog-footer-abs-stats">
                <span className="catalog-footer-unexcused">Nemotivate: {subj.nemotivate}</span>
                <span className="catalog-footer-excused">Motivate: {subj.motivate}</span>
                <span className="catalog-footer-total">Totale: {subj.nemotivate + subj.motivate}</span>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Nu există materii înregistrate. Profesorii vor adăuga materii și note în curând.
          </div>
        )}
      </div>

      {/* Panou suplimentar interactiv pentru profesori & adăugare note */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--text-main)' }}>
          Panou Tehnic & Înregistrare Note
        </h2>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={handlePrint} title="Tipărește situația">
            <Printer size={16} /> Printează
          </button>

          {/* Selector Trimestru */}
          <select 
            className="input" 
            style={{ width: 'auto', minWidth: '130px' }}
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                Modulul {t.number} ({t.status === 'OPEN' ? 'Activ' : 'Închis'})
              </option>
            ))}
          </select>

          {/* Pentru Profesori & Admini: Selector Elev specific sau Grup */}
          {isTeacherOrAdmin && (
            <>
              <select
                className="input"
                style={{ width: 'auto', minWidth: '190px' }}
                value={selectedStudentFilter}
                onChange={(e) => setSelectedStudentFilter(e.target.value)}
              >
                <option value="ALL">Toți elevii (după materie)</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    Elev: {s.lastName} {s.firstName}
                  </option>
                ))}
              </select>

              {selectedStudentFilter === 'ALL' && (
                <select
                  className="input"
                  style={{ width: 'auto', minWidth: '170px' }}
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              )}

              <button 
                className="btn btn-primary"
                onClick={() => {
                  setTargetGroupId(selectedGroupId);
                  setTargetStudentId(selectedStudentFilter !== 'ALL' ? selectedStudentFilter : (groupMembers[0]?.userId || allStudents[0]?.id || ''));
                  setShowAddGrade(true);
                }}
              >
                <Plus size={16} /> Adaugă notă
              </button>

              <button 
                className="btn btn-outline"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={() => {
                  setAbsenceGroupId(selectedGroupId);
                  setAbsenceStudentId(selectedStudentFilter !== 'ALL' ? selectedStudentFilter : (groupMembers[0]?.userId || allStudents[0]?.id || ''));
                  setShowAddAbsence(true);
                }}
              >
                <Plus size={16} /> Pune absență
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="bg-info-subtle" style={{ padding: '0.75rem', borderRadius: '0.5rem' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Media Curentă</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{averageGrade}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="bg-danger-subtle" style={{ padding: '0.75rem', borderRadius: '0.5rem' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Absențe Nemotivate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>{unexcusedCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="bg-success-subtle" style={{ padding: '0.75rem', borderRadius: '0.5rem' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Absențe Motivate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }} className="text-success">{excusedCount}</div>
          </div>
        </div>
      </div>

      {/* Secțiunea Note */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileSpreadsheet size={18} color="var(--primary)" /> Note Înregistrate
        </h2>

        {grades.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Nu sunt note înregistrate pentru filtrul selectat.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }} className="table-row-alt">
                  {isTeacherOrAdmin && <th style={{ padding: '0.75rem' }}>Elev</th>}
                  <th style={{ padding: '0.75rem' }}>Materie</th>
                  <th style={{ padding: '0.75rem' }}>Notă</th>
                  <th style={{ padding: '0.75rem' }}>Tip evaluare</th>
                  <th style={{ padding: '0.75rem' }}>Data</th>
                  <th style={{ padding: '0.75rem' }}>Comentariu</th>
                  {isTeacherOrAdmin && <th style={{ padding: '0.75rem', width: '50px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {isTeacherOrAdmin && (
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                        {g.student ? `${g.student.lastName} ${g.student.firstName}` : '-'}
                      </td>
                    )}
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-teacher" style={{ fontSize: '0.75rem' }}>
                        {g.group?.name || 'Materie'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={g.value >= 5 ? 'grade-badge-pass' : 'grade-badge-fail'} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        fontWeight: 700,
                      }}>
                        {g.value}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {g.type}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      {new Date(g.gradedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {g.comment || '-'}
                    </td>
                    {isTeacherOrAdmin && (
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleVoidGrade(g.id)}
                          title="Anulează nota"
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
          </div>
        )}
      </div>

      {/* Secțiunea Absențe (sortată pe materii) */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} color="var(--danger)" /> Evidență Absențe (Sortată pe Materii)
        </h2>

        {absences.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Nicio absență înregistrată.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }} className="table-row-alt">
                  {isTeacherOrAdmin && <th style={{ padding: '0.75rem' }}>Elev</th>}
                  <th style={{ padding: '0.75rem' }}>Materie / Curs</th>
                  <th style={{ padding: '0.75rem' }}>Data</th>
                  <th style={{ padding: '0.75rem' }}>Stare</th>
                  <th style={{ padding: '0.75rem' }}>Motiv / Detalii</th>
                  {isTeacherOrAdmin && <th style={{ padding: '0.75rem', width: '100px' }}>Acțiuni</th>}
                </tr>
              </thead>
              <tbody>
                {absences.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {isTeacherOrAdmin && (
                      <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                        {a.student ? `${a.student.lastName} ${a.student.firstName}` : '-'}
                      </td>
                    )}
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-student" style={{ fontSize: '0.75rem' }}>
                        <BookOpen size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                        {a.group?.name || 'General / Nemotivată'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                      {new Date(a.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {a.status === 'EXCUSED' ? (
                        <span className="text-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>
                          <CheckCircle2 size={14} /> Motivată
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 500 }}>
                          <XCircle size={14} /> Nemotivată
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {a.excuseReason || '-'}
                    </td>
                    {isTeacherOrAdmin && (
                      <td style={{ padding: '0.75rem' }}>
                        {a.status === 'UNEXCUSED' && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleExcuseAbsence(a.id)}
                          >
                            Motivează
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Adăugare Notă */}
      {showAddGrade && (
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
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '420px',
            width: '90%',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Adaugă Notă</h2>

            <form onSubmit={handleCreateGrade} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">Materie / Grup</label>
                <select
                  className="input"
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  required
                >
                  <option value="">Alege materia</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Elev</label>
                <select
                  className="input"
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  required
                >
                  <option value="">Alege elevul</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.lastName} {s.firstName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="label">Notă (1 - 10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="input"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <label className="label">Tip Notă</label>
                  <select
                    className="input"
                    value={gradeType}
                    onChange={(e) => setGradeType(e.target.value)}
                  >
                    <option value="TEST">Test scris</option>
                    <option value="ORAL">Ascultare orală</option>
                    <option value="HOMEWORK">Temă de casă</option>
                    <option value="PROJECT">Proiect</option>
                    <option value="THESIS">Teză</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Comentariu / Notiță (opțional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Răspuns foarte bun la lecție"
                  value={gradeComment}
                  onChange={(e) => setGradeComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddGrade(false)}
                >
                  Anulează
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvează nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adăugare Absență pe Materie */}
      {showAddAbsence && (
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
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '420px',
            width: '90%',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Înregistrează Absență</h2>

            <form onSubmit={handleCreateAbsence} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">Materie / Disciplină</label>
                <select
                  className="input"
                  value={absenceGroupId}
                  onChange={(e) => setAbsenceGroupId(e.target.value)}
                  required
                >
                  <option value="">Alege materia</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Elev</label>
                <select
                  className="input"
                  value={absenceStudentId}
                  onChange={(e) => setAbsenceStudentId(e.target.value)}
                  required
                >
                  <option value="">Alege elevul</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.lastName} {s.firstName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Data absenței</label>
                <input
                  type="date"
                  className="input"
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddAbsence(false)}
                >
                  Anulează
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Înregistrează
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
