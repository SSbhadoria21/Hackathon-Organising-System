import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Submission } from '@/models/Submission';
import { JudgeScore } from '@/models/JudgeScore';
import { Judge } from '@/models/Judge';
import { Result } from '@/models/Result';
import { Team } from '@/models/Team';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

/**
 * GET /hackathons/:id/rounds/:roundId/leaderboard
 * Organizer view: all submissions with aggregated judge scores and ranks.
 * Also shows per-criteria breakdown for the full evaluation rubric.
 */
export async function GET(
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

    const hackathon = await Hackathon.findById(id).lean();
    if (!hackathon) return errorResponse('Hackathon not found', 404);

    const isOrganizer = hackathon.organizerId.toString() === auth._id;

    // Judges can also view their round's leaderboard
    let judgeDoc: any = null;
    if (!isOrganizer) {
      judgeDoc = await Judge.findOne({
        hackathonId: id,
        status: 'ACCEPTED',
        $or: [{ userId: auth._id }],
      }).lean();

      if (!judgeDoc) {
        return errorResponse('Access denied', 403);
      }

      // Check if this judge has access to this round
      const hasAccess =
        judgeDoc.accessType === 'FULL' ||
        (judgeDoc.roundIds || []).some((r: any) => r.toString() === roundId);

      if (!hasAccess) {
        return errorResponse('You do not have access to this round', 403);
      }
    }

    const round = await Round.findOne({ _id: roundId, hackathonId: id }).lean();
    if (!round) return errorResponse('Round not found', 404);

    const submissions = await Submission.find({ hackathonId: id, roundId })
      .populate({
        path: 'teamId',
        populate: [
          { path: 'leaderId', select: 'fullName username avatar email' },
          { path: 'members', select: 'fullName username avatar email' },
        ],
      })
      .lean();

    // Get all judge scores for this round
    const allScores = await JudgeScore.find({ hackathonId: id, roundId })
      .populate('judgeId', 'name email')
      .lean();

    // Group scores by submission
    const scoresBySubmission = new Map<string, any[]>();
    for (const score of allScores) {
      const sid = score.submissionId.toString();
      if (!scoresBySubmission.has(sid)) scoresBySubmission.set(sid, []);
      scoresBySubmission.get(sid)!.push(score);
    }

    // Get all judges for this hackathon to know total expected judge count
    const allJudges = await Judge.find({
      hackathonId: id,
      status: 'ACCEPTED',
      $or: [
        { accessType: 'FULL' },
        { roundIds: new mongoose.Types.ObjectId(roundId) },
      ],
    })
      .select('name email userId')
      .lean();

    // Build criteria weight map
    const criteriaMap = new Map<string, { name: string; weight: number; description: string }>();
    const totalWeight = (round.criterias || []).reduce((acc: number, c: any) => acc + c.weight, 0) || 100;

    (round.criterias || []).forEach((c: any) => {
      criteriaMap.set(c._id.toString(), {
        name: c.name,
        weight: c.weight,
        description: c.description,
      });
    });

    // Build leaderboard entries
    const leaderboard = submissions.map((sub: any) => {
      const subScores = scoresBySubmission.get(sub._id.toString()) || [];
      const judgeCount = subScores.length;

      // Per-criteria averages
      const criteriaAverages: Record<string, { name: string; weight: number; avgScore: number; comments: string[] }> = {};
      (round.criterias || []).forEach((c: any) => {
        criteriaAverages[c._id.toString()] = {
          name: c.name,
          weight: c.weight,
          avgScore: 0,
          comments: [],
        };
      });

      let weightedTotal = 0;
      for (const js of subScores) {
        for (const cs of js.criteriaScores) {
          const cid = cs.criteriaId.toString();
          const critInfo = criteriaAverages[cid];
          if (critInfo) {
            critInfo.avgScore += cs.score;
            if (cs.comment) critInfo.comments.push(cs.comment);
          }
        }
      }

      // Average out
      for (const cid in criteriaAverages) {
        if (judgeCount > 0) {
          criteriaAverages[cid].avgScore = parseFloat(
            (criteriaAverages[cid].avgScore / judgeCount).toFixed(2)
          );
        }
        // Compute contribution to total
        const contrib =
          (criteriaAverages[cid].avgScore * criteriaAverages[cid].weight) / totalWeight;
        weightedTotal += contrib;
      }

      const aggregatedScore = parseFloat(weightedTotal.toFixed(2));

      // Judge-by-judge breakdown (organizer only)
      const judgeBreakdown = isOrganizer
        ? subScores.map((js) => ({
            judgeId: js.judgeId,
            judgeName: (js.judgeId as any)?.name || 'Judge',
            criteriaScores: js.criteriaScores,
            overallComment: js.overallComment,
            submittedAt: js.submittedAt,
          }))
        : [];

      return {
        submissionId: sub._id,
        team: sub.teamId
          ? {
              _id: sub.teamId._id,
              name: sub.teamId.name,
              leader: sub.teamId.leaderId,
              members: sub.teamId.members,
              memberCount: sub.teamId.members?.length || 0,
            }
          : null,
        submission: {
          repoUrl: sub.repoUrl,
          liveUrl: sub.liveUrl,
          deckFileUrl: sub.deckFileUrl,
          pitchVideoUrl: sub.pitchVideoUrl,
          description: sub.description,
          status: sub.status,
          submittedAt: sub.createdAt,
        },
        evaluation: {
          judgesEvaluated: judgeCount,
          totalJudgesForRound: allJudges.length,
          evaluationComplete: judgeCount >= allJudges.length && allJudges.length > 0,
          aggregatedScore,
          criteriaAverages: Object.values(criteriaAverages),
          ...(isOrganizer ? { judgeBreakdown } : {}),
          overallComments: subScores.map((js) => js.overallComment).filter(Boolean),
        },
        // Existing result if any
        existingResult: null as any,
      };
    });

    // Attach existing results
    const existingResults = await Result.find({ hackathonId: id, roundId }).lean();
    const resultMap = new Map(existingResults.map((r) => [r.teamId.toString(), r]));

    leaderboard.forEach((entry) => {
      const teamId = entry.team?._id?.toString();
      if (teamId && resultMap.has(teamId)) {
        entry.existingResult = resultMap.get(teamId);
      }
    });

    // Sort by aggregated score descending
    leaderboard.sort((a, b) => b.evaluation.aggregatedScore - a.evaluation.aggregatedScore);

    // Add rank
    leaderboard.forEach((entry, idx) => {
      (entry as any).rank = idx + 1;
    });

    return successResponse(
      {
        hackathon: {
          _id: hackathon._id,
          eventName: hackathon.eventName,
          status: hackathon.status,
        },
        round: {
          _id: round._id,
          roundName: round.roundName,
          roundNumber: round.roundNumber,
          roundType: round.roundType,
          roundOpens: round.roundOpens,
          roundCloses: round.roundCloses,
          maxTeamsAdvancing: round.maxTeamsAdvancing,
          criterias: round.criterias,
          totalWeight,
        },
        judges: allJudges,
        totalSubmissions: submissions.length,
        leaderboard,
        suggestedAdvancingTeamIds: leaderboard
          .slice(0, round.maxTeamsAdvancing)
          .map((e) => e.team?._id?.toString())
          .filter(Boolean),
      },
      'Round leaderboard fetched'
    );
  } catch (err: any) {
    console.error('Leaderboard error:', err);
    return errorResponse('Failed to fetch leaderboard', 500);
  }
}
