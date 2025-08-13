import api from './axiosInstance';

export const register = (formData: FormData) =>
  api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const login = (data: { vu_email: string; password: string }) =>
  api.post('/auth/login', data);
