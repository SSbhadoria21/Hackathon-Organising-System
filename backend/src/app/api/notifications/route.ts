import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');
    const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';

    const filter: any = { userId: auth._id };
    if (unreadOnly) {
      filter.read = false;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: auth._id, read: false }),
    ]);

    return successResponse(
      {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        unreadCount,
      },
      'Notifications fetched'
    );
  } catch (err: any) {
    console.error('Get notifications error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
