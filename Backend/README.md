# Express Authentication (Sequelize/MySQL)

This project is an Express.js authentication system converted from a NestJS flow. It includes:
- Register (OTP email verification)
- Login
- Verify Email (OTP)
- Resend OTP
- Forgot Password (send OTP)
- Reset Password
- JWT auth middleware

## Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies: `npm install`
3. Ensure MySQL is running and database exists.
4. Run: `node app.js` or `npm run dev` (requires nodemon).
