import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/Toast';
import { FullPageLoader } from '@/components/Loader';
import { AuthPage } from '@/pages/AuthPage';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { StudentsPage } from '@/pages/StudentsPage';
import { CoursesPage } from '@/pages/CoursesPage';
import { AttendancePage } from '@/pages/AttendancePage';

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <AuthPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
