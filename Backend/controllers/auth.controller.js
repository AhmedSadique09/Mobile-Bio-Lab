import * as AuthService from '../services/auth.service.js';

export const register = async (req, res) => {
  try {
    // Prepare payload with image path if uploaded
    const payload = {
      ...req.body,
      profilePicture: req.file ? `/uploads/${req.file.filename}` : null
    };

    const user = await AuthService.register(payload);
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
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    // Delete uploaded file if registration fails
    if (req.file) {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      try {
        fs.unlinkSync(filePath);
      } catch (deleteErr) {
        console.error('Error deleting file:', deleteErr);
      }
    }
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
