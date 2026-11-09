import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import {
  Group,
  SchoolEvent,
  NotificationItem,
  TimetableEntry,
  DayOfWeek,
  Assignment,
} from '../api/types';
import {
  Monitor,
  BookOpen,
  ClipboardList,
  Bell,
  ArrowRight,
  CheckSquare,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { useMobile } from '../common/useMobile';
import { SocialFeedService } from '../common/SocialFeedService';
import { SocialFeedPost } from '../api/types';
import { Home as DesktopHome } from './Home';

const DAY_KEYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const DAY_LABELS_RO: Record<DayOfWeek, string> = {
  MONDAY: 'LUNI',
  TUESDAY: 'MARȚI',
  WEDNESDAY: 'MIERCURI',
  THURSDAY: 'JOI',
  FRIDAY: 'VINERI',
  SATURDAY: 'SÂMBĂTĂ',
  SUNDAY: 'DUMINICĂ',
};

const MONTH_LABELS_RO = [
  'IANUARIE', 'FEBRUARIE', 'MARTIE', 'APRILIE', 'MAI', 'IUNIE',
  'IULIE', 'AUGUST', 'SEPTEMBRIE', 'OCTOMBRIE', 'NOIEMBRIE', 'DECEMBRIE',
];

/** Tipuri de iconuri pentru itemi "Ce ai de făcut" */
const ASSIGNMENT_TYPE_ICON: Record<string, React.FC<{ size?: number; color?: string }>> = {
  PROJECT: FileText,
  HOMEWORK: BookOpen,
  TEST: CheckSquare,
  THESIS: FileText,
};

const ASSIGNMENT_TYPE_LABEL: Record<string, string> = {
  PROJECT: 'Proiect',
  HOMEWORK: 'Temă',
  TEST: 'Test',
  THESIS: 'Teză',
};

/** CSS class names per tip task — controlate din index.css (dark mode safe) */
const ASSIGNMENT_TYPE_CLASS: Record<string, string> = {
  PROJECT: 'task-type-project',
  HOMEWORK: 'task-type-homework',
  TEST: 'task-type-test',
  THESIS: 'task-type-thesis',
};

export const MobileHome: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useMobile();

  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [todayClasses, setTodayClasses] = useState<TimetableEntry[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<
    { group: Group; assignment: Assignment }[]
  >([]);
  const [socialPosts, setSocialPosts] = useState<SocialFeedPost[]>([]);
  const [schoolName, setSchoolName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const dayIndex = now.getDay();
  const todayKey: DayOfWeek | null =
    dayIndex >= 1 && dayIndex <= 5 ? DAY_KEYS[dayIndex - 1] : null;

  const dateLabel = `${todayKey ? DAY_LABELS_RO[todayKey] : (dayIndex === 0 ? 'DUMINICĂ' : 'SÂMBĂTĂ')}, ${now.getDate()} ${MONTH_LABELS_RO[now.getMonth()]}`;

  useEffect(() => {
    apiClient<{ name: string }>('/api/v1/admin/school')
      .then((s) => setSchoolName(s.name))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [gList, eList, nList, timetableList] = await Promise.all([
          apiClient<Group[]>('/api/v1/groups').catch(() => []),
          apiClient<SchoolEvent[]>('/api/v1/events').catch(() => []),
          apiClient<NotificationItem[]>('/api/v1/notifications').catch(() => []),
          apiClient<TimetableEntry[]>('/api/v1/timetable/me').catch(() => []),
        ]);
        setGroups(gList);
        setEvents(eList.slice(0, 3));
        setNotifications(nList.filter((n) => !n.readAt).slice(0, 3));
        setSocialPosts(SocialFeedService.getPosts().slice(0, 2));

        if (todayKey) {
          setTodayClasses(
            timetableList
              .filter((t) => t.dayOfWeek === todayKey)
              .sort((a, b) => a.period - b.period),
          );
        }

        if (gList.length > 0) {
          const lists = await Promise.all(
            gList.map((g) =>
              apiClient<Assignment[]>(`/api/v1/groups/${g.id}/assignments`).catch(() => []),
            ),
          );
          const pending: { group: Group; assignment: Assignment }[] = [];
          gList.forEach((g, i) => {
            lists[i]
              .filter((a) => a.status === 'PUBLISHED' && a.progress?.status !== 'COMPLETED')
              .forEach((a) => pending.push({ group: g, assignment: a }));
          });
          // Sortare după dueAt
          pending.sort(
            (x, y) =>
              new Date(x.assignment.dueAt).getTime() -
              new Date(y.assignment.dueAt).getTime(),
          );
          setPendingAssignments(pending.slice(0, 6));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [todayKey]);

  const formatDeadline = (dueAt: string) => {
    const due = new Date(dueAt);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expirat';
    if (diffDays === 0) return 'Astăzi';
    if (diffDays === 1) return 'Mâine';
    return `De predat în ${diffDays} zile`;
  };

  if (loading) {
    return (
      <div className="mhome-loading">
        <div className="mhome-spinner" />
      </div>
    );
  }

  // Pe desktop, afișăm structura modernă bazată pe MobileHome, adaptată cu grid desktop
  if (!isMobile) {
    return (
      <div className="mhome mhome--desktop animate-fade-in">
        {/* ── Card de salut Desktop ── */}
        <div className="mhome-greeting-card card-interactive">
          <div className="mhome-greeting-inner">
            <p className="mhome-greeting-date">{dateLabel}</p>
            <p className="mhome-greeting-title">
              Bună {now.getHours() < 12 ? 'dimineața' : now.getHours() < 18 ? 'ziua' : 'seara'},{' '}
              <strong>{user?.firstName}!</strong>
            </p>
            {todayClasses.length > 0 ? (
              <p className="mhome-greeting-sub">
                {todayClasses.length} {todayClasses.length === 1 ? 'oră' : 'ore'} astăzi ·{' '}
                prima oră la <strong>{todayClasses[0].startTime}</strong>
              </p>
            ) : (
              <p className="mhome-greeting-sub">
                {todayKey ? 'Nicio oră programată astăzi.' : 'Weekend liber! 🎉'}
              </p>
            )}
          </div>
          <div className="mhome-greeting-icon" aria-hidden="true">
            <img
              src="/logo.png"
              alt="Oktapod"
              style={{ width: '64px', height: '64px', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* ── Grid cu 2 coloane pe Desktop ── */}
        <div className="mhome-desktop-grid">
          {/* Coloana Stânga: Ce ai de făcut & Orar de azi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Ce ai de făcut */}
            <section className="mhome-section card card-interactive" style={{ margin: 0, padding: '1.25rem' }}>
              <div className="mhome-section-header" style={{ marginBottom: '1rem' }}>
                <h2 className="mhome-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>Ce ai de făcut</h2>
                <Link to="/groups" className="mhome-section-link" style={{ margin: 0 }}>
                  Toate temele <ArrowRight size={14} />
                </Link>
              </div>

              {pendingAssignments.length > 0 ? (
                <div className="mhome-task-list">
                  {pendingAssignments.map(({ group, assignment }) => {
                    const typeKey = Object.keys(ASSIGNMENT_TYPE_LABEL).find((k) =>
                      assignment.title.toUpperCase().includes(k),
                    ) ?? 'HOMEWORK';
                    const TaskIcon = ASSIGNMENT_TYPE_ICON[typeKey] ?? ClipboardList;
                    const label = ASSIGNMENT_TYPE_LABEL[typeKey] ?? 'Temă';
                    const typeClass = ASSIGNMENT_TYPE_CLASS[typeKey] ?? 'task-type-homework';

                    return (
                      <Link
                        key={assignment.id}
                        to={`/groups/${group.id}`}
                        className="mhome-task-item"
                      >
                        <span className={`mhome-task-icon ${typeClass}`}>
                          <TaskIcon size={18} />
                        </span>
                        <span className="mhome-task-body">
                          <span className="mhome-task-name">{assignment.title}</span>
                          <span className="mhome-task-deadline">
                            {group.name} • {formatDeadline(assignment.dueAt)}
                          </span>
                        </span>
                        <span className={`mhome-task-badge ${typeClass}`}>
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="mhome-empty-text">✓ Toate temele sunt la zi. Bravo!</p>
              )}
            </section>

            {/* Orar astăzi */}
            <section className="mhome-section card card-interactive" style={{ margin: 0, padding: '1.25rem' }}>
              <div className="mhome-section-header" style={{ marginBottom: '1rem' }}>
                <h2 className="mhome-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                  Orar astăzi ({todayClasses.length} {todayClasses.length === 1 ? 'oră' : 'ore'})
                </h2>
                <Link to="/timetable" className="mhome-section-link" style={{ margin: 0 }}>
                  Orar complet <ArrowRight size={14} />
                </Link>
              </div>

              {todayClasses.length === 0 ? (
                <p className="mhome-empty-text">
                  {todayKey ? 'Nu ai cursuri programate astăzi.' : 'Weekend! Fără ore programate astăzi.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {todayClasses.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.625rem 0.875rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: '0.5rem',
                        borderLeft: '4px solid var(--primary)',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          {c.subject?.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          Prof. {c.teacher?.lastName} {c.teacher?.firstName} {c.room ? `• Sala ${c.room}` : ''}
                        </span>
                      </div>
                      <span className="badge badge-teacher" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {c.startTime} - {c.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Coloana Dreapta: Notificări & Evenimente & Link Catalog */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Catalog Card */}
            <div className="card card-interactive" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                    Situație Școlară & Catalog
                  </h2>
                  <Link to="/catalog" className="mhome-section-link" style={{ margin: 0 }}>
                    Catalog <ArrowRight size={14} />
                  </Link>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  Accesează rapid situația mediilor, notele din semestru și evidența absențelor motivate și nemotivate.
                </p>
              </div>
              <Link to="/catalog" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                Deschide Catalogul Electronic
              </Link>
            </div>

            {/* Notificări recente */}
            <section className="mhome-section card card-interactive" style={{ margin: 0, padding: '1.25rem' }}>
              <div className="mhome-section-header" style={{ marginBottom: '1rem' }}>
                <h2 className="mhome-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>Notificări noi</h2>
                <Link to="/notifications" className="mhome-section-link" style={{ margin: 0 }}>
                  <Bell size={14} /> {notifications.length}
                </Link>
              </div>

              {notifications.length > 0 ? (
                <div className="mhome-notif-list">
                  {notifications.map((n) => (
                    <Link key={n.id} to="/notifications" className="mhome-notif-item">
                      <span className="mhome-notif-dot" />
                      <span className="mhome-notif-body">
                        <span className="mhome-notif-title">{n.title}</span>
                        <span className="mhome-notif-msg">{n.message}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mhome-empty-text">Nu ai notificări noi necitite.</p>
              )}
            </section>

            {/* Noutăți Social Media (Discord / WhatsApp / IG) */}
            {socialPosts.length > 0 && (
              <section className="mhome-section card card-interactive" style={{ margin: 0, padding: '1.25rem' }}>
                <div className="mhome-section-header" style={{ marginBottom: '1rem' }}>
                  <h2 className="mhome-section-title" style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={18} color="var(--primary)" /> Noutăți Cluburi & Social Media
                  </h2>
                  <Link to="/news" className="mhome-section-link" style={{ margin: 0 }}>
                    Toate știrile <ArrowRight size={14} />
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {socialPosts.map((sp) => (
                    <Link
                      key={sp.id}
                      to="/news"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: sp.channel === 'DISCORD' ? '#5865f2' : sp.channel === 'WHATSAPP' ? '#25d366' : '#e1306c',
                          color: '#fff',
                        }}>
                          {sp.channel}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(sp.createdAt).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                        {sp.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sp.content}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* În liceu (evenimente) */}
            {events.length > 0 && (
              <section className="mhome-section card card-interactive" style={{ margin: 0, padding: '1.25rem' }}>
                <div className="mhome-section-header" style={{ marginBottom: '1rem' }}>
                  <h2 className="mhome-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>În liceu</h2>
                  <Link to="/calendar" className="mhome-section-link" style={{ margin: 0 }}>
                    Calendar
                  </Link>
                </div>
                <div className="mhome-event-list">
                  {events.map((e) => (
                    <div key={e.id} className="mhome-event-item">
                      <div className="mhome-event-thumb" aria-hidden="true">
                        <Monitor size={26} strokeWidth={1.2} color="var(--mobile-school-color)" />
                      </div>
                      <div className="mhome-event-body">
                        <span className="mhome-event-title">{e.title}</span>
                        <span className="mhome-event-date">
                          {new Date(e.startsAt).toLocaleDateString('ro-RO', {
                            day: 'numeric',
                            month: 'long',
                          })}{' '}
                          {e.description ? `· ${e.description.slice(0, 50)}` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mhome">
      {/* ── Card de salut ── */}
      <div className="mhome-greeting-card">
        <div className="mhome-greeting-inner">
          <p className="mhome-greeting-date">{dateLabel}</p>
          <p className="mhome-greeting-title">
            Bună {now.getHours() < 12 ? 'dimineața' : now.getHours() < 18 ? 'ziua' : 'seara'},{' '}
            <strong>{user?.firstName}!</strong>
          </p>
          {todayClasses.length > 0 ? (
            <p className="mhome-greeting-sub">
              {todayClasses.length} {todayClasses.length === 1 ? 'oră' : 'ore'} astăzi ·{' '}
              prima la {todayClasses[0].startTime}
            </p>
          ) : (
            <p className="mhome-greeting-sub">
              {todayKey ? 'Nicio oră programată astăzi' : 'Weekend liber 🎉'}
            </p>
          )}
        </div>
        <div className="mhome-greeting-icon" aria-hidden="true">
          <img
            src="/logo.png"
            alt="Oktapod"
            style={{ width: '52px', height: '52px', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* ── Ce ai de făcut ── */}
      {pendingAssignments.length > 0 && (
        <section className="mhome-section">
          <h2 className="mhome-section-title">Ce ai de făcut</h2>
          <div className="mhome-task-list">
            {pendingAssignments.map(({ group, assignment }) => {
              const IconComp = ASSIGNMENT_TYPE_ICON[assignment.progress?.status ?? ''] ?? ClipboardList;
              // Determinăm tipul din titlu dacă nu avem un câmp explicit
              const typeKey = Object.keys(ASSIGNMENT_TYPE_LABEL).find((k) =>
                assignment.title.toUpperCase().includes(k),
              ) ?? 'HOMEWORK';
              const TaskIcon = ASSIGNMENT_TYPE_ICON[typeKey] ?? ClipboardList;
              const label = ASSIGNMENT_TYPE_LABEL[typeKey] ?? 'Temă';
              const typeClass = ASSIGNMENT_TYPE_CLASS[typeKey] ?? 'task-type-homework';

              return (
                <Link
                  key={assignment.id}
                  to={`/groups/${group.id}`}
                  className="mhome-task-item"
                >
                  <span className={`mhome-task-icon ${typeClass}`}>
                    <TaskIcon size={18} />
                  </span>
                  <span className="mhome-task-body">
                    <span className="mhome-task-name">{assignment.title}</span>
                    <span className="mhome-task-deadline">{formatDeadline(assignment.dueAt)}</span>
                  </span>
                  <span className={`mhome-task-badge ${typeClass}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
          {pendingAssignments.length === 6 && (
            <Link to="/groups" className="mhome-see-all">
              Vezi toate temele <ArrowRight size={14} />
            </Link>
          )}
        </section>
      )}

      {pendingAssignments.length === 0 && (
        <section className="mhome-section">
          <h2 className="mhome-section-title">Ce ai de făcut</h2>
          <p className="mhome-empty-text">✓ Toate temele sunt la zi. Bravo!</p>
        </section>
      )}

      {/* ── Noutăți Social Media (Mobil) ── */}
      {socialPosts.length > 0 && (
        <section className="mhome-section">
          <div className="mhome-section-header">
            <h2 className="mhome-section-title">Noutăți & Social Hub</h2>
            <Link to="/news" className="mhome-section-link">Vezi toate</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {socialPosts.map((sp) => (
              <Link
                key={sp.id}
                to="/news"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: sp.channel === 'DISCORD' ? '#5865f2' : sp.channel === 'WHATSAPP' ? '#25d366' : '#e1306c',
                    color: '#fff',
                  }}>
                    {sp.channel}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(sp.createdAt).toLocaleDateString('ro-RO')}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {sp.title}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Notificări necitite ── */}
      {notifications.length > 0 && (
        <section className="mhome-section">
          <div className="mhome-section-header">
            <h2 className="mhome-section-title">Notificări noi</h2>
            <Link to="/notifications" className="mhome-section-link">
              <Bell size={14} /> {notifications.length}
            </Link>
          </div>
          <div className="mhome-notif-list">
            {notifications.map((n) => (
              <Link key={n.id} to="/notifications" className="mhome-notif-item">
                <span className="mhome-notif-dot" />
                <span className="mhome-notif-body">
                  <span className="mhome-notif-title">{n.title}</span>
                  <span className="mhome-notif-msg">{n.message}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── În liceu (evenimente) ── */}
      {events.length > 0 && (
        <section className="mhome-section">
          <div className="mhome-section-header">
            <h2 className="mhome-section-title">În liceu</h2>
            <Link to="/calendar" className="mhome-section-link">Calendar</Link>
          </div>
          <div className="mhome-event-list">
            {events.map((e) => (
              <div key={e.id} className="mhome-event-item">
                <div className="mhome-event-thumb" aria-hidden="true">
                  <Monitor size={26} strokeWidth={1.2} color="var(--mobile-school-color)" />
                </div>
                <div className="mhome-event-body">
                  <span className="mhome-event-title">{e.title}</span>
                  <span className="mhome-event-date">
                    {new Date(e.startsAt).toLocaleDateString('ro-RO', {
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    {e.description ? `· ${e.description.slice(0, 40)}` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
