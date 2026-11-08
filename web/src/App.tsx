import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RequireAuth, RequireRole } from './app/RouteGuards';
import { Layout } from './app/Layout';

import { Login } from './auth/Login';
import { Register } from './auth/Register';
import { ForgotPassword } from './auth/ForgotPassword';
import { ResetPassword } from './auth/ResetPassword';
import { VerifyEmail } from './auth/VerifyEmail';
import { Profile } from './profile/Profile';

import { Home } from './app/Home';
import { GroupsList } from './groups/GroupsList';
import { GroupDetail } from './groups/GroupDetail';
import { NotificationsList } from './notifications/NotificationsList';
import { CalendarView } from './calendar/CalendarView';
import { AdminDashboard } from './admin/AdminDashboard';
import { CatalogView } from './catalog/CatalogView';
import { TimetableView } from './timetable/TimetableView';
import { ClassesView } from './classes/ClassesView';
import { SubjectsView } from './subjects/SubjectsView';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rute publice de autentificare */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Rute protejate de sesiune */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/groups" element={<GroupsList />} />
              <Route path="/groups/:id" element={<GroupDetail />} />
              <Route path="/notifications" element={<NotificationsList />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/catalog" element={<CatalogView />} />
              <Route path="/timetable" element={<TimetableView />} />
              <Route path="/classes" element={<ClassesView />} />
              <Route path="/subjects" element={<SubjectsView />} />

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
    </BrowserRouter>
  );
};

export default App;
