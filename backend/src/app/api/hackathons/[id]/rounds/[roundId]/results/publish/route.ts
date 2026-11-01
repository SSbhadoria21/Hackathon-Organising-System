import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Result } from '@/models/Result';
import { Team } from '@/models/Team';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const publishSchema = z.object({
  /** Whether to notify all participants */
  notify: z.boolean().default(true),
  /** Custom announcement message (optional) */
  announcementMessage: z.string().max(1000).optional(),
});

/**
 * POST /hackathons/:id/rounds/:roundId/results/publish
 * Organizer publishes the results for a round — makes them publicly visible and notifies participants
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; roundId: string }> }
) {
  try {
    const { id, roundId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(roundId)) {
      return errorResponse('Invalid ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id });
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    const round = await Round.findOne({ _id: roundId, hackathonId: id }).lean();
    if (!round) return errorResponse('Round not found', 404);

    // Check results exist
    const resultsCount = await Result.countDocuments({ hackathonId: id, roundId });
    if (resultsCount === 0) {
      return errorResponse('No results found. Please run the advance step first.', 400);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = publishSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400);
    }

    const { notify, announcementMessage } = parsed.data;

    // Publish all results for this round
    await Result.updateMany({ hackathonId: id, roundId }, { $set: { published: true } });

    // Assign ranks based on finalScore
    const results = await Result.find({ hackathonId: id, roundId })
      .sort({ finalScore: -1 })
      .lean();

    for (let i = 0; i < results.length; i++) {
      await Result.findByIdAndUpdate(results[i]._id, { rank: i + 1 });
    }

    if (notify) {
      // Notify advancing teams
      const advancingResults = results.filter((r) => r.advanced);
      const eliminatedResults = results.filter((r) => !r.advanced);

      const isFinalRound = !(await Round.findOne({
        hackathonId: id,
        roundNumber: round.roundNumber + 1,
      }));

      const notifications: any[] = [];

      for (const result of advancingResults) {
        const team = await Team.findById(result.teamId).lean();
        if (!team) continue;

        notifications.push({
          userId: (team as any).leaderId,
          type: 'RESULT_PUBLISHED',
          title: isFinalRound ? '🏆 Final Results Announced!' : `🎉 Round ${round.roundNumber} Results — You Advanced!`,
          message:
            announcementMessage ||
            (isFinalRound
              ? `Congratulations! Your team "${(team as any).name}" ranked #${result.rank} in the finals of "${hackathon.eventName}". Score: ${result.finalScore}/100`
              : `Your team "${(team as any).name}" advanced from Round ${round.roundNumber}! Rank #${result.rank} | Score: ${result.finalScore}/100`),
          read: false,
          metadata: {
            hackathonId: id,
            roundId,
            roundNumber: String(round.roundNumber),
            teamId: result.teamId.toString(),
            rank: String(result.rank),
            score: String(result.finalScore),
            advanced: 'true',
          },
        });
      }

      for (const result of eliminatedResults) {
        const team = await Team.findById(result.teamId).lean();
        if (!team) continue;

        notifications.push({
          userId: (team as any).leaderId,
          type: 'RESULT_PUBLISHED',
          title: `Round ${round.roundNumber} Results Published`,
          message:
            announcementMessage ||
            `Your team "${(team as any).name}" was not selected to advance from Round ${round.roundNumber}. Score: ${result.finalScore}/100. Thank you for participating in "${hackathon.eventName}"!`,
          read: false,
          metadata: {
            hackathonId: id,
            roundId,
            roundNumber: String(round.roundNumber),
            teamId: result.teamId.toString(),
            rank: String(result.rank ?? ''),
            score: String(result.finalScore),
            advanced: 'false',
          },
        });
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    return successResponse(
      {
        roundId,
        roundName: round.roundName,
        roundNumber: round.roundNumber,
        publishedCount: resultsCount,
        advancingCount: results.filter((r) => r.advanced).length,
        eliminatedCount: results.filter((r) => !r.advanced).length,
        notificationsSent: notify,
      },
      `Results for Round ${round.roundNumber} published successfully`
    );
  } catch (err: any) {
    console.error('Publish results error:', err);
    return errorResponse('Failed to publish results', 500);
  }
}
