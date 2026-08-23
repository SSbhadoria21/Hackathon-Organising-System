import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long') 
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Gender must be MALE, FEMALE, or OTHER' }),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(200),
  about: z.string().max(1000).optional(),
});


export const loginSchema = z.object({
  
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});


export const verifyEmailSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const resendOtpSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});


export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
