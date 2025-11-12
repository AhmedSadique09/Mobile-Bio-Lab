import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Search, Edit, Trash2, User as UserIcon, ChevronLeft, ChevronRight, Loader2, Upload, Mail, Phone, MapPin, UserCircle, Camera } from 'lucide-react';
import { type User } from '../types';
import adminService from '../services/admin.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface UserManagementProps {
  currentUser: User;
}

interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  city: string;
  role: string;
  profilePicture: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    city: '',
    profilePicture: null as File | null,
    profilePicturePreview: '' as string | null,
  });
  const [initialFormData, setInitialFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    city: '',
    profilePicture: null as File | null,
    profilePicturePreview: '' as string | null,
  });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers(currentPage, searchTerm);
      if (response.statusCode === 200 && response.payload) {
        setUsers(response.payload.users || []);
        setPagination(response.payload.pagination || null);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load users when page changes
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadUsers();
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleDelete = async () => {
    if (deleteUserId) {
      try {
        await adminService.deleteUser(deleteUserId);
        loadUsers();
        setDeleteUserId(null);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleEditClick = (user: UserResponse) => {
    const initialData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      city: user.city,
      profilePicture: null as File | null,
      profilePicturePreview: user.profilePicture ? `http://localhost:4000${user.profilePicture}` : null,
    };
    setEditUser(user);
    setEditFormData(initialData);
    setInitialFormData(initialData);
  };

  // Check if form has changes
  const hasChanges = () => {
    return (
      editFormData.firstName !== initialFormData.firstName ||
      editFormData.lastName !== initialFormData.lastName ||
      editFormData.email !== initialFormData.email ||
      editFormData.mobile !== initialFormData.mobile ||
      editFormData.city !== initialFormData.city ||
      editFormData.profilePicture !== null ||
      editFormData.profilePicturePreview !== initialFormData.profilePicturePreview
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFormData({
        ...editFormData,
        profilePicture: file,
        profilePicturePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstName', editFormData.firstName);
      formData.append('lastName', editFormData.lastName);
      formData.append('email', editFormData.email);
      formData.append('mobile', editFormData.mobile);
      formData.append('city', editFormData.city);
      
      if (editFormData.profilePicture) {
        formData.append('profilePicture', editFormData.profilePicture);
      }

      await adminService.editUser(editUser.id, formData);
      // Update initial data after successful save
      setInitialFormData({
        ...editFormData,
        profilePicture: null, // Reset file after save
      });
      setEditUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'researcher': return 'bg-blue-100 text-blue-800';
      case 'technician': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">User Management</h1>
        <p className="text-gray-600">View and manage system users</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, mobile, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {pagination && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl mt-1">{pagination.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Researchers</p>
              <p className="text-2xl mt-1">{users.filter(u => u.role.toLowerCase() === 'researcher').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Students</p>
              <p className="text-2xl mt-1">{users.filter(u => u.role.toLowerCase() === 'student').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Technicians</p>
              <p className="text-2xl mt-1">{users.filter(u => u.role.toLowerCase() === 'technician').length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users {pagination && `(${pagination.totalUsers})`}</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profilePicture ? `http://localhost:4000${user.profilePicture}` : undefined} />
                        <AvatarFallback>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                          {user.isVerified && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{user.city}</span>
                          <span>•</span>
                          <span>{user.mobile}</span>
                          <span>•</span>
                          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {String(user.id) !== currentUser.id && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteUserId(user.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {users.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Sidebar */}
      <Sheet open={!!editUser} onOpenChange={(open) => {
        if (!open) {
          setEditUser(null);
          // Reset form data when closing
          setEditFormData({
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            city: '',
            profilePicture: null,
            profilePicturePreview: null,
          });
          setInitialFormData({
            firstName: '',
            lastName: '',
            email: '',
            mobile: '',
            city: '',
            profilePicture: null,
            profilePicturePreview: null,
          });
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-6 border-b px-6">
            <SheetTitle className="text-2xl font-semibold text-black">Edit User</SheetTitle>
            <SheetDescription className="text-base mt-2 text-black">
              Update user information and save changes when you're done.
            </SheetDescription>
          </SheetHeader>
          
          <div className="grid gap-6 py-6 px-6">
            {/* Profile Picture Section */}
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <Label className="text-sm font-semibold text-black mb-4 block">
                Profile Picture
              </Label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-2 border-gray-200 shadow-sm">
                    <AvatarImage src={editFormData.profilePicturePreview || undefined} />
                    <AvatarFallback className="text-xl font-semibold bg-gray-100 text-gray-600">
                      {editFormData.firstName[0]}{editFormData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => document.getElementById('profilePicture')?.click()}
                    className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 rounded-full p-2 border-2 border-white shadow-md transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
                <div className="flex-1">
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div>
                    <p className="text-sm text-black font-medium mb-2">Upload a new photo</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full hover:bg-gray-50 text-black"
                      style={{ border: '2px dashed #d1d5db' }}
                      onClick={() => document.getElementById('profilePicture')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {editFormData.profilePicture ? 'Change Photo' : 'Choose File'}
                    </Button>
                    {editFormData.profilePicture && (
                      <p className="text-xs text-gray-500 mt-1">{editFormData.profilePicture.name}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <UserCircle className="h-5 w-5 text-black" />
                <Label className="text-base font-semibold text-black">
                  Personal Information
                </Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-black">
                    First Name
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                      placeholder="First Name"
                      className="pl-10 text-black"
                      style={{ border: '1px solid #d1d5db' }}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-black">
                    Last Name
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                      placeholder="Last Name"
                      className="pl-10 text-black"
                      style={{ border: '1px solid #d1d5db' }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium text-black">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="pl-10 text-black"
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="mobile" className="text-sm font-medium text-black">
                  Mobile Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="mobile"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    placeholder="+92 300 1234567"
                    className="pl-10 text-black"
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="city" className="text-sm font-medium text-black">
                  City
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="city"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    placeholder="City"
                    className="pl-10 text-black"
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-6 mt-20 mb-4 gap-3 px-6 flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setEditUser(null);
                // Reset form data when canceling
                setEditFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  mobile: '',
                  city: '',
                  profilePicture: null,
                  profilePicturePreview: null,
                });
                setInitialFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  mobile: '',
                  city: '',
                  profilePicture: null,
                  profilePicturePreview: null,
                });
              }}
              disabled={saving}
              className="flex-1 text-black hover:bg-gray-50"
              style={{ border: '1px solid #d1d5db' }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditSave} 
              disabled={saving || !hasChanges()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
