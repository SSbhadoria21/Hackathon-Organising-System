import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

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
