import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Team } from '@/models/Team';
import { Submission } from '@/models/Submission';
import { JudgeScore } from '@/models/JudgeScore';
import { Result } from '@/models/Result';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const advanceSchema = z.object({
  /** List of teamIds that should advance to the next round */
  advancingTeamIds: z.array(z.string()).min(1, 'At least one team must advance'),
  /** Whether to auto-compute results from judge scores (true) or just manually set advancing teams */
  computeScores: z.boolean().default(true),
  /** Override: manually set advancing teams regardless of scores */
  manualOverride: z.boolean().default(false),
  overrideReason: z.string().optional(),
});

/**
 * POST /hackathons/:id/rounds/:roundId/advance
 * Organizer finalises a round: computes scores, marks advancing teams, notifies all teams.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; roundId: string }> }
) {
  try {
    const { id, roundId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(roundId)) {
      return errorResponse('Invalid ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id }).lean();
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    const round = await Round.findOne({ _id: roundId, hackathonId: id }).lean();
    if (!round) return errorResponse('Round not found', 404);

    const body = await req.json();
    const parsed = advanceSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { advancingTeamIds, computeScores, manualOverride, overrideReason } = parsed.data;

    // Fetch all submissions for this round
    const submissions = await Submission.find({
      hackathonId: id,
      roundId,
    }).lean();

    if (submissions.length === 0) {
      return errorResponse('No submissions found for this round', 404);
    }

    const advancingSet = new Set(advancingTeamIds);

    // Compute judge-aggregated scores per submission
    const results = [];

    for (const sub of submissions) {
      const subId = sub._id.toString();
      const teamId = sub.teamId.toString();
      const isAdvancing = advancingSet.has(teamId);

      let humanScoreTotal = 0;
      let judgeCount = 0;

      if (computeScores) {
        const judgeScores = await JudgeScore.find({
          submissionId: sub._id,
          roundId,
        }).lean();

        judgeCount = judgeScores.length;

        if (judgeCount > 0) {
          // Get criteria weights from round
          const criteriaWeightMap = new Map<string, number>();
          (round.criterias || []).forEach((c: any) => {
            criteriaWeightMap.set(c._id.toString(), c.weight);
          });

          const totalWeight = Array.from(criteriaWeightMap.values()).reduce((a, b) => a + b, 0) || 100;

          let sumAcrossJudges = 0;
          for (const js of judgeScores) {
            let weightedScore = 0;
            for (const cs of js.criteriaScores) {
              const weight = criteriaWeightMap.get(cs.criteriaId.toString()) || 0;
              weightedScore += (cs.score * weight) / totalWeight;
            }
            sumAcrossJudges += weightedScore;
          }
          // Average across judges
          humanScoreTotal = parseFloat((sumAcrossJudges / judgeCount).toFixed(2));
        }
      }

      const finalScore = parseFloat(humanScoreTotal.toFixed(2));

      // Upsert result
      const result = await Result.findOneAndUpdate(
        { hackathonId: id, roundId, teamId: sub.teamId },
        {
          $set: {
            submissionId: sub._id,
            aiScoreTotal: 0,   // AI scores will be added in future sprint
            humanScoreTotal,
            finalScore,
            aiWeightUsed: 0,
            judgeWeightUsed: 1,
            advanced: isAdvancing,
            flaggedForReview: manualOverride,
            reviewOutcome: manualOverride ? 'OVERRIDE_ADVANCE' : undefined,
            published: false,
          },
        },
        { upsert: true, new: true }
      );

      results.push(result);

      // Update submission status
      await Submission.findByIdAndUpdate(sub._id, {
        status: isAdvancing ? 'ADVANCED' : 'REJECTED',
      });
    }

    // Find next round
    const nextRound = await Round.findOne({
      hackathonId: id,
      roundNumber: round.roundNumber + 1,
    });

    // If there is a next round, add advancing teams to it
    if (nextRound) {
      const advancingTeamObjIds = advancingTeamIds.map(
        (tid) => new mongoose.Types.ObjectId(tid)
      );
      await Round.findByIdAndUpdate(nextRound._id, {
        $addToSet: { teamIds: { $each: advancingTeamObjIds } },
      });
    }

    // Notify ALL teams of their result
    const allTeams = await Team.find({ hackathonId: id }).lean();
    const notifications = allTeams.map((team: any) => {
      const isAdvancing = advancingSet.has(team._id.toString());
      return {
        userId: team.leaderId,
        type: 'ROUND_RESULT' as const,
        title: isAdvancing ? `🎉 You advanced to ${nextRound ? `Round ${nextRound.roundNumber}` : 'the finals'}!` : `Round ${round.roundNumber} Result`,
        message: isAdvancing
          ? `Congratulations! Your team "${team.name}" has advanced from Round ${round.roundNumber} (${round.roundName}).${nextRound ? ` Get ready for Round ${nextRound.roundNumber}: ${nextRound.roundName}.` : ' You are in the finals!'}`
          : `Your team "${team.name}" was not selected to advance from Round ${round.roundNumber} (${round.roundName}). Better luck next time!`,
        read: false,
        metadata: {
          hackathonId: id,
          roundId: roundId,
          roundNumber: String(round.roundNumber),
          teamId: team._id.toString(),
          advanced: String(isAdvancing),
          ...(nextRound ? { nextRoundId: nextRound._id.toString(), nextRoundNumber: String(nextRound.roundNumber) } : {}),
        },
      };
    });

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return successResponse(
      {
        round: { _id: round._id, roundName: round.roundName, roundNumber: round.roundNumber },
        totalSubmissions: submissions.length,
        advancingCount: advancingTeamIds.length,
        eliminatedCount: submissions.length - advancingTeamIds.length,
        nextRound: nextRound
          ? { _id: nextRound._id, roundName: nextRound.roundName, roundNumber: nextRound.roundNumber }
          : null,
        results: results.length,
      },
      `Round ${round.roundNumber} finalised. ${advancingTeamIds.length} team(s) advancing.`
    );
  } catch (err: any) {
    console.error('Advance round error:', err);
    return errorResponse('Failed to advance round', 500);
  }
}
