import { Link, useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../../utils/auth';

export default function Header(){
  const navigate = useNavigate();
  const { user } = getAuth();

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-semibold">Mobile Bio Lab</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm">Dashboard</Link>
              <Link to="/profile" className="text-sm">Profile</Link>
              {user.role === 'Admin' && <Link to="/admin" className="text-sm">Admin</Link>}
              <button onClick={logout} className="ml-2 bg-red-500 text-white px-3 py-1 rounded text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm">Login</Link>
              <Link to="/register" className="text-sm bg-green-500 text-white px-3 py-1 rounded">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
