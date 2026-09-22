import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80).optional(),
  bio: z.string().min(5, 'Bio must be at least 5 characters').max(250).optional(),
  about: z.string().max(1000).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  skills: z.array(z.string().trim().min(1)).max(30).optional(),
  collegeOrCompany: z.string().max(120).optional(),
  githubUrl: z.string().url('Invalid GitHub URL').or(z.literal('')).optional(),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').or(z.literal('')).optional(),
  portfolioUrl: z.string().url('Invalid Portfolio URL').or(z.literal('')).optional(),
});

export type TProfile = z.infer<typeof updateProfileSchema>;
export type UpdateProfileInput = TProfile;
