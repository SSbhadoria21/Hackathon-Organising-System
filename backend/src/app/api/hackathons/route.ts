import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Team } from '@/models/Team';
import { getAuthUser } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = getAuthUser(req);

    const search = req.nextUrl.searchParams.get('search') || '';
    const mode = req.nextUrl.searchParams.get('mode');
    const eligibility = req.nextUrl.searchParams.get('eligibility');
    const status = req.nextUrl.searchParams.get('status');
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '12');

    const query: any = {
      status: status ? status : { $in: ['PUBLISHED', 'ONGOING', 'COMPLETED'] },
    };

    if (search.trim()) {
      const sRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { eventName: sRegex },
        { theme: sRegex },
        { organizingBody: sRegex },
        { shortDescription: sRegex },
      ];
    }

    if (mode && ['ONLINE', 'OFFLINE', 'HYBRID'].includes(mode)) {
      query.mode = mode;
    }

    if (eligibility) {
      query.eligibility = eligibility;
    }

    const [hackathons, totalCount] = await Promise.all([
      Hackathon.find(query)
        .populate('organizerId', 'username fullName avatar')
        .sort({ registrationCloses: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Hackathon.countDocuments(query),
    ]);

    let userRegisteredHackathonIds = new Set<string>();
    if (auth) {
      const userTeams = await Team.find({ members: auth._id }).select('hackathonId').lean();
      userRegisteredHackathonIds = new Set(userTeams.map((t) => t.hackathonId.toString()));
    }

    const formattedHackathons = hackathons.map((h: any) => {
      const totalPrizes = (h.prizes || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      return {
        _id: h._id,
        slug: h.slug,
        eventName: h.eventName,
        theme: h.theme,
        mode: h.mode,
        banner: h.banner,
        logo: h.logo,
        organizingBody: h.organizingBody,
        shortDescription: h.shortDescription,
        expectedTeamsCount: h.expectedTeamsCount,
        registeredTeamsCount: h.registeredTeamsCount || 0,
        registrationOpens: h.registrationOpens,
        registrationCloses: h.registrationCloses,
        hackingStartsAt: h.hackingStartsAt,
        hackingEndsAt: h.hackingEndsAt,
        resultAnnouncementDate: h.resultAnnouncementDate,
        teamMinSize: h.teamMinSize,
        teamMaxSize: h.teamMaxSize,
        eligibility: h.eligibility,
        address: h.address,
        paid: h.paid,
        feeAmount: h.feeAmount,
        totalPrizes,
        status: h.status,
        organizer: h.organizerId,
        isUserRegistered: userRegisteredHackathonIds.has(h._id.toString()),
      };
    });

    return successResponse(
      {
        hackathons: formattedHackathons,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      'Hackathons fetched'
    );
  } catch (err: any) {
    console.error('Get hackathons error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
