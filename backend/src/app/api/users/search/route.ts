import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { getAuthUser } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q');
    if (!q || q.trim().length < 2) {
      return successResponse([], 'Query must be at least 2 characters');
    }

    await dbConnect();
    const auth = getAuthUser(req);

    const cleanQ = q.trim().replace(/^@/, '');
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
      .limit(15)
      .lean();

    return successResponse(users, 'Users found');
  } catch (err: any) {
    console.error('Search users error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
