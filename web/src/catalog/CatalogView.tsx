import React, { useEffect, useState, useMemo } from 'react';
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
import { SubjectEvolutionModal } from './SubjectEvolutionModal';
import { SendMessageModal } from '../common/SendMessageModal';
import { ModalPortal } from '../common/ModalPortal';
import { ReasonPromptModal } from '../common/ReasonPromptModal';

export const CatalogView: React.FC = () => {
  const { user } = useAuth();
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // Lista globală de elevi din școală (pentru dropdown & administrare)
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
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
  const [showSendMessage, setShowSendMessage] = useState(false);

  // Dialog pentru motivul anulării notei / motivării absenței
  const [reasonDialog, setReasonDialog] = useState<{
    kind: 'void-grade' | 'excuse-absence';
    id: string;
  } | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [reasonBusy, setReasonBusy] = useState(false);

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  // ── Profesor view: selector clasă ──────────────────────────────────────────
  // "Clasă" = un grup unic de tip clasă (dedus din groups: grupele cu același class)
  // Păstrăm: selectedClassFilter (className string) + selectedSubjectGroupId
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedSubjectGroupId, setSelectedSubjectGroupId] = useState<string>('');
  // Note rapide per elev (mini-modal inline)
  const [quickGradeStudent, setQuickGradeStudent] = useState<{ id: string; name: string } | null>(null);
  const [quickGradeGroupId, setQuickGradeGroupId] = useState<string>('');
  const [quickGradeValue, setQuickGradeValue] = useState<number>(10);
  const [quickGradeType, setQuickGradeType] = useState<string>('TEST');
  const [quickGradeComment, setQuickGradeComment] = useState<string>('');
  const [quickGradeBusy, setQuickGradeBusy] = useState(false);
  // Absență rapidă
  const [quickAbsStudent, setQuickAbsStudent] = useState<{ id: string; name: string } | null>(null);
  const [quickAbsDate, setQuickAbsDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickAbsBusy, setQuickAbsBusy] = useState(false);

  useEffect(() => {
    if (showAddGrade || showAddAbsence) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddGrade, showAddAbsence]);
  useEffect(() => {
    const init = async () => {
      try {
        const [termsList, groupsList, studentsList, subjectsList] = await Promise.all([
          apiClient<Term[]>('/api/v1/terms').catch(() => []),
          apiClient<Group[]>('/api/v1/groups').catch(() => []),
          isTeacherOrAdmin ? apiClient<User[]>('/api/v1/users?role=STUDENT').catch(() => []) : Promise.resolve([]),
          apiClient<Subject[]>('/api/v1/subjects').catch(() => []),
        ]);
        setTerms(termsList);
        if (termsList.length > 0) {
          const openTerm = termsList.find((t) => t.status === 'OPEN') || termsList[0];
          setSelectedTermId(openTerm.id);
        }
        setGroups(groupsList);
        setAllSubjects(subjectsList);
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

  // Handler Anulare / Ștergere Notă (motivul se colectează în modal)
  const handleVoidGrade = (gradeId: string) => {
    setReasonError(null);
    setReasonBusy(false);
    setReasonDialog({ kind: 'void-grade', id: gradeId });
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

  // Handler Motivare Absență (motivul se colectează în modal)
  const handleExcuseAbsence = (absenceId: string) => {
    setReasonError(null);
    setReasonBusy(false);
    setReasonDialog({ kind: 'excuse-absence', id: absenceId });
  };

  const closeReasonDialog = () => {
    setReasonDialog(null);
    setReasonError(null);
    setReasonBusy(false);
  };

  const handleReasonSubmit = async (reason: string) => {
    if (!reasonDialog) return;
    setReasonBusy(true);
    setReasonError(null);

    try {
      if (reasonDialog.kind === 'void-grade') {
        await apiClient(`/api/v1/grades/${reasonDialog.id}`, {
          method: 'DELETE',
          body: JSON.stringify({ reason }),
        });
      } else {
        await apiClient(`/api/v1/absences/${reasonDialog.id}/excuse`, {
          method: 'PATCH',
          body: JSON.stringify({ reason }),
        });
      }
      closeReasonDialog();
      loadCatalogData();
    } catch (err: any) {
      const status = err?.status ? ` (HTTP ${err.status})` : '';
      setReasonError(`${err?.message || 'Operațiunea a eșuat'}${status}`);
      setReasonBusy(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ── Profesor view: clase unice din groups ──────────────────────────────────
  // Fiecare group are `class` (clasa asociată) — extragem clasele unice
  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    groups.forEach((g) => {
      const cls = (g as any).class;
      if (cls && !seen.has(cls.id)) {
        seen.add(cls.id);
        result.push({ id: cls.id, name: cls.name });
      }
    });
    // Fallback: dacă groups nu au class, deduce din allStudents cu class
    if (result.length === 0) {
      allStudents.forEach((s) => {
        const cls = (s as any).class;
        if (cls && !seen.has(cls.id)) {
          seen.add(cls.id);
          result.push({ id: cls.id, name: cls.name });
        }
      });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [groups, allStudents]);

  // Auto-selectează prima clasă disponibilă
  useEffect(() => {
    if (uniqueClasses.length > 0 && !selectedClassFilter) {
      setSelectedClassFilter(uniqueClasses[0].id);
    }
  }, [uniqueClasses]);

  // Grupele din clasa selectată (pentru selector materie)
  const groupsInClass = useMemo(() => {
    if (!selectedClassFilter) return groups;
    return groups.filter((g) => (g as any).class?.id === selectedClassFilter || (g as any).classId === selectedClassFilter);
  }, [groups, selectedClassFilter]);

  // Auto-selectează prima grupă din clasă
  useEffect(() => {
    if (groupsInClass.length > 0) {
      setSelectedSubjectGroupId(groupsInClass[0].id);
    } else {
      setSelectedSubjectGroupId('');
    }
  }, [groupsInClass]);

  // Elevii din clasa selectată
  const studentsInClass = useMemo(() => {
    if (!selectedClassFilter) return allStudents;
    return allStudents.filter((s) => {
      const cls = (s as any).class;
      return cls && (cls.id === selectedClassFilter || cls.name === uniqueClasses.find(c => c.id === selectedClassFilter)?.name);
    });
  }, [allStudents, selectedClassFilter, uniqueClasses]);

  // Note/absențe din grupa selectată (pentru view profesor)
  const [teacherViewGrades, setTeacherViewGrades] = useState<GradeEntry[]>([]);
  const [teacherViewAbsences, setTeacherViewAbsences] = useState<AbsenceEntry[]>([]);
  const [teacherViewLoading, setTeacherViewLoading] = useState(false);

  useEffect(() => {
    if (!isTeacherOrAdmin || !selectedSubjectGroupId) return;
    const load = async () => {
      setTeacherViewLoading(true);
      try {
        const q = selectedTermId ? `?termId=${selectedTermId}` : '';
        const [grd, abs] = await Promise.all([
          apiClient<GradeEntry[]>(`/api/v1/groups/${selectedSubjectGroupId}/grades${q}`).catch(() => []),
          apiClient<AbsenceEntry[]>(`/api/v1/groups/${selectedSubjectGroupId}/absences${q}`).catch(() => []),
        ]);
        setTeacherViewGrades(grd);
        setTeacherViewAbsences(abs);
      } finally {
        setTeacherViewLoading(false);
      }
    };
    load();
  }, [selectedSubjectGroupId, selectedTermId, isTeacherOrAdmin]);

  // Handler notă rapidă per elev
  const handleQuickGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGradeStudent || !quickGradeGroupId) return;
    setQuickGradeBusy(true);
    try {
      await apiClient(`/api/v1/groups/${quickGradeGroupId}/grades`, {
        method: 'POST',
        body: JSON.stringify({
          studentId: quickGradeStudent.id,
          value: Number(quickGradeValue),
          type: quickGradeType,
          comment: quickGradeComment || undefined,
          gradedAt: new Date().toISOString(),
        }),
      });
      setQuickGradeStudent(null);
      setQuickGradeComment('');
      setQuickGradeValue(10);
      // Reîncarcă notele view profesor
      const q = selectedTermId ? `?termId=${selectedTermId}` : '';
      const grd = await apiClient<GradeEntry[]>(`/api/v1/groups/${quickGradeGroupId}/grades${q}`).catch(() => []);
      setTeacherViewGrades(grd);
    } catch (err: any) {
      alert(err.message || 'Eroare la adăugarea notei');
    } finally {
      setQuickGradeBusy(false);
    }
  };

  // Handler absență rapidă per elev
  const handleQuickAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAbsStudent) return;
    setQuickAbsBusy(true);
    try {
      await apiClient('/api/v1/absences', {
        method: 'POST',
        body: JSON.stringify({
          studentId: quickAbsStudent.id,
          groupId: selectedSubjectGroupId || undefined,
          date: new Date(quickAbsDate).toISOString(),
        }),
      });
      setQuickAbsStudent(null);
      const q = selectedTermId ? `?termId=${selectedTermId}` : '';
      const abs = await apiClient<AbsenceEntry[]>(`/api/v1/groups/${selectedSubjectGroupId}/absences${q}`).catch(() => []);
      setTeacherViewAbsences(abs);
    } catch (err: any) {
      alert(err.message || 'Eroare la înregistrarea absenței');
    } finally {
      setQuickAbsBusy(false);
    }
  };

  // Calcule statistice
  const averageGrade = grades.length > 0 
    ? (grades.reduce((acc, curr) => acc + curr.value, 0) / grades.length).toFixed(2)
    : '-';
  const unexcusedCount = absences.filter((a) => a.status === 'UNEXCUSED').length;
  const excusedCount = absences.filter((a) => a.status === 'EXCUSED').length;

  const [activeCatalogTab, setActiveCatalogTab] = useState<'note' | 'sumar' | 'observatii' | 'mesagerie' | 'motivari'>('note');
  const [selectedSubjectModal, setSelectedSubjectModal] = useState<{
    subjectName: string;
    teacherName: string;
    grades: GradeEntry[];
  } | null>(null);

  // Calculează datele dinamice per materie/grup — derivat din NOTE și ABSENȚE reale
  // Funcționează indiferent dacă `groups` e populat sau nu (ex: elev fără GroupMembership)
  const subjectData = useMemo(() => {
    type SubjEntry = {
      groupId: string;
      name: string;
      teacher: string;
      notes: string[];
      absences: string[];
      nemotivate: number;
      motivate: number;
      rawGrades: GradeEntry[];
      media: string;
    };

    const subjMap = new Map<string, SubjEntry>();

    // Construiește map-ul din note
    grades.forEach((g) => {
      const key = g.group?.id || '__no_group__';
      if (!subjMap.has(key)) {
        const grp = groups.find((x) => x.id === key);
        const name = grp?.subject?.name || grp?.name || g.group?.name || (g.group as any)?.subject?.name || 'Materie';
        const teacher = grp?.teacher
          ? `${grp.teacher.lastName || ''} ${grp.teacher.firstName || ''}`.trim().toUpperCase()
          : 'N/A';
        subjMap.set(key, { groupId: key, name, teacher, notes: [], absences: [], nemotivate: 0, motivate: 0, rawGrades: [], media: '-' });
      }
      const s = subjMap.get(key)!;
      s.notes.push(`${g.value} / ${new Date(g.gradedAt).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })}`);
      s.rawGrades.push(g);
    });

    // Adaugă absențele
    absences.forEach((a) => {
      const key = a.group?.id || '__no_group__';
      if (!subjMap.has(key)) {
        const grp = groups.find((x) => x.id === key);
        const name = grp?.subject?.name || grp?.name || a.group?.name || 'General';
        const teacher = grp?.teacher
          ? `${grp.teacher.lastName || ''} ${grp.teacher.firstName || ''}`.trim().toUpperCase()
          : 'N/A';
        subjMap.set(key, { groupId: key, name, teacher, notes: [], absences: [], nemotivate: 0, motivate: 0, rawGrades: [], media: '-' });
      }
      const s = subjMap.get(key)!;
      s.absences.push(`${new Date(a.date).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit' })} .`);
      if (a.status === 'EXCUSED') s.motivate++;
      else s.nemotivate++;
    });

    // Dacă există grupuri dar nu există note/absențe din ele, le adăugăm oricum (vizualizare completă)
    groups.forEach((group) => {
      if (!subjMap.has(group.id)) {
        const name = group.subject?.name || group.name;
        const teacher = group.teacher
          ? `${group.teacher.lastName || ''} ${group.teacher.firstName || ''}`.trim().toUpperCase()
          : 'N/A';
        subjMap.set(group.id, { groupId: group.id, name, teacher, notes: [], absences: [], nemotivate: 0, motivate: 0, rawGrades: [], media: '-' });
      }
    });

    // Calculează media finală
    subjMap.forEach((s) => {
      if (s.rawGrades.length > 0) {
        s.media = (s.rawGrades.reduce((acc, g) => acc + g.value, 0) / s.rawGrades.length).toFixed(1);
      }
    });

    return Array.from(subjMap.values()).filter((s) => s.groupId !== '__no_group__' || s.rawGrades.length > 0 || s.absences.length > 0);
  }, [grades, absences, groups]);

  const selectedStudentObj = allStudents.find((s) => s.id === selectedStudentFilter);
  const studentDisplayName = user?.role === 'STUDENT'
    ? `${user.lastName || ''} ${user.firstName || ''}`.trim().toUpperCase()
    : selectedStudentObj
    ? `${selectedStudentObj.lastName || ''} ${selectedStudentObj.firstName || ''}`.trim().toUpperCase()
    : user?.role === 'ADMIN'
    ? 'CATALOG ȘCOLAR — VIZUALIZARE NOTE'
    : user ? `${user.lastName || ''} ${user.firstName || ''}`.trim().toUpperCase() : 'UTILIZATOR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ═══════════════════════════════════════════════════════════
          PANOU PROFESOR / ADMIN — Vizualizare elevi pe clase
      ════════════════════════════════════════════════════════════ */}
      {isTeacherOrAdmin && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {/* Header panou profesor */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            backgroundColor: 'var(--bg-subtle, rgba(37,99,235,0.04))',
          }}>
            <GraduationCap size={20} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
              Catalog Electronic — Vizualizare Elevi
            </span>

            {/* Selector Trimestru */}
            <select
              className="input"
              style={{ width: 'auto', minWidth: '130px', marginLeft: 'auto' }}
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
            >
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  Modulul {t.number} ({t.status === 'OPEN' ? 'Activ' : 'Închis'})
                </option>
              ))}
            </select>

            {/* Selector Clasă */}
            <select
              className="input"
              style={{ width: 'auto', minWidth: '120px' }}
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
            >
              {uniqueClasses.length === 0 && (
                <option value="">— Toate clasele —</option>
              )}
              {uniqueClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Selector Materie/Grup */}
            <select
              className="input"
              style={{ width: 'auto', minWidth: '160px' }}
              value={selectedSubjectGroupId}
              onChange={(e) => setSelectedSubjectGroupId(e.target.value)}
            >
              {groupsInClass.length === 0 && (
                <option value="">— Nicio materie —</option>
              )}
              {groupsInClass.map((g) => (
                <option key={g.id} value={g.id}>
                  {(g as any).subject?.name || g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tabel elevi */}
          <div style={{ overflowX: 'auto' }}>
            {teacherViewLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Se încarcă...
              </div>
            ) : studentsInClass.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Nu există elevi înregistrați în această clasă.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      #
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Elev
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Note
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      Medie
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      Abs.
                    </th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Acțiuni
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentsInClass.map((student, idx) => {
                    const stuGrades = teacherViewGrades.filter((g) => g.studentId === student.id);
                    const stuAbsences = teacherViewAbsences.filter((a) => a.studentId === student.id);
                    const avg = stuGrades.length > 0
                      ? (stuGrades.reduce((s, g) => s + g.value, 0) / stuGrades.length).toFixed(2)
                      : '—';
                    const unexcused = stuAbsences.filter((a) => a.status === 'UNEXCUSED').length;
                    const studentName = `${student.lastName || ''} ${student.firstName || ''}`.trim() || student.email;

                    return (
                      <tr
                        key={student.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                      >
                        {/* Nr. crt */}
                        <td style={{ padding: '0.65rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* Nume elev */}
                        <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          {studentName}
                          {student.email && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              {student.email}
                            </div>
                          )}
                        </td>

                        {/* Note inline */}
                        <td style={{ padding: '0.65rem 1rem', maxWidth: '300px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                            {stuGrades.length === 0 ? (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                            ) : (
                              stuGrades.map((g) => (
                                <span
                                  key={g.id}
                                  title={`${g.type}${g.comment ? ' — ' + g.comment : ''}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    padding: '0 6px',
                                    backgroundColor: g.value >= 5
                                      ? 'rgba(34,197,94,0.15)'
                                      : 'rgba(239,68,68,0.15)',
                                    color: g.value >= 5 ? '#16a34a' : '#dc2626',
                                    border: `1px solid ${g.value >= 5 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                    cursor: 'default',
                                  }}
                                >
                                  {g.value}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Medie */}
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: avg === '—' ? 'var(--text-muted)' : Number(avg) >= 5 ? 'var(--success, #16a34a)' : 'var(--danger)',
                          }}>
                            {avg}
                          </span>
                        </td>

                        {/* Absențe */}
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                          {stuAbsences.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>0</span>
                          ) : (
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: unexcused > 0 ? 'var(--danger)' : 'var(--text-muted)',
                            }}>
                              {stuAbsences.length}
                              {unexcused > 0 && (
                                <span style={{ fontSize: '0.72rem', color: 'var(--danger)', marginLeft: '3px' }}>
                                  ({unexcused} nem.)
                                </span>
                              )}
                            </span>
                          )}
                        </td>

                        {/* Acțiuni */}
                        <td style={{ padding: '0.65rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem' }}
                            title="Adaugă notă"
                            onClick={() => {
                              setQuickGradeStudent({ id: student.id, name: studentName });
                              setQuickGradeGroupId(selectedSubjectGroupId);
                              setQuickGradeValue(10);
                              setQuickGradeType('TEST');
                              setQuickGradeComment('');
                            }}
                          >
                            <Plus size={14} /> Notă
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem', marginLeft: '0.4rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            title="Adaugă absență"
                            onClick={() => {
                              setQuickAbsStudent({ id: student.id, name: studentName });
                              setQuickAbsDate(new Date().toISOString().split('T')[0]);
                            }}
                          >
                            <Plus size={14} /> Abs.
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal rapid Adaugă Notă per elev */}
      {quickGradeStudent && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700 }}>Adaugă Notă</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Elev: <strong>{quickGradeStudent.name}</strong>
              </p>
              <form onSubmit={handleQuickGrade} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Nota (1–10)</label>
                    <input
                      type="number" min={1} max={10} className="input"
                      value={quickGradeValue}
                      onChange={(e) => setQuickGradeValue(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Tip</label>
                    <select className="input" value={quickGradeType} onChange={(e) => setQuickGradeType(e.target.value)}>
                      <option value="TEST">Test</option>
                      <option value="ORAL">Oral</option>
                      <option value="HOMEWORK">Temă</option>
                      <option value="PROJECT">Proiect</option>
                      <option value="PARTIAL">Teză</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Observație (opțional)</label>
                  <input
                    type="text" className="input" placeholder="ex: Teză sem. 1"
                    value={quickGradeComment}
                    onChange={(e) => setQuickGradeComment(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setQuickGradeStudent(null)} disabled={quickGradeBusy}>
                    Anulează
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={quickGradeBusy}>
                    {quickGradeBusy ? 'Se salvează...' : 'Salvează nota'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal rapid Adaugă Absență per elev */}
      {quickAbsStudent && (
        <ModalPortal>
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '380px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700 }}>Înregistrează Absență</h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Elev: <strong>{quickAbsStudent.name}</strong>
              </p>
              <form onSubmit={handleQuickAbsence} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Data absenței</label>
                  <input
                    type="date" className="input"
                    value={quickAbsDate}
                    onChange={(e) => setQuickAbsDate(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setQuickAbsStudent(null)} disabled={quickAbsBusy}>
                    Anulează
                  </button>
                  <button type="submit" className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} disabled={quickAbsBusy}>
                    {quickAbsBusy ? 'Se salvează...' : 'Înregistrează'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ══════════════════════════════════════════════
          VIEW EXISTENT (elev / sumar per materie)
      ══════════════════════════════════════════════ */}
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
          <button
            type="button"
            className="catalog-blue-btn"
            onClick={() => setShowSendMessage(true)}
          >
            Trimite-ne un mesaj
          </button>
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
          <div 
            key={idx} 
            className="catalog-card-container card-interactive"
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedSubjectModal({
              subjectName: subj.name,
              teacherName: subj.teacher,
              grades: subj.rawGrades,
            })}
            title="Apasă pentru grafic evoluție și calculator de medii"
          >
            <div className="catalog-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="catalog-card-subject-name">{subj.name}</h3>
                <p className="catalog-card-teacher-name">{subj.teacher}</p>
              </div>
              <span 
                style={{ 
                  fontSize: '0.72rem', 
                  backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                  padding: '2px 8px', 
                  borderRadius: '9999px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                Grafic &amp; Calculator &gt;
              </span>
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

      {/* Modal Evoluție & Calculator de Medii */}
      {selectedSubjectModal && (
        <SubjectEvolutionModal
          subjectName={selectedSubjectModal.subjectName}
          teacherName={selectedSubjectModal.teacherName}
          grades={selectedSubjectModal.grades}
          onClose={() => setSelectedSubjectModal(null)}
        />
      )}

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
                            title="Doar dirigintele clasei, profesorul materiei sau administratorul pot motiva absența"
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

      {/* Modal motiv (anulare notă / motivare absență) */}
      <ReasonPromptModal
        isOpen={Boolean(reasonDialog)}
        title={reasonDialog?.kind === 'void-grade' ? 'Anulează nota' : 'Motivează absența'}
        label={reasonDialog?.kind === 'void-grade' ? 'Motivul anulării notei' : 'Motivul motivării'}
        placeholder={reasonDialog?.kind === 'void-grade' ? 'ex: notă introdusă din greșeală' : 'ex: Scutire medicală'}
        confirmLabel={reasonDialog?.kind === 'void-grade' ? 'Anulează nota' : 'Motivează'}
        busy={reasonBusy}
        error={reasonError}
        onClose={closeReasonDialog}
        onSubmit={handleReasonSubmit}
      />

      {/* Modal Adăugare Notă */}
      {showAddGrade && (
        <ModalPortal>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
            overscrollBehavior: 'contain',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddGrade(false);
          }}
        >
          <div
            className="card card-interactive animate-fade-in"
            style={{
              backgroundColor: 'var(--bg-card, #1e293b)',
              color: 'var(--text-main, #f8fafc)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Adaugă Notă</h2>

            <form onSubmit={handleCreateGrade} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">Materie / Grup</label>
                <select
                  className="input"
                  value={targetGroupId}
                  onChange={(e) => {
                    setTargetGroupId(e.target.value);
                    // Reset student when group changes
                    setTargetStudentId('');
                  }}
                  required
                >
                  <option value="">Alege materia / grupul</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.subject?.name || g.name} {g.class ? `— ${g.class.name}` : ''}
                    </option>
                  ))}
                </select>
                {groups.length === 0 && (
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: 'var(--danger)', lineHeight: 1.4 }}>
                    ⚠️ Nu există grupuri accesibile. Ca profesor, trebuie să fii asignat la un grup.{' '}
                    Ca administrator, folosiți secțiunea <strong>Materii</strong> pentru a crea grupuri.
                  </p>
                )}
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
                  {/* Prioritizează membrii grupului selectat, altfel toți elevii */}
                  {targetGroupId && groupMembers.length > 0
                    ? groupMembers
                        .filter((m) => m.membershipRole === 'STUDENT')
                        .map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {m.user.lastName} {m.user.firstName}
                          </option>
                        ))
                    : allStudents.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.lastName} {s.firstName}{s.email ? ` (${s.email})` : ''}
                        </option>
                      ))
                  }
                </select>
                {targetGroupId && groupMembers.filter(m => m.membershipRole === 'STUDENT').length === 0 && allStudents.length > 0 && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Niciun elev înscris în acest grup — se afișează toți elevii școlii.
                  </p>
                )}
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
        </ModalPortal>
      )}

      {/* Modal Adăugare Absență pe Materie */}
      {showAddAbsence && (
        <ModalPortal>
        <div
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
            overscrollBehavior: 'contain',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddAbsence(false);
          }}
        >
          <div
            className="card card-interactive animate-fade-in"
            style={{
              backgroundColor: 'var(--bg-card, #1e293b)',
              color: 'var(--text-main, #f8fafc)',
              borderRadius: '16px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Înregistrează Absență</h2>

            <form onSubmit={handleCreateAbsence} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label className="label">Materie / Grup (opțional)</label>
                <select
                  className="input"
                  value={absenceGroupId}
                  onChange={(e) => setAbsenceGroupId(e.target.value)}
                >
                  <option value="">— Absență generală (fără materie) —</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.subject?.name || g.name} {g.class ? `— ${g.class.name}` : ''}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Lasă gol pentru absență fără materie specifică.
                </p>
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
        </ModalPortal>
      )}

      {/* Modal trimitere mesaj */}
      <SendMessageModal
        isOpen={showSendMessage}
        onClose={() => setShowSendMessage(false)}
        defaultRecipientName={user?.homeroomTeacher ? `Prof. ${user.homeroomTeacher.firstName} ${user.homeroomTeacher.lastName}` : 'Conducerea Școlii / Diriginte'}
        contextTitle="Trimite un mesaj către școală"
      />
    </div>
  );
};
