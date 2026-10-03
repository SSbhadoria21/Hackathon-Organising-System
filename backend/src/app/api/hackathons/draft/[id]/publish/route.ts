import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import dbConnect from '@/lib/mongodb';
import { Hackathon } from '@/models/Hackathon';
import { Round } from '@/models/Round';
import { requireAuth } from '@/lib/withAuth';
import { fullPublishHackathonSchema } from '@/schemas/hackathon.schema';
import { successResponse, errorResponse } from '@/utils/ApiResponse';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
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

    const draft = await Hackathon.findOne({
      _id: id,
      organizerId: auth._id,
      status: 'DRAFT',
    });

    if (!draft) {
      return errorResponse('Draft not found', 404);
    }

    const parsed = fullPublishHackathonSchema.safeParse(draft.toObject());
    if (!parsed.success) {
      return errorResponse(
        'Please fill all required fields before publishing',
        400,
        parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
      );
    }

    const roundCount = await Round.countDocuments({ hackathonId: draft._id });
    if (roundCount === 0) {
      return errorResponse('At least 1 round is required to publish', 400);
    }

    const baseSlug = slugify(draft.eventName || 'hackathon');
    let uniqueSlug = `${baseSlug}-${nanoid(5).toLowerCase()}`;
    const existingSlug = await Hackathon.findOne({ slug: uniqueSlug });
    if (existingSlug) {
      uniqueSlug = `${baseSlug}-${nanoid(7).toLowerCase()}`;
    }

    draft.status = 'PUBLISHED';
    draft.slug = uniqueSlug;
    await draft.save();

    const publishedHackathon = await Hackathon.findById(draft._id)
      .populate('roundIds')
      .lean();

    return successResponse(
      publishedHackathon,
      'Hackathon published successfully',
      200
    );
  } catch (err: any) {
    console.error('Publish hackathon error:', err);
    return errorResponse('Could not publish hackathon', 500);
  }
}
