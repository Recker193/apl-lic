import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Club, User } from '../api/types';
import { AssetIcon } from '../common/AssetIcon';
import { ModalPortal } from '../common/ModalPortal';
import { 
  Compass, 
  Plus, 
  ExternalLink, 
  Users, 
  Calendar, 
  Check, 
  LogOut, 
  Trash2, 
  Clock,
  Info
} from 'lucide-react';
import { formatDateTime24 } from '../common/dateUtils';



export const ClubsView: React.FC = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Creare Club
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formsUrl, setFormsUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadClubs = async () => {
    setLoading(true);
    try {
      const data = await apiClient<Club[]>('/api/v1/clubs');
      setClubs(data);
    } catch (err) {
      console.error('Error loading clubs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await apiClient('/api/v1/clubs', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description || undefined,
          formsUrl: formsUrl || undefined,
        }),
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      setFormsUrl('');
      loadClubs();
    } catch (err: any) {
      setErrorMsg(err.message || 'Eroare la crearea clubului');
    }
  };

  const handleJoinClub = async (clubId: string) => {
    try {
      await apiClient(`/api/v1/clubs/${clubId}/join`, { method: 'POST' });
      loadClubs();
    } catch (err: any) {
      alert(err.message || 'Eroare la înscriere');
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    if (!window.confirm('Sigur doriți să părăsiți acest club?')) return;
    try {
      await apiClient(`/api/v1/clubs/${clubId}/leave`, { method: 'POST' });
      loadClubs();
    } catch (err: any) {
      alert(err.message || 'Eroare la retragere');
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!window.confirm('Sigur doriți să ștergeți acest club și toate întâlnirile sale?')) return;
    try {
      await apiClient(`/api/v1/clubs/${clubId}`, { method: 'DELETE' });
      loadClubs();
    } catch (err: any) {
      alert(err.message || 'Eroare la ștergerea clubului');
    }
  };

  const [selectedClubInfo, setSelectedClubInfo] = useState<Club | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header conform imaginii media_1794298936238_bd355ae4 */}
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Cluburi și oportunități
        </h1>
      </div>

      {/* Banner Voluntariat RMI >> 20-27 februarie cu Link înscrieri */}
      <div className="clubs-banner-volunteer">
        <div className="clubs-volunteer-pill">
          <div className="clubs-volunteer-icon">!</div>
          <span>Voluntariat RMI &gt;&gt; 20-27 februarie</span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-muted)' }}>Link înscrieri: </span>
          <a 
            href="https://forms.gle/n5sSMgiBWTKruzbW9" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#0284c7', textDecoration: 'underline' }}
          >
            https://forms.gle/n5sSMgiBWTKruzbW9
          </a>
        </div>
      </div>

      {/* Secțiunea "Cluburile tale" dinamic */}
      <div className="clubs-user-section">
        <div className="clubs-user-list">
          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Cluburile tale:
          </div>
          {clubs.filter((c) => c.members?.some((m) => m.userId === user?.id)).length === 0 ? (
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Nu ești înscris încă la niciun club.
            </div>
          ) : (
            clubs
              .filter((c) => c.members?.some((m) => m.userId === user?.id))
              .map((c, idx) => {
                const membership = c.members?.find((m) => m.userId === user?.id);
                return (
                  <div key={c.id} style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    <strong>{idx + 1}. {c.name}</strong>{' '}
                    {membership && (
                      <span style={{ color: 'var(--text-muted)' }}>
                        (te-ai alăturat {new Date(membership.joinedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })})
                      </span>
                    )}
                  </div>
                );
              })
          )}
        </div>

        <button 
          type="button" 
          onClick={() => setShowAddModal(true)}
          className="clubs-request-action"
        >
          <img src="/icon-new-club-request.png" alt="Solicită club" className="clubs-request-icon" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span>Solicită înființarea unui nou club!</span>
        </button>
      </div>

      {/* Lista completă cu activitățile și cluburile dinamice din baza de date */}
      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Toate cluburile din școală
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Gestiune și înscrieri directe
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Înființează Club
          </button>
        </div>
      </div>

      {/* Grid Cluburi */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Se încarcă cluburile...
        </div>
      ) : clubs.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Nu a fost înființat încă niciun club. Fii tu primul coordonator!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {clubs.map((club) => {
            const isCoordinator = club.coordinatorId === user?.id || user?.role === 'ADMIN';
            const isMember = club.members?.some((m) => m.userId === user?.id);

            return (
              <div key={club.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0, color: 'var(--primary)' }}>
                      {club.name}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                      Coordonator: {club.coordinator?.firstName} {club.coordinator?.lastName}
                    </span>
                  </div>

                  {isCoordinator && (
                    <button
                      onClick={() => handleDeleteClub(club.id)}
                      title="Șterge club"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.7 }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {club.description && (
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {club.description}
                  </p>
                )}

                {/* Întâlniri de weekend programate */}
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '0.625rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} color="var(--primary)" /> Program Weekend:
                  </div>
                  {!club.meetings || club.meetings.length === 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Nicio întâlnire de weekend programată</span>
                  ) : (
                    club.meetings.map((m) => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                        <span>{m.dayOfWeek === 'SATURDAY' ? 'Sâmbătă' : 'Duminică'}: {m.title}</span>
                        <span style={{ fontWeight: 600 }}>{m.startTime} - {m.endTime}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Actions: Google Forms, Înscriere */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {club.formsUrl ? (
                    <a
                      href={club.formsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', gap: '0.35rem' }}
                    >
                      <ExternalLink size={13} /> Înscriere Google Forms
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fără formular extern</span>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isMember ? (
                      <button
                        onClick={() => handleLeaveClub(club.id)}
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', color: 'var(--danger)' }}
                      >
                        <LogOut size={13} /> Părăsește
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinClub(club.id)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                      >
                        <Check size={13} /> Alătură-te
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Înființare Club */}
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
            maxWidth: '460px',
            width: '90%',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Înființează un Club Nou</h2>

            {errorMsg && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateClub} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Nume Club</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: Clubul de Șah, Debate & Public Speaking"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Descriere / Scop</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Despre ce este clubul, obiective, cine poate participa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Link Google Forms (înscriere oficială)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://docs.google.com/forms/d/e/.../viewform"
                  value={formsUrl}
                  onChange={(e) => setFormsUrl(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  Elevii vor putea accesa direct acest formular pentru a se înregistra.
                </span>
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
                  Creează Club
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

