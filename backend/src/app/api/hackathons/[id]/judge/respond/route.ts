import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const respondSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
  /** judgeId from the notification metadata */
  judgeId: z.string().min(1, 'Judge ID is required'),
});

/**
 * POST /hackathons/:id/judge/respond
 * Judge accepts or declines their invitation.
 * Updates Judge status, links their userId, updates notification actionStatus.
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

    const body = await req.json();
    const parsed = respondSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { action, judgeId } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(judgeId)) {
      return errorResponse('Invalid judge ID', 400);
    }

    const judge = await Judge.findOne({
      _id: judgeId,
      hackathonId: id,
    });

    if (!judge) return errorResponse('Judge invitation not found', 404);

    if (judge.status !== 'INVITED') {
      return errorResponse(`Invitation already ${judge.status.toLowerCase()}`, 400);
    }

    const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    judge.status = newStatus;
    judge.userId = new mongoose.Types.ObjectId(auth._id);
    await judge.save();

    // Update notification actionStatus
    await Notification.findOneAndUpdate(
      {
        userId: auth._id,
        type: 'JUDGE_INVITE',
        'metadata.judgeId': judgeId,
      },
      {
        $set: {
          actionStatus: action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED',
          read: true,
        },
      }
    );

    if (action === 'ACCEPT') {
      const hackathon = await Hackathon.findById(id).lean();
      return successResponse(
        {
          judgeId: judge._id,
          hackathonId: id,
          hackathonName: (hackathon as any)?.eventName || 'Hackathon',
          status: newStatus,
          accessType: judge.accessType,
          roundIds: judge.roundIds,
        },
        'You have accepted the judging invitation!'
      );
    }

    return successResponse(
      { judgeId: judge._id, status: newStatus },
      'You have declined the judging invitation'
    );
  } catch (err: any) {
    console.error('Judge respond error:', err);
    return errorResponse('Failed to process response', 500);
  }
}
