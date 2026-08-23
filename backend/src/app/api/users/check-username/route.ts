import { type NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(request: NextRequest) {
  try {
    const username = request.nextUrl.searchParams.get('username');

    if (!username) {
      return errorResponse('Username query param is required', 400);
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username.toLowerCase())) {
      return successResponse(
        { available: false, reason: 'invalid_format' },
        'Username can only contain lowercase letters, numbers, and underscores (3–30 chars)'
      );
    }

    await dbConnect();
    const existing = await User.findOne({ username: username.toLowerCase() }).lean();

    if (existing) {
      return successResponse(
        { available: false, reason: 'taken' },
        'Username is already taken'
      );
    }

    return successResponse({ available: true }, 'Username is available');
  } catch (error: any) {
    console.error('[CHECK-USERNAME]', error);
    return errorResponse('Internal server error', 500);
  }
}
