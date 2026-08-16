import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IUser extends Document {
  username: string; 
  fullName: string;
  email: string;
  password?: string; 
  avatar?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bio: string;
  about?: string;
  teamId?: Types.ObjectId;
  refreshToken?: string;
  isSuperAdmin: boolean; 
  magic_link_token?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String }, 
    gender: {type: String, enum:['MALE','FEMALE','OTHER'], required: true},
    bio: {type: String, required: true},
    about: {type: String},
    teamId: {type: Schema.Types.ObjectId,ref: 'Team',},
    refreshToken: {type: String},
    isSuperAdmin: { type: Boolean, default: false },
    magic_link_token: { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
