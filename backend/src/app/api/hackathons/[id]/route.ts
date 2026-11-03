import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { JudgeScore } from '@/models/JudgeScore';
import { Team } from '@/models/Team';
import { Round } from '@/models/Round';
import { Submission } from '@/models/Submission';
import { Result } from '@/models/Result';
import { Payment } from '@/models/Payment';
import { Announcement } from '@/models/Announcement';
import { getAuthUser, requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dbConnect();
    const auth = getAuthUser(req);

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const hackathon = await Hackathon.findOne(query)
      .populate('roundIds')
      .populate('organizerId', 'username fullName avatar bio')
      .lean();

    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    const judges = await Judge.find({
      hackathonId: hackathon._id,
      status: 'ACCEPTED',
    })
      .populate('userId', 'username fullName avatar bio')
      .select('name email username userId roundIds')
      .lean();

    let userTeam = null;
    if (auth) {
      userTeam = await Team.findOne({
        hackathonId: hackathon._id,
        members: auth._id,
      }).lean();
    }

    const totalPrizes = (hackathon.prizes || []).reduce(
      (sum: number, p: any) => sum + (p.amount || 0),
      0
    );

    return successResponse(
      {
        ...hackathon,
        judges,
        totalPrizes,
        userRegistration: userTeam
          ? { isRegistered: true, teamId: userTeam._id, teamName: userTeam.name }
          : { isRegistered: false },
      },
      'Hackathon details fetched'
    );
  } catch (err: any) {
    console.error('Get hackathon error:', err);
    return errorResponse('Something went wrong', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const hackathon = await Hackathon.findOne(query);
    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    // Only organizer or super admin can delete
    if (
      hackathon.organizerId?.toString() !== auth._id.toString() &&
      auth.role !== 'SUPER_ADMIN'
    ) {
      return errorResponse('You are not authorized to delete this hackathon', 403);
    }

    const targetId = hackathon._id;

    // Delete the hackathon itself
    await Hackathon.findByIdAndDelete(targetId);

    // Cascade delete all associated data
    await Promise.all([
      Round.deleteMany({ hackathonId: targetId }),
      Team.deleteMany({ hackathonId: targetId }),
      Judge.deleteMany({ hackathonId: targetId }),
      JudgeScore.deleteMany({ hackathonId: targetId }),
      Submission.deleteMany({ hackathonId: targetId }),
      Result.deleteMany({ hackathonId: targetId }),
      Payment.deleteMany({ hackathonId: targetId }),
      Announcement.deleteMany({ hackathonId: targetId }),
    ]);

    return successResponse(
      { deletedId: targetId },
      'Hackathon and all associated data deleted successfully'
    );
  } catch (err: any) {
    console.error('Delete hackathon error:', err);
    return errorResponse('Failed to delete hackathon', 500);
  }
}
