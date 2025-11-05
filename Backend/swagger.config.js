import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth API Documentation',
      version: '1.0.0',
      description: 'API documentation for Authentication endpoints',
      contact: {
        name: 'API Support'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            mobile: {
              type: 'string',
              description: 'Mobile number'
            },
            city: {
              type: 'string',
              description: 'City name'
            },
            role: {
              type: 'string',
              description: 'User role'
            },
            isVerified: {
              type: 'boolean',
              description: 'Email verification status'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password', 'userType', 'mobile', 'city'],
          properties: {
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Password (minimum 8 characters)'
            },
            userType: {
              type: 'string',
              enum: ['Student', 'Researcher', 'Technician', 'Admin'],
              description: 'Type of user'
            },
            mobile: {
              type: 'string',
              description: 'Mobile number'
            },
            city: {
              type: 'string',
              description: 'City name'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            password: {
              type: 'string',
              description: 'Password'
            }
          }
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            }
          }
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['email', 'newPassword'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              description: 'New password (minimum 8 characters)'
            }
          }
        },
        VerifyEmailRequest: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            otp: {
              type: 'string',
              pattern: '^[0-9]+$',
              description: 'OTP code (numeric)'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            payload: {
              type: 'array',
              items: {
                type: 'object'
              },
              description: 'Additional error details'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'integer',
              description: 'HTTP status code'
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            payload: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './index.js']
};

export const swaggerSpec = swaggerJsdoc(options);

