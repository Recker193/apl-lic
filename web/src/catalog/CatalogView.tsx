import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { 
  Group, 
  Term, 
  GradeEntry, 
  AbsenceEntry, 
  GroupMember 
} from '../api/types';
import { 
  GraduationCap, 
  Award, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import { AssetIcon } from '../common/AssetIcon';

export const CatalogView: React.FC = () => {
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // Data
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [absences, setAbsences] = useState<AbsenceEntry[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state (Profesor)
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [gradeValue, setGradeValue] = useState<number>(10);
  const [gradeType, setGradeType] = useState<string>('TEST');
  const [gradeComment, setGradeComment] = useState('');

  // Absence modal
  const [showAddAbsence, setShowAddAbsence] = useState(false);
  const [absenceDate, setAbsenceDate] = useState(new Date().toISOString().split('T')[0]);

  // Load initial terms and groups
  useEffect(() => {
    const init = async () => {
      try {
        const [termsList, groupsList] = await Promise.all([
          apiClient<Term[]>('/api/v1/terms').catch(() => []),
          apiClient<Group[]>('/api/v1/groups').catch(() => []),
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
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch grades and absences when selection changes
  const loadCatalogData = async () => {
    if (!user) return;
    try {
      if (user.role === 'STUDENT') {
        const queryTerm = selectedTermId ? `?termId=${selectedTermId}` : '';
        const [myGrades, myAbsences] = await Promise.all([
          apiClient<GradeEntry[]>(`/api/v1/students/${user.id}/grades${queryTerm}`).catch(() => []),
          apiClient<AbsenceEntry[]>(`/api/v1/students/${user.id}/absences${queryTerm}`).catch(() => []),
        ]);
        setGrades(myGrades);
        setAbsences(myAbsences);
      } else if (selectedGroupId) {
        const queryTerm = selectedTermId ? `?termId=${selectedTermId}` : '';
        const [groupGrades, groupAbsences, members] = await Promise.all([
          apiClient<GradeEntry[]>(`/api/v1/groups/${selectedGroupId}/grades${queryTerm}`).catch(() => []),
          apiClient<AbsenceEntry[]>(`/api/v1/groups/${selectedGroupId}/absences${queryTerm}`).catch(() => []),
          apiClient<GroupMember[]>(`/api/v1/groups/${selectedGroupId}/members`).catch(() => []),
        ]);
        setGrades(groupGrades);
        setAbsences(groupAbsences);
        setGroupMembers(members.filter((m) => m.membershipRole === 'STUDENT'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, [selectedGroupId, selectedTermId, user?.role]);

  // Handlers for Teacher
  const handleCreateGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedStudentId) return;

    try {
      await apiClient(`/api/v1/groups/${selectedGroupId}/grades`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
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

  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedStudentId) return;

    try {
      await apiClient(`/api/v1/groups/${selectedGroupId}/absences`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
          termId: selectedTermId,
          date: new Date(absenceDate).toISOString(),
        }),
      });
      setShowAddAbsence(false);
      loadCatalogData();
    } catch (err: any) {
      alert(err.message || 'Eroare la înregistrarea absenței');
    }
  };

  const handleExcuseAbsence = async (absenceId: string) => {
    const reason = prompt('Motivul scutirii / motivării:');
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

  if (loading) return <div>Se încarcă catalogul...</div>;

  const isStudent = user?.role === 'STUDENT';
  const averageValue =
    grades.length > 0
      ? (grades.reduce((acc, g) => acc + g.value, 0) / grades.length).toFixed(2)
      : '-';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AssetIcon assetKey="catalog" fallbackIcon={FileSpreadsheet} size={26} style={{ color: 'var(--primary)' }} />
            Catalog Școlar
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isStudent
              ? 'Situația ta școlară: note, teze, medii și absențe'
              : 'Evidența notelor și a prezenței elevilor'}
          </p>
        </div>

        {/* Filters bar */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {terms.length > 0 && (
            <select
              className="input-field"
              style={{ width: 'auto' }}
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  Semestrul / Modulul {t.number} ({t.schoolYear})
                </option>
              ))}
            </select>
          )}

          {!isStudent && groups.length > 0 && (
            <select
              className="input-field"
              style={{ width: 'auto' }}
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
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', color: 'var(--primary)' }}>
            <AssetIcon assetKey="grade" fallbackIcon={Award} size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Medie Note</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{averageValue}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', color: '#16a34a' }}>
            <GraduationCap size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Note</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{grades.length}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', color: '#dc2626' }}>
            <AlertCircle size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Absențe Nemotivate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {absences.filter((a) => a.status === 'UNEXCUSED').length}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar for Teacher */}
      {!isStudent && (
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              if (groupMembers.length > 0) setSelectedStudentId(groupMembers[0].userId);
              setShowAddGrade(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} /> Adaugă Notă
          </button>
          <button
            onClick={() => {
              if (groupMembers.length > 0) setSelectedStudentId(groupMembers[0].userId);
              setShowAddAbsence(true);
            }}
            className="btn btn-outline"
          >
            <Plus size={16} /> Înregistrează Absență
          </button>
        </div>
      )}

      {/* MODAL ADAUGA NOTA */}
      {showAddGrade && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '440px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Adăugare Notă în Catalog</h2>
            <form onSubmit={handleCreateGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Elev</label>
                <select
                  required
                  className="input-field"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {groupMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.firstName} {m.user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Notă (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    className="input-field"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(Number(e.target.value))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Tip Evaluare</label>
                  <select
                    className="input-field"
                    value={gradeType}
                    onChange={(e) => setGradeType(e.target.value)}
                  >
                    <option value="ORAL">Oral</option>
                    <option value="TEST">Lucrare / Test</option>
                    <option value="HOMEWORK">Temă</option>
                    <option value="PROJECT">Proiect</option>
                    <option value="THESIS">Teză</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Comentariu (opțional)</label>
                <input
                  type="text"
                  placeholder="ex: Răspuns foarte bun la tablă"
                  className="input-field"
                  value={gradeComment}
                  onChange={(e) => setGradeComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddGrade(false)} className="btn btn-outline">Anulează</button>
                <button type="submit" className="btn btn-primary">Salvează Nota</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADAUGA ABSENTA */}
      {showAddAbsence && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Înregistrare Absență</h2>
            <form onSubmit={handleCreateAbsence} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Elev</label>
                <select
                  required
                  className="input-field"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {groupMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.firstName} {m.user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Data</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddAbsence(false)} className="btn btn-outline">Anulează</button>
                <button type="submit" className="btn btn-primary">Înregistrează</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 1: NOTE TABEL */}
      <div className="card">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={18} color="var(--primary)" /> Note & Evaluări
        </h2>
        {grades.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
            Nu există note înregistrate pentru selecția curentă.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem' }}>Data</th>
                  {!isStudent && <th style={{ padding: '0.6rem' }}>Elev</th>}
                  {isStudent && <th style={{ padding: '0.6rem' }}>Materie</th>}
                  <th style={{ padding: '0.6rem' }}>Tip</th>
                  <th style={{ padding: '0.6rem' }}>Notă</th>
                  <th style={{ padding: '0.6rem' }}>Profesor</th>
                  <th style={{ padding: '0.6rem' }}>Comentariu</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.6rem' }}>{new Date(g.gradedAt).toLocaleDateString('ro-RO')}</td>
                    {!isStudent && (
                      <td style={{ padding: '0.6rem', fontWeight: 500 }}>
                        {g.student ? `${g.student.firstName} ${g.student.lastName}` : '-'}
                      </td>
                    )}
                    {isStudent && (
                      <td style={{ padding: '0.6rem', fontWeight: 500 }}>
                        {g.group?.name || '-'}
                      </td>
                    )}
                    <td style={{ padding: '0.6rem' }}>
                      <span className="badge">{g.type}</span>
                    </td>
                    <td style={{ padding: '0.6rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          fontWeight: 700,
                          backgroundColor: g.value >= 5 ? '#dcfce7' : '#fee2e2',
                          color: g.value >= 5 ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {g.value}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>
                      {g.teacher ? `${g.teacher.firstName} ${g.teacher.lastName}` : '-'}
                    </td>
                    <td style={{ padding: '0.6rem', color: '#475569' }}>{g.comment || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: ABSENTE TABEL */}
      <div className="card">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} color="#dc2626" /> Absențe
        </h2>
        {absences.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
            Nu sunt absențe înregistrate. Felicitări pentru prezență!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem' }}>Data</th>
                  {!isStudent && <th style={{ padding: '0.6rem' }}>Elev</th>}
                  <th style={{ padding: '0.6rem' }}>Materie / Grup</th>
                  <th style={{ padding: '0.6rem' }}>Stare</th>
                  <th style={{ padding: '0.6rem' }}>Motiv</th>
                  {!isStudent && <th style={{ padding: '0.6rem' }}>Acțiuni</th>}
                </tr>
              </thead>
              <tbody>
                {absences.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.6rem' }}>{new Date(a.date).toLocaleDateString('ro-RO')}</td>
                    {!isStudent && (
                      <td style={{ padding: '0.6rem', fontWeight: 500 }}>
                        {a.student ? `${a.student.firstName} ${a.student.lastName}` : '-'}
                      </td>
                    )}
                    <td style={{ padding: '0.6rem' }}>{a.group?.name || 'Toată ziua'}</td>
                    <td style={{ padding: '0.6rem' }}>
                      {a.status === 'EXCUSED' ? (
                        <span className="badge" style={{ backgroundColor: '#dcfce7', color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={12} /> Motivată
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <XCircle size={12} /> Nemotivată
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem', color: '#475569' }}>{a.excuseReason || '-'}</td>
                    {!isStudent && (
                      <td style={{ padding: '0.6rem' }}>
                        {a.status === 'UNEXCUSED' && (
                          <button
                            onClick={() => handleExcuseAbsence(a.id)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
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
    </div>
  );
};

