import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { Group, SchoolEvent, NotificationItem } from '../api/types';
import { BookOpen, Calendar, Bell, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [gList, eList, nList] = await Promise.all([
          apiClient<Group[]>('/api/v1/groups').catch(() => []),
          apiClient<SchoolEvent[]>('/api/v1/events').catch(() => []),
          apiClient<NotificationItem[]>('/api/v1/notifications').catch(() => []),
        ]);
        setGroups(gList);
        setEvents(eList.slice(0, 5));
        setNotifications(nList.slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <div>Se încarcă datele panoului...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
          Bun venit, {user?.firstName}!
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Iată sumarul activității tale școlare de astăzi.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Grupurile mele */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} color="var(--primary)" /> Grupurile mele ({groups.length})
            </h2>
            <Link to="/groups" style={{ fontSize: '0.875rem' }}>Vezi toate</Link>
          </div>
          {groups.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nu sunteți înscris în niciun grup încă.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {groups.slice(0, 4).map((g) => (
                <Link
                  key={g.id}
                  to={`/groups/${g.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{g.name}</span>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Evenimente școlare */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--primary)" /> Evenimente școală
            </h2>
            <Link to="/calendar" style={{ fontSize: '0.875rem' }}>Calendar</Link>
          </div>
          {events.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nu există evenimente programate în curând.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {events.map((e) => (
                <div key={e.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{e.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(e.startsAt).toLocaleDateString()} - {new Date(e.endsAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notificări recente */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={20} color="var(--primary)" /> Notificări recente
            </h2>
            <Link to="/notifications" style={{ fontSize: '0.875rem' }}>Vezi toate</Link>
          </div>
          {notifications.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nicio notificare primită.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <div style={{ fontWeight: n.readAt ? 400 : 600, fontSize: '0.875rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

