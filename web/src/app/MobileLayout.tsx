import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../common/ThemeContext';
import { AccentColorPicker } from '../common/AccentColorPicker';
import { apiClient } from '../api/client';
import {
  Home,
  GraduationCap,
  Clock,
  BookOpen,
  Calendar,
  Bell,
  User,
  LogOut,
  Shield,
  List,
  FileCheck,
  Compass,
  MessageSquare,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  MessageSquareHeart,
  Settings,
} from 'lucide-react';
import { FeedbackModal } from '../common/FeedbackModal';

/* ─────────────────────────────────────────────
   Butonul roșu subliniat care toggle-ul sidebar-ului
   Iconul de setări (gear) – singurul buton de setări
───────────────────────────────────────────── */
const BOTTOM_TABS = [
  { path: '/', icon: Home, image: '/tab-home.png', label: 'Acasă' },
  { path: '/groups', icon: BookOpen, image: '/tab-materii.png', label: 'Materii' },
  { path: '/timetable', icon: Clock, image: '/tab-orar.png', label: 'Orar' },
  { path: '/catalog', icon: GraduationCap, image: '/tab-catalog.png', label: 'Catalog' },
  { path: '/clubs', icon: Compass, image: '/tab-cluburi.png', label: 'Cluburi' },
  { path: '/profile', icon: User, image: '/tab-profil.png', label: 'Profil' },
];

/* ─────────────────────────────────────────────
   Secțiuni din drawer (meniu complet)
───────────────────────────────────────────── */
const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { path: '/', icon: Home, label: 'Panou principal' },
      { path: '/catalog', icon: GraduationCap, label: 'Catalog' },
      { path: '/timetable', icon: Clock, label: 'Orar' },
      { path: '/groups', icon: BookOpen, label: 'Grupurile mele' },
      { path: '/exams', icon: FileCheck, label: 'Teste & Examene' },
      { path: '/clubs', icon: Compass, label: 'Cluburi & Activități' },
      { path: '/news', icon: MessageSquare, label: 'Noutăți & Social Hub' },
      { path: '/calendar', icon: Calendar, label: 'Calendar' },
      { path: '/notifications', icon: Bell, label: 'Notificări' },
    ],
  },
  {
    title: 'Management',
    roles: ['ADMIN', 'TEACHER'],
    items: [
      { path: '/classes', icon: List, label: 'Clase' },
      { path: '/subjects', icon: BookOpen, label: 'Materii' },
    ],
  },
  {
    title: 'Contul meu',
    items: [
      { path: '/profile', icon: User, label: 'Profil' },
    ],
  },
  {
    title: 'Administrare',
    roles: ['ADMIN'],
    items: [{ path: '/admin', icon: Shield, label: 'Școală & Audit' }],
  },
];

export const MobileLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [schoolName, setSchoolName] = useState<string>('');
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Polling notificări
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const notifs = await apiClient<any[]>('/api/v1/notifications');
        setUnreadCount(notifs.filter((n) => !n.readAt).length);
      } catch {
        /* ignore */
      }
    };
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 60000);
    return () => clearInterval(iv);
  }, [user, location.pathname]);

  // Fetch numele școlii pentru header
  useEffect(() => {
    if (!user) return;
    apiClient<{ name: string }>('/api/v1/admin/school')
      .then((s) => setSchoolName(s.name))
      .catch(() => setSchoolName('Oktapod'));
  }, [user]);

  // Închide drawer-ul la navigare
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="mobile-layout">
      {/* ── Header mobil cu logo caracatiță și nume liceu stilizat ── */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', zIndex: 2 }}>
          <img
            src="/logo.png"
            alt="Oktapod"
            style={{ width: '26px', height: '26px', objectFit: 'contain' }}
          />
          <span style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            color: 'var(--mobile-school-color)',
            letterSpacing: '-0.02em',
          }}>
            Oktapod
          </span>
        </div>

        {/* Butonul de meniu / drawer */}
        <button
          className="mobile-icon-btn mobile-header-menu-btn"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-label={drawerOpen ? 'Închide meniu' : 'Deschide meniu'}
          style={{
            zIndex: 2,
            marginLeft: 'auto',
          }}
        >
          {unreadCount > 0 && (
            <span className="mobile-header-notif-dot" />
          )}
          <Menu size={22} />
        </button>
      </header>

      {/* ── Conținut principal ── */}
      <main className="mobile-main">
        <Outlet />
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav className="mobile-tab-bar">
        {BOTTOM_TABS.map(({ path, icon: Icon, image, label }) => {
          const active = isActive(path);
          return (
            <Link key={path} to={path} className={`mobile-tab${active ? ' mobile-tab--active' : ''}`}>
              <span className="mobile-tab-icon-wrap">
                {image ? (
                  <img
                    src={image}
                    alt={label}
                    className="mobile-tab-custom-icon"
                    onError={(e) => {
                      // Fallback la LucideIcon dacă imaginea nu se încarcă
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
                )}
              </span>
              <span className="mobile-tab-label">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}

      {/* ── Drawer panel ── */}
      <aside className={`mobile-drawer${drawerOpen ? ' mobile-drawer--open' : ''}`}>
        {/* Header drawer — fără logo Oktapod (cel din header-ul principal este suficient) */}
        <div className="mobile-drawer-header">
          <div>
            <div className="mobile-drawer-title" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--mobile-school-color)', marginBottom: '0.25rem' }}>
              {schoolName || 'Platformă Școlară'}
            </div>
            {user && (
              <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {user.firstName} {user.lastName}
                </span>
              </div>
            )}
          </div>
          <button
            className="mobile-icon-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Închide meniu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigare în drawer */}
        <nav className="mobile-drawer-nav custom-scrollbar">
          {NAV_SECTIONS.map((section, si) => {
            if (section.roles && user && !section.roles.includes(user.role)) return null;

            return (
              <div key={si} className="mobile-drawer-section">
                {section.title && (
                  <div className="mobile-drawer-section-title">{section.title}</div>
                )}
                {section.items.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`mobile-drawer-link${isActive(path) ? ' mobile-drawer-link--active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                    <ChevronRight size={16} className="mobile-drawer-chevron" />
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Footer drawer: Customizare culoare, Dark Mode & Deconectare */}
        <div className="mobile-drawer-footer">
          <div style={{ padding: '0.25rem 0' }}>
            <AccentColorPicker compact={false} />
          </div>

          <button
            onClick={() => {
              setDrawerOpen(false);
              setShowFeedbackModal(true);
            }}
            className="btn btn-outline mobile-drawer-footer-btn"
            style={{ color: '#d97706', borderColor: 'rgba(217, 119, 6, 0.3)' }}
          >
            <MessageSquareHeart size={16} /> Trimite Feedback
          </button>

          <button
            onClick={toggleDarkMode}
            className="btn btn-outline mobile-drawer-footer-btn"
            title="Schimbă tema"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isDarkMode ? (
                <Moon size={16} color="var(--warning)" />
              ) : (
                <Sun size={16} color="var(--warning)" />
              )}
              {isDarkMode ? 'Mod Întunecat' : 'Mod Luminos'}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {isDarkMode ? 'ON' : 'OFF'}
            </span>
          </button>
          <button
            onClick={logout}
            className="btn btn-outline mobile-drawer-footer-btn"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={16} /> Deconectare
          </button>
        </div>
      </aside>

      {/* Modal Feedback integrat în mobil */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
};
