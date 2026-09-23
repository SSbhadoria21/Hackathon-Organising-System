import { z } from 'zod';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only have letters, numbers and underscores'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(/[A-Z]/, 'Password must have at least one uppercase letter')
    .regex(/[0-9]/, 'Password must have at least one number'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).or(z.literal('')).optional(),
  bio: z.string().max(200, 'Bio cannot exceed 200 characters').optional(),
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
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must be numbers only'),
});

export const resendOtpSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type RegType = z.infer<typeof registerSchema>;
export type LoginType = z.infer<typeof loginSchema>;
export type VerifyType = z.infer<typeof verifyEmailSchema>;
export type RegisterInput = RegType;
export type LoginInput = LoginType;
export type VerifyEmailInput = VerifyType;
