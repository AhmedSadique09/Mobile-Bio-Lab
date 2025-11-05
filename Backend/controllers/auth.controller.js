import * as AuthService from '../services/auth.service.js';

export const register = async (req, res) => {
  try {
    const user = await AuthService.register(req.body);
    return res.status(201).json({
      statusCode: 201,
      message: 'Registeration successful',
      payload: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    return res.status(err.status || 500).json({ statusCode: err.status || 500, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const resp = await AuthService.login(req.body);
    return res.status(resp.statusCode).json(resp);
  } catch (err) {
    return res.status(err.status || 500).json({ statusCode: err.status || 500, message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const resp = await AuthService.forgotPassword(req.body);
    return res.status(resp.statusCode || 200).json(resp);
  } catch (err) {
    return res.status(err.status || 500).json({ statusCode: err.status || 500, message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const resp = await AuthService.resetPassword(req.body);
    return res.status(resp.statusCode || 200).json(resp);
  } catch (err) {
    return res.status(err.status || 500).json({ statusCode: err.status || 500, message: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const resp = await AuthService.verifyEmail(req.body);
    return res.status(resp.statusCode).json(resp);
  } catch (err) {
    return res.status(err.status || 500).json({ statusCode: err.status || 500, message: err.message });
  }
};

export const resendOTP = async (req, res) => {
  try {
    const resp = await AuthService.resendOTP(req.body);
    return res.status(resp.statusCode || 200).json(resp);
  } catch (err) {
    return res.status(err.status || 500).json({ statusCode: err.status || 500, message: err.message });
  }
};
