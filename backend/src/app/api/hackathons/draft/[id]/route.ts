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
        draftId: draft._id.toString(),
        rounds: draft.roundIds || [],
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
        if (data.allowedColleges !== undefined) {
          draft.allowedColleges = Array.isArray(data.allowedColleges)
            ? data.allowedColleges
            : typeof data.allowedColleges === 'string'
            ? data.allowedColleges.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
        }
        if (data.plagiarismPolicyEnabled !== undefined) draft.plagiarismPolicyEnabled = Boolean(data.plagiarismPolicyEnabled);
        if (data.cocDocumentUrl !== undefined) draft.cocDocumentUrl = data.cocDocumentUrl;
        if (data.techStackRestrictions !== undefined) {
          draft.techStackRestrictions = Array.isArray(data.techStackRestrictions)
            ? data.techStackRestrictions
            : typeof data.techStackRestrictions === 'string'
            ? data.techStackRestrictions.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
        }
        if (data.problemStatementPdfUrl !== undefined) draft.problemStatementPdfUrl = data.problemStatementPdfUrl;
        if (data.tracks !== undefined) {
          draft.tracks = Array.isArray(data.tracks)
            ? data.tracks
                .filter((t: any) => t && (t.title || t.name))
                .map((t: any) => ({
                  title: (t.title || t.name || '').trim(),
                  description: (t.description || '').trim(),
                }))
            : [];
        }

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
              const criterias = Array.isArray(r.criterias) && r.criterias.length > 0
                ? r.criterias
                    .filter((c: any) => c && c.name && c.name.trim())
                    .map((c: any) => ({
                      name: c.name.trim(),
                      weight: Number(c.weight) || 0,
                      description: (c.description || 'Evaluation criterion').trim(),
                    }))
                : [
                    { name: 'Innovation & Impact', weight: 40, description: 'Novelty of idea' },
                    { name: 'Technical Execution', weight: 40, description: 'Code quality and architecture' },
                    { name: 'UI/UX Design', weight: 20, description: 'User experience' },
                  ];

              return Round.create({
                hackathonId: draft._id,
                roundName: (r.roundName || `Round ${index + 1}`).trim(),
                roundNumber: Number(r.roundNumber) || index + 1,
                roundType: r.roundType || 'SUBMISSION',
                roundOpens: r.roundOpens ? new Date(r.roundOpens) : draft.registrationCloses || new Date(),
                roundCloses: r.roundCloses ? new Date(r.roundCloses) : draft.resultAnnouncementDate || new Date(),
                maxTeamsAdvancing: Number(r.maxTeamsAdvancing) || 10,
                aiWeightage: r.aiWeightage !== undefined ? Number(r.aiWeightage) : 0.4,
                scoreThreshold: r.scoreThreshold !== undefined ? Number(r.scoreThreshold) : 0,
                isOnline: r.isOnline !== false,
                offlineVenue: r.isOnline === false ? (r.offlineVenue || '').trim() || undefined : undefined,
                offlineAddress: r.isOnline === false ? (r.offlineAddress || '').trim() || undefined : undefined,
                offlineMapLink: r.isOnline === false ? (r.offlineMapLink || '').trim() || undefined : undefined,
                criterias,
                quizQuestions: Array.isArray(r.quizQuestions)
                  ? r.quizQuestions
                      .filter((q: any) => q && q.question && q.question.trim())
                      .map((q: any) => ({
                        question: q.question.trim(),
                        options: Array.isArray(q.options) ? q.options.map((opt: string) => String(opt).trim()) : [],
                        correctIndex: Number(q.correctIndex) || 0,
                        marks: Number(q.marks) || 1,
                        timeLimitSeconds: q.timeLimitSeconds ? Number(q.timeLimitSeconds) : undefined,
                      }))
                  : undefined,
              });
            })
          );

          draft.roundIds = createdRounds.map((r) => r._id as any);
          draft.stepProgress.rounds = createdRounds.length > 0;
        }
        break;
      }

      case 'PRIZES_SPONSORS': {
        if (data.prizes !== undefined) {
          draft.prizes = Array.isArray(data.prizes)
            ? data.prizes
                .filter((p: any) => p && p.title && p.title.trim())
                .map((p: any) => ({
                  title: p.title.trim(),
                  amount: Number(p.amount) || 0,
                  type: ['CASH', 'VOUCHER', 'TROPHY', 'OTHER'].includes(String(p.type || '').toUpperCase())
                    ? String(p.type).toUpperCase()
                    : 'CASH',
                  description: (p.description || '').trim(),
                }))
            : [];
        }
        if (data.sponsors !== undefined) {
          draft.sponsors = Array.isArray(data.sponsors)
            ? data.sponsors
                .filter((s: any) => s && (s.name || s.logoUrl || s.websiteUrl))
                .map((s: any) => ({
                  name: (s.name || 'Sponsor').trim(),
                  logoUrl: (s.logoUrl || '').trim(),
                  websiteUrl: (s.websiteUrl || '').trim(),
                }))
            : [];
        }
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
        draftId: draft._id.toString(),
        rounds: populatedDraft?.roundIds || [],
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
