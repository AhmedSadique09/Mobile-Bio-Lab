import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/authApi';
import { saveAuth } from '../../utils/auth';

export default function Login(){
  const [form, setForm] = useState({ vu_email: '', password: '' });
  const navigate = useNavigate();

  const handle = (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await login(form);
      saveAuth(res.data.token, res.data.user);
      if (res.data.user.role === 'Admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Login failed';
      alert(message);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <form onSubmit={submit} className="w-96 bg-white p-6 rounded shadow">
        <h2 className="text-2xl mb-4">Login</h2>
        <input name="vu_email" value={form.vu_email} onChange={handle} placeholder="VU Email" className="w-full p-2 mb-3 border rounded" />
        <input name="password" value={form.password} onChange={handle} type="password" placeholder="Password" className="w-full p-2 mb-4 border rounded" />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
      </form>
    </div>
  );
}
