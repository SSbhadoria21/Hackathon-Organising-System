import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const criteriaItemSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, 'Criteria name required').max(100),
  description: z.string().min(5, 'Description required').max(500),
  weight: z.number().min(1, 'Weight must be at least 1').max(100),
});

const rubricSchema = z.object({
  criterias: z
    .array(criteriaItemSchema)
    .min(1, 'At least one criteria is required')
    .max(10, 'Maximum 10 criteria allowed'),
  /** Max teams advancing from this round */
  maxTeamsAdvancing: z.number().int().min(1).optional(),
  /** Score threshold below which a team is auto-eliminated */
  scoreThreshold: z.number().min(0).max(100).optional(),
});

/**
 * GET /hackathons/:id/rounds/:roundId/rubric
 * Get the evaluation rubric (criteria) for a round.
 * Accessible to organizer and assigned judges.
 */
export async function GET(
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

    const hackathon = await Hackathon.findById(id).lean();
    if (!hackathon) return errorResponse('Hackathon not found', 404);

    const round = await Round.findOne({ _id: roundId, hackathonId: id }).lean();
    if (!round) return errorResponse('Round not found', 404);

    const totalWeight = (round.criterias || []).reduce(
      (acc: number, c: any) => acc + c.weight,
      0
    );

    return successResponse(
      {
        roundId: round._id,
        roundName: round.roundName,
        roundNumber: round.roundNumber,
        roundType: round.roundType,
        maxTeamsAdvancing: round.maxTeamsAdvancing,
        scoreThreshold: round.scoreThreshold,
        criterias: round.criterias || [],
        totalWeight,
        isBalanced: totalWeight === 100,
      },
      'Rubric fetched'
    );
  } catch (err: any) {
    console.error('Get rubric error:', err);
    return errorResponse('Failed to fetch rubric', 500);
  }
}

/**
 * PUT /hackathons/:id/rounds/:roundId/rubric
 * Organizer sets or updates the evaluation rubric for a round.
 * Replaces all criteria. Warn: if judges have already scored, updating criteria may invalidate scores.
 */
export async function PUT(
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

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id }).lean();
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    const round = await Round.findOne({ _id: roundId, hackathonId: id });
    if (!round) return errorResponse('Round not found', 404);

    const body = await req.json();
    const parsed = rubricSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { criterias, maxTeamsAdvancing, scoreThreshold } = parsed.data;

    // Warn if total weight is not 100 but still allow it
    const totalWeight = criterias.reduce((acc, c) => acc + c.weight, 0);

    const formattedCriterias = criterias.map((c) => ({
      _id: c._id && mongoose.Types.ObjectId.isValid(c._id)
        ? new mongoose.Types.ObjectId(c._id)
        : new mongoose.Types.ObjectId(),
      name: c.name,
      description: c.description,
      weight: c.weight,
    }));

    round.criterias = formattedCriterias as any;
    if (maxTeamsAdvancing !== undefined) round.maxTeamsAdvancing = maxTeamsAdvancing;
    if (scoreThreshold !== undefined) round.scoreThreshold = scoreThreshold;

    await round.save();

    return successResponse(
      {
        roundId: round._id,
        roundName: round.roundName,
        criterias: round.criterias,
        totalWeight,
        isBalanced: totalWeight === 100,
        maxTeamsAdvancing: round.maxTeamsAdvancing,
        scoreThreshold: round.scoreThreshold,
        warning: totalWeight !== 100
          ? `Total weight is ${totalWeight}, not 100. Scores will be normalised automatically during result computation.`
          : undefined,
      },
      'Evaluation rubric saved'
    );
  } catch (err: any) {
    console.error('Save rubric error:', err);
    return errorResponse('Failed to save rubric', 500);
  }
}
