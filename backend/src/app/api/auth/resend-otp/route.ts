import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { EmailVerification } from '@/models/EmailVerification';
import { resendOtpSchema } from '@/schemas/auth.schema';
import { sendVerificationOtp } from '@/lib/mailer';
import { successResponse, errorResponse } from '@/utils/ApiResponse';
import { Types } from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const parsed = resendOtpSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Validation failed', 400);
    }

    const { userId } = parsed.data;

    const user = await User.findById(userId).select('email fullName isEmailVerified');
    if (!user) return errorResponse('User not found', 404);

    if (user.isEmailVerified) {
      return errorResponse('Email is already verified', 400);
    }

    const recent = await EmailVerification.findOne({
      userId: new Types.ObjectId(userId),
      type: 'EMAIL_VERIFY',
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
    });

    if (recent) {
      return errorResponse('Please wait a minute before requesting again', 429);
    }

    await EmailVerification.deleteMany({ userId: user._id, type: 'EMAIL_VERIFY' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmailVerification.create({
      userId: user._id,
      email: user.email,
      token: otp,
      type: 'EMAIL_VERIFY',
      expiresAt,
    });

    await sendVerificationOtp(user.email, user.fullName, otp);

    return successResponse(null, 'OTP sent to your email');
  } catch (err: any) {
    console.error('Resend OTP error:', err);
    return errorResponse('Something went wrong, please try again', 500);
  }
}
