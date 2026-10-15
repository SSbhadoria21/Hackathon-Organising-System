import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { Round } from '@/models/Round';
import { Submission } from '@/models/Submission';
import { JudgeScore } from '@/models/JudgeScore';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const submitScoreSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  criteriaScores: z
    .array(
      z.object({
        criteriaId: z.string().min(1, 'Criteria ID is required'),
        score: z.number().min(0).max(100, 'Score must be between 0 and 100'),
        comment: z.string().optional(),
      })
    )
    .min(1, 'At least one criteria score is required'),
  overallComment: z.string().optional(),
  scoredAfterSeingAI: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid hackathon ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const hackathon = await Hackathon.findById(id).lean();
    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    const isOrganizer = hackathon.organizerId.toString() === auth._id;

    const user = await User.findById(auth._id).select('email').lean();
    const userEmail = user?.email?.toLowerCase();

    let judge: any = null;
    if (!isOrganizer) {
      judge = await Judge.findOne({
        hackathonId: id,
        status: 'ACCEPTED',
        $or: [
          { userId: auth._id },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      }).lean();

      if (!judge) {
        return errorResponse('You do not have judging access for this hackathon', 403);
      }
    }

    const body = await req.json();
    const parsed = submitScoreSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { submissionId, criteriaScores, overallComment, scoredAfterSeingAI } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return errorResponse('Invalid submission ID', 400);
    }

    const submission = await Submission.findOne({
      _id: submissionId,
      hackathonId: id,
    });

    if (!submission) {
      return errorResponse('Submission not found in this hackathon', 404);
    }

    // Access control check for judge
    if (!isOrganizer && judge) {
      const accessType = judge.accessType || 'FULL';
      if (accessType === 'SPECIFIC_ROUNDS') {
        const allowedRoundIds = (judge.roundIds || []).map((r: any) => r.toString());
        if (!allowedRoundIds.includes(submission.roundId.toString())) {
          return errorResponse(
            'Access denied: You do not have permission to judge submissions in this round',
            403
          );
        }
      }
    }

    // Verify criteria IDs exist in the round
    const round = await Round.findById(submission.roundId).lean();
    if (!round) {
      return errorResponse('Round not found', 404);
    }

    const validCriteriaIds = new Set((round.criterias || []).map((c: any) => c._id.toString()));
    const formattedCriteriaScores = criteriaScores.map((c) => {
      if (!validCriteriaIds.has(c.criteriaId)) {
        throw new Error(`Invalid criteria ID: ${c.criteriaId}`);
      }
      return {
        criteriaId: new mongoose.Types.ObjectId(c.criteriaId),
        score: c.score,
        comment: c.comment,
      };
    });

    // Save or update JudgeScore
    // If organizer is judging directly without a Judge doc, find or create temporary judge doc
    let effectiveJudgeId = judge?._id;
    if (!effectiveJudgeId && isOrganizer) {
      let orgJudge = await Judge.findOne({ hackathonId: id, userId: auth._id });
      if (!orgJudge) {
        orgJudge = await Judge.create({
          hackathonId: id,
          userId: auth._id,
          name: 'Organizer',
          email: user?.email || 'organizer@hackathon.com',
          status: 'ACCEPTED',
          accessType: 'FULL',
          roundIds: hackathon.roundIds,
        });
      }
      effectiveJudgeId = orgJudge._id;
    }

    const judgeScore = await JudgeScore.findOneAndUpdate(
      {
        submissionId: submission._id,
        judgeId: effectiveJudgeId,
      },
      {
        $set: {
          hackathonId: id,
          roundId: submission.roundId,
          criteriaScores: formattedCriteriaScores,
          overallComment,
          scoredAfterSeingAI,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // If submission is currently in SUBMITTED, update to EVALUATING
    if (submission.status === 'SUBMITTED') {
      submission.status = 'EVALUATING';
      await submission.save();
    }

    return successResponse(
      judgeScore,
      'Submission score saved successfully'
    );
  } catch (err: any) {
    console.error('Submit score error:', err);
    return errorResponse(err.message || 'Failed to submit score', 500);
  }
}
