import { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { VerifyOTP } from './components/VerifyOTP';
import { ResetPassword } from './components/ResetPassword';
import { Layout } from './components/Layout';
import { AdminDashboard } from './components/AdminDashboard';
import { Profile } from './components/Profile';
import { AddSample } from './components/AddSample';
import { Samples } from './components/Samples';
import { SampleDetail } from './components/SampleDetail';
import { Bookings } from './components/Bookings';
import { Protocols } from './components/Protocols';
import { UserManagement } from './components/UserManagement';
import { ActivityLogs } from './components/ActivityLogs';
import { BLEDeviceManager } from './components/BLEDeviceManager';
import { UserDataVisualization } from './components/UserDataVisualization';
import { AdminDataVisualization } from './components/AdminDataVisualization';
import { Toaster } from './components/ui/sonner';
import { initializeStorage, getCurrentUser, setCurrentUser } from './lib/storage';
import { type User, type Sample } from './types';
import authService from './services/auth.service';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

// Admin Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/admin-users" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Initialize storage with mock data - only once
    if (!hasInitialized.current) {
      initializeStorage();
      hasInitialized.current = true;
      
      // Check if user is already logged in - only on initial mount
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // If on auth route, redirect to dashboard
        const authRoutes = ['/login', '/register', '/forgot-password', '/verify-otp', '/reset-password'];
        if (authRoutes.includes(location.pathname)) {
          const targetRoute = currentUser.role === 'admin' ? '/admin-users' : '/samples';
          navigate(targetRoute, { replace: true });
        }
      } else if (location.pathname === '/') {
        // If no user and on root, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, []); // Empty dependency array - only run on mount

  const handleLogin = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      navigate(currentUser.role === 'admin' ? '/admin-users' : '/samples', { replace: true });
    }
  };

  const handleLogout = () => {
    // Clear token from cookies
    authService.logout();
    // Clear user from localStorage
    setCurrentUser(null);
    setUser(null);
    navigate('/login', { replace: true });
  };

  const handleNavigate = (page: string, data?: any) => {
    // Ensure page path starts with / for absolute navigation
    const path = page.startsWith('/') ? page : `/${page}`;
    navigate(path, { state: data });
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  // Get email from location state for OTP and Reset Password pages
  const getEmailFromState = () => {
    const state = location.state as any;
    return state?.email || '';
  };

  const getSampleFromState = () => {
    const state = location.state as any;
    return state as Sample | null;
  };

  return (
    <>
      <Toaster />
      <Routes>
      {/* Auth Routes */}
      <Route 
        path="/login" 
        element={<Login onLogin={handleLogin} />} 
      />
      <Route 
        path="/register" 
        element={<Register />} 
      />
      <Route 
        path="/forgot-password" 
        element={<ForgotPassword />} 
      />
      <Route 
        path="/verify-otp" 
        element={
          getEmailFromState() ? (
            <VerifyOTP 
              email={getEmailFromState()} 
            />
          ) : (
            <Navigate to="/register" replace />
          )
        } 
      />
      <Route 
        path="/reset-password" 
        element={
          getEmailFromState() ? (
            <ResetPassword 
              email={getEmailFromState()} 
              onSuccess={() => navigate('/login')}
            />
          ) : (
            <Navigate to="/forgot-password" replace />
          )
        } 
      />

      <Route
        path="/admin-dashboard"
        element={
          <AdminRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="admin-dashboard"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <AdminDashboard user={user || getCurrentUser()!} onNavigate={handleNavigate} />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="profile"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <Profile user={user || getCurrentUser()!} onUpdate={handleUserUpdate} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/samples"
        element={
          <ProtectedRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="samples"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <Samples user={user || getCurrentUser()!} onNavigate={handleNavigate} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-sample"
        element={
          <ProtectedRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="add-sample"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <AddSample user={user || getCurrentUser()!} onNavigate={handleNavigate} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sample-detail"
        element={
          <ProtectedRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="sample-detail"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              {getSampleFromState() ? (
                <SampleDetail sample={getSampleFromState()!} onNavigate={handleNavigate} />
              ) : (
                <Navigate to="/samples" replace />
              )}
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="bookings"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <Bookings user={user || getCurrentUser()!} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/protocols"
        element={
          <ProtectedRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="protocols"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <Protocols user={user || getCurrentUser()!} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ble-devices"
        element={
          <ProtectedRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="ble-devices"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <BLEDeviceManager />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-visualization"
        element={
          <ProtectedRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="user-visualization"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <UserDataVisualization user={user || getCurrentUser()!} />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-visualization"
        element={
          <AdminRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="admin-visualization"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <AdminDataVisualization user={user || getCurrentUser()!} />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin-users"
        element={
          <AdminRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="admin-users"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <UserManagement currentUser={user || getCurrentUser()!} />
            </Layout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin-logs"
        element={
          <AdminRoute>
            <Layout
              user={user || getCurrentUser()!}
              currentPage="admin-logs"
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            >
              <ActivityLogs />
            </Layout>
          </AdminRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}
