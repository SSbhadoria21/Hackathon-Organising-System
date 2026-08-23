import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  fullName: string;
  email: string;

  password: string | null;
  googleId?: string;      
  avatar?: string;        
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bio: string;
  about?: string;
  role: 'USER' | 'SUPER_ADMIN';
  isEmailVerified: boolean; 
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    username:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName:    { type: String, required: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },

    password:    { type: String, default: null },
    googleId:    { type: String, sparse: true, unique: true },
    avatar:      { type: String },
    gender:      { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
    bio:         { type: String, required: true },
    about:       { type: String },
    role:           { type: String, enum: ['USER', 'SUPER_ADMIN'], default: 'USER' },
    isEmailVerified:{ type: Boolean, default: false },
    refreshToken:   { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
