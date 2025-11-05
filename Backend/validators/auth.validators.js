import { body } from 'express-validator';

export const registerValidator = [
  body('firstName').notEmpty().withMessage('firstName required'),
  body('lastName').notEmpty().withMessage('lastName required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
  body('userType').isIn(['Student','Researcher','Technician','Admin']).withMessage('Invalid userType'),
  body('mobile').notEmpty().withMessage('mobile required'),
  body('city').notEmpty().withMessage('city required'),
];

export const loginValidator = [
  body('email').isEmail(),
  body('password').notEmpty()
];

export const forgotValidator = [
  body('email').isEmail()
];

export const resetValidator = [
  body('email').isEmail(),
  body('newPassword').isLength({ min: 8 })
];

export const verifyValidator = [
  body('email').isEmail(),
  body('otp').isNumeric()
];
