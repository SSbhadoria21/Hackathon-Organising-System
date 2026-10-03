import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import { Hackathon, HackathonStep } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { Judge } from '@/models/Judge';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid draft ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const draft = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
    })
      .populate('roundIds')
      .lean();

    if (!draft) {
      return errorResponse('Draft not found', 404);
    }

    const judges = await Judge.find({ hackathonId: id }).lean();

    return successResponse(
      {
        ...draft,
        judges,
      },
      'Draft fetched'
    );
  } catch (err: any) {
    console.error('Get draft error:', err);
    return errorResponse('Something went wrong', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse('Invalid draft ID', 400);
    }

    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const draft = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
      status: 'DRAFT',
    });

    if (!draft) {
      return errorResponse('Draft not found', 404);
    }

    const body = await req.json();
    const { step } = body as { step: HackathonStep };
    const data = body?.data || {};

    if (!step) {
      return errorResponse('Step is required', 400);
    }

    switch (step) {
      case 'BASIC_DETAILS': {
        if (data.eventName !== undefined) draft.eventName = data.eventName;
        if (data.theme !== undefined) draft.theme = data.theme;
        if (data.mode !== undefined) draft.mode = data.mode;
        if (data.banner !== undefined) draft.banner = data.banner;
        if (data.logo !== undefined) draft.logo = data.logo;
        if (data.organizingBody !== undefined) draft.organizingBody = data.organizingBody;
        if (data.shortDescription !== undefined) draft.shortDescription = data.shortDescription;
        if (data.description !== undefined) draft.description = data.description;
        if (data.expectedTeamsCount !== undefined) draft.expectedTeamsCount = Number(data.expectedTeamsCount);
        if (data.address !== undefined) draft.address = data.address;
        if (data.mapLink !== undefined) draft.mapLink = data.mapLink;

        if (draft.eventName && draft.theme && draft.banner && draft.organizingBody && draft.description) {
          draft.stepProgress.basicDetails = true;
        }
        break;
      }

      case 'TIMELINE': {
        if (data.registrationOpens) draft.registrationOpens = new Date(data.registrationOpens);
        if (data.registrationCloses) draft.registrationCloses = new Date(data.registrationCloses);
        if (data.hackingStartsAt) draft.hackingStartsAt = new Date(data.hackingStartsAt);
        if (data.hackingEndsAt) draft.hackingEndsAt = new Date(data.hackingEndsAt);
        if (data.resultAnnouncementDate) draft.resultAnnouncementDate = new Date(data.resultAnnouncementDate);
        if (data.timeZone) draft.timeZone = data.timeZone;

        if (draft.registrationOpens && draft.registrationCloses && draft.resultAnnouncementDate) {
          draft.stepProgress.timeline = true;
        }
        break;
      }

      case 'RULES_ELIGIBILITY': {
        if (data.teamMinSize !== undefined) draft.teamMinSize = Number(data.teamMinSize);
        if (data.teamMaxSize !== undefined) draft.teamMaxSize = Number(data.teamMaxSize);
        if (data.eligibility !== undefined) draft.eligibility = data.eligibility;
        if (data.allowedColleges !== undefined) draft.allowedColleges = data.allowedColleges;
        if (data.plagiarismPolicyEnabled !== undefined) draft.plagiarismPolicyEnabled = Boolean(data.plagiarismPolicyEnabled);
        if (data.cocDocumentUrl !== undefined) draft.cocDocumentUrl = data.cocDocumentUrl;
        if (data.techStackRestrictions !== undefined) draft.techStackRestrictions = data.techStackRestrictions;
        if (data.problemStatementPdfUrl !== undefined) draft.problemStatementPdfUrl = data.problemStatementPdfUrl;
        if (data.tracks !== undefined) draft.tracks = data.tracks;

        if (draft.cocDocumentUrl && draft.teamMinSize && draft.teamMaxSize) {
          draft.stepProgress.rulesEligibility = true;
        }
        break;
      }

      case 'ROUNDS': {
        if (Array.isArray(data.rounds)) {
          await Round.deleteMany({ hackathonId: draft._id });

          const createdRounds = await Promise.all(
            data.rounds.map(async (r: any, index: number) => {
              return Round.create({
                hackathonId: draft._id,
                roundName: r.roundName || `Round ${index + 1}`,
                roundNumber: r.roundNumber || index + 1,
                roundType: r.roundType || 'SUBMISSION',
                roundOpens: r.roundOpens ? new Date(r.roundOpens) : draft.registrationCloses || new Date(),
                roundCloses: r.roundCloses ? new Date(r.roundCloses) : draft.resultAnnouncementDate || new Date(),
                maxTeamsAdvancing: r.maxTeamsAdvancing || 10,
                aiWeightage: r.aiWeightage !== undefined ? r.aiWeightage : 0.4,
                scoreThreshold: r.scoreThreshold || 0,
                criterias: r.criterias || [
                  { name: 'Innovation & Impact', weight: 40, description: 'Novelty of idea' },
                  { name: 'Technical Execution', weight: 40, description: 'Code quality and architecture' },
                  { name: 'UI/UX Design', weight: 20, description: 'User experience' },
                ],
                quizQuestions: r.quizQuestions,
              });
            })
          );

          draft.roundIds = createdRounds.map((r) => r._id as any);
          draft.stepProgress.rounds = createdRounds.length > 0;
        }
        break;
      }

      case 'PRIZES_SPONSORS': {
        if (data.prizes !== undefined) draft.prizes = data.prizes;
        if (data.sponsors !== undefined) draft.sponsors = data.sponsors;
        draft.stepProgress.prizesSponsors = true;
        break;
      }

      case 'PAYMENTS': {
        if (data.paid !== undefined) draft.paid = Boolean(data.paid);
        if (data.feeCollectedInRound !== undefined) draft.feeCollectedInRound = Number(data.feeCollectedInRound);
        if (data.feeAmount !== undefined) draft.feeAmount = Number(data.feeAmount);
        if (data.refundPolicy !== undefined) draft.refundPolicy = data.refundPolicy;
        draft.stepProgress.payments = true;
        break;
      }

      case 'JUDGES': {
        draft.stepProgress.judges = true;
        break;
      }

      case 'PREVIEW': {
        break;
      }
    }

    draft.currentStep = step;
    draft.markModified('stepProgress');
    await draft.save();

    const populatedDraft = await Hackathon.findById(draft._id).populate('roundIds').lean();
    const judges = await Judge.find({ hackathonId: draft._id }).lean();

    return successResponse(
      {
        ...populatedDraft,
        judges,
      },
      `Step ${step} saved`
    );
  } catch (err: any) {
    console.error('Patch draft error:', err);
    return errorResponse(`Could not save draft: ${err.message || 'Error'}`, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const draft = await Hackathon.findOneAndDelete({
      _id: id,
      organizerId: auth._id,
      status: 'DRAFT',
    });

    if (!draft) {
      return errorResponse('Draft not found', 404);
    }

    await Promise.all([
      Round.deleteMany({ hackathonId: id }),
      Judge.deleteMany({ hackathonId: id }),
    ]);

    return successResponse(null, 'Draft deleted');
  } catch (err: any) {
    console.error('Delete draft error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
