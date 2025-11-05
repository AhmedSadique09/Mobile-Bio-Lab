import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOTPEmail = async ({ email, otp, type = 'verification', userName = '' }) => {
  const subject = type === 'password-reset' ? 'Password Reset OTP' : 'Email Verification OTP';
  const text = `Hi ${userName || ''},\n\nYour OTP is: ${otp}\nIt will expire shortly.\n\nIf you didn't request this, ignore.`;

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject,
    text,
  });
};

export const sendWelcomeEmail = async (email, firstName) => {
  const subject = 'Welcome!';
  const text = `Hi ${firstName || ''},\n\nWelcome to our platform!`;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject,
    text,
  });
};
