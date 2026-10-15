import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { Round } from '@/models/Round';
import { Submission } from '@/models/Submission';
import { JudgeScore } from '@/models/JudgeScore';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

function getRoundLifecycle(round: any) {
  const now = Date.now();
  const opens = new Date(round.roundOpens).getTime();
  const closes = new Date(round.roundCloses).getTime();

  if (now < opens) {
    return { roundStatus: 'UPCOMING', isActive: false, isClosed: false };
  }
  if (now > closes) {
    return { roundStatus: 'CLOSED', isActive: false, isClosed: true };
  }
  return { roundStatus: 'ACTIVE', isActive: true, isClosed: false };
}

export async function GET(
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
        return errorResponse('You do not have judging access to this hackathon', 403);
      }
    }

    // Fetch all rounds for this hackathon
    const allRounds = await Round.find({ hackathonId: id })
      .sort({ roundNumber: 1 })
      .lean();

    // Determine access permissions
    let allowedRoundIds: string[] = [];
    let accessType: 'FULL' | 'SPECIFIC_ROUNDS' = 'FULL';

    if (isOrganizer) {
      accessType = 'FULL';
      allowedRoundIds = allRounds.map((r) => r._id.toString());
    } else {
      accessType = judge.accessType || 'FULL';
      if (accessType === 'SPECIFIC_ROUNDS' && judge.roundIds && judge.roundIds.length > 0) {
        const permittedSet = new Set(judge.roundIds.map((r: any) => r.toString()));
        allowedRoundIds = allRounds
          .filter((r) => permittedSet.has(r._id.toString()))
          .map((r) => r._id.toString());
      } else {
        allowedRoundIds = allRounds.map((r) => r._id.toString());
      }
    }

    // Check optional filter by roundId from query string
    const queryRoundId = req.nextUrl.searchParams.get('roundId');
    if (queryRoundId) {
      if (!allowedRoundIds.includes(queryRoundId)) {
        return errorResponse(
          'Access denied: You do not have permission to view or judge this specific round',
          403
        );
      }
      allowedRoundIds = [queryRoundId];
    }

    const targetRounds = allRounds.filter((r) =>
      allowedRoundIds.includes(r._id.toString())
    );

    // Fetch submissions for all target rounds
    const submissions = await Submission.find({
      hackathonId: id,
      roundId: { $in: targetRounds.map((r) => r._id) },
    })
      .populate({
        path: 'teamId',
        populate: [
          { path: 'leaderId', select: 'fullName username avatar email' },
          { path: 'members', select: 'fullName username avatar email' },
        ],
      })
      .lean();

    // Fetch scores submitted by this judge (or all if organizer)
    const scoreFilter: any = { hackathonId: id };
    if (judge) {
      scoreFilter.judgeId = judge._id;
    }
    const myScores = await JudgeScore.find(scoreFilter).lean();
    const scoreMap = new Map(myScores.map((s) => [s.submissionId.toString(), s]));

    // Group submissions round-wise
    const submissionsByRound: Record<string, any[]> = {};
    submissions.forEach((sub: any) => {
      const rId = sub.roundId.toString();
      if (!submissionsByRound[rId]) submissionsByRound[rId] = [];

      const score = scoreMap.get(sub._id.toString());
      submissionsByRound[rId].push({
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
        deckFileUrl: sub.deckFileUrl,
        repoUrl: sub.repoUrl,
        liveUrl: sub.liveUrl,
        demoCredentials: sub.demoCredentials,
        pitchVideoUrl: sub.pitchVideoUrl,
        description: sub.description,
        verificationChecklist: sub.verificationChecklist,
        status: sub.status,
        submittedAt: sub.createdAt,
        evaluation: score
          ? {
              isEvaluated: true,
              judgeScoreId: score._id,
              criteriaScores: score.criteriaScores,
              overallComment: score.overallComment,
              submittedAt: score.submittedAt,
            }
          : {
              isEvaluated: false,
            },
      });
    });

    const roundsWithSubmissions = targetRounds.map((round: any) => {
      const rId = round._id.toString();
      const roundSubs = submissionsByRound[rId] || [];
      const evaluatedCount = roundSubs.filter((s) => s.evaluation.isEvaluated).length;
      const lifecycle = getRoundLifecycle(round);

      return {
        roundId: round._id,
        roundName: round.roundName,
        roundNumber: round.roundNumber,
        roundType: round.roundType,
        roundOpens: round.roundOpens,
        roundCloses: round.roundCloses,
        ...lifecycle,
        criterias: round.criterias || [],
        aiWeightage: round.aiWeightage,
        scoreThreshold: round.scoreThreshold,
        totalSubmissions: roundSubs.length,
        evaluatedSubmissionsCount: evaluatedCount,
        pendingSubmissionsCount: Math.max(0, roundSubs.length - evaluatedCount),
        submissions: roundSubs,
      };
    });

    return successResponse(
      {
        hackathon: {
          _id: hackathon._id,
          eventName: hackathon.eventName,
          theme: hackathon.theme,
          banner: hackathon.banner,
          status: hackathon.status,
        },
        judgeAccess: {
          isOrganizer,
          judgeId: judge?._id || null,
          accessType,
          accessTypeLabel:
            accessType === 'FULL'
              ? 'Full Access (All Submissions)'
              : 'Specific Rounds Access',
          allowedRoundIds,
          totalAllowedRounds: targetRounds.length,
        },
        rounds: roundsWithSubmissions,
      },
      'Round-wise submissions fetched successfully'
    );
  } catch (err: any) {
    console.error('Get judge submissions error:', err);
    return errorResponse('Failed to fetch judge submissions', 500);
  }
}
