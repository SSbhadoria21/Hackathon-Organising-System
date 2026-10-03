import { NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { requireAuth } from '@/lib/withAuth';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const draft = await Hackathon.create({
      organizerId: auth._id,
      status: 'DRAFT',
      currentStep: 'BASIC_DETAILS',
      eventName: 'Untitled Hackathon',
      stepProgress: {
        basicDetails: false,
        timeline: false,
        rulesEligibility: false,
        rounds: false,
        prizesSponsors: false,
        payments: false,
        judges: false,
      },
    });

    return successResponse(
      {
        draftId: draft._id.toString(),
        currentStep: draft.currentStep,
        stepProgress: draft.stepProgress,
      },
      'Draft created',
      201
    );
  } catch (err: any) {
    console.error('Create draft error:', err);
    return errorResponse('Something went wrong', 500);
  }
}
