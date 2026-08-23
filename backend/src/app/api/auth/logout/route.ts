import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const auth = requireAuth(request);
    if (auth instanceof Response) return auth;

    await User.findByIdAndUpdate(auth._id, { refreshToken: null });

    const cookieStore = await cookies();
    cookieStore.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, 
      path: '/',
    });

    return successResponse(null, 'Logged out successfully');
  } catch (error: any) {
    console.error('[LOGOUT]', error);
    return errorResponse('Internal server error', 500);
  }
}
