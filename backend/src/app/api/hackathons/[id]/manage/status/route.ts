import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Team } from '@/models/Team';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const statusSchema = z.object({
  status: z.enum(['PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED']),
  /** Announcement message sent to all registered teams */
  announcementMessage: z.string().max(1000).optional(),
  /** For CANCELLED — optional reason */
  reason: z.string().max(500).optional(),
});

/**
 * POST /hackathons/:id/manage/status
 * Organizer controls hackathon lifecycle status with participant notifications.
 *
 * Transitions allowed:
 *   DRAFT      → PUBLISHED
 *   PUBLISHED  → ONGOING | CANCELLED
 *   ONGOING    → COMPLETED | CANCELLED
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid hackathon ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id });
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { status: newStatus, announcementMessage, reason } = parsed.data;
    const currentStatus = hackathon.status;

    // Validate transition
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ['PUBLISHED'],
      PUBLISHED: ['ONGOING', 'CANCELLED'],
      ONGOING: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      return errorResponse(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }

    // DRAFT → PUBLISHED: validate required fields
    if (newStatus === 'PUBLISHED') {
      const missing: string[] = [];
      if (!hackathon.eventName) missing.push('eventName');
      if (!hackathon.theme) missing.push('theme');
      if (!hackathon.banner) missing.push('banner');
      if (!hackathon.registrationOpens) missing.push('registrationOpens');
      if (!hackathon.registrationCloses) missing.push('registrationCloses');
      if (!hackathon.resultAnnouncementDate) missing.push('resultAnnouncementDate');
      if (!hackathon.cocDocumentUrl) missing.push('cocDocumentUrl');

      if (missing.length > 0) {
        return errorResponse(
          `Cannot publish: missing required fields: ${missing.join(', ')}`,
          400
        );
      }

      // Check that at least one round is configured
      const roundCount = await Round.countDocuments({ hackathonId: id });
      if (roundCount === 0) {
        return errorResponse('Cannot publish: at least one round must be configured', 400);
      }
    }

    hackathon.status = newStatus as any;
    await hackathon.save();

    // Notify all registered teams
    const teams = await Team.find({ hackathonId: id }).lean();

    if (teams.length > 0) {
      const defaultMessages: Record<string, string> = {
        PUBLISHED: `"${hackathon.eventName}" is now open for registration!`,
        ONGOING: `"${hackathon.eventName}" has officially started! Good luck to all participants!`,
        COMPLETED: `"${hackathon.eventName}" has concluded. Thank you for participating!`,
        CANCELLED: `"${hackathon.eventName}" has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
      };

      const notifTitles: Record<string, string> = {
        PUBLISHED: '📢 Hackathon Published',
        ONGOING: '🚀 Hackathon Started!',
        COMPLETED: '🏁 Hackathon Completed',
        CANCELLED: '❌ Hackathon Cancelled',
      };

      const notifications = teams.map((team: any) => ({
        userId: team.leaderId,
        type: 'ANNOUNCEMENT' as const,
        title: notifTitles[newStatus],
        message: announcementMessage || defaultMessages[newStatus],
        read: false,
        metadata: {
          hackathonId: id,
          teamId: team._id.toString(),
          newStatus,
          ...(reason ? { reason } : {}),
        },
      }));

      await Notification.insertMany(notifications);
    }

    return successResponse(
      {
        _id: hackathon._id,
        eventName: hackathon.eventName,
        previousStatus: currentStatus,
        status: newStatus,
        notifiedTeams: teams.length,
      },
      `Hackathon status updated to ${newStatus}`
    );
  } catch (err: any) {
    console.error('Status update error:', err);
    return errorResponse('Failed to update status', 500);
  }
}
