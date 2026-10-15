import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Team } from '@/models/Team';
import { Submission } from '@/models/Submission';
import { Round } from '@/models/Round';
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

    // 1. Fetch user's own team participations (hackathons user joined)
    const userTeams = await Team.find({ members: auth._id })
      .sort({ createdAt: -1 })
      .populate('hackathonId')
      .populate('leaderId', 'fullName username avatar email')
      .populate('members', 'fullName username avatar email')
      .lean();

    const teamIds = userTeams.map((t) => t._id);
    const submissions = await Submission.find({ teamId: { $in: teamIds } })
      .populate('roundId', 'roundName roundNumber roundType')
      .lean();

    const submissionsByTeamId: Record<string, any[]> = {};
    submissions.forEach((sub) => {
      const tId = sub.teamId.toString();
      if (!submissionsByTeamId[tId]) submissionsByTeamId[tId] = [];
      submissionsByTeamId[tId].push(sub);
    });

    const myParticipations = userTeams
      .filter((t) => t.hackathonId) // ensure hackathon exists
      .map((t: any) => {
        const h = t.hackathonId;
        const lifecycle = getLifecycleStatus(h);
        const teamSubmissions = submissionsByTeamId[t._id.toString()] || [];

        return {
          teamId: t._id,
          teamName: t.name,
          inviteCode: t.inviteCode,
          isLeader: t.leaderId?._id?.toString() === auth._id,
          leader: t.leaderId,
          members: t.members,
          memberCount: t.members?.length || 0,
          paymentStatus: t.paymentStatus,
          registeredAt: t.createdAt,
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
          submissions: teamSubmissions,
          submissionsCount: teamSubmissions.length,
        };
      });

    // 2. Fetch created hackathons & recent participations for organizers
    const createdHackathons = await Hackathon.find({ organizerId: auth._id })
      .select('_id eventName slug banner status hackingStartsAt hackingEndsAt')
      .lean();

    let organizerRecentParticipations: any[] = [];
    let mostRecentCreatedHackathonParticipation: any = null;

    if (createdHackathons.length > 0) {
      const createdHackathonIds = createdHackathons.map((h) => h._id);

      const recentTeamsInCreatedHackathons = await Team.find({
        hackathonId: { $in: createdHackathonIds },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('hackathonId', 'eventName slug banner status mode hackingStartsAt hackingEndsAt')
        .populate('leaderId', 'fullName username avatar email')
        .populate('members', 'fullName username avatar email')
        .lean();

      organizerRecentParticipations = recentTeamsInCreatedHackathons.map((t: any) => {
        const h = t.hackathonId || {};
        const lifecycle = getLifecycleStatus(h);
        return {
          teamId: t._id,
          teamName: t.name,
          inviteCode: t.inviteCode,
          leader: t.leaderId,
          members: t.members,
          memberCount: t.members?.length || 0,
          paymentStatus: t.paymentStatus,
          registeredAt: t.createdAt,
          hackathon: {
            _id: h._id,
            eventName: h.eventName,
            slug: h.slug,
            banner: h.banner,
            status: h.status,
            ...lifecycle,
          },
        };
      });

      if (organizerRecentParticipations.length > 0) {
        mostRecentCreatedHackathonParticipation = organizerRecentParticipations[0];
      }
    }

    const mostRecentParticipation =
      myParticipations.length > 0 ? myParticipations[0] : null;

    return successResponse(
      {
        myParticipations,
        mostRecentParticipation,
        organizerRecentParticipations,
        mostRecentCreatedHackathonParticipation,
        hasCreatedHackathons: createdHackathons.length > 0,
        stats: {
          totalMyParticipations: myParticipations.length,
          totalCreatedHackathons: createdHackathons.length,
          totalRegistrationsInCreated: organizerRecentParticipations.length,
        },
      },
      'Participations fetched successfully'
    );
  } catch (err: any) {
    console.error('Get participations error:', err);
    return errorResponse('Failed to fetch participations', 500);
  }
}
