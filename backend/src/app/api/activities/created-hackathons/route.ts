import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Judge } from '@/models/Judge';
import { Team } from '@/models/Team';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

function getLifecycleStatus(h: any) {
  const now = Date.now();
  if (h.status === 'DRAFT') {
    return { lifecycleStatus: 'DRAFT', statusLabel: 'Draft', isDraft: true, isOver: false, isOngoing: false, isUpcoming: false };
  }
  if (h.status === 'COMPLETED') {
    return { lifecycleStatus: 'COMPLETED', statusLabel: 'Over', isDraft: false, isOver: true, isOngoing: false, isUpcoming: false };
  }
  if (h.hackingEndsAt && new Date(h.hackingEndsAt).getTime() < now) {
    return { lifecycleStatus: 'COMPLETED', statusLabel: 'Over', isDraft: false, isOver: true, isOngoing: false, isUpcoming: false };
  }
  if (h.status === 'ONGOING') {
    return { lifecycleStatus: 'ONGOING', statusLabel: 'Currently Going', isDraft: false, isOver: false, isOngoing: true, isUpcoming: false };
  }
  if (
    h.hackingStartsAt &&
    h.hackingEndsAt &&
    new Date(h.hackingStartsAt).getTime() <= now &&
    new Date(h.hackingEndsAt).getTime() >= now
  ) {
    return { lifecycleStatus: 'ONGOING', statusLabel: 'Currently Going', isDraft: false, isOver: false, isOngoing: true, isUpcoming: false };
  }
  return { lifecycleStatus: 'UPCOMING', statusLabel: 'Upcoming', isDraft: false, isOver: false, isOngoing: false, isUpcoming: true };
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    const [hackathons, totalCount] = await Promise.all([
      Hackathon.find({ organizerId: auth._id })
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Hackathon.countDocuments({ organizerId: auth._id }),
    ]);

    const hackathonIds = hackathons.map((h) => h._id);

    // Fetch counts in parallel
    const [teamsCounts, judgesCounts, roundsCounts] = await Promise.all([
      Team.aggregate([
        { $match: { hackathonId: { $in: hackathonIds } } },
        { $group: { _id: '$hackathonId', count: { $sum: 1 } } },
      ]),
      Judge.aggregate([
        { $match: { hackathonId: { $in: hackathonIds } } },
        { $group: { _id: '$hackathonId', count: { $sum: 1 }, acceptedCount: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } } } },
      ]),
      Round.aggregate([
        { $match: { hackathonId: { $in: hackathonIds } } },
        { $group: { _id: '$hackathonId', count: { $sum: 1 } } },
      ]),
    ]);

    const teamsCountMap = new Map(teamsCounts.map((t) => [t._id.toString(), t.count]));
    const judgesCountMap = new Map(judgesCounts.map((j) => [j._id.toString(), j]));
    const roundsCountMap = new Map(roundsCounts.map((r) => [r._id.toString(), r.count]));

    const formattedHackathons = hackathons.map((h: any) => {
      const idStr = h._id.toString();
      const lifecycle = getLifecycleStatus(h);

      const sp = h.stepProgress || {
        basicDetails: false,
        timeline: false,
        rulesEligibility: false,
        rounds: false,
        prizesSponsors: false,
        payments: false,
        judges: false,
      };
      const completedSteps = Object.values(sp).filter(Boolean).length;
      const progressPercent = Math.round((completedSteps / 7) * 100);

      const totalPrizes = (h.prizes || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const judgeStats = judgesCountMap.get(idStr) || { count: 0, acceptedCount: 0 };

      return {
        _id: h._id,
        slug: h.slug,
        eventName: h.eventName || 'Untitled Hackathon',
        theme: h.theme || '',
        mode: h.mode,
        banner: h.banner || '',
        logo: h.logo || '',
        organizingBody: h.organizingBody || '',
        shortDescription: h.shortDescription || '',
        description: h.description || '',
        status: h.status,
        ...lifecycle,

        // Step progression
        currentStep: h.currentStep,
        stepProgress: sp,
        progressPercent,

        // Timeline
        registrationOpens: h.registrationOpens,
        registrationCloses: h.registrationCloses,
        hackingStartsAt: h.hackingStartsAt,
        hackingEndsAt: h.hackingEndsAt,
        resultAnnouncementDate: h.resultAnnouncementDate,

        // Metrics
        expectedTeamsCount: h.expectedTeamsCount || 10,
        registeredTeamsCount: teamsCountMap.get(idStr) || h.registeredTeamsCount || 0,
        roundsCount: roundsCountMap.get(idStr) || (h.roundIds ? h.roundIds.length : 0),
        totalJudgesCount: judgeStats.count,
        acceptedJudgesCount: judgeStats.acceptedCount,
        totalPrizes,

        // Management and Navigation URLs
        manageUrl: `/hackathon/management/${h._id}`,
        publicUrl: h.slug ? `/hackathons/${h.slug}` : `/hackathons/${h._id}`,
        editUrl: h.status === 'DRAFT' ? `/create-hackathon?id=${h._id}` : `/create-hackathon?id=${h._id}&mode=edit`,

        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
      };
    });

    const stats = {
      totalCreated: totalCount,
      draftsCount: formattedHackathons.filter((h) => h.lifecycleStatus === 'DRAFT').length,
      upcomingCount: formattedHackathons.filter((h) => h.lifecycleStatus === 'UPCOMING').length,
      ongoingCount: formattedHackathons.filter((h) => h.lifecycleStatus === 'ONGOING').length,
      completedCount: formattedHackathons.filter((h) => h.lifecycleStatus === 'COMPLETED').length,
    };

    return successResponse(
      {
        hackathons: formattedHackathons,
        stats,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      'Created hackathons fetched successfully'
    );
  } catch (err: any) {
    console.error('Get created hackathons error:', err);
    return errorResponse('Failed to fetch created hackathons', 500);
  }
}
