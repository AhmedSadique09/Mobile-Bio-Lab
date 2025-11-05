import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import authService from '../services/auth.service';
import { setCurrentUser } from '../lib/storage';
import type { User } from '../types';

interface LoginProps {
  onLogin?: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!formData.password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.statusCode === 200) {
          // Check if email verification is required
        if (response.payload?.user && !response.payload.user.isVerified) {
          // If not verified, redirect to OTP verification
          setError('Please verify your email first. Check your inbox for OTP.');
          setTimeout(() => {
            navigate('/verify-otp', { state: { email: formData.email.trim().toLowerCase() } });
          }, 2000);
          return;
        }

        // If login successful and token exists, user is logged in
        if (response.payload?.token && response.payload.user) {
          // Convert backend user to frontend User type
          const backendUser = response.payload.user;
          const frontendUser: User = {
            id: backendUser.id.toString(),
            username: backendUser.email,
            email: backendUser.email,
            firstName: backendUser.firstName,
            lastName: backendUser.lastName,
            mobile: '',
            role: backendUser.role.toLowerCase() as 'student' | 'researcher' | 'technician' | 'admin',
            city: '',
            createdAt: new Date().toISOString(),
          };
          
          // Store user in localStorage
          setCurrentUser(frontendUser);
          
          // Navigate to appropriate dashboard
          navigate(frontendUser.role === 'admin' ? '/admin-dashboard' : '/dashboard', { replace: true });
          
          if (onLogin) {
            onLogin();
          }
        } else {
          setError('Login failed. Please try again.');
        }
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-10 border-gray-300 focus:border-gray-900 focus:ring-gray-900 pr-10"
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
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-gray-900 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-gray-900 hover:underline font-medium"
                  >
                    Register here
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
