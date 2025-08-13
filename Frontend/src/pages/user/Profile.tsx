import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { getAuth, clearAuth } from '../../utils/auth';
import { updateProfile, deleteOwn, exportOwnProfile } from '../../api/userApi';
import { downloadBlob } from '../../utils/pdfUtils';
import { useNavigate, Navigate } from 'react-router-dom';

export default function Profile(){
  const { user } = getAuth();
  const userId = String((user as any)?.id ?? '');
  if (!user) return <Navigate to="/login" replace />;
  const [form, setForm] = useState<{
    firstName: string;
    lastName: string;
    mobile: string;
    email: string;
    city: string;
    oldPassword: string;
    newPassword: string;
    profilePicture: File | null;
  }>({ firstName:'', lastName:'', mobile:'', email:'', city:'', oldPassword:'', newPassword:'', profilePicture:null });
  const navigate = useNavigate();

  useEffect(()=> {
    if (user) {
      setForm(prev => ({
        ...prev,
        firstName: String((user as any).firstName ?? ''),
        lastName: String((user as any).lastName ?? ''),
        mobile: String((user as any).mobile ?? ''),
        email: String((user as any).email ?? ''),
        city: String((user as any).city ?? ''),
      }));
    }
  }, [user]);

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    if (name === 'profilePicture') {
      const file = e.target.files?.[0] ?? null;
      setForm({ ...form, profilePicture: file });
    } else {
      setForm({ ...form, [name]: e.target.value });
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const data = new FormData();
      if (form.firstName) data.append('firstName', form.firstName);
      if (form.lastName) data.append('lastName', form.lastName);
      if (form.mobile) data.append('mobile', form.mobile);
      if (form.email) data.append('email', form.email);
      if (form.city) data.append('city', form.city);
      if (form.oldPassword) data.append('oldPassword', form.oldPassword);
      if (form.newPassword) data.append('newPassword', form.newPassword);
      if (form.profilePicture) data.append('profilePicture', form.profilePicture);

      await updateProfile(userId, data);
      alert('Profile updated. Please login again.');
      clearAuth();
      navigate('/login');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Update failed';
      alert(message);
    }
  };

  const doDelete = async () => {
    if (!confirm('Delete your account?')) return;
    try {
      await deleteOwn(userId);
      alert('Account deleted');
      clearAuth();
      navigate('/register');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Delete failed';
      alert(message);
    }
  };

  const downloadProfile = async () => {
    try {
      const res = await exportOwnProfile();
      downloadBlob(res.data, `profile-${userId}.pdf`);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'PDF failed';
      alert(message);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-xl mb-4">Your Profile</h2>
      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3 w-full md:w-2/3">
        <div className="grid grid-cols-2 gap-2">
          <input name="firstName" value={form.firstName} onChange={handle} placeholder="First name" className="p-2 border rounded" />
          <input name="lastName" value={form.lastName} onChange={handle} placeholder="Last name" className="p-2 border rounded" />
        </div>
        <input name="mobile" value={form.mobile} onChange={handle} placeholder="Mobile" className="p-2 border rounded w-full" />
        <input name="email" value={form.email} onChange={handle} placeholder="Email" className="p-2 border rounded w-full" />
        <input name="city" value={form.city} onChange={handle} placeholder="City" className="p-2 border rounded w-full" />
        <div className="grid grid-cols-2 gap-2">
          <input name="oldPassword" onChange={handle} placeholder="Old password" type="password" className="p-2 border rounded" />
          <input name="newPassword" onChange={handle} placeholder="New password" type="password" className="p-2 border rounded" />
        </div>
        <input name="profilePicture" type="file" onChange={handle} className="p-2 border rounded w-full" />
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Update Profile</button>
          <button type="button" onClick={downloadProfile} className="bg-green-600 text-white px-4 py-2 rounded">Export PDF</button>
          <button type="button" onClick={doDelete} className="bg-red-500 text-white px-4 py-2 rounded">Delete Account</button>
        </div>
      </form>
    </div>
  );
}
