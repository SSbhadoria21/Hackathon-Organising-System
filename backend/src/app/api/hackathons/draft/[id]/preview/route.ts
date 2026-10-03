import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

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

    const draft = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
    })
      .populate('roundIds')
      .populate('organizerId', 'username fullName avatar bio')
      .lean();

    if (!draft) {
      return errorResponse('Hackathon draft not found', 404);
    }

    const judges = await Judge.find({ hackathonId: id })
      .select('name email username status')
      .lean();

    const totalPrizesAmount = (draft.prizes || []).reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0
    );

    return successResponse(
      {
        ...draft,
        judges,
        totalPrizesAmount,
        previewMode: true,
      },
      'Preview fetched'
    );
  } catch (err: any) {
    console.error('Draft preview error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
