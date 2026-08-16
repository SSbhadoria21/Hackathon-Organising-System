import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IResult extends Document {
  hackathonId: Types.ObjectId;
  roundId: Types.ObjectId;
  teamId: Types.ObjectId;
  submissionId: Types.ObjectId;
  aiScoreTotal: number;
  humanScoreTotal: number;
  finalScore: number;
  rank?: number;
  advanced: boolean;
  flaggedForReview?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema: Schema = new Schema(
  {
    hackathonId: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    roundId: { type: Schema.Types.ObjectId, ref: 'Round', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    
    
    aiScoreTotal: { type: Number, required: true },
    humanScoreTotal: { type: Number, required: true },
    finalScore: { type: Number, required: true },
    
    
    rank: { type: Number }, 
    advanced: { type: Boolean, required: true, default: false },
    flaggedForReview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Result: Model<IResult> = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
