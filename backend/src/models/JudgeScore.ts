import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IJudgeScore extends Document {
  submissionId: Types.ObjectId;
  judgeId: Types.ObjectId;      
  hackathonId: Types.ObjectId;  
  roundId: Types.ObjectId;      

  criteriaScores: {
    criteriaId: Types.ObjectId;
    score: number;     
    comment?: string;
  }[];

  overallComment?: string;

  scoredAfterSeingAI: boolean;

  submittedAt: Date;
  updatedAt: Date;
}

const JudgeScoreSchema: Schema<IJudgeScore> = new Schema(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    judgeId:      { type: Schema.Types.ObjectId, ref: 'Judge', required: true },
    hackathonId:  { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    roundId:      { type: Schema.Types.ObjectId, ref: 'Round', required: true },

    criteriaScores: [
      {
        criteriaId: { type: Schema.Types.ObjectId, required: true },
        score:      { type: Number, required: true, min: 0, max: 100 },
        comment:    { type: String },
      },
    ],

    overallComment:       { type: String },
    scoredAfterSeingAI:   { type: Boolean, default: false },
    submittedAt:          { type: Date, default: Date.now },
  },
  { timestamps: true }
);

JudgeScoreSchema.index({ submissionId: 1, judgeId: 1 }, { unique: true });
JudgeScoreSchema.index({ hackathonId: 1, roundId: 1 });

export const JudgeScore: Model<IJudgeScore> =
  mongoose.models.JudgeScore || mongoose.model<IJudgeScore>('JudgeScore', JudgeScoreSchema);
