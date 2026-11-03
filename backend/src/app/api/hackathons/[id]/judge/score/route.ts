import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { Round } from '@/models/Round';
import { Submission } from '@/models/Submission';
import { Team } from '@/models/Team';
import { Result } from '@/models/Result';
import { Notification } from '@/models/Notification';
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
  advanceTeam: z.boolean().optional(),
  status: z.enum(['ADVANCED', 'REJECTED', 'EVALUATING']).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const hackathon = await Hackathon.findOne(query).lean();
    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    const hackathonId = hackathon._id;
    const isOrganizer = hackathon.organizerId.toString() === auth._id;

    const user = await User.findById(auth._id).select('email').lean();
    const userEmail = user?.email?.toLowerCase();

    let judge: any = null;
    if (!isOrganizer) {
      judge = await Judge.findOne({
        hackathonId,
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

    const {
      submissionId,
      criteriaScores,
      overallComment,
      scoredAfterSeingAI,
      advanceTeam,
      status: requestedStatus,
    } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return errorResponse('Invalid submission ID', 400);
    }

    const submission = await Submission.findOne({
      _id: submissionId,
      hackathonId,
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

    let roundCriterias = (round.criterias || []) as any[];
    if (roundCriterias.length === 0) {
      const defaultCrit = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Overall Innovation & Execution',
        weight: 100,
        description: 'Evaluation of the project quality, innovation, and execution',
      };
      await Round.findByIdAndUpdate(submission.roundId, {
        $push: { criterias: defaultCrit },
      });
      roundCriterias = [defaultCrit];
    }

    const validCriteriaIds = new Set(roundCriterias.map((c: any) => c._id?.toString()));
    const formattedCriteriaScores = criteriaScores.map((c) => {
      let cId = c.criteriaId;
      if (!validCriteriaIds.has(cId)) {
        cId = roundCriterias[0]._id.toString();
      }
      return {
        criteriaId: new mongoose.Types.ObjectId(cId),
        score: c.score,
        comment: c.comment,
      };
    });

    // Save or update JudgeScore
    // If organizer is judging directly without a Judge doc, find or create temporary judge doc
    let effectiveJudgeId = judge?._id;
    if (!effectiveJudgeId && isOrganizer) {
      let orgJudge = await Judge.findOne({ hackathonId, userId: auth._id });
      if (!orgJudge) {
        orgJudge = await Judge.create({
          hackathonId,
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
          hackathonId,
          roundId: submission.roundId,
          criteriaScores: formattedCriteriaScores,
          overallComment,
          scoredAfterSeingAI,
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Handle status change or advanceTeam
    const shouldAdvance = advanceTeam === true || requestedStatus === 'ADVANCED';
    const shouldReject = requestedStatus === 'REJECTED';

    if (shouldAdvance) {
      submission.status = 'ADVANCED';
      await submission.save();

      // Find next round and grant eligibility
      const nextRound = await Round.findOne({
        hackathonId,
        roundNumber: round.roundNumber + 1,
      });

      if (nextRound) {
        await Round.findByIdAndUpdate(nextRound._id, {
          $addToSet: { teamIds: submission.teamId },
        });
      }

      // Compute score average for this evaluation
      const cSum = formattedCriteriaScores.reduce((acc, c) => acc + c.score, 0);
      const avg = formattedCriteriaScores.length ? parseFloat((cSum / formattedCriteriaScores.length).toFixed(1)) : 0;

      // Upsert Result record
      await Result.findOneAndUpdate(
        { hackathonId, roundId: submission.roundId, teamId: submission.teamId },
        {
          $set: {
            submissionId: submission._id,
            finalScore: avg,
            humanScoreTotal: avg,
            advanced: true,
            published: true,
          },
        },
        { upsert: true, new: true }
      );

      // Notify team leader
      const team = await Team.findById(submission.teamId);
      if (team?.leaderId) {
        await Notification.create({
          userId: team.leaderId,
          type: 'ROUND_RESULT',
          title: `🎉 You have cleared Round ${round.roundNumber}!`,
          message: `Congratulations! Your team "${team.name}" has cleared Round ${round.roundNumber} (${round.roundName})${nextRound ? ` and is now eligible to submit work for Round ${nextRound.roundNumber}: ${nextRound.roundName}.` : ' and reached the finals!'}`,
          read: false,
          metadata: {
            hackathonId: id,
            roundId: submission.roundId.toString(),
            teamId: team._id.toString(),
            advanced: 'true',
          },
        });
      }
    } else if (shouldReject) {
      submission.status = 'REJECTED';
      await submission.save();

      const cSum = formattedCriteriaScores.reduce((acc, c) => acc + c.score, 0);
      const avg = formattedCriteriaScores.length ? parseFloat((cSum / formattedCriteriaScores.length).toFixed(1)) : 0;

      await Result.findOneAndUpdate(
        { hackathonId: id, roundId: submission.roundId, teamId: submission.teamId },
        {
          $set: {
            submissionId: submission._id,
            finalScore: avg,
            humanScoreTotal: avg,
            advanced: false,
            published: true,
          },
        },
        { upsert: true, new: true }
      );
    } else if (submission.status === 'SUBMITTED') {
      submission.status = 'EVALUATING';
      await submission.save();
    }

    return successResponse(
      {
        judgeScore,
        submissionStatus: submission.status,
        advanced: shouldAdvance,
      },
      shouldAdvance
        ? 'Submission scored and team cleared round successfully! 🎉'
        : 'Submission score saved successfully'
    );
  } catch (err: any) {
    console.error('Submit score error:', err);
    return errorResponse(err.message || 'Failed to submit score', 500);
  }
}
