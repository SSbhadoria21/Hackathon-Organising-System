import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: auth._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return errorResponse('Notification not found', 404);
    }

    return successResponse(notification, 'Notification marked as read');
  } catch (err: any) {
    console.error('Mark read error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
