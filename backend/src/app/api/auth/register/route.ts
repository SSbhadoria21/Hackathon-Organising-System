import { type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { EmailVerification } from '@/models/EmailVerification';
import { registerSchema } from '@/schemas/auth.schema';
import { sendVerificationOtp } from '@/lib/mailer';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { username, fullName, email, password, gender, bio, about } = parsed.data;

    const existingUsername = await User.findOne({ username }).lean();
    if (existingUsername) {
      return errorResponse('Username is already taken', 409);
    }
    const existingEmail = await User.findOne({ email }).lean();
    if (existingEmail) {
      return errorResponse('An account with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      fullName,
      email,
      password: hashedPassword,
      gender,
      bio,
      about,
      isEmailVerified: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

    await EmailVerification.create({
      userId: user._id,
      email,
      token: otp,
      type: 'EMAIL_VERIFY',
      expiresAt,
    });


    await sendVerificationOtp(email, fullName, otp);

    
    return successResponse(
      { userId: user._id.toString() },
      'Account created. Check your email for the 6-digit verification code.',
      201
    );
  } catch (error: any) {
    console.error('[REGISTER]', error);
    return errorResponse(`Internal server error: ${error.message || error.toString()}`, 500, [{ trace: error.stack }]);
  }
}
