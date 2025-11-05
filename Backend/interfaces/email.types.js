/**
 * @fileoverview Email service type definitions and documentation for JavaScript/Express backend
 * @description These are JSDoc type definitions for reference and IDE autocomplete support
 */

/**
 * @typedef {'verification' | 'password-reset'} EmailOTPType
 * Email OTP type options
 */

/**
 * @typedef {Object} EmailPayload
 * @property {string} email - Recipient email address
 * @property {string} otp - OTP code to send
 * @property {EmailOTPType} [type='verification'] - Type of email OTP (optional, defaults to 'verification')
 * @property {string} [userName=''] - User's name for personalization (optional, defaults to empty string)
 */

// Export types for JSDoc (no runtime exports needed in pure JS)
module.exports = {};

