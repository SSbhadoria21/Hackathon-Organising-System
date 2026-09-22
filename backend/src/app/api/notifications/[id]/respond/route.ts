import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { Judge } from '@/models/Judge';
import { Team } from '@/models/Team';
import { Hackathon } from '@/models/Hackathon';
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

    const body = await req.json();
    const { action } = body;

    if (action !== 'ACCEPT' && action !== 'DECLINE') {
      return errorResponse('Invalid action', 400);
    }

    const notification = await Notification.findOne({
      _id: id,
      userId: auth._id,
    });

    if (!notification) {
      return errorResponse('Notification not found', 404);
    }

    if (notification.actionStatus && notification.actionStatus !== 'PENDING') {
      return errorResponse(`Invitation already ${notification.actionStatus.toLowerCase()}`, 400);
    }

    const metadata: Record<string, any> = notification.metadata
      ? notification.metadata instanceof Map
        ? Object.fromEntries(notification.metadata)
        : (notification.metadata as any)
      : {};

    const newActionStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';

    if (notification.type === 'JUDGE_INVITE') {
      const judgeId = metadata.judgeId;
      if (judgeId) {
        await Judge.findByIdAndUpdate(judgeId, {
          $set: {
            status: newActionStatus,
            userId: auth._id,
          },
        });
      }

      notification.actionStatus = newActionStatus;
      notification.read = true;
      await notification.save();

      return successResponse(
        { actionStatus: newActionStatus, type: 'JUDGE_INVITE' },
        `Invitation ${action === 'ACCEPT' ? 'accepted' : 'declined'}`
      );
    }

    if (notification.type === 'TEAM_INVITE') {
      const teamId = metadata.teamId;
      if (!teamId) {
        return errorResponse('Missing team information in notification', 400);
      }

      const team = await Team.findById(teamId);
      if (!team) {
        return errorResponse('Team not found', 404);
      }

      if (action === 'ACCEPT') {
        const hackathon = await Hackathon.findById(team.hackathonId);
        const maxSize = hackathon?.teamMaxSize || 4;

        if (team.members.length >= maxSize) {
          return errorResponse(`Team is already full (max ${maxSize} members)`, 400);
        }

        if (!team.members.some((m) => m.toString() === auth._id)) {
          team.members.push(auth._id as any);
          await team.save();
        }
      }

      notification.actionStatus = newActionStatus;
      notification.read = true;
      await notification.save();

      return successResponse(
        { actionStatus: newActionStatus, teamId: team._id },
        `Invitation ${action === 'ACCEPT' ? 'accepted' : 'declined'}`
      );
    }

    return errorResponse('Invalid request', 400);
  } catch (err: any) {
    console.error('Notification respond error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
