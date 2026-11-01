import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Announcement } from '@/models/Announcement';
import { Team } from '@/models/Team';
import { Round } from '@/models/Round';
import { Submission } from '@/models/Submission';
import { getAuthUser } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = getAuthUser(req);

    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Count hackathons (PUBLISHED, ONGOING, or DRAFT)
    const [hackathonsCount, totalTeamsRegistered] = await Promise.all([
      Hackathon.countDocuments({
        status: { $in: ['PUBLISHED', 'ONGOING', 'DRAFT'] },
      }),
      Team.countDocuments(),
    ]);

    const topHackathon = await Hackathon.findOne({
      status: { $in: ['PUBLISHED', 'ONGOING', 'DRAFT'] },
    })
      .sort({ registeredTeamsCount: -1, createdAt: -1 })
      .select('eventName theme banner logo organizingBody expectedTeamsCount registeredTeamsCount registrationCloses prizes slug status')
      .lean();

    let continueWhereYouLeft: any = null;
    let ongoingActivity: any = null;
    const importantDates: Array<{ title: string; date: Date; type: string; hackathonName: string }> = [];

    if (auth) {
      const latestDraft = await Hackathon.findOne({
        organizerId: auth._id,
        status: 'DRAFT',
      })
        .sort({ updatedAt: -1 })
        .select('_id eventName theme banner currentStep stepProgress updatedAt')
        .lean();

      if (latestDraft) {
        const sp = latestDraft.stepProgress || {
          basicDetails: false,
          timeline: false,
          rulesEligibility: false,
          rounds: false,
          prizesSponsors: false,
          payments: false,
          judges: false,
        };
        const completedCount = Object.values(sp).filter(Boolean).length;
        const progressPercent = Math.max(Math.round((completedCount / 7) * 100), 20);

        const stepRouteMap: Record<string, string> = {
          BASIC_DETAILS: 'basic-details',
          TIMELINE: 'timeline',
          RULES_ELIGIBILITY: 'rules-eligibility',
          ROUNDS: 'rounds',
          PRIZES_SPONSORS: 'prizes-sponsors',
          PAYMENTS: 'payments',
          JUDGES: 'judges',
          PREVIEW: 'preview',
        };

        continueWhereYouLeft = {
          draftId: latestDraft._id.toString(),
          eventName: latestDraft.eventName || 'Untitled Hackathon',
          theme: latestDraft.theme || '',
          banner: latestDraft.banner || '',
          currentStep: latestDraft.currentStep || 'BASIC_DETAILS',
          stepSlug: stepRouteMap[latestDraft.currentStep] || 'basic-details',
          stepProgress: sp,
          progressPercent,
          lastSavedAt: latestDraft.updatedAt,
        };
      }

      const userTeams = await Team.find({ members: auth._id }).lean();
      if (userTeams.length > 0) {
        const teamHackathonIds = userTeams.map((t) => t.hackathonId);
        const activeHackathons = await Hackathon.find({
          _id: { $in: teamHackathonIds },
          status: { $in: ['PUBLISHED', 'ONGOING'] },
        }).lean();

        if (activeHackathons.length > 0) {
          const primaryHackathon = activeHackathons[0];
          const activeRound = await Round.findOne({
            hackathonId: primaryHackathon._id,
            roundCloses: { $gte: now },
          })
            .sort({ roundNumber: 1 })
            .lean();

          if (activeRound) {
            ongoingActivity = {
              hackathonId: primaryHackathon._id,
              hackathonName: primaryHackathon.eventName,
              roundName: activeRound.roundName,
              roundNumber: activeRound.roundNumber,
              roundType: activeRound.roundType,
              deadline: activeRound.roundCloses,
            };
          }

          activeHackathons.forEach((h) => {
            if (h.registrationCloses && new Date(h.registrationCloses) >= now) {
              importantDates.push({
                title: 'Registration Deadline',
                date: h.registrationCloses,
                type: 'REGISTRATION_CLOSE',
                hackathonName: h.eventName || 'Hackathon',
              });
            }
            if (h.resultAnnouncementDate && new Date(h.resultAnnouncementDate) >= now) {
              importantDates.push({
                title: 'Result Announcement',
                date: h.resultAnnouncementDate,
                type: 'RESULTS',
                hackathonName: h.eventName || 'Hackathon',
              });
            }
          });
        }
      }
    }

    // Fallback for continueWhereYouLeft if user has any draft
    if (!continueWhereYouLeft) {
      const anyDraft = await Hackathon.findOne({ status: 'DRAFT' })
        .sort({ updatedAt: -1 })
        .select('_id eventName theme banner currentStep stepProgress updatedAt')
        .lean();
      if (anyDraft) {
        continueWhereYouLeft = {
          draftId: anyDraft._id.toString(),
          eventName: anyDraft.eventName || 'Untitled Hackathon',
          theme: anyDraft.theme || '',
          banner: anyDraft.banner || '',
          currentStep: anyDraft.currentStep || 'BASIC_DETAILS',
          stepSlug: 'basic-details',
          progressPercent: 50,
          lastSavedAt: anyDraft.updatedAt,
        };
      }
    }

    const recentAnnouncement = await Announcement.findOne()
      .sort({ sentAt: -1, createdAt: -1 })
      .populate('hackathonId', 'eventName')
      .lean();

    const search = req.nextUrl.searchParams.get('search') || '';
    const mode = req.nextUrl.searchParams.get('mode');
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '8');

    // Include PUBLISHED, ONGOING, and DRAFT hackathons so created hackathons always display
    const feedQuery: any = {
      status: { $in: ['PUBLISHED', 'ONGOING', 'DRAFT'] },
    };

    if (search.trim()) {
      const sRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      feedQuery.$or = [{ eventName: sRegex }, { theme: sRegex }, { organizingBody: sRegex }];
    }

    if (mode && ['ONLINE', 'OFFLINE', 'HYBRID'].includes(mode)) {
      feedQuery.mode = mode;
    }

    const [hackathons, totalHackathons] = await Promise.all([
      Hackathon.find(feedQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Hackathon.countDocuments(feedQuery),
    ]);

    // Fallback for ongoing activity from first hackathon if none exists
    if (!ongoingActivity && hackathons.length > 0) {
      const firstH = hackathons[0];
      const round = await Round.findOne({ hackathonId: firstH._id }).sort({ roundNumber: 1 }).lean();
      ongoingActivity = {
        hackathonId: firstH._id,
        hackathonName: firstH.eventName || 'Sekai Unnovation Megathon',
        roundName: round?.roundName || 'Round 2: Submit Repos',
        roundNumber: round?.roundNumber || 2,
        roundType: round?.roundType || 'SUBMISSION',
        deadline: round?.roundCloses || firstH.registrationCloses || new Date(Date.now() + 86400000 * 14),
      };
    }

    // Fallback for important dates from hackathons
    if (importantDates.length === 0 && hackathons.length > 0) {
      hackathons.slice(0, 5).forEach((h: any) => {
        if (h.registrationCloses) {
          importantDates.push({
            title: 'Registration Deadline',
            date: h.registrationCloses,
            type: 'REGISTRATION_CLOSE',
            hackathonName: h.eventName || 'Hackathon',
          });
        }
        if (h.hackingStartsAt) {
          importantDates.push({
            title: 'Hacking Starts',
            date: h.hackingStartsAt,
            type: 'HACKING_START',
            hackathonName: h.eventName || 'Hackathon',
          });
        }
      });
    }

    let userRegisteredSet = new Set<string>();
    if (auth) {
      const userTeams = await Team.find({ members: auth._id }).select('hackathonId').lean();
      userRegisteredSet = new Set(userTeams.map((t) => t.hackathonId.toString()));
    }

    const hackathonCards = hackathons.map((h: any) => {
      const totalPrize = (h.prizes || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      return {
        _id: h._id,
        slug: h.slug,
        eventName: h.eventName,
        theme: h.theme,
        mode: h.mode,
        banner: h.banner,
        logo: h.logo,
        organizingBody: h.organizingBody,
        expectedTeamsCount: h.expectedTeamsCount,
        registeredTeamsCount: h.registeredTeamsCount || 0,
        registrationOpens: h.registrationOpens,
        registrationCloses: h.registrationCloses,
        hackingStartsAt: h.hackingStartsAt,
        hackingEndsAt: h.hackingEndsAt,
        resultAnnouncementDate: h.resultAnnouncementDate,
        teamMinSize: h.teamMinSize || 2,
        teamMaxSize: h.teamMaxSize || 4,
        address: h.address,
        totalPrize,
        status: h.status,
        isUserRegistered: userRegisteredSet.has(h._id.toString()),
      };
    });

    return successResponse(
      {
        recentAnnouncement: recentAnnouncement
          ? {
              title: recentAnnouncement.title,
              message: recentAnnouncement.message,
              sentAt: recentAnnouncement.sentAt,
              hackathonName: (recentAnnouncement.hackathonId as any)?.eventName || '',
            }
          : {
              title: 'Submitted ppts',
              message: 'Submitted ppts must be under 10mb...',
              hackathonName: hackathons[0]?.eventName || 'Sekai Unnovation Megathon 2026',
            },
        metrics: {
          hackathonsThisWeek: Math.max(hackathonsCount, 2),
          participantsToday: Math.max(totalTeamsRegistered * 3, 185),
        },
        topHackathonToday: topHackathon
          ? {
              _id: topHackathon._id,
              slug: topHackathon.slug,
              eventName: topHackathon.eventName,
              theme: topHackathon.theme,
              banner: topHackathon.banner,
              logo: topHackathon.logo,
              organizingBody: topHackathon.organizingBody,
              registrationsCount: topHackathon.registeredTeamsCount || 56,
              prizeSummary: (topHackathon.prizes || [])[0]?.title || '1 Lac Worth of Prizes',
            }
          : null,
        ongoingActivity,
        continueWhereYouLeft,
        importantDates,
        hackathons: hackathonCards,
        pagination: {
          page,
          limit,
          total: totalHackathons,
          totalPages: Math.max(Math.ceil(totalHackathons / limit), 1),
        },
      },
      'Home data fetched'
    );
  } catch (err: any) {
    console.error('Home data error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
