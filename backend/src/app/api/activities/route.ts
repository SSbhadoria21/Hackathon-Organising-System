import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Team } from '@/models/Team';
import { Judge } from '@/models/Judge';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const user = await User.findById(auth._id).select('email').lean();
    const userEmail = user?.email?.toLowerCase();

    const [myTeamsCount, createdCount, accessedCount] = await Promise.all([
      Team.countDocuments({ members: auth._id }),
      Hackathon.countDocuments({ organizerId: auth._id }),
      Judge.countDocuments({
        status: 'ACCEPTED',
        $or: [
          { userId: auth._id },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      }),
    ]);

    return successResponse(
      {
        counts: {
          participations: myTeamsCount,
          createdHackathons: createdCount,
          accessedHackathons: accessedCount,
        },
        endpoints: {
          participations: '/api/activities/participations',
          createdHackathons: '/api/activities/created-hackathons',
          accessedHackathons: '/api/activities/accessed-hackathons',
        },
      },
      'Activities overview fetched'
    );
  } catch (err: any) {
    console.error('Activities overview error:', err);
    return errorResponse('Failed to fetch activities overview', 500);
  }
}
