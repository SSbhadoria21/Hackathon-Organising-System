import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Result } from '@/models/Result';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const overrideSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
  teamId: z.string().min(1, 'Team ID is required'),
  outcome: z.enum(['OVERRIDE_ADVANCE', 'OVERRIDE_REJECT', 'CONFIRMED']),
  reason: z.string().max(500).optional(),
});

/**
 * POST /hackathons/:id/manage/override
 * Organizer overrides a specific team's result in a round.
 * E.g., force-advance a team that scored below threshold, or remove an erroneously advanced team.
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

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id }).lean();
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    const body = await req.json();
    const parsed = overrideSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { roundId, teamId, outcome, reason } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(roundId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return errorResponse('Invalid roundId or teamId', 400);
    }

    const result = await Result.findOne({
      hackathonId: id,
      roundId,
      teamId,
    });

    if (!result) {
      return errorResponse('Result not found for this team in this round', 404);
    }

    result.reviewOutcome = outcome;
    result.flaggedForReview = true;

    if (outcome === 'OVERRIDE_ADVANCE') {
      result.advanced = true;
    } else if (outcome === 'OVERRIDE_REJECT') {
      result.advanced = false;
    }

    await result.save();

    return successResponse(
      {
        resultId: result._id,
        teamId,
        roundId,
        outcome,
        advanced: result.advanced,
        reason,
      },
      `Result overridden: ${outcome}`
    );
  } catch (err: any) {
    console.error('Override error:', err);
    return errorResponse('Failed to override result', 500);
  }
}
