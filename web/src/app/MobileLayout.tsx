import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Tab-urile afișate în bara de jos (max 5)
───────────────────────────────────────────── */
const BOTTOM_TABS = [
  { path: '/', icon: Home, label: 'Acasă' },
  { path: '/timetable', icon: Clock, label: 'Orar' },
  { path: '/catalog', icon: GraduationCap, label: 'Catalog' },
  { path: '/clubs', icon: Compass, label: 'Cluburi' },
  { path: '/notifications', icon: Bell, label: 'Notificări' },
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
      { path: '/calendar', icon: Calendar, label: 'Calendar' },
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
      { path: '/notifications', icon: Bell, label: 'Notificări' },
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
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => localStorage.getItem('hssa_theme') === 'dark',
  );
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('hssa_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('hssa_theme', 'light');
    }
  }, [isDarkMode]);

  // Polling notificări
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const notifs = await apiClient<any[]>('/api/v1/notifications');
        setUnreadCount(notifs.filter((n) => !n.readAt).length);
      } catch {
        /* ignore */
      }
    };
    fetch();
    const iv = setInterval(fetch, 60000);
    return () => clearInterval(iv);
  }, [user, location.pathname]);

  // Închide drawer-ul la navigare
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="mobile-layout">
      {/* ── Header mobil ── */}
      <header className="mobile-header">
        <span className="mobile-header-logo">HSSA</span>
        <div className="mobile-header-right">
          {user && (
            <span className={`badge badge-${user.role.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
              {user.firstName}
            </span>
          )}
          <button
            className="mobile-icon-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Deschide meniu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ── Conținut principal ── */}
      <main className="mobile-main">
        <Outlet />
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav className="mobile-tab-bar">
        {BOTTOM_TABS.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          const isNotif = path === '/notifications';
          return (
            <Link key={path} to={path} className={`mobile-tab${active ? ' mobile-tab--active' : ''}`}>
              <span className="mobile-tab-icon-wrap">
                <Icon size={22} />
                {isNotif && unreadCount > 0 && (
                  <span className="mobile-notif-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
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
        {/* Header drawer */}
        <div className="mobile-drawer-header">
          <div>
            <div className="mobile-drawer-title">HSSA Portal</div>
            {user && (
              <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
            // Filtrare pe rol
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

        {/* Footer drawer */}
        <div className="mobile-drawer-footer">
          <button
            onClick={() => setIsDarkMode((p) => !p)}
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
    </div>
  );
};
