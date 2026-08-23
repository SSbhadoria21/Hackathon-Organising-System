import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// Access token - 15 min k liye 
export const generateAccessToken = (
  userId: Types.ObjectId | string,
  role: 'USER' | 'SUPER_ADMIN' = 'USER'
) => {
  return jwt.sign(
    { _id: userId.toString(), role },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '15m') as any }
  );
};

// Refresh token 7 din k liye 
export const generateRefreshToken = (userId: Types.ObjectId | string) => {
  return jwt.sign(
    { _id: userId.toString() },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '7d') as any }
  );
};


export const generateJudgeToken = (judgeId: string, hackathonId: string) => {
  return jwt.sign(
    { judgeId, hackathonId },
    process.env.JUDGE_TOKEN_SECRET!,
    { expiresIn: '7d' }
  );
};
