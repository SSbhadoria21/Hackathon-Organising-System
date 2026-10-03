import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { Team } from '@/models/Team';
import { getAuthUser } from '@/lib/withAuth';
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
