import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertCircle, ArrowLeft, Upload, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import authService from '../services/auth.service';
import type { UserType } from '../interfaces/auth.interface';

interface RegisterProps { }

export function Register({ }: RegisterProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: '' as 'student' | 'researcher' | 'technician' | '',
    city: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!formData.role) {
      setError('Please select a role');
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobile || !formData.city) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Map role to userType (capitalize first letter for backend)
      const userTypeMap: Record<string, UserType> = {
        'student': 'Student',
        'researcher': 'Researcher',
        'technician': 'Technician',
      };

      const userType = userTypeMap[formData.role] || 'Student';

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName.trim());
      formDataToSend.append('lastName', formData.lastName.trim());
      formDataToSend.append('email', formData.email.trim().toLowerCase());
      formDataToSend.append('password', formData.password);
      formDataToSend.append('userType', userType);
      formDataToSend.append('mobile', formData.mobile.trim());
      formDataToSend.append('city', formData.city.trim());

      // Add profile picture if selected
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture);
      }

      // Call API with FormData
      const response = await authService.registerWithFile(formDataToSend);

      if (response.statusCode === 201) {
        setSuccess(true);
        // Navigate to OTP verification page with email
        setTimeout(() => {
          navigate('/verify-otp', { state: { email: formData.email.trim().toLowerCase() } });
        }, 1500);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      // Handle API errors
      const errorMessage = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the actual file object
      setProfilePicture(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/login')}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Fill in your details to get started</p>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Registration successful! Redirecting to OTP verification...
                  </AlertDescription>
                </Alert>
              )}

              {/* Profile Picture */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Profile Picture</Label>
                <div className="flex items-center gap-4">
                  <div className="flex">
                    {profilePicturePreview ? (
                      <Avatar className="w-16 h-16 border-2 border-gray-200">
                        <AvatarImage src={profilePicturePreview} alt="Profile" />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                          {formData.firstName?.[0]?.toUpperCase() || formData.lastName?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
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
                      size="sm"
                      onClick={() => document.getElementById('profilePicture')?.click()}
                      className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {profilePicturePreview ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                      placeholder="John"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                      placeholder="Doe"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900 pr-10"
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900 pr-10"
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Passwords match
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="researcher">Researcher</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mobile */}
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                      className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                      placeholder="+92 300 1234567"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                      placeholder="Lahore"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-gray-900 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
