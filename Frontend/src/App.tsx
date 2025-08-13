import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header.tsx';
import Login from './pages/auth/Login.tsx';
import Register from './pages/auth/Register.tsx';
import Activate from './pages/auth/Activate.tsx';
import UserDashboard from './pages/user/UserDashboard.tsx';
import Profile from './pages/user/Profile.tsx';
import AdminDashboard from './pages/admin/AdminDashboard.tsx';
import UsersList from './pages/admin/UsersList.tsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App(){
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/activate/:vuId" element={<Activate/>} />

        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard/></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboard/></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UsersList/></AdminRoute>} />

        <Route path="*" element={<NotFound/>} />
      </Routes>
    </BrowserRouter>
  );
}
