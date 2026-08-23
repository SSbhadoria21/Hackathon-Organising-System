import { type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { generateAccessToken, generateRefreshToken } from '@/utils/tokens';
import { successResponse, errorResponse } from '@/utils/ApiResponse';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return errorResponse('No refresh token provided', 401);
    }

    let decoded: { _id: string };
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { _id: string };
    } catch {
      return errorResponse('Refresh token is invalid or expired. Please login again.', 401);
    }

    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== refreshToken) {
  
      if (user) {
        await User.findByIdAndUpdate(user._id, { refreshToken: null });
        const cookieStore = await cookies();
        cookieStore.delete('refreshToken');
      }
      return errorResponse('Session invalidated. Please login again.', 401);
    }

    
    const newAccessToken = generateAccessToken(user._id as Types.ObjectId, user.role);
    const newRefreshToken = generateRefreshToken(user._id as Types.ObjectId);

    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    const newCookieStore = await cookies();
    newCookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return successResponse(
      { accessToken: newAccessToken },
      'Token refreshed successfully'
    );
  } catch (error: any) {
    console.error('[REFRESH]', error);
    return errorResponse('Internal server error', 500);
  }
}
