import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { SchoolClass, Subject, AuditLogItem, UserRole, User, Group } from '../api/types';
import { Shield, Plus, Mail, Copy, Check, Users, ArrowRightLeft, BookOpen, GraduationCap, Trash2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [className, setClassName] = useState('');
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [subjectName, setSubjectName] = useState('');

  // Transfer / Înscriere Elev
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');

  // Transfer / Schimbare Profesor la Curs/Grup
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [newGroupClassId, setNewGroupClassId] = useState('');

  // Invitation
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('STUDENT');
  const [inviteClassId, setInviteClassId] = useState('');
  const [lastInviteToken, setLastInviteToken] = useState('');
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  const inviteUrl = lastInviteToken
    ? `${window.location.origin}/register?token=${lastInviteToken}`
    : '';

  const loadAll = async () => {
    try {
      const [cData, sData, aData, studentsData, teachersData, groupsData] = await Promise.all([
        apiClient<SchoolClass[]>('/api/v1/classes').catch(() => []),
        apiClient<Subject[]>('/api/v1/subjects').catch(() => []),
        apiClient<{ items: AuditLogItem[] }>('/api/v1/audit?page=1&limit=15').catch(() => ({ items: [] })),
        apiClient<User[]>('/api/v1/users?role=STUDENT').catch(() => []),
        apiClient<User[]>('/api/v1/users?role=TEACHER').catch(() => []),
        apiClient<Group[]>('/api/v1/groups').catch(() => []),
      ]);
      setClasses(cData);
      setSubjects(sData);
      setAuditLogs(aData.items || []);
      setStudents(studentsData);
      setTeachers(teachersData);
      setGroups(groupsData);
      if (studentsData.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentsData[0].id);
      }
      if (cData.length > 0 && !targetClassId) {
        setTargetClassId(cData[0].id);
      }
      if (groupsData.length > 0 && !selectedGroupId) {
        setSelectedGroupId(groupsData[0].id);
        setNewTeacherId(groupsData[0].teacherId || teachersData[0]?.id || '');
        setNewGroupClassId(groupsData[0].classId || cData[0]?.id || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/api/v1/classes', {
        method: 'POST',
        body: JSON.stringify({ name: className, schoolYear }),
      });
      setClassName('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/api/v1/subjects', {
        method: 'POST',
        body: JSON.stringify({ name: subjectName }),
      });
      setSubjectName('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Alocare sau transfer elev într-o clasă
  const handleAssignOrTransferStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !targetClassId) return;

    try {
      await apiClient(`/api/v1/classes/${targetClassId}/students`, {
        method: 'POST',
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      alert('Elevul a fost înscris / transferat cu succes în noua clasă!');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Eroare la transferul elevului');
    }
  };

  // Modificare profesor sau clasă pentru un curs/grup
  const handleUpdateGroupAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroupId) return;

    try {
      await apiClient(`/api/v1/groups/${selectedGroupId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          teacherId: newTeacherId || undefined,
          classId: newGroupClassId || undefined,
        }),
      });
      alert('Asignarea cursului a fost actualizată cu succes!');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Eroare la actualizarea profesorului / clasei');
    }
  };

  // Ștergere utilizator (elev sau profesor) - eliberează email-ul pentru o nouă înregistrare
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Sunteți sigur că doriți să ștergeți utilizatorul "${userName}"? Toate datele asociate vor fi eliminate, iar adresa de email va putea fi folosită din nou la înregistrare.`)) {
      return;
    }

    try {
      await apiClient(`/api/v1/users/${userId}`, {
        method: 'DELETE',
      });
      alert('Utilizatorul a fost șters cu succes!');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Eroare la ștergerea utilizatorului');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API indisponibil');
      }
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient<{ token: string }>('/api/v1/invitations', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          classId: inviteClassId || undefined,
        }),
      });
      setLastInviteToken(res.token);
      const url = `${window.location.origin}/register?token=${res.token}`;
      await copyToClipboard(url);
      setInviteLinkCopied(true);
      window.setTimeout(() => setInviteLinkCopied(false), 3000);
      alert('Invitație creată cu succes! Link-ul de activare a fost copiat automat în clipboard.');
      setInviteEmail('');
      setInviteClassId('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) return;
    await copyToClipboard(inviteUrl);
    setInviteLinkCopied(true);
    window.setTimeout(() => setInviteLinkCopied(false), 2500);
  };

  if (loading) return <div>Se încarcă modulul de administrare...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={24} color="var(--primary)" /> Administrare liceu
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Gestionare clase, materii didactice, generare de invitații și registru de audit
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Adăugare Clasă */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Clase școlare ({classes.length})</h2>
          <form onSubmit={handleCreateClass} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              required
              placeholder="Nume (ex: 11-B)"
              className="input-field"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
            <input
              type="text"
              required
              className="input-field"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              style={{ width: '120px' }}
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
            </button>
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {classes.map((c) => (
              <span key={c.id} className="badge">
                {c.name} ({c.schoolYear})
              </span>
            ))}
          </div>
        </div>

        {/* Adăugare Materie */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Materii didactice ({subjects.length})</h2>
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              required
              placeholder="Denumire materie"
              className="input-field"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
            </button>
          </form>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {subjects.map((s) => (
              <span key={s.id} className="badge">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Acțiuni Administrative: Alocare & Transfer Elevi + Schimbare Profesor Curs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Înscriere / Transfer Elev într-o clasă */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--primary)" /> Înscriere & Transfer Elev
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Adaugă un elev înregistrat într-o clasă sau transferă-l dintr-o clasă în alta.
          </p>
          <form onSubmit={handleAssignOrTransferStudent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Alege Elevul
              </label>
              <select
                className="input-field"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map((s) => {
                  const currentClass = s.classMemberships?.[0]?.class?.name;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.lastName} {s.firstName} ({s.email}) {currentClass ? `· Clasa actuală: ${currentClass}` : '· Fără clasă'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Clasa țintă (noua clasă)
              </label>
              <select
                className="input-field"
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Clasa {c.name} ({c.schoolYear})
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
              <ArrowRightLeft size={16} /> Înscrie / Transferă elev
            </button>
          </form>
        </div>

        {/* Schimbare Profesor sau Clasă la o Materie/Grup */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={18} color="var(--primary)" /> Schimbare Profesor la Curs / Clasă
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Transferă un profesor la predarea la o altă clasă sau schimbă cadrul didactic asociat.
          </p>
          <form onSubmit={handleUpdateGroupAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Alege Cursul / Grupul
              </label>
              <select
                className="input-field"
                value={selectedGroupId}
                onChange={(e) => {
                  const gId = e.target.value;
                  setSelectedGroupId(gId);
                  const grp = groups.find((g) => g.id === gId);
                  if (grp) {
                    setNewTeacherId(grp.teacherId || teachers[0]?.id || '');
                    setNewGroupClassId(grp.classId || classes[0]?.id || '');
                  }
                }}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Clasa: {g.class?.name || 'Nespecificată'})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Profesor Titular
                </label>
                <select
                  className="input-field"
                  value={newTeacherId}
                  onChange={(e) => setNewTeacherId(e.target.value)}
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.lastName} {t.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Clasă predare
                </label>
                <select
                  className="input-field"
                  value={newGroupClassId}
                  onChange={(e) => setNewGroupClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.schoolYear})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
              <BookOpen size={16} /> Salvează modificarea de predare
            </button>
          </form>
        </div>
      </div>

      {/* Creare Invitație */}
      <div className="card" style={{ maxWidth: '650px' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={18} /> Invită utilizator (Elev sau Profesor)
        </h2>
        <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Email</label>
            <input
              type="email"
              required
              placeholder="utilizator@liceu.ro"
              className="input-field"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Rol</label>
              <select
                className="input-field"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
              >
                <option value="STUDENT">Elev</option>
                <option value="TEACHER">Profesor</option>
              </select>
            </div>

            {inviteRole === 'STUDENT' && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Clasă</label>
                <select
                  className="input-field"
                  value={inviteClassId}
                  onChange={(e) => setInviteClassId(e.target.value)}
                >
                  <option value="">Alegeți clasa (opțional)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Generează invitație
          </button>
        </form>

        {inviteUrl && (
          <div
            className="invite-box-contrast"
            style={{
              marginTop: '1rem',
              padding: '0.875rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>
              Link de activare generat
            </strong>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', opacity: 0.85 }}>
              Link-ul a fost copiat automat în clipboard! Expiră în 7 zile.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'stretch',
                marginTop: '0.625rem',
                flexWrap: 'wrap',
              }}
            >
              <input
                readOnly
                value={inviteUrl}
                onFocus={(e) => e.currentTarget.select()}
                onClick={(e) => e.currentTarget.select()}
                aria-label="Link de activare"
                className="invite-input-contrast"
                style={{
                  flex: '1 1 260px',
                  minWidth: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  cursor: 'text',
                }}
              />
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="btn btn-primary"
                style={{ whiteSpace: 'nowrap', gap: '0.375rem', flexShrink: 0 }}
              >
                {inviteLinkCopied ? <Check size={16} /> : <Copy size={16} />}
                {inviteLinkCopied ? 'Copiat!' : 'Copiază linkul'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listă Elevi cu opțiune de Ștergere */}
      <div className="card">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--primary)" /> Gestionare Elevi Înregistrați ({students.length})
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Ștergerea unui elev eliberează adresa de email asociată, permițând refolosirea acesteia pentru o nouă înregistrare.
        </p>

        {students.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nu există elevi înregistrați.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem' }}>Nume & Prenume</th>
                  <th style={{ padding: '0.6rem' }}>Email</th>
                  <th style={{ padding: '0.6rem' }}>Clasă</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {students.map((st) => {
                  const studentClass = st.classMemberships?.[0]?.class?.name || 'Fără clasă';
                  const displayName = `${st.lastName} ${st.firstName}`;
                  return (
                    <tr key={st.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{displayName}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{st.email}</td>
                      <td style={{ padding: '0.6rem' }}>
                        <span className="badge" style={{ fontSize: '0.75rem' }}>{studentClass}</span>
                      </td>
                      <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(st.id, displayName)}
                          className="btn btn-outline"
                          style={{
                            borderColor: 'var(--danger, #ef4444)',
                            color: 'var(--danger, #ef4444)',
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          title="Șterge definitiv elevul"
                        >
                          <Trash2 size={14} /> Șterge cont
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Listă Profesori cu opțiune de Ștergere */}
      <div className="card">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GraduationCap size={18} color="var(--primary)" /> Gestionare Profesori Înregistrați ({teachers.length})
        </h2>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Ștergerea unui cadru didactic eliberează adresa de email și transferă cursurile/evidențele către conducere.
        </p>

        {teachers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nu există profesori înregistrați.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem' }}>Nume & Prenume</th>
                  <th style={{ padding: '0.6rem' }}>Email</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((tc) => {
                  const displayName = `Prof. ${tc.lastName} ${tc.firstName}`;
                  return (
                    <tr key={tc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem', fontWeight: 600 }}>{displayName}</td>
                      <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{tc.email}</td>
                      <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(tc.id, displayName)}
                          className="btn btn-outline"
                          style={{
                            borderColor: 'var(--danger, #ef4444)',
                            color: 'var(--danger, #ef4444)',
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.8rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                          title="Șterge definitiv profesorul"
                        >
                          <Trash2 size={14} /> Șterge cont
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registru de Audit */}
      <div className="card">
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Registru de audit (Acțiuni administrative)</h2>
        {auditLogs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nu există intrări în jurnalul de audit.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Data</th>
                  <th style={{ padding: '0.5rem' }}>Acțiune</th>
                  <th style={{ padding: '0.5rem' }}>Tip resursă</th>
                  <th style={{ padding: '0.5rem' }}>Actor ID</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{log.action}</td>
                    <td style={{ padding: '0.5rem' }}>{log.resourceType}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{log.actorId.slice(0, 8)}...</td>
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

