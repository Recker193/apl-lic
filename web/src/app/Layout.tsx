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

  const navLinkStyle = (path: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.375rem',
    color: location.pathname === path ? 'var(--primary)' : 'var(--text-main)',
    backgroundColor: location.pathname === path ? 'var(--bg-hover)' : 'transparent',
    fontWeight: location.pathname === path ? 600 : 400,
    textDecoration: 'none',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Sidebar cu scrollbar propriu */}
      <aside style={{ 
        width: '260px', 
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-sidebar)', 
        borderRight: '1px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column',
        zIndex: 50,
      }}>
        {/* Header Sidebar */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={22} /> HSSA Portal
          </h2>
          {user && (
            <div style={{ marginTop: '0.5rem' }}>
              <span className={`badge badge-${user.role.toLowerCase()}`}>
                {user.role}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                {user.firstName} {user.lastName}
              </span>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Bar (Independent scroll) */}
        <nav 
          className="custom-scrollbar"
          style={{ 
            padding: '1rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.25rem', 
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <Link to="/" style={navLinkStyle('/')}>
            <Home size={18} /> Panou principal
          </Link>
          <Link to="/catalog" style={navLinkStyle('/catalog')}>
            <GraduationCap size={18} /> Catalog
          </Link>
          <Link to="/timetable" style={navLinkStyle('/timetable')}>
            <Clock size={18} /> Orar
          </Link>
          <Link to="/groups" style={navLinkStyle('/groups')}>
            <BookOpen size={18} /> Grupurile mele
          </Link>
          <Link to="/exams" style={navLinkStyle('/exams')}>
            <FileCheck size={18} /> Teste & Examene
          </Link>
          <Link to="/clubs" style={navLinkStyle('/clubs')}>
            <Compass size={18} /> Cluburi & Activități
          </Link>
          <Link to="/calendar" style={navLinkStyle('/calendar')}>
            <Calendar size={18} /> Calendar
          </Link>

          {(user?.role === 'ADMIN' || user?.role === 'TEACHER') && (
            <>
              <div style={{ margin: '1rem 0 0.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Management Școală
              </div>
              <Link to="/classes" style={navLinkStyle('/classes')}>
                <List size={18} /> Clase
              </Link>
              <Link to="/subjects" style={navLinkStyle('/subjects')}>
                <BookOpen size={18} /> Materii
              </Link>
            </>
          )}

          <div style={{ margin: '1rem 0 0.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Contul Meu
          </div>
          <Link to="/notifications" style={navLinkStyle('/notifications')}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '0.65rem',
                  width: '14px',
                  height: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span>Notificări</span>
          </Link>
          <Link to="/profile" style={navLinkStyle('/profile')}>
            <User size={18} /> Profil
          </Link>

          {user?.role === 'ADMIN' && (
            <>
              <div style={{ margin: '1rem 0 0.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Administrare
              </div>
              <Link to="/admin" style={navLinkStyle('/admin')}>
                <Shield size={18} /> Școală & Audit
              </Link>
            </>
          )}
        </nav>

        {/* Footer Sidebar: Dark Mode Toggle & Deconectare */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {isDarkMode ? 'ON' : 'OFF'}
            </span>
          </button>

          <button 
            onClick={logout} 
            className="btn btn-outline" 
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
          >
            <LogOut size={16} /> Deconectare
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
