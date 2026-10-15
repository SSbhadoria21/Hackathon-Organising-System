import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { Round } from '@/models/Round';
import { requireAuth } from '@/lib/withAuth';
import { judgeUpdateSchema } from '@/schemas/hackathon.schema';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; judgeId: string }> }
) {
  try {
    const { id, judgeId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(judgeId)) {
      return errorResponse('Invalid ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const judge = await Judge.findOne({
      _id: judgeId,
      hackathonId: id,
    })
      .populate('userId', 'username fullName avatar bio skills')
      .populate('roundIds', 'roundName roundNumber roundType')
      .lean();

    if (!judge) {
      return errorResponse('Judge not found', 404);
    }

    return successResponse(judge, 'Judge fetched');
  } catch (err: any) {
    console.error('Get judge error:', err);
    return errorResponse('Something went wrong', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; judgeId: string }> }
) {
  try {
    const { id, judgeId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(judgeId)) {
      return errorResponse('Invalid ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const hackathon = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found or unauthorized', 403);
    }

    const body = await req.json();
    const parsed = judgeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const updateData: any = {};
    if (parsed.data.accessType) {
      updateData.accessType = parsed.data.accessType;
    }
    if (parsed.data.status) {
      updateData.status = parsed.data.status;
    }

    if (parsed.data.accessType === 'SPECIFIC_ROUNDS' && parsed.data.roundIds) {
      const validRounds = await Round.find({
        hackathonId: id,
        _id: { $in: parsed.data.roundIds.map((r) => new mongoose.Types.ObjectId(r)) },
      });
      updateData.roundIds = validRounds.map((r) => r._id);
    } else if (parsed.data.accessType === 'FULL') {
      const allRounds = await Round.find({ hackathonId: id }).select('_id');
      updateData.roundIds = allRounds.map((r) => r._id);
    } else if (parsed.data.roundIds) {
      const validRounds = await Round.find({
        hackathonId: id,
        _id: { $in: parsed.data.roundIds.map((r) => new mongoose.Types.ObjectId(r)) },
      });
      updateData.roundIds = validRounds.map((r) => r._id);
    }

    const updatedJudge = await Judge.findOneAndUpdate(
      { _id: judgeId, hackathonId: id },
      { $set: updateData },
      { new: true }
    )
      .populate('userId', 'username fullName avatar bio skills')
      .populate('roundIds', 'roundName roundNumber roundType')
      .lean();

    if (!updatedJudge) {
      return errorResponse('Judge not found', 404);
    }

    return successResponse(updatedJudge, 'Judge access updated');
  } catch (err: any) {
    console.error('Update judge error:', err);
    return errorResponse('Something went wrong', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; judgeId: string }> }
) {
  try {
    const { id, judgeId } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(judgeId)) {
      return errorResponse('Invalid ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const hackathon = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    const removedJudge = await Judge.findOneAndDelete({
      _id: judgeId,
      hackathonId: id,
    });

    if (!removedJudge) {
      return errorResponse('Judge not found', 404);
    }

    return successResponse(null, 'Judge removed');
  } catch (err: any) {
    console.error('Remove judge error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
