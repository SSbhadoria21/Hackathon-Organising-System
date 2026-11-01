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

const announceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  /** Target audience: 'ALL' or specific round participants */
  audience: z.enum(['ALL', 'ROUND']).default('ALL'),
  roundId: z.string().optional(),
  /** For ONLINE hackathons: include a meeting/stream link */
  meetLink: z.string().url().optional().or(z.literal('')),
  notifyAll: z.boolean().default(true),
});

/**
 * POST /hackathons/:id/manage/announce
 * Organizer broadcasts announcements to all registered teams or round-specific participants.
 * Key for online hackathons: can include meet/stream links.
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

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id }).lean();
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    const body = await req.json();
    const parsed = announceSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { title, message, audience, roundId, meetLink, notifyAll } = parsed.data;

    // Determine target teams
    let targetTeams: any[] = [];

    if (audience === 'ROUND' && roundId) {
      if (!mongoose.Types.ObjectId.isValid(roundId)) {
        return errorResponse('Invalid round ID', 400);
      }
      const round = await Round.findOne({ _id: roundId, hackathonId: id }).lean();
      if (!round) return errorResponse('Round not found', 404);

      const roundTeamIds = (round.teamIds || []).map((t: any) => t.toString());
      targetTeams = await Team.find({
        hackathonId: id,
        _id: { $in: roundTeamIds },
      }).lean();
    } else {
      targetTeams = await Team.find({ hackathonId: id }).lean();
    }

    if (targetTeams.length === 0) {
      return successResponse({ notifiedCount: 0 }, 'No teams to notify');
    }

    const finalMessage = meetLink
      ? `${message}\n\n🔗 Join Link: ${meetLink}`
      : message;

    const notifications = targetTeams.map((team: any) => ({
      userId: team.leaderId,
      type: 'ANNOUNCEMENT' as const,
      title,
      message: finalMessage,
      read: false,
      metadata: {
        hackathonId: id,
        teamId: team._id.toString(),
        audience,
        ...(roundId ? { roundId } : {}),
        ...(meetLink ? { meetLink } : {}),
        hackathonMode: hackathon.mode || 'ONLINE',
      },
    }));

    await Notification.insertMany(notifications);

    return successResponse(
      {
        title,
        audience,
        ...(roundId ? { roundId } : {}),
        ...(meetLink ? { meetLink } : {}),
        notifiedCount: notifications.length,
      },
      `Announcement sent to ${notifications.length} team leader(s)`
    );
  } catch (err: any) {
    console.error('Announce error:', err);
    return errorResponse('Failed to send announcement', 500);
  }
}

/**
 * GET /hackathons/:id/manage/announce
 * Get all teams for this hackathon (to preview audience before sending)
 */
export async function GET(
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

    const hackathon = await Hackathon.findOne({ _id: id, organizerId: auth._id }).lean();
    if (!hackathon) return errorResponse('Hackathon not found or not authorized', 403);

    const rounds = await Round.find({ hackathonId: id }).sort({ roundNumber: 1 }).lean();

    const allTeams = await Team.find({ hackathonId: id })
      .populate('leaderId', 'fullName username email avatar')
      .lean();

    const audienceOptions = [
      {
        id: 'ALL',
        label: 'All Registered Teams',
        count: allTeams.length,
      },
      ...rounds.map((r: any) => ({
        id: `ROUND:${r._id}`,
        roundId: r._id,
        label: `Round ${r.roundNumber}: ${r.roundName}`,
        count: (r.teamIds || []).length,
      })),
    ];

    return successResponse(
      {
        hackathon: { _id: hackathon._id, eventName: hackathon.eventName, mode: hackathon.mode },
        audienceOptions,
        isOnline: hackathon.mode === 'ONLINE' || hackathon.mode === 'HYBRID',
      },
      'Announcement options fetched'
    );
  } catch (err: any) {
    console.error('Announce options error:', err);
    return errorResponse('Failed to fetch announcement options', 500);
  }
}
