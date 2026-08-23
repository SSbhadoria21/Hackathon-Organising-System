import { type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { loginSchema } from '@/schemas/auth.schema';
import { generateAccessToken, generateRefreshToken } from '@/utils/tokens';
import { successResponse, errorResponse } from '@/utils/ApiResponse';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
      );
    }

    const { identifier, password } = parsed.data;

    const isEmail = identifier.includes('@');
    const user = await User.findOne(
      isEmail ? { email: identifier.toLowerCase() } : { username: identifier.toLowerCase() }
    );

    if (!user) {

      return errorResponse('Invalid credentials', 401);
    }

    if (!user.isEmailVerified) {
      return errorResponse(
        'Email not verified. Please verify your email before logging in.',
        403,
        [{ field: 'email', message: 'Email not verified', userId: user._id.toString() }]
      );
    }
    if (!user.password) {
      return errorResponse(
        'This account uses Google Sign-In. Please sign in with Google.',
        400
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return errorResponse('Invalid credentials', 401);
    }

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

    const safeUser = {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      bio: user.bio,
      about: user.about,
      gender: user.gender,
      isEmailVerified: user.isEmailVerified,
    };

    return successResponse({ user: safeUser, accessToken }, 'Login successful');
  } catch (error: any) {
    console.error('[LOGIN]', error);
    return errorResponse('Internal server error', 500);
  }
}
