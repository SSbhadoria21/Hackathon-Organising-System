import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Result } from '@/models/Result';
import { Team } from '@/models/Team';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const announceWinnersSchema = z.object({
  /** Custom message for winners */
  winnerMessage: z.string().max(1000).optional(),
  /** Custom message for all participants */
  participantMessage: z.string().max(1000).optional(),
  /** Also mark hackathon as COMPLETED */
  markCompleted: z.boolean().default(true),
});

/**
 * POST /hackathons/:id/manage/announce-winners
 * Organizer officially announces the final winners.
 * Takes the last round's published results, ranks all teams globally, and sends winner notifications.
 */
export async function POST(
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

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id });
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    if (hackathon.status === 'COMPLETED') {
      return errorResponse('Winners have already been announced for this hackathon', 400);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = announceWinnersSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400);
    }

    const { winnerMessage, participantMessage, markCompleted } = parsed.data;

    // Get all published results from ALL rounds, sorted by finalScore desc for the last round
    const allResults = await Result.find({ hackathonId: id, published: true })
      .populate('teamId', 'name leaderId members')
      .populate('roundId', 'roundName roundNumber')
      .sort({ 'roundId.roundNumber': -1, rank: 1 })
      .lean();

    if (allResults.length === 0) {
      return errorResponse(
        'No published results found. Publish round results before announcing winners.',
        400
      );
    }

    // Find final round results (advanced teams)
    const resultsByRound = new Map<string, any[]>();
    for (const result of allResults) {
      const rId = result.roundId?._id?.toString() ?? result.roundId.toString();
      if (!resultsByRound.has(rId)) resultsByRound.set(rId, []);
      resultsByRound.get(rId)!.push(result);
    }

    // The "final" results = last round's results that are advanced
    const lastRoundKey = Array.from(resultsByRound.keys()).pop()!;
    const finalRoundResults = (resultsByRound.get(lastRoundKey) || []).sort(
      (a, b) => (a.rank ?? 999) - (b.rank ?? 999)
    );

    const winners = finalRoundResults.filter((r) => r.advanced).slice(0, 3);
    const finalists = finalRoundResults.filter((r) => r.advanced);
    const allParticipatingTeams = await Team.find({ hackathonId: id })
      .populate('leaderId', 'fullName username')
      .lean();

    // Build notifications
    const notifications: any[] = [];
    const winnerTeamIds = new Set(winners.map((w: any) => w.teamId?._id?.toString() ?? w.teamId.toString()));
    const finalistTeamIds = new Set(finalists.map((f: any) => f.teamId?._id?.toString() ?? f.teamId.toString()));

    for (const team of allParticipatingTeams) {
      const teamId = (team as any)._id.toString();
      const isWinner = winnerTeamIds.has(teamId);
      const isFinalist = finalistTeamIds.has(teamId);
      const winnerResult = winners.find(
        (w: any) => w.teamId?._id?.toString() === teamId || w.teamId?.toString() === teamId
      );

      let title: string;
      let message: string;

      if (isWinner && winnerResult) {
        const trophies = ['🥇', '🥈', '🥉'];
        title = `${trophies[winnerResult.rank - 1] || '🏆'} You won "${hackathon.eventName}"!`;
        message =
          winnerMessage ||
          `Congratulations! Your team "${(team as any).name}" finished in Position #${winnerResult.rank} at "${hackathon.eventName}"! Your final score: ${winnerResult.finalScore}/100.`;
      } else if (isFinalist) {
        title = `🏅 Finalist at "${hackathon.eventName}"`;
        message =
          participantMessage ||
          `Your team "${(team as any).name}" was a finalist at "${hackathon.eventName}". Amazing work!`;
      } else {
        title = `Results Announced — "${hackathon.eventName}"`;
        message =
          participantMessage ||
          `The results for "${hackathon.eventName}" have been officially announced. Thank you for participating!`;
      }

      notifications.push({
        userId: (team as any).leaderId?._id ?? (team as any).leaderId,
        type: 'RESULT_PUBLISHED' as const,
        title,
        message,
        read: false,
        metadata: {
          hackathonId: id,
          teamId,
          isWinner: String(isWinner),
          isFinalist: String(isFinalist),
          rank: winnerResult ? String(winnerResult.rank) : '',
        },
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    if (markCompleted) {
      hackathon.status = 'COMPLETED';
      await hackathon.save();
    }

    return successResponse(
      {
        hackathonId: id,
        eventName: hackathon.eventName,
        status: hackathon.status,
        winners: winners.map((w: any) => ({
          rank: w.rank,
          team: w.teamId,
          finalScore: w.finalScore,
        })),
        finalistsCount: finalists.length,
        totalParticipatingTeams: allParticipatingTeams.length,
        notificationsSent: notifications.length,
        markedCompleted: markCompleted,
      },
      `Winners announced for "${hackathon.eventName}"!`
    );
  } catch (err: any) {
    console.error('Announce winners error:', err);
    return errorResponse('Failed to announce winners', 500);
  }
}

/**
 * GET /hackathons/:id/manage/announce-winners
 * Preview what the winners announcement would look like
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

    const allResults = await Result.find({ hackathonId: id, published: true })
      .populate('teamId', 'name leaderId')
      .populate('roundId', 'roundName roundNumber')
      .sort({ rank: 1 })
      .lean();

    const finalResults = allResults.filter((r) => r.advanced);
    const hasUnpublishedResults = await Result.exists({ hackathonId: id, published: false });

    return successResponse(
      {
        readyToAnnounce: finalResults.length > 0 && !hasUnpublishedResults,
        totalPublishedResults: allResults.length,
        unpublishedResultsExist: !!hasUnpublishedResults,
        potentialWinners: finalResults.slice(0, 3).map((r) => ({
          rank: r.rank,
          team: r.teamId,
          finalScore: r.finalScore,
        })),
        totalFinalists: finalResults.length,
      },
      'Winner announcement preview'
    );
  } catch (err: any) {
    console.error('Winner preview error:', err);
    return errorResponse('Failed to get preview', 500);
  }
}
