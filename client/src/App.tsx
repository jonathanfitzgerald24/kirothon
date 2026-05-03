import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DemoProvider } from '@/contexts/DemoContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { InvitationPage } from '@/pages/InvitationPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PortalFolderPage } from '@/pages/PortalFolderPage';
import { PortalFilePage } from '@/pages/PortalFilePage';
import { UploadPage } from '@/pages/UploadPage';
import { UploadHistoryPage } from '@/pages/UploadHistoryPage';
import { SearchPage } from '@/pages/SearchPage';
import { AdminArchitecturePage } from '@/pages/AdminArchitecturePage';
import { AdminUsersPage } from '@/pages/AdminUsersPage';
import { AdminAuditPage } from '@/pages/AdminAuditPage';
import { AdminDriveSyncPage } from '@/pages/AdminDriveSyncPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DemoProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/invite/:token" element={<InvitationPage />} />

                {/* Protected routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/portal/folder/:categoryId" element={<PortalFolderPage />} />
                  <Route path="/portal/file/:fileId" element={<PortalFilePage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/upload/history" element={<UploadHistoryPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/admin/architecture" element={<AdminArchitecturePage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/audit" element={<AdminAuditPage />} />
                  <Route path="/admin/drive-sync" element={<AdminDriveSyncPage />} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </DemoProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
