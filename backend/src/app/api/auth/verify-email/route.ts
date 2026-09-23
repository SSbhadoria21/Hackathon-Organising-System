import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { EmailVerification } from '@/models/EmailVerification';
import { verifyEmailSchema } from '@/schemas/auth.schema';
import { generateAccessToken, generateRefreshToken } from '@/utils/tokens';
import { successResponse, errorResponse } from '@/utils/ApiResponse';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
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
      return errorResponse('No OTP found, please request a new one', 404);
    }

    if (verificationDoc.expiresAt < new Date()) {
      return errorResponse('OTP expired, please request a new one', 410);
    }

    if (verificationDoc.token !== otp) {
      return errorResponse('Invalid OTP', 400);
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
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return successResponse(
      { user, accessToken },
      'Email verified successfully'
    );
  } catch (err: any) {
    console.error('Verify email error:', err);
    return errorResponse('Something went wrong, please try again', 500);
  }
}
