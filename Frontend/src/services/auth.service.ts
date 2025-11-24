import { HttpService } from './base.service';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendOTPRequest,
  ResendOTPResponse,
} from '../interfaces/auth.interface';

class AuthService extends HttpService {
  /**
   * Register a new user
   * @param data Register request data
   * @returns Register response
   */
  register = async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await this.post('auth/register', data);
    return response as RegisterResponse;
  };

  /**
   * Register a new user with file upload (multipart/form-data)
   * @param formData FormData containing user data and profile picture
   * @returns Register response
   */
  registerWithFile = async (formData: FormData): Promise<RegisterResponse> => {
    const response = await this.post('auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response as RegisterResponse;
  };

  /**
   * Login user
   * @param data Login request data
   * @returns Login response with user and token
   */
  login = async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await this.post('auth/login', data);

    // If login is successful and token exists, set it
    if (response.payload?.token) {
      HttpService.setToken(response.payload.token);
    }

    return response as LoginResponse;
  };

  /**
   * Request password reset
   * @param data Forgot password request data
   * @returns Forgot password response
   */
  forgotPassword = async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
    const response = await this.post('auth/forgot-password', data);
    return response as ForgotPasswordResponse;
  };

  /**
   * Reset password
   * @param data Reset password request data
   * @returns Reset password response
   */
  resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    const response = await this.post('auth/reset-password', data);
    return response as ResetPasswordResponse;
  };

  /**
   * Verify email with OTP
   * @param data Verify email request data
   * @returns Verify email response with user and token
   */
  verifyEmail = async (data: VerifyEmailRequest): Promise<VerifyEmailResponse> => {
    const response = await this.post('auth/verify-email', data);

    // If verification is successful and token exists, set it
    if (response.payload?.token) {
      HttpService.setToken(response.payload.token);
    }

    return response as VerifyEmailResponse;
  };

  /**
   * Resend OTP for email verification
   * @param data Resend OTP request data
   * @returns Resend OTP response
   */
  resendOTP = async (data: ResendOTPRequest): Promise<ResendOTPResponse> => {
    const response = await this.post('auth/resend-otp', data);
    return response as ResendOTPResponse;
  };

  /**
   * Logout user (clears token and cookies)
   */
  logout = (): void => {
    HttpService.clearCookie();
    // clearCookie() already removes the Authorization header
  };
}

export default new AuthService();