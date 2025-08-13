import api from './axiosInstance';

export const adminGetUsers = (params?: string) =>
  api.get('/users/getusers' + (params ? `?${params}` : ''));

export const adminVerifyUser = (userId: number | string) =>
  api.put(`/admin/verify/${userId}`);

export const adminSendActivation = (userId: number | string) =>
  api.post(`/admin/send-activation/${userId}`);

export const adminUpdateUser = (userId: number | string, formData: FormData) =>
  api.put(`/admin/update-user/${userId}`, formData, { headers: {'Content-Type':'multipart/form-data'} });

export const adminDeleteUser = (userId: number | string) =>
  api.delete(`/admin/delete-user/${userId}`);

export const adminExportUsers = (params?: string) =>
  api.get('/admin/export-users' + (params ? `?${params}` : ''), { responseType: 'blob' });
