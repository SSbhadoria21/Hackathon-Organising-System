import { z } from 'zod';
import { roundSchema } from './round.schema';

export const basicDetailsStepSchema = z.object({
  eventName: z.string().min(3, 'Event name must be at least 3 characters').max(100),
  theme: z.string().min(2, 'Theme is required').max(100),
  mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
  banner: z.string().min(1, 'Banner image URL is required'),
  logo: z.string().optional(),
  organizingBody: z.string().min(2, 'Organizing body is required').max(120),
  shortDescription: z.string().max(250).optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  expectedTeamsCount: z.coerce.number().int().min(1).default(10),
  address: z.string().optional(),
  mapLink: z.string().optional(),
}).refine(
  (data) => {
    if (data.mode === 'OFFLINE' || data.mode === 'HYBRID') {
      return !!data.address && !!data.mapLink;
    }
    return true;
  },
  {
    message: 'Address and Map Link are required for Offline and Hybrid hackathons',
    path: ['address', 'mapLink'],
  }
);

export const timelineStepSchema = z.object({
  registrationOpens: z.coerce.date(),
  registrationCloses: z.coerce.date(),
  hackingStartsAt: z.coerce.date().optional(),
  hackingEndsAt: z.coerce.date().optional(),
  resultAnnouncementDate: z.coerce.date(),
  timeZone: z.string().default('Asia/Kolkata'),
}).refine(
  (data) => data.registrationOpens < data.registrationCloses,
  {
    message: 'Registration closing date must be after opening date',
    path: ['registrationCloses'],
  }
).refine(
  (data) => data.registrationCloses <= data.resultAnnouncementDate,
  {
    message: 'Result announcement date must be on or after registration closes',
    path: ['resultAnnouncementDate'],
  }
);

export const rulesEligibilityStepSchema = z.object({
  teamMinSize: z.coerce.number().int().min(1, 'Minimum team size is 1').default(1),
  teamMaxSize: z.coerce.number().int().min(1, 'Maximum team size is 1').default(4),
  eligibility: z.enum([
    'UNIVERSITY_STUDENTS',
    'ACROSS_UNIVERSITIES',
    'WORKING_PROFESSIONALS',
    'OPEN_TO_ALL',
  ]),
  allowedColleges: z.array(z.string()).default([]),
  plagiarismPolicyEnabled: z.boolean().default(false),
  cocDocumentUrl: z.string().min(1, 'Code of Conduct URL or document is required'),
  techStackRestrictions: z.array(z.string()).default([]),
  problemStatementPdfUrl: z.string().optional(),
  tracks: z
    .array(
      z.object({
        title: z.string().min(1, 'Track title is required'),
        description: z.string().optional(),
      })
    )
    .default([]),
}).refine((data) => data.teamMinSize <= data.teamMaxSize, {
  message: 'Minimum team size cannot be greater than maximum team size',
  path: ['teamMaxSize'],
});

export const roundsStepSchema = z.object({
  rounds: z.array(roundSchema).min(1, 'At least 1 round must be configured'),
});

export const prizesSponsorsStepSchema = z.object({
  prizes: z
    .array(
      z.object({
        title: z.string().min(1, 'Prize title is required'),
        amount: z.coerce.number().min(0),
        type: z.enum(['CASH', 'VOUCHER', 'TROPHY', 'OTHER']).default('CASH'),
        description: z.string().optional(),
      })
    )
    .default([]),
  sponsors: z
    .array(
      z.object({
        name: z.string().min(1, 'Sponsor name is required'),
        logoUrl: z.string().optional(),
        websiteUrl: z.string().optional(),
      })
    )
    .default([]),
});

export const paymentsStepSchema = z.object({
  paid: z.boolean().default(false),
  feeCollectedInRound: z.coerce.number().int().min(1).default(1),
  feeAmount: z.coerce.number().min(0).default(0),
  refundPolicy: z.string().optional(),
});

export const judgeInviteSchema = z.object({
  targetUsername: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  roundIds: z.array(z.string()).optional(),
}).refine((data) => data.targetUsername || data.email, {
  message: 'Either username or email is required to invite a judge',
  path: ['targetUsername'],
});

export const fullPublishHackathonSchema = z.object({
  eventName: z.string().min(3, 'Event name must be at least 3 characters').max(100),
  theme: z.string().min(2, 'Theme is required'),
  mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
  banner: z.string().min(1, 'Banner is required'),
  logo: z.string().optional(),
  organizingBody: z.string().min(2, 'Organizing body is required'),
  shortDescription: z.string().max(250).optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  expectedTeamsCount: z.coerce.number().int().min(1),
  address: z.string().optional(),
  mapLink: z.string().optional(),

  registrationOpens: z.coerce.date(),
  registrationCloses: z.coerce.date(),
  hackingStartsAt: z.coerce.date().optional(),
  hackingEndsAt: z.coerce.date().optional(),
  resultAnnouncementDate: z.coerce.date(),
  timeZone: z.string().default('Asia/Kolkata'),

  teamMinSize: z.coerce.number().int().min(1),
  teamMaxSize: z.coerce.number().int().min(1),
  eligibility: z.enum([
    'UNIVERSITY_STUDENTS',
    'ACROSS_UNIVERSITIES',
    'WORKING_PROFESSIONALS',
    'OPEN_TO_ALL',
  ]),
  allowedColleges: z.array(z.string()).default([]),
  plagiarismPolicyEnabled: z.boolean().default(false),
  cocDocumentUrl: z.string().min(1, 'Code of conduct is required'),
  techStackRestrictions: z.array(z.string()).default([]),
  problemStatementPdfUrl: z.string().optional(),
  tracks: z.array(z.object({ title: z.string().min(1), description: z.string().optional() })).default([]),

  prizes: z.array(z.object({
    title: z.string().min(1),
    amount: z.coerce.number().min(0),
    type: z.enum(['CASH', 'VOUCHER', 'TROPHY', 'OTHER']),
    description: z.string().optional(),
  })).default([]),

  sponsors: z.array(z.object({
    name: z.string().min(1),
    logoUrl: z.string().optional(),
    websiteUrl: z.string().optional(),
  })).default([]),

  paid: z.boolean().default(false),
  feeCollectedInRound: z.coerce.number().int().min(1).default(1),
  feeAmount: z.coerce.number().min(0).default(0),
  refundPolicy: z.string().optional(),
});
