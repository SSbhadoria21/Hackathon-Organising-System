import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { auth } from '@/lib/firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { generateAccessToken, generateRefreshToken } from '@/utils/tokens';
import { successResponse, errorResponse } from '@/utils/ApiResponse';
import { cookies } from 'next/headers';
import { Types } from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== 'string') {
      return errorResponse('Token is required', 400);
    }

    let firebaseUser: DecodedIdToken;
    try {
      firebaseUser = await auth.verifyIdToken(idToken);
    } catch (err: any) {
      console.error('Google token verification failed:', err.message);
      return errorResponse('Invalid or expired token, please sign in again', 401);
    }

    const { uid, email, name, picture } = firebaseUser;

    if (!email) {
      return errorResponse('Google account has no email', 400);
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.googleId) {
        user.googleId = uid;
        await user.save();
      }
    } else {
      const baseUsername = (name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);
      const username = `${baseUsername}${Math.floor(1000 + Math.random() * 9000)}`;

      user = await User.create({
        username,
        fullName: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: null,
        googleId: uid,
        avatar: picture || undefined,
        gender: 'OTHER',
        bio: 'Google sign-in user',
        isEmailVerified: true,
        role: 'USER',
      });
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

    const isNewUser = !firebaseUser.email;
    return successResponse(
      { user: safeUser, accessToken },
      user.googleId === uid && !isNewUser ? 'Signed in with Google' : 'Account created with Google'
    );
  } catch (err: any) {
    console.error('Google auth error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
