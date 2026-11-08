import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiClient } from '../api/client';
import { 
  BookOpen, 
  Calendar, 
  Bell, 
  User, 
  LogOut, 
  Shield, 
  Home,
  List,
  Clock,
  GraduationCap,
  FileCheck,
  Compass,
  Sun,
  Moon
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [schoolName, setSchoolName] = useState<string>('');

  // Dark Mode State with LocalStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('hssa_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('hssa_theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('hssa_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    if (!user) return;
    apiClient<{ name: string }>('/api/v1/admin/school')
      .then((s) => setSchoolName(s.name))
      .catch(() => setSchoolName('HSSA Portal'));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const notifs = await apiClient<any[]>('/api/v1/notifications');
        const unread = notifs.filter((n) => !n.readAt).length;
        setUnreadCount(unread);
      } catch {
        // Ignoră erorile temporare
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar cu scrollbar propriu */}
      <aside className="desktop-sidebar">
        {/* Header Sidebar — Nume școală cu verde ca pe mobil */}
        <div className="desktop-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--mobile-school-color-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--mobile-school-color)',
            }}>
              <BookOpen size={20} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--mobile-school-color)',
                margin: 0,
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {schoolName || 'HSSA Portal'}
              </h2>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <span className={`badge badge-${user.role.toLowerCase()}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                    {user.role}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.firstName} {user.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Bar (Independent scroll) */}
        <nav 
          className="custom-scrollbar"
          style={{ 
            padding: '1rem 0.85rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.3rem', 
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Meniu Principal
          </div>
          <Link to="/" className={`desktop-nav-link ${isActive('/') ? 'desktop-nav-link--active' : ''}`}>
            <Home size={18} /> <span>Acasă</span>
          </Link>
          <Link to="/groups" className={`desktop-nav-link ${isActive('/groups') ? 'desktop-nav-link--active' : ''}`}>
            <BookOpen size={18} /> <span>Materii & Grupuri</span>
          </Link>
          <Link to="/timetable" className={`desktop-nav-link ${isActive('/timetable') ? 'desktop-nav-link--active' : ''}`}>
            <Clock size={18} /> <span>Orar Școlar</span>
          </Link>
          <Link to="/catalog" className={`desktop-nav-link ${isActive('/catalog') ? 'desktop-nav-link--active' : ''}`}>
            <GraduationCap size={18} /> <span>Catalog Electronic</span>
          </Link>
          <Link to="/clubs" className={`desktop-nav-link ${isActive('/clubs') ? 'desktop-nav-link--active' : ''}`}>
            <Compass size={18} /> <span>Cluburi & Activități</span>
          </Link>
          <Link to="/exams" className={`desktop-nav-link ${isActive('/exams') ? 'desktop-nav-link--active' : ''}`}>
            <FileCheck size={18} /> <span>Teste & Examene</span>
          </Link>
          <Link to="/calendar" className={`desktop-nav-link ${isActive('/calendar') ? 'desktop-nav-link--active' : ''}`}>
            <Calendar size={18} /> <span>Calendar Școlar</span>
          </Link>

          {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
            <>
              <div style={{ margin: '1rem 0 0.35rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Management Școală
              </div>
              <Link to="/classes" className={`desktop-nav-link ${isActive('/classes') ? 'desktop-nav-link--active' : ''}`}>
                <List size={18} /> <span>Clase</span>
              </Link>
              <Link to="/subjects" className={`desktop-nav-link ${isActive('/subjects') ? 'desktop-nav-link--active' : ''}`}>
                <BookOpen size={18} /> <span>Gestionare Materii</span>
              </Link>
            </>
          )}

          <div style={{ margin: '1rem 0 0.35rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contul Meu
          </div>
          <Link to="/notifications" className={`desktop-nav-link ${isActive('/notifications') ? 'desktop-nav-link--active' : ''}`}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="nav-badge-pill">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>Notificări</span>
          </Link>
          <Link to="/profile" className={`desktop-nav-link ${isActive('/profile') ? 'desktop-nav-link--active' : ''}`}>
            <User size={18} /> <span>Profilul meu</span>
          </Link>

          {user?.role === 'ADMIN' && (
            <>
              <div style={{ margin: '1rem 0 0.35rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Administrare
              </div>
              <Link to="/admin" className={`desktop-nav-link ${isActive('/admin') ? 'desktop-nav-link--active' : ''}`}>
                <Shield size={18} /> <span>Școală & Audit</span>
              </Link>
            </>
          )}
        </nav>

        {/* Footer Sidebar: Dark Mode Toggle & Deconectare */}
        <div className="desktop-sidebar-footer">
          {/* Buton Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.85rem' }}
            title="Schimbă tema de culori"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isDarkMode ? <Moon size={16} color="var(--warning)" /> : <Sun size={16} color="var(--warning)" />}
              <span>{isDarkMode ? 'Mod Întunecat' : 'Mod Luminos'}</span>
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {isDarkMode ? 'ON' : 'OFF'}
            </span>
          </button>

          <button 
            onClick={logout} 
            className="btn btn-outline" 
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
          >
            <LogOut size={16} /> <span>Deconectare</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="desktop-main-wrapper custom-scrollbar">
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
