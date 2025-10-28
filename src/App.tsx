import type { FC, ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from './caberu/context/AuthContext';
import { HomePage } from './caberu/pages/HomePage';
import { LoginPage } from './caberu/pages/LoginPage';
import { SignupPage } from './caberu/pages/SignupPage';
import { ClientDashboard } from './caberu/pages/ClientDashboard';
import { ProfessionalDashboard } from './caberu/pages/ProfessionalDashboard';
import { ChatPage } from './caberu/pages/ChatPage';

const queryClient = new QueryClient();

type PrivateRouteProps = {
  children: ReactElement;
  roles?: Array<'client' | 'professional'>;
};

const PrivateRoute: FC<PrivateRouteProps> = ({ children, roles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes: FC = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route
      path="/dashboard/client"
      element={
        <PrivateRoute roles={['client', 'professional']}>
          <ClientDashboard />
        </PrivateRoute>
      }
    />
    <Route
      path="/dashboard/pro"
      element={
        <PrivateRoute roles={['professional']}>
          <ProfessionalDashboard />
        </PrivateRoute>
      }
    />
    <Route
      path="/chat"
      element={
        <PrivateRoute>
          <ChatPage />
        </PrivateRoute>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
      <Sonner />
    </QueryClientProvider>
  );
};

export default App;
