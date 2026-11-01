import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const hackathon = await Hackathon.findOne(query).lean();
    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    // Status check
    if (
      hackathon.status !== 'PUBLISHED' &&
      hackathon.status !== 'ONGOING' &&
      hackathon.status !== 'DRAFT'
    ) {
      return errorResponse('Registration is not open for this hackathon', 400);
    }

    // Registration window check (only if dates are defined and not in DRAFT)
    const now = new Date();
    if (hackathon.status !== 'DRAFT') {
      if (hackathon.registrationOpens && now < hackathon.registrationOpens) {
        return errorResponse('Registration has not opened yet', 400);
      }
      if (hackathon.registrationCloses && now > hackathon.registrationCloses) {
        return errorResponse('Registration is closed', 400);
      }
    }

    // Check if user is already in a team for this hackathon
    const existingTeam = await Team.findOne({
      hackathonId: hackathon._id,
      members: auth._id,
    });
    if (existingTeam) {
      return errorResponse('You are already registered in this hackathon', 409);
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body defaults to CREATE with user's name
      body = {};
    }

    const user = await User.findById(auth._id).select('fullName username email avatar').lean();
    const defaultTeamName = `${user?.fullName || user?.username || 'Participant'}'s Team`;

    // Normalise action
    const action = (body.action || 'CREATE').toUpperCase();

    if (action === 'JOIN') {
      const inviteCode = (body.inviteCode || '').trim().toUpperCase();
      if (!inviteCode) {
        return errorResponse('Invite code is required to join a team', 400);
      }

      const team = await Team.findOne({
        hackathonId: hackathon._id,
        inviteCode,
      });

      if (!team) {
        return errorResponse('Invalid invite code or team does not exist for this hackathon', 404);
      }

      const maxMembers = hackathon.teamMaxSize || 4;
      if (team.members.length >= maxMembers) {
        return errorResponse(`Team is already full (maximum ${maxMembers} members)`, 400);
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
          message: `${user?.fullName || 'A new member'} joined your team "${team.name}" for ${hackathon.eventName || 'the hackathon'}.`,
          read: false,
          metadata: {
            hackathonId: hackathon._id.toString(),
            teamId: team._id.toString(),
            teamName: team.name,
          },
        });
      }

      const populatedTeam = await Team.findById(team._id)
        .populate('leaderId', 'fullName username avatar email')
        .populate('members', 'fullName username avatar email')
        .lean();

      return successResponse(
        {
          team: populatedTeam,
          isRegistered: true,
          teamId: team._id.toString(),
          teamName: team.name,
          inviteCode: team.inviteCode,
          message: `Successfully joined "${team.name}"!`,
        },
        'Joined team successfully',
        200
      );
    }

    // CREATE team
    const teamName = (body.teamName || '').trim() || defaultTeamName;
    if (teamName.length < 2 || teamName.length > 60) {
      return errorResponse('Team name must be between 2 and 60 characters', 400);
    }

    // Check capacity
    if (
      hackathon.expectedTeamsCount &&
      hackathon.registeredTeamsCount >= hackathon.expectedTeamsCount
    ) {
      return errorResponse('This hackathon has reached maximum team capacity', 400);
    }

    const inviteCode = nanoid(8).toUpperCase();

    const team = await Team.create({
      name: teamName,
      hackathonId: hackathon._id,
      inviteCode,
      members: [auth._id],
      leaderId: auth._id,
      paymentStatus: hackathon.paid ? 'PENDING' : 'NOT_REQUIRED',
    });

    // Increment registered teams count
    await Hackathon.findByIdAndUpdate(hackathon._id, {
      $inc: { registeredTeamsCount: 1 },
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('leaderId', 'fullName username avatar email')
      .populate('members', 'fullName username avatar email')
      .lean();

    return successResponse(
      {
        team: populatedTeam,
        isRegistered: true,
        teamId: team._id.toString(),
        teamName: team.name,
        inviteCode,
        message: `Team "${teamName}" created! Share invite code: ${inviteCode}`,
      },
      'Team created and registered successfully',
      201
    );
  } catch (err: any) {
    console.error('Register error:', err);
    return errorResponse(err.message || 'Failed to register', 500);
  }
}
