import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, CheckCircle, Loader2, AlertCircle, Edit } from 'lucide-react';
import { type User } from '../types';
import adminService from '../services/admin.service';
import { getCurrentUser, setCurrentUser } from '../lib/storage';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export function Profile({ user, onUpdate }: ProfileProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    mobile: user.mobile,
    city: user.city,
    profilePicture: user.profilePicture || ''
  });
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(
    user.profilePicture ? (user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:4000${user.profilePicture}`) : null
  );
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('mobile', formData.mobile);
      formDataToSend.append('city', formData.city);
      
      if (profilePictureFile) {
        formDataToSend.append('profilePicture', profilePictureFile);
      }

      // Use admin API with user's own ID
      const userId = parseInt(user.id);
      const response = await adminService.editUser(userId, formDataToSend);

      if (response.statusCode === 200 && response.payload) {
        // Update local storage with new user data
        const backendUser = response.payload;
        const currentUser = getCurrentUser();
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            firstName: backendUser.firstName,
            lastName: backendUser.lastName,
            mobile: backendUser.mobile || '',
            city: backendUser.city || '',
            profilePicture: backendUser.profilePicture ? `http://localhost:4000${backendUser.profilePicture}` : ''
          };
          setCurrentUser(updatedUser);
          onUpdate(updatedUser);
        }

        // Reset file after successful upload
        setProfilePictureFile(null);
        setSuccess(true);
        setIsEditing(false); // Exit edit mode after successful save
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">Profile updated successfully!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="border-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your photo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profilePicturePreview || formData.profilePicture} />
              <AvatarFallback className="text-2xl">
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <Input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('profilePicture')?.click()}
              disabled={!isEditing}
              style={{ border: '1px solid #d1d5db' }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    required
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    required
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    disabled={!isEditing}
                    required
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditing}
                    required
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input 
                    value={user.role} 
                    disabled 
                    style={{ border: '1px solid #d1d5db' }}
                  />
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form data to original user data
                      setFormData({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        mobile: user.mobile,
                        city: user.city,
                        profilePicture: user.profilePicture || ''
                      });
                      setProfilePictureFile(null);
                      setProfilePicturePreview(user.profilePicture ? (user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:4000${user.profilePicture}`) : null);
                      setError('');
                    }}
                    disabled={loading}
                    style={{ border: '1px solid #d1d5db' }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              ) : (
                <Button 
                  type="button" 
                  className="w-full"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
