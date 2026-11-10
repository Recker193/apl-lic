import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { SchoolClass, Subject, AuditLogItem, UserRole } from '../api/types';
import { Shield, Plus, Mail, Copy, Check } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [className, setClassName] = useState('');
  const [schoolYear, setSchoolYear] = useState('2026-2027');
  const [subjectName, setSubjectName] = useState('');

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
      const [cData, sData, aData] = await Promise.all([
        apiClient<SchoolClass[]>('/api/v1/classes').catch(() => []),
        apiClient<Subject[]>('/api/v1/subjects').catch(() => []),
        apiClient<{ items: AuditLogItem[] }>('/api/v1/audit?page=1&limit=15').catch(() => ({ items: [] })),
      ]);
      setClasses(cData);
      setSubjects(sData);
      setAuditLogs(aData.items || []);
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

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient<{ token: string; emailSent?: boolean }>(
        '/api/v1/invitations',
        {
          method: 'POST',
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
            classId: inviteClassId || undefined,
          }),
        },
      );
      setLastInviteToken(res.token);
      alert(
        res.emailSent === false
          ? 'Invitație creată, dar emailul nu a putut fi trimis. Trimiteți manual linkul afișat mai jos.'
          : 'Invitație creată cu succes!',
      );
      setInviteEmail('');
      setInviteClassId('');
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        throw new Error('Clipboard API indisponibil');
      }
    } catch {
      // Fallback pentru contexte ne-securizate (http în rețeaua locală)
      const textarea = document.createElement('textarea');
      textarea.value = inviteUrl;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
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
            style={{
              marginTop: '1rem',
              padding: '0.875rem',
              /* Culori bazate pe variabilele temei, ca linkul să fie vizibil
                 și pe light, și pe dark mode (înainte era alb pe albastru deschis) */
              backgroundColor: 'var(--bg-subtle)',
              border: '2px solid var(--primary)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-main)',
            }}
          >
            <strong style={{ display: 'block', color: 'var(--text-main)' }}>
              Link de activare generat
            </strong>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.8rem' }}>
              Trimite acest link elevului. Expiră în 7 zile.
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
                className="input-field"
                style={{
                  flex: '1 1 260px',
                  minWidth: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  backgroundColor: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  borderColor: 'var(--border)',
                  cursor: 'text',
                }}
              />
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className={`btn ${inviteLinkCopied ? 'btn-outline' : 'btn-primary'}`}
                style={{ whiteSpace: 'nowrap', gap: '0.375rem', flexShrink: 0 }}
              >
                {inviteLinkCopied ? <Check size={16} /> : <Copy size={16} />}
                {inviteLinkCopied ? 'Copiat!' : 'Copiază linkul'}
              </button>
            </div>
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

