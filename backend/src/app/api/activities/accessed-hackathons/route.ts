import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Judge } from '@/models/Judge';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Submission } from '@/models/Submission';
import { JudgeScore } from '@/models/JudgeScore';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

function getLifecycleStatus(h: any) {
  const now = Date.now();
  if (h.status === 'COMPLETED') {
    return { lifecycleStatus: 'COMPLETED', statusLabel: 'Over', isOver: true, isOngoing: false, isUpcoming: false };
  }
  if (h.hackingEndsAt && new Date(h.hackingEndsAt).getTime() < now) {
    return { lifecycleStatus: 'COMPLETED', statusLabel: 'Over', isOver: true, isOngoing: false, isUpcoming: false };
  }
  if (h.status === 'ONGOING') {
    return { lifecycleStatus: 'ONGOING', statusLabel: 'Currently Going', isOver: false, isOngoing: true, isUpcoming: false };
  }
  if (
    h.hackingStartsAt &&
    h.hackingEndsAt &&
    new Date(h.hackingStartsAt).getTime() <= now &&
    new Date(h.hackingEndsAt).getTime() >= now
  ) {
    return { lifecycleStatus: 'ONGOING', statusLabel: 'Currently Going', isOver: false, isOngoing: true, isUpcoming: false };
  }
  return { lifecycleStatus: 'UPCOMING', statusLabel: 'Upcoming', isOver: false, isOngoing: false, isUpcoming: true };
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const user = await User.findById(auth._id).select('email').lean();
    const userEmail = user?.email?.toLowerCase();

    // Find all judge records where user is accepted
    const judgeQuery: any = {
      status: 'ACCEPTED',
      $or: [
        { userId: auth._id },
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    };

    const judgeRecords = await Judge.find(judgeQuery)
      .populate('hackathonId')
      .populate('roundIds', 'roundName roundNumber roundType roundOpens roundCloses')
      .lean();

    const formattedAccessedHackathons = await Promise.all(
      judgeRecords.map(async (judge: any) => {
        const h = judge.hackathonId;
        if (!h) return null;

        const lifecycle = getLifecycleStatus(h);

        // Fetch all rounds for hackathon to resolve full vs specific round access
        const allRounds = await Round.find({ hackathonId: h._id })
          .select('_id roundName roundNumber roundType roundOpens roundCloses')
          .sort({ roundNumber: 1 })
          .lean();

        const accessType = judge.accessType || 'FULL';
        let allowedRounds = [];

        if (accessType === 'SPECIFIC_ROUNDS' && judge.roundIds && judge.roundIds.length > 0) {
          const roundIdSet = new Set(judge.roundIds.map((r: any) => (r._id || r).toString()));
          allowedRounds = allRounds.filter((r) => roundIdSet.has(r._id.toString()));
        } else {
          allowedRounds = allRounds;
        }

        const allowedRoundIds = allowedRounds.map((r) => r._id);

        // Submission & scoring metrics
        const totalSubmissionsInScope = await Submission.countDocuments({
          hackathonId: h._id,
          roundId: { $in: allowedRoundIds },
        });

        const scoredByMeCount = await JudgeScore.countDocuments({
          hackathonId: h._id,
          judgeId: judge._id,
          roundId: { $in: allowedRoundIds },
        });

        return {
          judgeId: judge._id,
          judgeStatus: judge.status,
          accessType,
          accessTypeLabel:
            accessType === 'FULL'
              ? 'Full Access (All Submissions)'
              : 'Specific Rounds Access',
          allowedRounds,
          allowedRoundIds: allowedRoundIds.map((id) => id.toString()),
          metrics: {
            totalSubmissionsInScope,
            evaluatedByMeCount: scoredByMeCount,
            pendingEvaluationCount: Math.max(0, totalSubmissionsInScope - scoredByMeCount),
          },
          hackathon: {
            _id: h._id,
            slug: h.slug,
            eventName: h.eventName,
            theme: h.theme,
            mode: h.mode,
            banner: h.banner,
            logo: h.logo,
            organizingBody: h.organizingBody,
            status: h.status,
            ...lifecycle,
            registrationOpens: h.registrationOpens,
            registrationCloses: h.registrationCloses,
            hackingStartsAt: h.hackingStartsAt,
            hackingEndsAt: h.hackingEndsAt,
            resultAnnouncementDate: h.resultAnnouncementDate,
          },
          // URLs to open submissions round-wise
          submissionsUrl: `/api/hackathons/${h._id}/judge/submissions`,
          judgePortalUrl: `/hackathon/${h._id}/judge`,
        };
      })
    );

    const validAccessedHackathons = formattedAccessedHackathons.filter(Boolean);

    const stats = {
      totalAccessed: validAccessedHackathons.length,
      upcomingCount: validAccessedHackathons.filter((a: any) => a.hackathon.lifecycleStatus === 'UPCOMING').length,
      ongoingCount: validAccessedHackathons.filter((a: any) => a.hackathon.lifecycleStatus === 'ONGOING').length,
      completedCount: validAccessedHackathons.filter((a: any) => a.hackathon.lifecycleStatus === 'COMPLETED').length,
    };

    return successResponse(
      {
        accessedHackathons: validAccessedHackathons,
        stats,
      },
      'Accessed hackathons fetched successfully'
    );
  } catch (err: any) {
    console.error('Get accessed hackathons error:', err);
    return errorResponse('Failed to fetch accessed hackathons', 500);
  }
}
