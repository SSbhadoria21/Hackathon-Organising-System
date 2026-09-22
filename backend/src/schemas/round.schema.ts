import { z } from 'zod';

export const criterionSchema = z.object({
  name: z.string().min(1, 'Criterion name is required').max(100),
  weight: z.number().min(0).max(100),
  description: z.string().min(1, 'Description is required').max(500),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options required'),
  correctIndex: z.number().min(0),
  marks: z.number().min(1, 'Marks must be at least 1'),
  timeLimitSeconds: z.number().positive().optional(),
});

export const roundSchema = z.object({
  roundName: z.string().min(1, 'Round name is required').max(100),
  roundNumber: z.number().int().min(1),
  roundType: z.enum(['SUBMISSION', 'QUIZ', 'PROTOTYPE', 'PITCH']),
  roundOpens: z.coerce.date(),
  roundCloses: z.coerce.date(),
  maxTeamsAdvancing: z.number().int().min(1).default(10),
  aiWeightage: z.number().min(0).max(1).default(0.4),
  scoreThreshold: z.number().min(0).max(100).optional(),
  criterias: z.array(criterionSchema).min(1, 'At least 1 evaluation criterion is required'),
  quizQuestions: z.array(quizQuestionSchema).optional(),
});

export type TRound = z.infer<typeof roundSchema>;
export type TCriterion = z.infer<typeof criterionSchema>;
export type TQuiz = z.infer<typeof quizQuestionSchema>;
export type RoundInput = TRound;
export type CriterionInput = TCriterion;
export type QuizQuestionInput = TQuiz;
