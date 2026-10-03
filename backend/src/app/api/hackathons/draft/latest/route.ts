import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const draft = await Hackathon.findOne({
      organizerId: auth._id,
      status: 'DRAFT',
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (!draft) {
      return successResponse(null, 'No active draft found');
    }

    const sp = draft.stepProgress || {
      basicDetails: false,
      timeline: false,
      rulesEligibility: false,
      rounds: false,
      prizesSponsors: false,
      payments: false,
      judges: false,
    };

    const completedSteps = Object.values(sp).filter(Boolean).length;
    const progressPercent = Math.round((completedSteps / 7) * 100);

    return successResponse(
      {
        draftId: draft._id.toString(),
        eventName: draft.eventName || 'Untitled Hackathon',
        theme: draft.theme || '',
        banner: draft.banner || '',
        currentStep: draft.currentStep || 'BASIC_DETAILS',
        stepProgress: sp,
        progressPercent,
        updatedAt: draft.updatedAt,
      },
      'Latest draft fetched'
    );
  } catch (err: any) {
    console.error('Get latest draft error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
