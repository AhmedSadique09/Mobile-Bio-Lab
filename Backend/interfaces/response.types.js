/**
 * @fileoverview API Response type definitions and documentation for JavaScript/Express backend
 * @description These are JSDoc type definitions for reference and IDE autocomplete support
 */

/**
 * @typedef {Object} ApiResponse
 * @template T
 * @property {number} statusCode - HTTP status code
 * @property {string} message - Response message
 * @property {T} [payload] - Response payload (optional)
 */

/**
 * @typedef {Object} LoginResponsePayload
 * @property {Object} user - User object
 * @property {number} user.id - User ID
 * @property {string} user.firstName - User's first name
 * @property {string} user.lastName - User's last name
 * @property {string} user.email - User's email address
 * @property {string} user.role - User's role
 * @property {boolean} user.isVerified - Email verification status
 * @property {string|null} token - JWT authentication token (null if not verified)
 */

/**
 * @typedef {Object} VerifyEmailResponsePayload
 * @property {Object} user - User object
 * @property {number} user.id - User ID
 * @property {string} user.firstName - User's first name
 * @property {string} user.lastName - User's last name
 * @property {string} user.email - User's email address
 * @property {string} user.role - User's role
 * @property {boolean} user.isVerified - Email verification status (always true)
 * @property {string} token - JWT authentication token
 */

/**
 * @typedef {Object} RegisterResponsePayload
 * @property {number} id - User ID
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} email - User's email address
 * @property {string} mobile - User's mobile number
 * @property {string} city - User's city
 * @property {string} role - User's role
 * @property {boolean} isVerified - Email verification status
 */

// Export types for JSDoc (no runtime exports needed in pure JS)
module.exports = {};

