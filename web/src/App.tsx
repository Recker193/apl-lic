import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './common/ThemeContext';
import { RequireAuth, RequireRole } from './app/RouteGuards';
import { Layout } from './app/Layout';
import { MobileLayout } from './app/MobileLayout';
import { useMobile } from './common/useMobile';

import { Login } from './auth/Login';
import { Register } from './auth/Register';
import { ForgotPassword } from './auth/ForgotPassword';
import { ResetPassword } from './auth/ResetPassword';
import { VerifyEmail } from './auth/VerifyEmail';
import { Profile } from './profile/Profile';

import { MobileHome } from './app/MobileHome';
import { GroupsList } from './groups/GroupsList';
import { GroupDetail } from './groups/GroupDetail';
import { NotificationsList } from './notifications/NotificationsList';
import { CalendarView } from './calendar/CalendarView';
import { AdminDashboard } from './admin/AdminDashboard';
import { CatalogView } from './catalog/CatalogView';
import { TimetableView } from './timetable/TimetableView';
import { ClassesView } from './classes/ClassesView';
import { SubjectsView } from './subjects/SubjectsView';
import { ExamsView } from './exams/ExamsView';
import { ClubsView } from './clubs/ClubsView';
import { NewsHubView } from './news/NewsHubView';

/**
 * Alege layout-ul potrivit în funcție de dimensiunea ecranului.
 * Pe mobil (< 768 px) se folosește MobileLayout cu bottom tab bar.
 * Pe desktop se folosește Layout-ul clasic cu sidebar.
 */
const AppLayout: React.FC = () => {
  const isMobile = useMobile();
  return isMobile ? <MobileLayout /> : <Layout />;
};

/**
 * Componenta Home alege versiunea mobilă sau desktop
 * în funcție de viewport — MobileHome face asta intern.
 */
const HomeRoute: React.FC = () => <MobileHome />;

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          {/* Rute publice de autentificare */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Rute protejate de sesiune — layout ales dinamic */}
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/groups" element={<GroupsList />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/notifications" element={<NotificationsList />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/catalog" element={<CatalogView />} />
              <Route path="/timetable" element={<TimetableView />} />
              <Route path="/classes" element={<ClassesView />} />
              <Route path="/subjects" element={<SubjectsView />} />
              <Route path="/exams" element={<ExamsView />} />
              <Route path="/clubs" element={<ClubsView />} />
              <Route path="/news" element={<NewsHubView />} />

              {/* Rute exclusiv ADMIN */}
              <Route element={<RequireRole roles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  );
};

export default App;
