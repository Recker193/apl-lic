import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { NotificationItem } from '../api/types';
import { formatDateTime24 } from '../common/dateUtils';
import { Check } from 'lucide-react';

export const NotificationsList: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await apiClient<NotificationItem[]>('/api/v1/notifications');
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient('/api/v1/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
      );
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div>Se încarcă notificările...</div>;

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Notificări</h1>
          <p style={{ color: 'var(--text-muted)' }}>Actualizări importante despre teme, teste și activități</p>
        </div>
        {notifications.some((n) => !n.readAt) && (
          <button onClick={handleMarkAllAsRead} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
            <Check size={16} /> Marchează toate ca citite
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Nu aveți nicio notificare în acest moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="card"
              style={{
                backgroundColor: n.readAt ? 'var(--bg-card)' : '#f0fdf4',
                borderColor: n.readAt ? 'var(--border)' : '#86efac',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: n.readAt ? 500 : 700 }}>{n.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#334155', marginTop: '0.25rem' }}>{n.message}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                  {formatDateTime24(n.createdAt)}
                </span>
              </div>

              {!n.readAt && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  Marchează ca citit
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

