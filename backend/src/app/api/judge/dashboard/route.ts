import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Judge } from '@/models/Judge';
import { Hackathon } from '@/models/Hackathon';
import { JudgeScore } from '@/models/JudgeScore';
import { Submission } from '@/models/Submission';
import { Round } from '@/models/Round';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

/**
 * GET /api/judge/dashboard
 * Returns all hackathons the authenticated user is a judge for,
 * with scoring progress per round.
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    // Find all judge records where this user is accepted
    const judgeRecords = await Judge.find({
      userId: auth._id,
      status: 'ACCEPTED',
    })
      .populate('hackathonId', 'eventName theme banner status hackingStartsAt hackingEndsAt organizerId mode')
      .lean();

    if (judgeRecords.length === 0) {
      return successResponse([], 'You are not a judge for any hackathon');
    }

    const dashboard = await Promise.all(
      judgeRecords.map(async (judgeRecord: any) => {
        const hackathon = judgeRecord.hackathonId;
        if (!hackathon) return null;

        const hackathonId = hackathon._id.toString();

        // Get rounds this judge has access to
        let rounds: any[];
        if (judgeRecord.accessType === 'FULL') {
          rounds = await Round.find({ hackathonId })
            .sort({ roundNumber: 1 })
            .lean();
        } else {
          rounds = await Round.find({
            _id: { $in: judgeRecord.roundIds || [] },
            hackathonId,
          })
            .sort({ roundNumber: 1 })
            .lean();
        }

        // For each round, count submissions and my scored count
        const roundProgress = await Promise.all(
          rounds.map(async (round: any) => {
            const totalSubs = await Submission.countDocuments({
              hackathonId,
              roundId: round._id,
            });

            const myScored = await JudgeScore.countDocuments({
              hackathonId,
              roundId: round._id,
              judgeId: judgeRecord._id,
            });

            const now = new Date();
            const roundStatus =
              now < round.roundOpens
                ? 'UPCOMING'
                : now > round.roundCloses
                ? 'CLOSED'
                : 'ACTIVE';

            return {
              roundId: round._id,
              roundName: round.roundName,
              roundNumber: round.roundNumber,
              roundType: round.roundType,
              roundOpens: round.roundOpens,
              roundCloses: round.roundCloses,
              roundStatus,
              totalSubmissions: totalSubs,
              scoredCount: myScored,
              pendingCount: Math.max(0, totalSubs - myScored),
              completionPercent:
                totalSubs > 0 ? Math.round((myScored / totalSubs) * 100) : 0,
              criterias: round.criterias || [],
            };
          })
        );

        const totalPending = roundProgress.reduce((acc, r) => acc + r.pendingCount, 0);
        const totalScored = roundProgress.reduce((acc, r) => acc + r.scoredCount, 0);

        return {
          judgeId: judgeRecord._id,
          accessType: judgeRecord.accessType,
          hackathon: {
            _id: hackathon._id,
            eventName: hackathon.eventName,
            theme: hackathon.theme,
            banner: hackathon.banner,
            status: hackathon.status,
            mode: hackathon.mode,
            hackingStartsAt: hackathon.hackingStartsAt,
            hackingEndsAt: hackathon.hackingEndsAt,
          },
          rounds: roundProgress,
          stats: {
            totalRounds: roundProgress.length,
            totalPendingSubmissions: totalPending,
            totalScoredSubmissions: totalScored,
            isFullyComplete: totalPending === 0 && totalScored > 0,
          },
        };
      })
    );

    const filtered = dashboard.filter(Boolean);

    return successResponse(filtered, 'Judge dashboard fetched');
  } catch (err: any) {
    console.error('Judge dashboard error:', err);
    return errorResponse('Failed to fetch judge dashboard', 500);
  }
}
