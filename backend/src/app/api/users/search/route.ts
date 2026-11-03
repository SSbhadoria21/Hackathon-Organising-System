import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { getAuthUser } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q');
    if (!q || q.trim().length < 1) {
      return successResponse([], 'Query is empty');
    }

    await dbConnect();
    const auth = getAuthUser(req);

    const cleanQ = q.trim().replace(/^@/, '').toLowerCase();
    const searchRegex = new RegExp(cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const query: any = {
      $or: [{ username: searchRegex }, { fullName: searchRegex }],
      isEmailVerified: true,
    };

    if (auth) {
      query._id = { $ne: auth._id };
    }

    const users = await User.find(query)
      .select('_id username fullName avatar bio skills collegeOrCompany')
      .limit(20)
      .lean();

    // Prioritize usernames that start with the query, followed by alphabetical order
    users.sort((a: any, b: any) => {
      const aUser = (a.username || '').toLowerCase();
      const bUser = (b.username || '').toLowerCase();
      const aStarts = aUser.startsWith(cleanQ);
      const bStarts = bUser.startsWith(cleanQ);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return aUser.localeCompare(bUser);
    });

    return successResponse(users, 'Users found');
  } catch (err: any) {
    console.error('Search users error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
