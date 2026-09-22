import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const user = await User.findById(auth._id).select(
      '-password -refreshToken -googleId'
    );

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user, 'Profile fetched');
  } catch (err: any) {
    console.error('Me error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
