import User from '../models/User.js';
import {
  generateToken,
  hashPassword,
  comparePassword,
  generateOTP,
  generateExpiryTime
} from '../helpers/auth.helper.js';
import { sendOTPEmail, sendWelcomeEmail } from './email.service.js';
import { Op } from 'sequelize';

export const register = async (payload) => {
  const existing = await User.findOne({ where: { email: payload.email.toLowerCase() } });
  if (existing) {
    const err = new Error('User already exists.');
    err.status = 409;
    throw err;
  }

  const hashed = hashPassword(payload.password);
  const otp = generateOTP();
  const otpExpireAt = generateExpiryTime();

  const body = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    password: hashed,
    role: payload.userType || 'Student',
    mobile: payload.mobile,
    city: payload.city,
    profilePicture: payload.profilePicture || null,
    otp,
    otpExpireAt,
  };

  const user = await User.create(body);

  await sendOTPEmail({
    email: user.email,
    otp: otp,
    type: 'verification',
    userName: user.firstName
  });

  user.password = undefined;
  return user;
};

export const login = async (loginDto) => {
  const user = await User.findOne({
    where: {
      email: loginDto.email.toLowerCase(),
      role: { [Op.in]: ['Student', 'Researcher', 'Technician', 'Admin'] }
    }
  });

  if (!user) {
    const err = new Error('User does not exist!');
    err.status = 404;
    throw err;
  }

  if (user.deletedAt) {
    const err = new Error('User already deleted');
    err.status = 403;
    throw err;
  }

  if (user.isActivated === false) {
    const err = new Error('User is inactive');
    err.status = 403;
    throw err;
  }

  if (!user.isVerified) {
    const OTP = generateOTP();
    const OTPExpireAt = generateExpiryTime();
    await user.update({ otp: OTP, otpExpireAt: OTPExpireAt });

    await sendOTPEmail({
      email: user.email,
      otp: OTP,
      type: 'verification',
      userName: user.firstName + ' ' + user.lastName
    });

    const isCorrect = comparePassword(loginDto.password, user.password || '');
    if (!isCorrect) {
      const err = new Error('Invalid password.');
      err.status = 409;
      throw err;
    }

    return {
      statusCode: 200,
      message: 'User login successfully - Email verification required',
      payload: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile || '',
          city: user.city || '',
          role: user.role,
          profilePicture: user.profilePicture || null,
          isVerified: user.isVerified
        },
        token: null
      }
    };
  }

  const isCorrect = comparePassword(loginDto.password, user.password || '');
  if (!isCorrect) {
    const err = new Error('Invalid password.');
    err.status = 409;
    throw err;
  }

  const token = generateToken(user);
  return {
    statusCode: 200,
    message: 'User login successfully',
    payload: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile || '',
        city: user.city || '',
        role: user.role,
        profilePicture: user.profilePicture || null,
        isVerified: user.isVerified
      },
      token
    }
  };
};

export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ where: { email: email.toLowerCase() }});
  if (!user) {
    const err = new Error('User does not exist!');
    err.status = 404;
    throw err;
  }

  if (user.deletedAt) {
    const err = new Error('User already deleted');
    err.status = 403;
    throw err;
  }

  if (user.isActivated === false) {
    const err = new Error('User is inactive');
    err.status = 403;
    throw err;
  }

  if (!user.isVerified) {
    const err = new Error('Email is not verified yet. Please check your email.');
    err.status = 409;
    throw err;
  }

  const OTP = generateOTP();
  const OTPExpireAt = generateExpiryTime();

  await user.update({ otp: OTP, otpExpireAt: OTPExpireAt });
  await sendOTPEmail({
    email: user.email,
    otp: OTP,
    type: 'password-reset',
    userName: user.firstName
  });

  return { statusCode: 200, message: 'Password reset OTP has been sent to your email' };
};

export const resetPassword = async ({ email, newPassword }) => {
  const user = await User.findOne({ where: { email: email.toLowerCase() }});
  if (!user) {
    const err = new Error('User does not exist!');
    err.status = 404;
    throw err;
  }

  if (user.deletedAt) {
    const err = new Error('User already deleted');
    err.status = 403;
    throw err;
  }

  if (user.isActivated === false) {
    const err = new Error('User is inactive');
    err.status = 403;
    throw err;
  }

  const hashed = hashPassword(newPassword);
  await user.update({ password: hashed });

  return { statusCode: 200, message: 'Your password has been updated successfully' };
};

export const verifyEmail = async ({ email, otp }) => {
  const user = await User.findOne({ where: { email: email.toLowerCase(), otp: String(otp) }});
  if (!user) {
    const err = new Error('Invalid OTP.');
    err.status = 404;
    throw err;
  }

  if (user.otpExpireAt && Date.now() > Number(user.otpExpireAt)) {
    const err = new Error('OTP expired. Request a new one');
    err.status = 409;
    throw err;
  }

  await user.update({ isVerified: true, otp: null, otpExpireAt: null });

  const token = generateToken(user);
  await sendWelcomeEmail(user.email, user.firstName);

  return {
    statusCode: 200,
    message: 'Email verified successfully',
    payload: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile || '',
        city: user.city || '',
        role: user.role,
        profilePicture: user.profilePicture || null,
        isVerified: true
      },
      token
    }
  };
};

export const resendOTP = async ({ email }) => {
  const user = await User.findOne({ where: { email: email.toLowerCase() }});
  if (!user) {
    const err = new Error('User does not exist!');
    err.status = 404;
    throw err;
  }

  if (user.deletedAt) {
    const err = new Error('User already deleted');
    err.status = 403;
    throw err;
  }

  if (user.isActivated === false) {
    const err = new Error('User is inactive');
    err.status = 403;
    throw err;
  }

  const OTP = generateOTP();
  const OTPExpireAt = generateExpiryTime();

  await user.update({ otp: OTP, otpExpireAt: OTPExpireAt });
  await sendOTPEmail({
    email: user.email,
    otp: OTP,
    type: 'verification',
    userName: user.firstName
  });

  return { statusCode: 200, message: 'OTP has been sent to your email' };
};
