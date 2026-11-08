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
} from 'lucide-react';
import { useMobile } from '../common/useMobile';
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

  // Pe desktop, redă layout-ul compact normal
  if (!isMobile) {
    return <DesktopHome />;
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
          <Monitor size={44} strokeWidth={1.2} color="var(--mobile-school-color)" />
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
