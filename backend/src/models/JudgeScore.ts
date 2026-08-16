import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IJudgeScore extends Document {
  submissionId: Types.ObjectId;
  judgeId: Types.ObjectId;
  criteriaScores: {
    criteriaId: Types.ObjectId;
    score: number;
    comment?: string;
  }[];
  overallComment?: string;
  submittedAt: Date;
  updatedAt: Date;
}

const JudgeScoreSchema: Schema = new Schema(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    judgeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    criteriaScores: [
      {
        criteriaId: { type: Schema.Types.ObjectId, required: true }, 
        score: { type: Number, required: true },
        comment: { type: String },
      },
    ],
    overallComment: { type: String },
    submittedAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true } 
);

export const JudgeScore: Model<IJudgeScore> =
  mongoose.models.JudgeScore || mongoose.model<IJudgeScore>('JudgeScore', JudgeScoreSchema);
