import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Team } from '@/models/Team';
import { Judge } from '@/models/Judge';
import { Submission } from '@/models/Submission';
import { Result } from '@/models/Result';
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

    const hackathon = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
    })
      .populate('organizerId', 'fullName username email avatar')
      .lean();

    if (!hackathon) {
      return errorResponse('Hackathon not found or you are not the organizer', 403);
    }

    // 1. Fetch rounds
    const rounds = await Round.find({ hackathonId: id })
      .sort({ roundNumber: 1 })
      .lean();

    // 2. Fetch teams
    const teams = await Team.find({ hackathonId: id })
      .sort({ createdAt: -1 })
      .populate('leaderId', 'fullName username email avatar')
      .populate('members', 'fullName username email avatar')
      .lean();

    // 3. Fetch judges
    const judges = await Judge.find({ hackathonId: id })
      .populate('userId', 'fullName username email avatar bio skills')
      .populate('roundIds', 'roundName roundNumber roundType')
      .lean();

    // 4. Fetch submissions
    const submissions = await Submission.find({ hackathonId: id })
      .populate('roundId', 'roundName roundNumber')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // 5. Fetch published results
    const results = await Result.find({ hackathonId: id })
      .populate('teamId', 'name')
      .populate('roundId', 'roundName roundNumber')
      .sort({ rank: 1 })
      .lean();

    // Calculate aggregated stats
    const totalParticipants = teams.reduce((acc, t: any) => acc + (t.members?.length || 0), 0);

    const submissionsByRound: Record<string, number> = {};
    submissions.forEach((s: any) => {
      const rId = s.roundId?._id ? s.roundId._id.toString() : s.roundId?.toString();
      if (rId) {
        submissionsByRound[rId] = (submissionsByRound[rId] || 0) + 1;
      }
    });

    const enrichedRounds = rounds.map((r: any) => {
      const now = Date.now();
      const opens = new Date(r.roundOpens).getTime();
      const closes = new Date(r.roundCloses).getTime();
      const isCurrent = now >= opens && now <= closes;

      return {
        ...r,
        submissionsCount: submissionsByRound[r._id.toString()] || 0,
        isCurrentlyActive: isCurrent,
      };
    });

    const activeRound = enrichedRounds.find((r) => r.isCurrentlyActive) || null;
    const lifecycle = getLifecycleStatus(hackathon);

    return successResponse(
      {
        hackathon: {
          ...hackathon,
          ...lifecycle,
        },
        stats: {
          totalRegisteredTeams: teams.length,
          expectedTeamsCount: hackathon.expectedTeamsCount || 10,
          totalParticipants,
          totalRounds: rounds.length,
          totalSubmissions: submissions.length,
          totalJudges: judges.length,
          acceptedJudgesCount: judges.filter((j: any) => j.status === 'ACCEPTED').length,
          pendingJudgesCount: judges.filter((j: any) => j.status === 'INVITED').length,
          activeRound: activeRound
            ? { roundId: activeRound._id, roundName: activeRound.roundName, roundNumber: activeRound.roundNumber }
            : null,
        },
        rounds: enrichedRounds,
        teams,
        judges,
        submissions,
        results,
      },
      'Management details fetched successfully'
    );
  } catch (err: any) {
    console.error('Get management error:', err);
    return errorResponse('Failed to fetch management details', 500);
  }
}

export async function PATCH(
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

    const hackathon = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found or you are not the organizer', 403);
    }

    const body = await req.json();
    const allowedFields = ['status', 'description', 'shortDescription', 'leaderboardPublic', 'cocDocumentUrl'];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        (hackathon as any)[field] = body[field];
      }
    });

    await hackathon.save();

    return successResponse(hackathon, 'Hackathon updated successfully');
  } catch (err: any) {
    console.error('Update management error:', err);
    return errorResponse('Failed to update hackathon', 500);
  }
}
