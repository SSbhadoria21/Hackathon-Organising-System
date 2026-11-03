import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Team } from '@/models/Team';
import { Judge } from '@/models/Judge';
import { JudgeScore } from '@/models/JudgeScore';
import { Submission } from '@/models/Submission';
import { Result } from '@/models/Result';
import { Payment } from '@/models/Payment';
import { Announcement } from '@/models/Announcement';
import { User } from '@/models/User';
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
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const hackathon = await Hackathon.findOne(query)
      .populate('organizerId', 'fullName username email avatar')
      .lean();

    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    const hackathonId = hackathon._id;

    const isOrganizer =
      (hackathon.organizerId as any)?._id?.toString() === auth._id.toString() ||
      (hackathon.organizerId as any)?.toString() === auth._id.toString();
    const isSuperAdmin = auth.role === 'SUPER_ADMIN';

    const user = await User.findById(auth._id).select('email').lean();
    const userEmail = user?.email?.toLowerCase();

    // Check if user is an accepted judge
    const judgeRecord = await Judge.findOne({
      hackathonId,
      status: 'ACCEPTED',
      $or: [
        { userId: auth._id },
        ...(userEmail ? [{ email: userEmail }] : []),
      ],
    }).lean();

    const isJudge = Boolean(judgeRecord);

    if (!isOrganizer && !isSuperAdmin && !isJudge) {
      return errorResponse(
        'Access denied: You are not authorized to view the management dashboard for this hackathon.',
        403
      );
    }

    // 1. Fetch rounds
    const rounds = await Round.find({ hackathonId })
      .sort({ roundNumber: 1 })
      .lean();

    // 2. Fetch teams
    const teams = await Team.find({ hackathonId })
      .sort({ createdAt: -1 })
      .populate('leaderId', 'fullName username email avatar')
      .populate('members', 'fullName username email avatar')
      .lean();

    // 3. Fetch judges
    const judges = await Judge.find({ hackathonId })
      .populate('userId', 'fullName username email avatar bio skills')
      .populate('roundIds', 'roundName roundNumber roundType')
      .lean();

    // 4. Fetch submissions with round criteria and team info
    const submissions = await Submission.find({ hackathonId })
      .populate({
        path: 'roundId',
        select: 'roundName roundNumber criterias isOnline offlineVenue',
      })
      .populate({
        path: 'teamId',
        select: 'name leaderId members',
        populate: [
          { path: 'leaderId', select: 'fullName username email avatar' },
          { path: 'members', select: 'fullName username email avatar' },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    // 5. Fetch all judge scores for submissions
    const judgeScores = await JudgeScore.find({ hackathonId })
      .populate('judgeId', 'name email userId')
      .lean();

    const scoresBySub: Record<string, any[]> = {};
    judgeScores.forEach((js: any) => {
      const sId = js.submissionId?.toString();
      if (!scoresBySub[sId]) scoresBySub[sId] = [];
      scoresBySub[sId].push(js);
    });

    const enrichedSubmissions = submissions.map((s: any) => {
      const sId = s._id.toString();
      const subScores = scoresBySub[sId] || [];
      const myScore = subScores.find(
        (sc: any) =>
          sc.judgeId?.userId?.toString() === auth._id.toString() ||
          sc.judgeId?._id?.toString() === judgeRecord?._id?.toString()
      );

      let avgScore: number | null = null;
      if (subScores.length > 0) {
        const totalSum = subScores.reduce((acc: number, curr: any) => {
          const cSum = (curr.criteriaScores || []).reduce(
            (cAcc: number, c: any) => cAcc + (c.score || 0),
            0
          );
          const cAvg = curr.criteriaScores?.length ? cSum / curr.criteriaScores.length : 0;
          return acc + cAvg;
        }, 0);
        avgScore = parseFloat((totalSum / subScores.length).toFixed(1));
      }

      return {
        ...s,
        scores: subScores,
        myScore: myScore || null,
        averageScore: avgScore,
      };
    });

    // 6. Fetch published results
    const results = await Result.find({ hackathonId })
      .populate('teamId', 'name')
      .populate('roundId', 'roundName roundNumber')
      .sort({ rank: 1 })
      .lean();

    // Calculate aggregated stats
    const totalParticipants = teams.reduce((acc, t: any) => acc + (t.members?.length || 0), 0);

    const submissionsByRound: Record<string, number> = {};
    enrichedSubmissions.forEach((s: any) => {
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
          rounds: enrichedRounds,
          roundIds: enrichedRounds,
        },
        userRole: isOrganizer || isSuperAdmin ? 'ORGANIZER' : 'JUDGE',
        isJudge,
        isOrganizer: isOrganizer || isSuperAdmin,
        judgeProfile: judgeRecord || null,
        stats: {
          totalRegisteredTeams: teams.length,
          expectedTeamsCount: hackathon.expectedTeamsCount || 10,
          totalParticipants,
          totalRounds: rounds.length,
          totalSubmissions: enrichedSubmissions.length,
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
        submissions: enrichedSubmissions,
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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const hackathon = await Hackathon.findOne(query);
    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    if (
      hackathon.organizerId?.toString() !== auth._id.toString() &&
      auth.role !== 'SUPER_ADMIN'
    ) {
      return errorResponse('You are not authorized to delete this hackathon', 403);
    }

    const targetId = hackathon._id;

    await Hackathon.findByIdAndDelete(targetId);

    await Promise.all([
      Round.deleteMany({ hackathonId: targetId }),
      Team.deleteMany({ hackathonId: targetId }),
      Judge.deleteMany({ hackathonId: targetId }),
      JudgeScore.deleteMany({ hackathonId: targetId }),
      Submission.deleteMany({ hackathonId: targetId }),
      Result.deleteMany({ hackathonId: targetId }),
      Payment.deleteMany({ hackathonId: targetId }),
      Announcement.deleteMany({ hackathonId: targetId }),
    ]);

    return successResponse(
      { deletedId: targetId },
      'Hackathon and all associated data deleted successfully'
    );
  } catch (err: any) {
    console.error('Delete hackathon error:', err);
    return errorResponse('Failed to delete hackathon', 500);
  }
}
