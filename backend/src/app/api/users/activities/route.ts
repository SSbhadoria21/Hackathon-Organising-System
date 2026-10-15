import { NextRequest } from 'next/server';
import { GET as getOverview } from '@/app/api/activities/route';

export async function GET(req: NextRequest) {
  return getOverview(req);
}
