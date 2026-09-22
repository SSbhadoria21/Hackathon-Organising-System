import { type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken'; 
export interface AuthPayload {
  _id: string;
  role: 'USER' | 'SUPER_ADMIN';
}

export type TAuth = AuthPayload;

export interface JudgeAuthPayload {
  judgeId: string;
  hackathonId: string;
}

export type TJudgeAuth = JudgeAuthPayload;

export function getAuthUser(req: NextRequest): AuthPayload | null {
  const authHeader = req.headers.get('authorization');
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

export function getAuthJudge(req: NextRequest): JudgeAuthPayload | null {
  const authHeader = req.headers.get('authorization');
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

export function requireAuth(req: NextRequest): AuthPayload | Response {
  const auth = getAuthUser(req);
  if (!auth) {
    return Response.json(
      { success: false, message: 'Please login to continue' },
      { status: 401 }
    );
  }
  return auth;
}

export function requireSuperAdmin(req: NextRequest): AuthPayload | Response {
  const auth = getAuthUser(req);
  if (!auth) {
    return Response.json(
      { success: false, message: 'Please login to continue' },
      { status: 401 }
    );
  }
  if (auth.role !== 'SUPER_ADMIN') {
    return Response.json(
      { success: false, message: 'Admin access required' },
      { status: 403 }
    );
  }
  return auth;
}
