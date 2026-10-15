import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Judge } from '@/models/Judge';
import { Round } from '@/models/Round';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/withAuth';
import { judgeInviteSchema } from '@/schemas/hackathon.schema';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

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
    const judges = await Judge.find({ hackathonId: id })
      .populate('userId', 'username fullName avatar bio skills')
      .populate('roundIds', 'roundName roundNumber roundType')
      .lean();

    return successResponse(judges, 'Judges fetched');
  } catch (err: any) {
    console.error('Get judges error:', err);
    return errorResponse('Something went wrong', 500);
  }
}

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

    const hackathon = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 404);
    }

    const body = await req.json();
    const parsed = judgeInviteSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'Validation failed',
        400,
        parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const { targetUsername, email, name, accessType = 'FULL', roundIds } = parsed.data;

    // Resolve which rounds are granted
    let finalRoundIds: mongoose.Types.ObjectId[] = [];
    let roundNames: string[] = [];

    const allHackathonRounds = await Round.find({ hackathonId: id }).select('_id roundName roundNumber').lean();

    if (accessType === 'SPECIFIC_ROUNDS' && roundIds && roundIds.length > 0) {
      const validRounds = allHackathonRounds.filter((r) =>
        roundIds.includes(r._id.toString())
      );

      if (validRounds.length === 0) {
        return errorResponse('Selected rounds do not belong to this hackathon', 400);
      }

      finalRoundIds = validRounds.map((r) => r._id as mongoose.Types.ObjectId);
      roundNames = validRounds.map((r) => `Round ${r.roundNumber}: ${r.roundName}`);
    } else {
      // FULL access to all submissions across all rounds
      finalRoundIds = allHackathonRounds.map((r) => r._id as mongoose.Types.ObjectId);
      roundNames = allHackathonRounds.map((r) => `Round ${r.roundNumber}: ${r.roundName}`);
    }

    const accessDescription =
      accessType === 'FULL'
        ? 'Full access (all rounds and submissions)'
        : `Specific round(s): ${roundNames.join(', ')}`;

    if (targetUsername) {
      const cleanUsername = targetUsername.trim().replace(/^@/, '').toLowerCase();
      const targetUser = await User.findOne({ username: cleanUsername });

      if (!targetUser) {
        return errorResponse(`User @${cleanUsername} not found`, 404);
      }

      if (targetUser._id.toString() === auth._id) {
        return errorResponse('You cannot invite yourself as a judge', 400);
      }

      const existingJudge = await Judge.findOne({
        hackathonId: id,
        $or: [{ userId: targetUser._id }, { email: targetUser.email }],
      });

      if (existingJudge) {
        return errorResponse(`User @${cleanUsername} is already invited`, 409);
      }

      const organizer = await User.findById(auth._id).select('fullName');

      const judge = await Judge.create({
        hackathonId: id,
        name: targetUser.fullName,
        email: targetUser.email,
        username: targetUser.username,
        userId: targetUser._id,
        invitedBy: auth._id,
        status: 'INVITED',
        accessType,
        roundIds: finalRoundIds,
      });

      await Notification.create({
        userId: targetUser._id,
        type: 'JUDGE_INVITE',
        title: 'Judge Invitation Request',
        message: `${organizer?.fullName || 'An organizer'} invited you to be a judge for "${hackathon.eventName}" with ${accessDescription}`,
        actionStatus: 'PENDING',
        read: false,
        metadata: {
          hackathonId: hackathon._id.toString(),
          hackathonName: hackathon.eventName || 'Hackathon',
          organizerName: organizer?.fullName || 'Organizer',
          judgeId: judge._id.toString(),
          accessType,
          roundIds: JSON.stringify(finalRoundIds.map(String)),
          roundNames: JSON.stringify(roundNames),
        },
      });

      const populatedJudge = await Judge.findById(judge._id)
        .populate('userId', 'username fullName avatar bio skills')
        .populate('roundIds', 'roundName roundNumber roundType')
        .lean();

      return successResponse(
        populatedJudge,
        `Invitation sent to @${cleanUsername}`,
        201
      );
    }

    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const existingJudge = await Judge.findOne({
        hackathonId: id,
        email: cleanEmail,
      });

      if (existingJudge) {
        return errorResponse(`Email ${cleanEmail} is already invited`, 409);
      }

      const magicLinkToken = nanoid(32);
      const judge = await Judge.create({
        hackathonId: id,
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        invitedBy: auth._id,
        status: 'INVITED',
        accessType,
        roundIds: finalRoundIds,
        magicLinkToken,
        magicLinkExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // If user with this email exists in system, send internal notification too
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        const organizer = await User.findById(auth._id).select('fullName');
        await Notification.create({
          userId: existingUser._id,
          type: 'JUDGE_INVITE',
          title: 'Judge Invitation Request',
          message: `${organizer?.fullName || 'An organizer'} invited you to be a judge for "${hackathon.eventName}" with ${accessDescription}`,
          actionStatus: 'PENDING',
          read: false,
          metadata: {
            hackathonId: hackathon._id.toString(),
            hackathonName: hackathon.eventName || 'Hackathon',
            organizerName: organizer?.fullName || 'Organizer',
            judgeId: judge._id.toString(),
            accessType,
            roundIds: JSON.stringify(finalRoundIds.map(String)),
            roundNames: JSON.stringify(roundNames),
          },
        });
      }

      const populatedJudge = await Judge.findById(judge._id)
        .populate('userId', 'username fullName avatar bio skills')
        .populate('roundIds', 'roundName roundNumber roundType')
        .lean();

      return successResponse(
        populatedJudge,
        `Invitation sent to ${cleanEmail}`,
        201
      );
    }

    return errorResponse('Username or email is required', 400);
  } catch (err: any) {
    console.error('Invite judge error:', err);
    return errorResponse('Could not invite judge', 500);
  }
}
