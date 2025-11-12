import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import authService from '../services/auth.service';
import { setCurrentUser } from '../lib/storage';
import type { User } from '../types';

interface VerifyOTPProps {
  email?: string;
  onVerifySuccess?: () => void;
}

export function VerifyOTP({ email: propEmail }: VerifyOTPProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from props or location state
  const email = propEmail || (location.state as any)?.email || '';
  const isPasswordReset = (location.state as any)?.isPasswordReset || false;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await authService.verifyEmail({
        email: email,
        otp: otp,
      });

      if (response.statusCode === 200 && response.payload) {
        setSuccess(true);
        
        // Store user data and login if token exists
        if (response.payload.user && response.payload.token) {
          // Convert backend user to frontend User type
          const backendUser = response.payload.user;
          const frontendUser: User = {
            id: backendUser.id.toString(),
            username: backendUser.email, // Use email as username
            email: backendUser.email,
            firstName: backendUser.firstName,
            lastName: backendUser.lastName,
            mobile: '', // Backend doesn't return mobile in verify response
            role: backendUser.role.toLowerCase() as 'student' | 'researcher' | 'technician' | 'admin',
            city: '', // Backend doesn't return city in verify response
            createdAt: new Date().toISOString(),
          };
          
          // Store user in localStorage
          setCurrentUser(frontendUser);
          console.log('User verified and logged in:', frontendUser);

          // Redirect based on flow
          setTimeout(() => {
            if (isPasswordReset) {
              // Navigate to reset password page for password reset flow
              navigate('/reset-password', { state: { email: email } });
            } else {
              // Navigate to login page after email verification
              navigate('/login', { replace: true });
            }
          }, 2000);
        } else {
          // No token or user, redirect to login
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setResendMessage('');
    setIsResending(true);

    try {
      const response = await authService.resendOTP({ email });
      
      if (response.statusCode === 200) {
        setResendMessage('OTP has been resent to your email. Please check your inbox.');
        setOtp(''); // Clear current OTP
      } else {
        setError(response.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to resend OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when OTP is complete (6 digits)
  useEffect(() => {
    if (otp.length === 6 && !isLoading && !success) {
      const verify = async () => {
        if (!otp || otp.length !== 6) {
          setError('Please enter a valid 6-digit OTP');
          return;
        }

        setError('');
        setIsLoading(true);

        try {
          const response = await authService.verifyEmail({
            email: email,
            otp: otp,
          });

          if (response.statusCode === 200 && response.payload) {
            setSuccess(true);
            
            // Store user data and login if token exists
            if (response.payload.user && response.payload.token) {
              // Convert backend user to frontend User type
              const backendUser = response.payload.user;
              const frontendUser: User = {
                id: backendUser.id.toString(),
                username: backendUser.email, // Use email as username
                email: backendUser.email,
                firstName: backendUser.firstName,
                lastName: backendUser.lastName,
                mobile: backendUser.mobile || '',
                role: backendUser.role.toLowerCase() as 'student' | 'researcher' | 'technician' | 'admin',
                city: backendUser.city || '',
                profilePicture: backendUser.profilePicture ? `http://localhost:4000${backendUser.profilePicture}` : '',
                createdAt: new Date().toISOString(),
              };
              
              // Store user in localStorage
              setCurrentUser(frontendUser);
              console.log('User verified and logged in:', frontendUser);
            }

            // Redirect based on flow
            setTimeout(() => {
              if (isPasswordReset) {
                // Navigate to reset password page for password reset flow
                navigate('/reset-password', { state: { email: email } });
              } else {
                // Navigate to login page after email verification
                navigate('/login', { replace: true });
              }
            }, 2000);
          } else {
            setError(response.message || 'Invalid OTP. Please try again.');
          }
        } catch (err: any) {
          console.error('OTP verification error:', err);
          const errorMessage = err?.response?.data?.message || err?.message || 'Verification failed. Please try again.';
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };
      verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(isPasswordReset ? '/forgot-password' : '/register')}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isPasswordReset ? 'Back to Forgot Password' : 'Back to Registration'}
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              {isPasswordReset ? 'Verify OTP' : 'Verify Your Email'}
            </h1>
            <p className="text-gray-600">
              {isPasswordReset 
                ? 'Enter the 6-digit OTP sent to your email to reset your password' 
                : 'Enter the 6-digit OTP sent to your email'}
            </p>
          </div>
        </div>

        <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
            <CardTitle className="text-center">
              {isPasswordReset ? 'Password Reset OTP' : 'Email Verification'}
            </CardTitle>
            <CardDescription className="text-center">
              We've sent a {isPasswordReset ? 'password reset' : 'verification'} code to
              <span className="font-medium text-gray-900"> {email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  {isPasswordReset 
                    ? 'OTP verified successfully! Redirecting to reset password...' 
                    : 'Email verified successfully! Redirecting to login...'}
                </AlertDescription>
              </Alert>
            )}

            {resendMessage && (
              <Alert className="border-blue-200 bg-blue-50">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {resendMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700 text-center block">
                  Enter OTP
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={isLoading || success}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || success || otp.length !== 6}
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  isPasswordReset ? 'Verify OTP' : 'Verify Email'
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendOTP}
                disabled={isResending || success}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

