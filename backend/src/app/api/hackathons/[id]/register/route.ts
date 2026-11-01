import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

const createTeamSchema = z.object({
  action: z.literal('CREATE'),
  teamName: z.string().min(2, 'Team name must be at least 2 characters').max(60),
});

const joinTeamSchema = z.object({
  action: z.literal('JOIN'),
  inviteCode: z.string().min(6, 'Invalid invite code'),
});

const schema = z.discriminatedUnion('action', [createTeamSchema, joinTeamSchema]);

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

    const hackathon = await Hackathon.findById(id).lean();
    if (!hackathon) return errorResponse('Hackathon not found', 404);

    // Status check
    if (hackathon.status !== 'PUBLISHED' && hackathon.status !== 'ONGOING') {
      return errorResponse('Registration is not open for this hackathon', 400);
    }

    // Registration window check
    const now = new Date();
    if (hackathon.registrationOpens && now < hackathon.registrationOpens) {
      return errorResponse('Registration has not opened yet', 400);
    }
    if (hackathon.registrationCloses && now > hackathon.registrationCloses) {
      return errorResponse('Registration is closed', 400);
    }

    // Check if user already in a team for this hackathon
    const existingTeam = await Team.findOne({
      hackathonId: id,
      members: auth._id,
    });
    if (existingTeam) {
      return errorResponse('You are already registered in this hackathon', 409);
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const user = await User.findById(auth._id).select('fullName email').lean();

    if (parsed.data.action === 'CREATE') {
      // Check team capacity for hackathon
      if (hackathon.expectedTeamsCount && hackathon.registeredTeamsCount >= hackathon.expectedTeamsCount) {
        return errorResponse('This hackathon has reached maximum team capacity', 400);
      }

      const inviteCode = nanoid(8).toUpperCase();

      const team = await Team.create({
        name: parsed.data.teamName,
        hackathonId: id,
        inviteCode,
        members: [auth._id],
        leaderId: auth._id,
        paymentStatus: hackathon.paid ? 'PENDING' : 'NOT_REQUIRED',
      });

      // Increment registered teams count
      await Hackathon.findByIdAndUpdate(id, { $inc: { registeredTeamsCount: 1 } });

      const populatedTeam = await Team.findById(team._id)
        .populate('leaderId', 'fullName username avatar email')
        .populate('members', 'fullName username avatar email')
        .lean();

      return successResponse(
        {
          team: populatedTeam,
          inviteCode,
          message: `Team "${parsed.data.teamName}" created! Share invite code: ${inviteCode}`,
        },
        'Team created and registered successfully',
        201
      );
    }

    // JOIN via invite code
    const team = await Team.findOne({
      hackathonId: id,
      inviteCode: parsed.data.inviteCode.toUpperCase(),
    });

    if (!team) return errorResponse('Invalid invite code', 404);

    if (team.members.length >= hackathon.teamMaxSize) {
      return errorResponse(`Team is full (max ${hackathon.teamMaxSize} members)`, 400);
    }

    // Add user to team
    team.members.push(new mongoose.Types.ObjectId(auth._id));
    await team.save();

    // Notify team leader
    if (team.leaderId.toString() !== auth._id) {
      await Notification.create({
        userId: team.leaderId,
        type: 'TEAM_INVITE',
        title: 'New Member Joined',
        message: `${user?.fullName || 'A user'} joined your team "${team.name}" for ${hackathon.eventName || 'the hackathon'}`,
        read: false,
        metadata: {
          hackathonId: id,
          teamId: team._id.toString(),
          teamName: team.name,
        },
      });
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('leaderId', 'fullName username avatar email')
      .populate('members', 'fullName username avatar email')
      .lean();

    return successResponse(populatedTeam, 'Joined team successfully');
  } catch (err: any) {
    console.error('Register error:', err);
    return errorResponse('Failed to register', 500);
  }
}
