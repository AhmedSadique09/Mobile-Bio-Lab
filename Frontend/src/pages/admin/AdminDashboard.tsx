import { Link } from 'react-router-dom';

export default function AdminDashboard(){
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">User Management</h3>
          <p className="text-sm mt-2">Verify, update, delete users and export reports.</p>
          <Link to="/admin/users" className="mt-3 inline-block bg-blue-600 text-white px-3 py-1 rounded">Open Users</Link>
        </div>
      </div>
    </div>
  );
}
