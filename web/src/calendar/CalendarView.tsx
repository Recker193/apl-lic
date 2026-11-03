import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Calendar as CalendarIcon, Clock, BookOpen } from 'lucide-react';

interface CalendarData {
  assignments: Array<{ id: string; title: string; dueAt: string; groupName?: string }>;
  exams: Array<{ id: string; title: string; scheduledAt: string; groupName?: string }>;
  events: Array<{ id: string; title: string; startsAt: string; endsAt: string }>;
}

export const CalendarView: React.FC = () => {
  const [data, setData] = useState<CalendarData>({ assignments: [], exams: [], events: [] });
  const [loading, setLoading] = useState(true);

  // Default range: current month +/- 15 days
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const res = await apiClient<CalendarData>(`/api/v1/calendar?from=${start}&to=${end}`);
        setData(res);
      } finally {
        setLoading(false);
      }
    };
    loadCalendar();
  }, [start, end]);

  if (loading) return <div>Se încarcă calendarul activităților...</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarIcon size={24} color="var(--primary)" /> Calendar activități
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Toate termenele de predare, testele și evenimentele liceului într-un singur loc
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Teste viitoare */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#b91c1c' }}>
            Teste & Examene programate
          </h2>
          {data.exams.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Niciun test în această perioadă.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.exams.map((ex) => (
                <div key={ex.id} style={{ padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '0.375rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ex.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Clock size={12} /> {new Date(ex.scheduledAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teme cu termen de predare */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#d97706' }}>
            Termene-limită teme
          </h2>
          {data.assignments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nicio temă activă cu scadență.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.assignments.map((as) => (
                <div key={as.id} style={{ padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '0.375rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{as.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                    <Clock size={12} /> Predare: {new Date(as.dueAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Evenimente școlare */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1d4ed8' }}>
            Evenimente liceu
          </h2>
          {data.events.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Niciun eveniment anunțat.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.events.map((ev) => (
                <div key={ev.id} style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '0.375rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ev.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {new Date(ev.startsAt).toLocaleDateString()} - {new Date(ev.endsAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

