import { useEffect, useState } from 'react';
import { adminVerifyUser, adminSendActivation, adminUpdateUser, adminDeleteUser, adminExportUsers } from '../../api/adminApi';
import { getUsers } from '../../api/userApi';
import { downloadBlob } from '../../utils/pdfUtils';

interface User {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  city?: string;
  isVerified: boolean;
  isActivated?: boolean; // ✅ Added field for activation status
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState<{ role: string; city: string }>({ role: '', city: '' });
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers('startIndex=0&limit=100');
      setUsers(res.data.users || []);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Fetch failed';
      alert(message);
    } finally { setLoading(false); }
  };

  const applyFilter = () => {
    let list = users;
    if (filters.role) list = list.filter(u => u.role === filters.role);
    if (filters.city) list = list.filter(u => (u.city || '').toLowerCase().includes(filters.city.toLowerCase()));
    setUsers(list);
  };

  const resetFilter = () => { fetchUsers(); setFilters({ role: '', city: '' }); };

  const handleVerify = async (id: string | number) => {
    try { await adminVerifyUser(id); alert('Verified'); fetchUsers(); } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Verify failed';
      alert(message);
    }
  };

  const handleSendActivation = async (id: string | number) => {
    try { 
      await adminSendActivation(id); 
      alert('Activation sent'); 
      fetchUsers(); // ✅ Immediately refresh after sending
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Send failed';
      alert(message);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Delete user?')) return;
    try { await adminDeleteUser(id); alert('Deleted'); fetchUsers(); } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Delete failed';
      alert(message);
    }
  };

  const handleEdit = async (id: string | number) => {
    const email = prompt('New VU Email (leave blank to skip):');
    const city = prompt('New City (leave blank to skip):');
    try {
      const fd = new FormData();
      if (email) fd.append('email', email);
      if (city) fd.append('city', city);
      await adminUpdateUser(id, fd);
      alert('Updated');
      fetchUsers();
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Update failed';
      alert(message);
    }
  };

  const exportPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append('role', filters.role);
      if (filters.city) params.append('city', filters.city);
      const res = await adminExportUsers(params.toString());
      downloadBlob(res.data, `users-${Date.now()}.pdf`);
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Export failed';
      alert(message);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-xl mb-4">Users Management</h2>

      <div className="bg-white p-4 rounded shadow mb-4 flex items-center gap-2">
        <select className="p-2 border" value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All roles</option>
          <option value="Student">Student</option>
          <option value="Researcher">Researcher</option>
          <option value="Technician">Technician</option>
        </select>
        <input placeholder="City" className="p-2 border" value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} />
        <button onClick={applyFilter} className="bg-blue-600 text-white px-3 py-1 rounded">Filter</button>
        <button onClick={resetFilter} className="bg-gray-600 text-white px-3 py-1 rounded">Reset</button>
        <button onClick={exportPDF} className="ml-auto bg-green-600 text-white px-3 py-1 rounded">Export PDF</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">#</th><th className="p-2">Name</th><th className="p-2">Email</th>
                <th className="p-2">Role</th><th className="p-2">City</th><th className="p-2">Verified</th><th className="p-2">Activation</th><th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2">{idx + 1}</td>
                  <td className="p-2">{u.firstName} {u.lastName}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.city}</td>
                  <td className="p-2">{u.isVerified ? 'Yes' : 'No'}</td>
                  <td className="p-2">
                    {u.isActivated ? (
                      <span className="text-green-600 font-semibold">Account Activated</span>
                    ) : (
                      <button onClick={() => handleSendActivation(u.id)} className="bg-yellow-500 text-white px-2 py-1 rounded">
                        Send Activation
                      </button>
                    )}
                  </td>
                  <td className="p-2 space-x-1">
                    {!u.isVerified && <button onClick={() => handleVerify(u.id)} className="bg-blue-500 text-white px-2 py-1 rounded">Verify</button>}
                    <button onClick={() => handleEdit(u.id)} className="bg-indigo-500 text-white px-2 py-1 rounded">Edit</button>
                    <button onClick={() => handleDelete(u.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={8} className="p-4 text-center">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
