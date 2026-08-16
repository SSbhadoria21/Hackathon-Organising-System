import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAIEvaluation extends Document {
  submissionId: Types.ObjectId;
  evaluatorType: 'ppt' | 'repo' | 'demo';
  criteriaScores: {
    criteriaId: Types.ObjectId;
    score: number;
    reasoning: string;
    confidence: number;
  }[];
  status: 'pending' | 'running' | 'done' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const AIEvaluationSchema: Schema = new Schema(
  {
    submissionId: { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    evaluatorType: { type: String, enum: ['ppt', 'repo', 'demo'], required: true },
    criteriaScores: [
      {
        criteriaId: { type: Schema.Types.ObjectId, required: true },
        score: { type: Number, required: true },
        reasoning: { type: String, required: true },
        confidence: { type: Number, required: true }, 
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'running', 'done', 'failed'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true }
);

export const AIEvaluation: Model<IAIEvaluation> =
  mongoose.models.AIEvaluation || mongoose.model<IAIEvaluation>('AIEvaluation', AIEvaluationSchema);
