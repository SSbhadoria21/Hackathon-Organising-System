import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { Hackathon } from '@/models/Hackathon';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await context.params;
    if (!username) {
      return errorResponse('Username is required', 400);
    }

    await dbConnect();
    const user = await User.findOne({ username: username.toLowerCase() })
      .select('-password -refreshToken -googleId -email')
      .lean();

    if (!user) {
      return errorResponse('User not found', 404);
    }

    const organizedHackathons = await Hackathon.find({
      organizerId: user._id,
      status: { $in: ['PUBLISHED', 'ONGOING', 'COMPLETED'] },
    })
      .select('eventName slug theme mode banner registrationOpens registrationCloses status')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return successResponse(
      {
        ...user,
        organizedHackathons,
      },
      'Profile fetched'
    );
  } catch (err: any) {
    console.error('Get user error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
