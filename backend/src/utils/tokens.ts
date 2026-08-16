import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export const generateAccessToken = (userId: Types.ObjectId | string) => {
  return jwt.sign(
    { _id: userId.toString() },
    process.env.ACCESS_TOKEN_SECRET || 'fallback_access_secret',
    { expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '1d') as any }
  );
};

export const generateRefreshToken = (userId: Types.ObjectId | string) => {
  return jwt.sign(
    { _id: userId.toString() },
    process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret',
    { expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '10d') as any }
  );
};
