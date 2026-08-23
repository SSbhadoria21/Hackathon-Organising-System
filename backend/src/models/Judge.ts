import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IJudge extends Document {
  hackathonId: Types.ObjectId;
  roundIds: Types.ObjectId[];        

  name: string;
  email: string;

  userId?: Types.ObjectId;

  magicLinkToken?: string;   
  magicLinkExpiresAt?: Date;

  assignedTeamIds: Types.ObjectId[];

  conflictTeamIds: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const JudgeSchema: Schema<IJudge> = new Schema(
  {
    hackathonId:      { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    roundIds:         [{ type: Schema.Types.ObjectId, ref: 'Round' }],
    name:             { type: String, required: true, trim: true },
    email:            { type: String, required: true, lowercase: true, trim: true },
    userId:           { type: Schema.Types.ObjectId, ref: 'User' },
    magicLinkToken:   { type: String },
    magicLinkExpiresAt:{ type: Date },
    assignedTeamIds:  [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    conflictTeamIds:  [{ type: Schema.Types.ObjectId, ref: 'Team' }],
  },
  { timestamps: true }
);

JudgeSchema.index({ hackathonId: 1, email: 1 }, { unique: true });
JudgeSchema.index({ magicLinkToken: 1 }, { sparse: true });

export const Judge: Model<IJudge> =
  mongoose.models.Judge || mongoose.model<IJudge>('Judge', JudgeSchema);
