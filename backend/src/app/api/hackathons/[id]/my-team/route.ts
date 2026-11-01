import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { Hackathon } from '@/models/Hackathon';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

/**
 * GET /hackathons/:id/my-team
 * Returns the authenticated user's team for this hackathon, with invite code (visible to leader)
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

    const team = await Team.findOne({
      hackathonId: id,
      members: auth._id,
    })
      .populate('leaderId', 'fullName username avatar email bio skills')
      .populate('members', 'fullName username avatar email bio skills')
      .lean();

    if (!team) {
      return successResponse(null, 'You are not registered in this hackathon');
    }

    const isLeader = (team as any).leaderId?._id?.toString() === auth._id
      || (team as any).leaderId?.toString() === auth._id;

    return successResponse(
      {
        ...team,
        // Only expose invite code to the team leader
        inviteCode: isLeader ? (team as any).inviteCode : undefined,
        isLeader,
      },
      'Your team fetched'
    );
  } catch (err: any) {
    console.error('Get my-team error:', err);
    return errorResponse('Failed to fetch team', 500);
  }
}

/**
 * DELETE /hackathons/:id/my-team
 * Leave the team (if member) or disband team (if leader)
 */
export async function DELETE(
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

    if (hackathon.status === 'ONGOING' || hackathon.status === 'COMPLETED') {
      return errorResponse('Cannot leave or disband a team once hackathon is ongoing or completed', 400);
    }

    const team = await Team.findOne({
      hackathonId: id,
      members: auth._id,
    });

    if (!team) {
      return errorResponse('You are not in any team for this hackathon', 404);
    }

    const isLeader = team.leaderId.toString() === auth._id;

    if (isLeader) {
      // Disband team — notify all members
      const nonLeaderMembers = team.members.filter((m) => m.toString() !== auth._id);
      if (nonLeaderMembers.length > 0) {
        const notifications = nonLeaderMembers.map((memberId) => ({
          userId: memberId,
          type: 'ANNOUNCEMENT' as const,
          title: 'Team Disbanded',
          message: `Your team "${team.name}" for "${hackathon.eventName || 'the hackathon'}" has been disbanded by the team leader.`,
          read: false,
          metadata: { hackathonId: id, teamId: team._id.toString() },
        }));
        await Notification.insertMany(notifications);
      }

      await Team.findByIdAndDelete(team._id);
      await Hackathon.findByIdAndUpdate(id, { $inc: { registeredTeamsCount: -1 } });

      return successResponse(null, 'Team disbanded successfully');
    }

    // Non-leader: just leave
    team.members = team.members.filter((m) => m.toString() !== auth._id) as any;
    await team.save();

    // Notify leader
    await Notification.create({
      userId: team.leaderId,
      type: 'ANNOUNCEMENT',
      title: 'Member Left Team',
      message: `A member has left your team "${team.name}" for "${hackathon.eventName || 'the hackathon'}".`,
      read: false,
      metadata: { hackathonId: id, teamId: team._id.toString() },
    });

    return successResponse(null, 'You have left the team');
  } catch (err: any) {
    console.error('Leave team error:', err);
    return errorResponse('Failed to leave team', 500);
  }
}
