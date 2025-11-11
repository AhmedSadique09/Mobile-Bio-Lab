import { HttpService } from './base.service';

class AdminService extends HttpService {
  /**
   * Get all users with search and pagination
   * @param page Page number
   * @param search Search term
   */
  getUsers = async (page: number = 1, search: string = '') => {
    return this.get('admin/users', { page, search });
  };

  /**
   * Update user details
   * @param userId User ID
   * @param userData User data to update (FormData or object)
   */
  editUser = async (userId: number, userData: FormData | {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    city?: string;
    profilePicture?: File | string;
  }) => {
    return this.put(`admin/users/${userId}`, userData, {
      headers: userData instanceof FormData ? {
        'Content-Type': 'multipart/form-data'
      } : {}
    });
  };

  /**
   * Delete a user
   * @param userId User ID
   */
  deleteUser = async (userId: number) => {
    return this.delete(`admin/users/${userId}`);
  };
}

export default new AdminService();

