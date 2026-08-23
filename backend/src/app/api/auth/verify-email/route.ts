import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { EmailVerification } from '@/models/EmailVerification';
import { verifyEmailSchema } from '@/schemas/auth.schema';
import { generateAccessToken, generateRefreshToken } from '@/utils/tokens';
import { successResponse, errorResponse } from '@/utils/ApiResponse';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { userId, otp } = parsed.data;

    const verificationDoc = await EmailVerification.findOne({
      userId: new Types.ObjectId(userId),
      type: 'EMAIL_VERIFY',
    }).sort({ createdAt: -1 });

    if (!verificationDoc) {
      return errorResponse('No verification code found. Please request a new one.', 404);
    }

    if (verificationDoc.expiresAt < new Date()) {
      return errorResponse('Verification code has expired. Please request a new one.', 410);
    }


    if (verificationDoc.token !== otp) {
      return errorResponse('Invalid verification code', 400);
    }

    
    const user = await User.findByIdAndUpdate(
      userId,
      { isEmailVerified: true },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    
    await EmailVerification.deleteMany({ userId: user._id, type: 'EMAIL_VERIFY' });

    const accessToken = generateAccessToken(user._id as Types.ObjectId, user.role);
    const refreshToken = generateRefreshToken(user._id as Types.ObjectId);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    const cookieStore = await cookies();
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, 
      path: '/',
    });

    return successResponse(
      { user, accessToken },
      'Email verified successfully. You are now logged in.'
    );
  } catch (error: any) {
    console.error('[VERIFY-EMAIL]', error);
    return errorResponse('Internal server error', 500);
  }
}
