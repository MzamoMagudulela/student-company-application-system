import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Layouts
import PublicLayout from '@/layouts/PublicLayout';
import StudentLayout from '@/layouts/StudentLayout';
import AdminLayout from '@/layouts/AdminLayout';

// Public & Auth Pages
import HomePage from '@/pages/public/HomePage';
import OpportunitiesPage from '@/pages/public/OpportunitiesPage';
import CVDoctorPublicPage from '@/pages/public/CVDoctorPublicPage';
import LearningPage from '@/pages/public/LearningPage';
import AboutPage from '@/pages/public/AboutPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import AccountRecoveryPage from '@/pages/auth/AccountRecoveryPage';

// Student Workspace Pages
import StudentDashboard from '@/pages/student/StudentDashboard';
import StudentProfilePage from '@/pages/student/StudentProfilePage';
import CVDoctorPage from '@/pages/student/CVDoctorPage';
import CVBuilderPage from '@/pages/student/CVBuilderPage';
import StudentOpportunitiesPage from '@/pages/student/StudentOpportunitiesPage';
import SavedOpportunitiesPage from '@/pages/student/SavedOpportunitiesPage';
import StudentApplicationsPage from '@/pages/student/StudentApplicationsPage';
import StudentOffersPage from '@/pages/student/StudentOffersPage';
import StudentLearningPage from '@/pages/student/StudentLearningPage';
import StudentNotificationsPage from '@/pages/student/StudentNotificationsPage';
import StudentSecurityPage from '@/pages/student/StudentSecurityPage';

// Administrator Workspace Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminStudentsPage from '@/pages/admin/AdminStudentsPage';
import AdminOpportunitiesPage from '@/pages/admin/AdminOpportunitiesPage';
import AdminApplicationsPage from '@/pages/admin/AdminApplicationsPage';
import AdminOffersPage from '@/pages/admin/AdminOffersPage';
import AdminAuditPage from '@/pages/admin/AdminAuditPage';
import AdminRecoveryRequestsPage from '@/pages/admin/AdminRecoveryRequestsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
              {/* Public Experience */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/opportunities" element={<OpportunitiesPage />} />
                <Route path="/cv-doctor" element={<CVDoctorPublicPage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/recovery" element={<AccountRecoveryPage />} />
              </Route>

              {/* Student Experience */}
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<Navigate to="/student/dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="profile" element={<StudentProfilePage />} />
                <Route path="cv-doctor" element={<CVDoctorPage />} />
                <Route path="cv-builder" element={<CVBuilderPage />} />
                <Route path="opportunities" element={<StudentOpportunitiesPage />} />
                <Route path="saved" element={<SavedOpportunitiesPage />} />
                <Route path="applications" element={<StudentApplicationsPage />} />
                <Route path="offers" element={<StudentOffersPage />} />
                <Route path="learning" element={<StudentLearningPage />} />
                <Route path="notifications" element={<StudentNotificationsPage />} />
                <Route path="security" element={<StudentSecurityPage />} />
              </Route>

              {/* Administrator Experience */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="opportunities" element={<AdminOpportunitiesPage />} />
                <Route path="applications" element={<AdminApplicationsPage />} />
                <Route path="offers" element={<AdminOffersPage />} />
                <Route path="learning" element={<LearningPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
                <Route path="recovery-requests" element={<AdminRecoveryRequestsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
