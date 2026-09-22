import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { requireAuth } from '@/lib/withAuth';
import { uploadBufferToCloudinary } from '@/lib/upload';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return errorResponse('Avatar file is required', 400);
    }

    if (!file.type.startsWith('image/')) {
      return errorResponse('File must be an image', 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('Image must be less than 5MB', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { url } = await uploadBufferToCloudinary(buffer, 'avatars', 'image');

    const user = await User.findByIdAndUpdate(
      auth._id,
      { $set: { avatar: url } },
      { new: true }
    ).select('-password -refreshToken -googleId');

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(
      { avatar: url, user },
      'Avatar updated'
    );
  } catch (err: any) {
    console.error('Avatar upload error:', err);
    return errorResponse('Could not upload avatar', 500);
  }
}
