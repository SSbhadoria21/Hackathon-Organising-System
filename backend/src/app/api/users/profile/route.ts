import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Hackathon } from '@/models/Hackathon';
import { Team } from '@/models/Team';
import { requireAuth } from '@/lib/withAuth';
import { updateProfileSchema } from '@/schemas/profile.schema';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const user = await User.findById(auth._id).select('-password -refreshToken -googleId').lean();
    if (!user) {
      return errorResponse('User not found', 404);
    }

    const [hackathonsOrganized, teamsJoined, activeDrafts] = await Promise.all([
      Hackathon.countDocuments({ organizerId: auth._id, status: { $ne: 'DRAFT' } }),
      Team.countDocuments({ members: auth._id }),
      Hackathon.countDocuments({ organizerId: auth._id, status: 'DRAFT' }),
    ]);

    return successResponse(
      {
        ...user,
        stats: {
          hackathonsOrganized,
          teamsJoined,
          activeDrafts,
        },
      },
      'Profile fetched'
    );
  } catch (err: any) {
    console.error('Get profile error:', err);
    return errorResponse('Something went wrong', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      auth._id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).select('-password -refreshToken -googleId');

    if (!updatedUser) {
      return errorResponse('User not found', 404);
    }

    return successResponse(updatedUser, 'Profile updated');
  } catch (err: any) {
    console.error('Patch profile error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
