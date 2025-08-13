import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../api/authApi';

export default function Register(){
  const [form, setForm] = useState<{ 
    first_name: string; 
    last_name: string; 
    vu_id: string; 
    vu_email: string; 
    mobile_number: string; 
    role: string; 
    city: string; 
    password: string; 
    confirm_password: string; 
    profile_picture: File | null 
  }>({
    first_name:'', last_name:'', vu_id:'', vu_email:'', mobile_number:'', role:'Student', city:'', password:'', confirm_password:'', profile_picture:null
  });
  const navigate = useNavigate();

  const handle = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    if (name === 'profile_picture' && 'files' in e.target) {
      const file = (e.target as HTMLInputElement).files?.[0] ?? null;
      setForm({ ...form, profile_picture: file });
    } else {
      setForm({ ...form, [name]: (e.target as HTMLInputElement | HTMLSelectElement).value });
    }
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.password || form.password !== form.confirm_password) return alert('Password mismatch');
    try {
      const data = new FormData();
      data.append('first_name', form.first_name);
      data.append('last_name', form.last_name);
      data.append('vu_id', form.vu_id);
      data.append('vu_email', form.vu_email);
      data.append('mobile_number', form.mobile_number);
      data.append('role', form.role);
      data.append('city', form.city);
      data.append('password', form.password);
      if (form.profile_picture) data.append('profile_picture', form.profile_picture);

      await register(data);
      alert('Registered. Wait for admin verification.');
      navigate('/login');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Register failed';
      alert(message);
    }
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-64px)]">
      <form onSubmit={submit} className="w-96 bg-white p-6 rounded shadow space-y-2">
        <h2 className="text-2xl">Register</h2>
        <input name="first_name" placeholder="First name" onChange={handle} className="w-full p-2 border rounded" />
        <input name="last_name" placeholder="Last name" onChange={handle} className="w-full p-2 border rounded" />
        <input name="vu_id" placeholder="VU ID (e.g. BC22...)" onChange={handle} className="w-full p-2 border rounded" />
        <input name="vu_email" type="email" placeholder="VU Email" onChange={handle} className="w-full p-2 border rounded" />
        <input name="mobile_number" placeholder="Mobile number" onChange={handle} className="w-full p-2 border rounded" />
        <select name="role" value={form.role} onChange={handle} className="w-full p-2 border rounded">
          <option>Student</option><option>Researcher</option><option>Technician</option>
        </select>
        <input name="city" placeholder="City" onChange={handle} className="w-full p-2 border rounded" />
        <input name="password" type="password" placeholder="Password" onChange={handle} className="w-full p-2 border rounded" />
        <input name="confirm_password" type="password" placeholder="Confirm password" onChange={handle} className="w-full p-2 border rounded" />
        <input name="profile_picture" type="file" onChange={handle} className="w-full p-2 border rounded" />
        <button className="w-full bg-green-600 text-white p-2 rounded">Register</button>
      </form>
    </div>
  );
}
