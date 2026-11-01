import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Team } from '@/models/Team';
import { Submission } from '@/models/Submission';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const submitSchema = z.object({
  roundId: z.string().min(1, 'Round ID is required'),
  // General fields
  description: z.string().max(5000).optional(),
  // Code/Project submission
  repoUrl: z.string().url().optional().or(z.literal('')),
  liveUrl: z.string().url().optional().or(z.literal('')),
  demoCredentials: z.string().max(500).optional(),
  // Deck
  deckFileUrl: z.string().url().optional().or(z.literal('')),
  // Pitch / Prototype
  pitchVideoUrl: z.string().url().optional().or(z.literal('')),
});

/**
 * GET /hackathons/:id/submissions
 * Get team's own submissions for this hackathon (all rounds)
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

    const team = await Team.findOne({
      hackathonId: id,
      members: auth._id,
    }).lean();

    if (!team) {
      return errorResponse('You are not registered in this hackathon', 403);
    }

    const roundId = req.nextUrl.searchParams.get('roundId');
    const filter: any = { hackathonId: id, teamId: (team as any)._id };
    if (roundId && mongoose.Types.ObjectId.isValid(roundId)) {
      filter.roundId = roundId;
    }

    const submissions = await Submission.find(filter)
      .populate('roundId', 'roundName roundNumber roundType roundOpens roundCloses maxTeamsAdvancing')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ team, submissions }, 'Submissions fetched');
  } catch (err: any) {
    console.error('Get submissions error:', err);
    return errorResponse('Failed to fetch submissions', 500);
  }
}

/**
 * POST /hackathons/:id/submissions
 * Submit/update team's work for a round
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

    const hackathon = await Hackathon.findById(id).lean();
    if (!hackathon) return errorResponse('Hackathon not found', 404);

    if (hackathon.status !== 'ONGOING' && hackathon.status !== 'PUBLISHED') {
      return errorResponse('Submissions are not accepted at this time', 400);
    }

    const team = await Team.findOne({
      hackathonId: id,
      members: auth._id,
    }).lean();

    if (!team) {
      return errorResponse('You are not registered in this hackathon', 403);
    }

    // Payment check — if fee was required, ensure team has paid
    if (
      hackathon.paid &&
      (team as any).paymentStatus !== 'PAID' &&
      (team as any).paymentStatus !== 'NOT_REQUIRED'
    ) {
      return errorResponse('Payment is required to submit. Please complete payment first.', 402);
    }

    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { roundId, ...fields } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(roundId)) {
      return errorResponse('Invalid round ID', 400);
    }

    // Validate round belongs to hackathon and is currently open
    const round = await Round.findOne({
      _id: roundId,
      hackathonId: id,
    }).lean();

    if (!round) return errorResponse('Round not found in this hackathon', 404);

    const now = new Date();
    if (now < round.roundOpens) {
      return errorResponse('This round has not opened for submissions yet', 400);
    }
    if (now > round.roundCloses) {
      return errorResponse('Submission deadline for this round has passed', 400);
    }

    // Check if team is eligible for this round (must be in round.teamIds unless round is first)
    const isFirstRound = round.roundNumber === 1;
    const teamInRound = (round.teamIds || []).some(
      (t: any) => t.toString() === (team as any)._id.toString()
    );

    if (!isFirstRound && !teamInRound) {
      return errorResponse('Your team is not eligible to submit in this round', 403);
    }

    // If first round — add team to round if not already there
    if (isFirstRound && !teamInRound) {
      await Round.findByIdAndUpdate(roundId, {
        $addToSet: { teamIds: (team as any)._id },
      });
    }

    // Check minimum submission fields based on round type
    if (round.roundType === 'SUBMISSION' || round.roundType === 'PROTOTYPE') {
      if (!fields.repoUrl && !fields.deckFileUrl && !fields.liveUrl) {
        return errorResponse(
          'At least one of repoUrl, deckFileUrl, or liveUrl is required for this round type',
          400
        );
      }
    }
    if (round.roundType === 'PITCH') {
      if (!fields.pitchVideoUrl && !fields.deckFileUrl) {
        return errorResponse(
          'A pitch video URL or deck is required for PITCH rounds',
          400
        );
      }
    }

    // Upsert submission (teams can update until deadline)
    const submission = await Submission.findOneAndUpdate(
      { hackathonId: id, roundId, teamId: (team as any)._id },
      {
        $set: {
          ...fields,
          status: 'SUBMITTED',
        },
      },
      { upsert: true, new: true }
    );

    const populated = await Submission.findById(submission._id)
      .populate('roundId', 'roundName roundNumber roundType roundOpens roundCloses')
      .lean();

    return successResponse(populated, 'Submission saved successfully', 201);
  } catch (err: any) {
    console.error('Submit error:', err);
    return errorResponse('Failed to submit', 500);
  }
}
