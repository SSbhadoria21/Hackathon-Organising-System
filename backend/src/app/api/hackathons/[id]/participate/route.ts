import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Team } from '@/models/Team';
import { Submission } from '@/models/Submission';
import { Result } from '@/models/Result';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

/**
 * GET /hackathons/:id/participate
 * Participant's full journey view for a hackathon.
 * Shows: team info, all rounds (eligible/not), submissions per round, results, current status.
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

    const hackathon = await Hackathon.findById(id)
      .populate('organizerId', 'fullName username avatar')
      .lean();

    if (!hackathon) return errorResponse('Hackathon not found', 404);

    // Check if user is registered
    const team = await Team.findOne({
      hackathonId: id,
      members: auth._id,
    })
      .populate('leaderId', 'fullName username avatar email')
      .populate('members', 'fullName username avatar email bio skills')
      .lean();

    if (!team) {
      // Return hackathon info without participation data
      return successResponse(
        {
          hackathon: {
            _id: hackathon._id,
            eventName: hackathon.eventName,
            theme: hackathon.theme,
            banner: hackathon.banner,
            logo: hackathon.logo,
            status: hackathon.status,
            mode: hackathon.mode,
            registrationOpens: hackathon.registrationOpens,
            registrationCloses: hackathon.registrationCloses,
            hackingStartsAt: hackathon.hackingStartsAt,
            hackingEndsAt: hackathon.hackingEndsAt,
            teamMinSize: hackathon.teamMinSize,
            teamMaxSize: hackathon.teamMaxSize,
            paid: hackathon.paid,
            feeAmount: hackathon.feeAmount,
          },
          isRegistered: false,
          team: null,
          rounds: [],
          overallStatus: 'NOT_REGISTERED',
        },
        'Not registered in this hackathon'
      );
    }

    const isLeader = (team as any).leaderId?._id?.toString() === auth._id
      || (team as any).leaderId?.toString() === auth._id;

    // Fetch all rounds
    const rounds = await Round.find({ hackathonId: id })
      .sort({ roundNumber: 1 })
      .lean();

    // Fetch team's submissions
    const submissions = await Submission.find({
      hackathonId: id,
      teamId: (team as any)._id,
    }).lean();

    const subByRound = new Map(submissions.map((s: any) => [s.roundId.toString(), s]));

    // Fetch results for this team
    const results = await Result.find({
      hackathonId: id,
      teamId: (team as any)._id,
    }).lean();

    const resultByRound = new Map(results.map((r: any) => [r.roundId.toString(), r]));

    // Build per-round status
    let eliminated = false;
    const roundDetails = rounds.map((round: any) => {
      const rId = round._id.toString();
      const sub = subByRound.get(rId);
      const result = resultByRound.get(rId);

      const isSubAdvanced = sub?.status === 'ADVANCED' || result?.advanced === true;
      const isSubRejected = sub?.status === 'REJECTED' || (result && result.advanced === false);

      // Check if team cleared previous round
      let prevRoundCleared = false;
      if (round.roundNumber > 1) {
        const prevRound = rounds.find((r: any) => r.roundNumber === round.roundNumber - 1);
        if (prevRound) {
          const prevSub = subByRound.get(prevRound._id.toString());
          const prevRes = resultByRound.get(prevRound._id.toString());
          prevRoundCleared = prevSub?.status === 'ADVANCED' || prevRes?.advanced === true;
        }
      }

      const isEligible =
        round.roundNumber === 1 ||
        (round.teamIds || []).some((t: any) => t.toString() === (team as any)._id.toString()) ||
        prevRoundCleared;

      const now = new Date();
      const roundStatus =
        now < round.roundOpens
          ? 'UPCOMING'
          : now > round.roundCloses
          ? 'CLOSED'
          : 'ACTIVE';

      // Deadline countdown in minutes
      const minutesToDeadline =
        roundStatus === 'ACTIVE'
          ? Math.max(0, Math.floor((round.roundCloses.getTime() - now.getTime()) / 60000))
          : null;

      let participantStatus: string;
      if (isSubAdvanced) {
        participantStatus = 'ADVANCED';
      } else if (isSubRejected) {
        participantStatus = 'ELIMINATED';
        eliminated = true;
      } else if (!isEligible) {
        participantStatus = eliminated ? 'ELIMINATED' : 'NOT_YET_ELIGIBLE';
      } else if (sub) {
        participantStatus = sub.status === 'EVALUATING' ? 'EVALUATING' : 'SUBMITTED';
      } else if (roundStatus === 'ACTIVE') {
        participantStatus = 'PENDING_SUBMISSION';
      } else if (roundStatus === 'CLOSED') {
        participantStatus = 'MISSED_SUBMISSION';
      } else {
        participantStatus = 'UPCOMING';
      }

      return {
        roundId: round._id,
        roundName: round.roundName,
        roundNumber: round.roundNumber,
        roundType: round.roundType,
        roundOpens: round.roundOpens,
        roundCloses: round.roundCloses,
        roundStatus,
        minutesToDeadline,
        maxTeamsAdvancing: round.maxTeamsAdvancing,
        criterias: round.criterias || [],
        isEligible,
        participantStatus,
        isRoundCleared: isSubAdvanced,
        isOnline: round.isOnline !== false,
        offlineVenue: round.offlineVenue,
        offlineAddress: round.offlineAddress,
        offlineMapLink: round.offlineMapLink,
        submission: sub
          ? {
              _id: sub._id,
              status: sub.status,
              repoUrl: sub.repoUrl,
              liveUrl: sub.liveUrl,
              deckFileUrl: sub.deckFileUrl,
              pitchVideoUrl: sub.pitchVideoUrl,
              description: sub.description,
              submittedAt: sub.createdAt,
              updatedAt: sub.updatedAt,
            }
          : null,
        result: result
          ? {
              rank: result.rank,
              finalScore: result.finalScore,
              advanced: result.advanced,
              published: result.published,
            }
          : null,
      };
    });

    // Overall participant status
    let overallStatus: string;
    if ((team as any).paymentStatus === 'PENDING') {
      overallStatus = 'PAYMENT_PENDING';
    } else if (eliminated) {
      overallStatus = 'ELIMINATED';
    } else if (hackathon.status === 'COMPLETED') {
      overallStatus = 'HACKATHON_COMPLETED';
    } else {
      const advancedCount = roundDetails.filter((r) => r.participantStatus === 'ADVANCED').length;
      const currentRound = roundDetails.find(
        (r) => r.isEligible && r.participantStatus !== 'ADVANCED'
      );
      overallStatus = currentRound
        ? `ACTIVE_ROUND_${currentRound.roundNumber}`
        : advancedCount === rounds.length
        ? 'FINALIST'
        : 'REGISTERED';
    }

    return successResponse(
      {
        hackathon: {
          _id: hackathon._id,
          eventName: hackathon.eventName,
          theme: hackathon.theme,
          banner: hackathon.banner,
          logo: hackathon.logo,
          status: hackathon.status,
          mode: hackathon.mode,
          address: hackathon.address,
          mapLink: hackathon.mapLink,
          registrationOpens: hackathon.registrationOpens,
          registrationCloses: hackathon.registrationCloses,
          hackingStartsAt: hackathon.hackingStartsAt,
          hackingEndsAt: hackathon.hackingEndsAt,
          resultAnnouncementDate: hackathon.resultAnnouncementDate,
          paid: hackathon.paid,
          feeAmount: hackathon.feeAmount,
          organizer: hackathon.organizerId,
          leaderboardPublic: hackathon.leaderboardPublic,
        },
        isRegistered: true,
        isLeader,
        team: {
          ...(team as any),
          // Only expose invite code to leader
          inviteCode: isLeader ? (team as any).inviteCode : undefined,
        },
        overallStatus,
        rounds: roundDetails,
        summary: {
          totalRounds: rounds.length,
          roundsCompleted: roundDetails.filter((r) => ['ADVANCED', 'ELIMINATED'].includes(r.participantStatus)).length,
          currentRoundNumber: roundDetails.find((r) => r.isEligible && r.participantStatus === 'PENDING_SUBMISSION' || r.participantStatus === 'SUBMITTED')?.roundNumber ?? null,
          isEliminated: eliminated,
          isFinalist: !eliminated && roundDetails.every((r) => !r.isEligible || r.participantStatus === 'ADVANCED'),
        },
      },
      'Participation details fetched'
    );
  } catch (err: any) {
    console.error('Participate error:', err);
    return errorResponse('Failed to fetch participation data', 500);
  }
}
