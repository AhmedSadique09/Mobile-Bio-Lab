import api from './axiosInstance';

export const getUsers = (params?: string) =>
  api.get('/users/getusers' + (params ? `?${params}` : ''));

export const getUser = (userId: number | string) =>
  api.get(`/users/${userId}`);

export const updateProfile = (userId: number | string, formData: FormData) =>
  api.put(`/users/update/${userId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const deleteOwn = (userId: number | string) =>
  api.delete(`/users/delete/${userId}`);

export const activate = (vuId: number | string) =>
  api.get(`/users/activate/${vuId}`);
export const exportOwnProfile = () => api.get('/users/export-profile', { responseType: 'blob' });
