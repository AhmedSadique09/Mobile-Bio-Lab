import { getAuth } from '../../utils/auth';
import { Link } from 'react-router-dom';

export default function UserDashboard(){
  const { user } = getAuth();
  const toStringOr = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback;
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl mb-4">Welcome, {toStringOr(user?.firstName, toStringOr(user?.vuId, toStringOr(user?.email)))}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Your Info</h3>
          <p><strong>Role:</strong> {toStringOr(user?.role)}</p>
          <p><strong>City:</strong> {toStringOr(user?.city, 'N/A')}</p>
          <div className="mt-3">
            <Link to="/profile" className="bg-blue-600 text-white px-3 py-1 rounded">Manage Profile</Link>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Export</h3>
          <p>Download your profile as PDF.</p>
          <a href="#" onClick={(e)=>{e.preventDefault(); window.open('http://localhost:3000/api/users/export-profile','_blank')}} className="mt-2 inline-block bg-green-600 text-white px-3 py-1 rounded">Export PDF</a>
        </div>
      </div>
    </div>
  );
}
