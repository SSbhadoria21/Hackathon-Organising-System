import { NextRequest } from 'next/server';
import { GET as getParticipations } from '@/app/api/activities/participations/route';
import { GET as getCreatedHackathons } from '@/app/api/activities/created-hackathons/route';
import { GET as getAccessedHackathons } from '@/app/api/activities/accessed-hackathons/route';
import { errorResponse } from '@/utils/ApiResponse';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params;

  if (type === 'participations') {
    return getParticipations(req);
  }
  if (type === 'created-hackathons' || type === 'created') {
    return getCreatedHackathons(req);
  }
  if (type === 'accessed-hackathons' || type === 'accessed') {
    return getAccessedHackathons(req);
  }

  return errorResponse('Invalid activity type', 400);
}
