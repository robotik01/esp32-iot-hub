import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';

import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import DevicesPage from './pages/DevicesPage';
import MonitoringPage from './pages/MonitoringPage';
import AutomationPage from './pages/AutomationPage';
import SettingsPage from './pages/SettingsPage';
import UsersPage from './pages/UsersPage';
import SerialConfigPage from './pages/SerialConfigPage';

import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Main Layout Component
const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// App Routes
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout><HomePage /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout><DashboardPage /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/devices" element={
        <ProtectedRoute>
          <MainLayout><DevicesPage /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/monitoring" element={
        <ProtectedRoute>
          <MainLayout><MonitoringPage /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/automation" element={
        <ProtectedRoute>
          <MainLayout><AutomationPage /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout><SettingsPage /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute>
          <MainLayout><UsersPage /></MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/serial" element={
        <ProtectedRoute>
          <MainLayout><SerialConfigPage /></MainLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <DeviceProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DeviceProvider>
    </AuthProvider>
  );
}

export default App;
