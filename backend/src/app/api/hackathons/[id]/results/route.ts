import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Result } from '@/models/Result';
import { Team } from '@/models/Team';
import { getAuthUser } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

/**
 * GET /hackathons/:id/results
 * Public-facing results page — returns published results for all rounds.
 * Shows final leaderboard and winners.
 * If user is authenticated and registered, highlights their team's position.
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
    const auth = getAuthUser(req);

    const hackathon = await Hackathon.findById(id).lean();
    if (!hackathon) return errorResponse('Hackathon not found', 404);

    // Fetch all published results ordered by round
    const rounds = await Round.find({ hackathonId: id })
      .sort({ roundNumber: 1 })
      .lean();

    const allResults = await Result.find({ hackathonId: id, published: true })
      .populate('teamId', 'name leaderId members')
      .populate('roundId', 'roundName roundNumber maxTeamsAdvancing')
      .sort({ roundId: 1, rank: 1 })
      .lean();

    // Group by round
    const resultsByRound: Record<string, any> = {};
    for (const result of allResults) {
      const rId = (result.roundId as any)?._id?.toString() ?? result.roundId.toString();
      if (!resultsByRound[rId]) {
        resultsByRound[rId] = {
          round: result.roundId,
          entries: [],
        };
      }
      resultsByRound[rId].entries.push(result);
    }

    // Check if user is participating
    let myTeam: any = null;
    if (auth) {
      myTeam = await Team.findOne({ hackathonId: id, members: auth._id }).lean();
    }

    // Final round results = winners
    const lastRound = rounds[rounds.length - 1];
    const finalResults = lastRound
      ? (resultsByRound[lastRound._id.toString()]?.entries || [])
      : [];

    const winners = finalResults
      .filter((r: any) => r.advanced)
      .slice(0, 3)
      .map((r: any) => ({
        rank: r.rank,
        team: r.teamId,
        score: r.finalScore,
      }));

    return successResponse(
      {
        hackathon: {
          _id: hackathon._id,
          eventName: hackathon.eventName,
          theme: hackathon.theme,
          banner: hackathon.banner,
          status: hackathon.status,
          leaderboardPublic: hackathon.leaderboardPublic,
        },
        rounds: rounds.map((r: any) => ({
          ...r,
          results: resultsByRound[r._id.toString()]?.entries || [],
          hasPublishedResults: !!resultsByRound[r._id.toString()],
        })),
        winners,
        myTeamResults: myTeam
          ? allResults.filter(
              (r: any) => r.teamId?._id?.toString() === (myTeam as any)._id.toString()
            )
          : null,
      },
      'Results fetched'
    );
  } catch (err: any) {
    console.error('Get results error:', err);
    return errorResponse('Failed to fetch results', 500);
  }
}
