import * as yup from "yup";

const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'mediverse.health'];
const commonTLDs = ['com', 'org', 'net', 'edu', 'gov', 'io', 'health'];

export const loginSchema = yup.object({
  email: yup.string()
    .required('Email is required')
    .test('valid-email', 'Invalid email address', (value) => {
      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(value)) {
        return false;
      }

      const domainParts = value.split('@')[1].split('.');
      const domain = value.split('@')[1];
      const tld = domainParts[domainParts.length - 1];

      // Check for allowed specific domains
      if (allowedDomains.includes(domain)) {
        return true;
      }

      // Check for common TLDs
      return commonTLDs.includes(tld) || domainParts.length > 2;
    }),
  password: yup.string()
    .required('Password is required'),
});

export interface ILogin extends yup.InferType<typeof loginSchema> { }