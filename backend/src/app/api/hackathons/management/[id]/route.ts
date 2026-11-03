import { NextRequest } from 'next/server';
import {
  GET as getManagement,
  PATCH as patchManagement,
  DELETE as deleteManagement,
} from '@/app/api/hackathons/[id]/management/route';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getManagement(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return patchManagement(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return deleteManagement(req, context);
}
