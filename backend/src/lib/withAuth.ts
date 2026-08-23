import { type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken'; 
export interface AuthPayload {
  _id: string;
  role: 'USER' | 'SUPER_ADMIN';
}

export interface JudgeAuthPayload {
  judgeId: string;
  hackathonId: string;
}


export function getAuthUser(request: NextRequest): AuthPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as AuthPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getAuthJudge(request: NextRequest): JudgeAuthPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JUDGE_TOKEN_SECRET!
    ) as JudgeAuthPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(request: NextRequest): AuthPayload | Response {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json(
      { success: false, message: 'Unauthorized — please login' },
      { status: 401 }
    );
  }
  return auth;
}
 
export function requireSuperAdmin(request: NextRequest): AuthPayload | Response {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json(
      { success: false, message: 'Unauthorized — please login' },
      { status: 401 }
    );
  }
  if (auth.role !== 'SUPER_ADMIN') {
    return Response.json(
      { success: false, message: 'Forbidden — super admin access required' },
      { status: 403 }
    );
  }
  return auth;
}
