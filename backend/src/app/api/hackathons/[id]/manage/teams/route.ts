import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Team } from '@/models/Team';
import { Submission } from '@/models/Submission';
import { JudgeScore } from '@/models/JudgeScore';
import { Judge } from '@/models/Judge';
import { Result } from '@/models/Result';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

/**
 * GET /hackathons/:id/manage/teams
 * Organizer view of all teams with full member details, submission status per round, and payment status.
 */
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

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id }).lean();
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    const rounds = await Round.find({ hackathonId: id }).sort({ roundNumber: 1 }).lean();

    const teams = await Team.find({ hackathonId: id })
      .populate('leaderId', 'fullName username avatar email bio skills collegeOrCompany')
      .populate('members', 'fullName username avatar email bio skills collegeOrCompany')
      .lean();

    const allSubmissions = await Submission.find({ hackathonId: id }).lean();
    const allResults = await Result.find({ hackathonId: id }).lean();

    // Index submissions by teamId+roundId
    const subIndex = new Map<string, any>();
    allSubmissions.forEach((sub: any) => {
      subIndex.set(`${sub.teamId}:${sub.roundId}`, sub);
    });

    // Index results by teamId+roundId
    const resultIndex = new Map<string, any>();
    allResults.forEach((res: any) => {
      resultIndex.set(`${res.teamId}:${res.roundId}`, res);
    });

    const enrichedTeams = teams.map((team: any) => {
      const roundStatuses = rounds.map((round: any) => {
        const sub = subIndex.get(`${team._id}:${round._id}`);
        const result = resultIndex.get(`${team._id}:${round._id}`);
        const isEligible = round.roundNumber === 1 || (round.teamIds || []).some(
          (t: any) => t.toString() === team._id.toString()
        );

        return {
          roundId: round._id,
          roundName: round.roundName,
          roundNumber: round.roundNumber,
          eligible: isEligible,
          submitted: !!sub,
          submissionStatus: sub?.status || null,
          score: result?.finalScore ?? null,
          rank: result?.rank ?? null,
          advanced: result?.advanced ?? null,
          reviewOutcome: result?.reviewOutcome ?? null,
        };
      });

      // Overall team journey
      const currentRound = roundStatuses.findLast((r) => r.eligible);
      const eliminated = roundStatuses.some((r) => r.advanced === false);
      const isFinalist = roundStatuses.every((r) => !r.eligible || r.advanced !== false);

      return {
        _id: team._id,
        name: team.name,
        inviteCode: team.inviteCode, // organizer can see all invite codes
        leader: team.leaderId,
        members: team.members,
        memberCount: team.members?.length || 0,
        paymentStatus: team.paymentStatus,
        createdAt: team.createdAt,
        rounds: roundStatuses,
        currentRound,
        isEliminated: eliminated,
        isFinalist,
      };
    });

    return successResponse(
      {
        hackathon: {
          _id: hackathon._id,
          eventName: hackathon.eventName,
          status: hackathon.status,
          teamMinSize: hackathon.teamMinSize,
          teamMaxSize: hackathon.teamMaxSize,
          paid: hackathon.paid,
        },
        rounds: rounds.map((r: any) => ({
          _id: r._id,
          roundName: r.roundName,
          roundNumber: r.roundNumber,
          roundType: r.roundType,
          roundOpens: r.roundOpens,
          roundCloses: r.roundCloses,
          maxTeamsAdvancing: r.maxTeamsAdvancing,
          teamCount: (r.teamIds || []).length,
        })),
        totalTeams: teams.length,
        teams: enrichedTeams,
      },
      'Teams fetched'
    );
  } catch (err: any) {
    console.error('Manage teams error:', err);
    return errorResponse('Failed to fetch teams', 500);
  }
}
