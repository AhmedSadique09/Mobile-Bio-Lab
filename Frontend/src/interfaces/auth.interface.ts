/**
 * User Role Types
 */
export type UserRole = 'Student' | 'Researcher' | 'Technician' | 'Admin';

/**
 * User Type for Registration
 */
export type UserType = 'Student' | 'Researcher' | 'Technician' | 'Admin';

/**
 * Base API Response Structure
 */
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  payload?: T;
}

/**
 * User Data Structure
 */
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  city: string;
  role: UserRole;
  isVerified: boolean;
}

/**
 * Register Request Interface
 */
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType?: UserType;
  mobile: string;
  city: string;
}

/**
 * Register Response Interface
 */
export interface RegisterResponse extends ApiResponse {
  payload: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    city: string;
    role: UserRole;
    isVerified: boolean;
  };
}

/**
 * Login Request Interface
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login Response Payload
 */
export interface LoginResponsePayload {
  user: User;
  token: string | null;
}

/**
 * Login Response Interface
 */
export interface LoginResponse extends ApiResponse {
  payload: LoginResponsePayload;
}

/**
 * Forgot Password Request Interface
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Forgot Password Response Interface
 */
export interface ForgotPasswordResponse extends ApiResponse {
  payload?: never;
}

/**
 * Reset Password Request Interface
 */
export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
}

/**
 * Reset Password Response Interface
 */
export interface ResetPasswordResponse extends ApiResponse {
  payload?: never;
}

/**
 * Verify Email Request Interface
 */
export interface VerifyEmailRequest {
  email: string;
  otp: string | number;
}

/**
 * Verify Email Response Payload
 */
export interface VerifyEmailResponsePayload {
  user: User;
  token: string;
}

/**
 * Verify Email Response Interface
 */
export interface VerifyEmailResponse extends ApiResponse {
  payload: VerifyEmailResponsePayload;
}

/**
 * Resend OTP Request Interface
 */
export interface ResendOTPRequest {
  email: string;
}

/**
 * Resend OTP Response Interface
 */
export interface ResendOTPResponse extends ApiResponse {
  payload?: never;
}
