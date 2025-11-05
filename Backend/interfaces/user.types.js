/**
 * @fileoverview User-related type definitions and documentation for JavaScript/Express backend
 * @description These are JSDoc type definitions for reference and IDE autocomplete support
 */

/**
 * @typedef {'Student' | 'Researcher' | 'Technician' | 'Admin'} UserRole
 * User role types enum
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} email - User's email address
 * @property {string} [password] - User's hashed password (optional)
 * @property {string} mobile - User's mobile number
 * @property {UserRole} role - User's role
 * @property {string} city - User's city
 * @property {string} [profilePicture] - User's profile picture URL (optional)
 * @property {boolean} isVerified - Email verification status
 * @property {boolean} isActivated - User activation status
 * @property {string|null} [otp] - OTP code (optional, nullable)
 * @property {number|null} [otpExpireAt] - OTP expiration timestamp (optional, nullable)
 * @property {number|null} [deletedAt] - Soft delete timestamp (optional, nullable)
 * @property {Date} [createdAt] - Creation timestamp (optional)
 * @property {Date} [updatedAt] - Update timestamp (optional)
 */

/**
 * @typedef {Object} RegisterPayload
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} email - User's email address
 * @property {string} password - User's password (min 8 characters)
 * @property {string} mobile - User's mobile number
 * @property {string} city - User's city
 * @property {UserRole} [userType] - User's role type (optional, defaults to 'Student')
 */

/**
 * @typedef {Object} LoginPayload
 * @property {string} email - User's email address
 * @property {string} password - User's password
 */

/**
 * @typedef {Object} ForgotPasswordPayload
 * @property {string} email - User's email address
 */

/**
 * @typedef {Object} ResetPasswordPayload
 * @property {string} email - User's email address
 * @property {string} newPassword - New password (min 8 characters)
 */

/**
 * @typedef {Object} VerifyEmailPayload
 * @property {string} email - User's email address
 * @property {string|number} otp - OTP code for verification
 */

/**
 * @typedef {Object} ResendOTPPayload
 * @property {string} email - User's email address
 */

/**
 * @typedef {Object} UserResponse
 * @property {number} id - User ID
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} email - User's email address
 * @property {string} mobile - User's mobile number
 * @property {string} city - User's city
 * @property {UserRole} role - User's role
 * @property {boolean} isVerified - Email verification status
 */

// Export types for JSDoc (no runtime exports needed in pure JS)
module.exports = {};

