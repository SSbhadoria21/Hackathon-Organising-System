import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAIEvaluation extends Document {
  submissionId: Types.ObjectId;
  evaluatorType: 'PPT' | 'REPO' | 'DEMO';

  criteriaScores: {
    criteriaId: Types.ObjectId;
    score: number;        
    reasoning: string;    
    confidence: number;  
  }[];

  scratchpad?: Record<string, any>;

  flags?: {
    singleCommitDump: boolean;      
    lastMinuteCommitBurst: boolean; 
    suspectedBackdating: boolean; 
  };

  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  failReason?: string; 

  createdAt: Date;
  updatedAt: Date;
}

const AIEvaluationSchema: Schema<IAIEvaluation> = new Schema(
  {
    submissionId:  { type: Schema.Types.ObjectId, ref: 'Submission', required: true },
    evaluatorType: { type: String, enum: ['PPT', 'REPO', 'DEMO'], required: true },

    criteriaScores: [
      {
        criteriaId:  { type: Schema.Types.ObjectId, required: true },
        score:       { type: Number, required: true, min: 0, max: 100 },
        reasoning:   { type: String, required: true },
        confidence:  { type: Number, required: true, min: 0, max: 1 },
      },
    ],

    scratchpad: { type: Schema.Types.Mixed },

    flags: {
      singleCommitDump:        { type: Boolean, default: false },
      lastMinuteCommitBurst:   { type: Boolean, default: false },
      suspectedBackdating:     { type: Boolean, default: false },
    },

    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'DONE', 'FAILED'],
      default: 'PENDING',
      required: true,
    },

    failReason: { type: String },
  },
  { timestamps: true }
);

AIEvaluationSchema.index({ submissionId: 1, evaluatorType: 1 }, { unique: true });

export const AIEvaluation: Model<IAIEvaluation> =
  mongoose.models.AIEvaluation || mongoose.model<IAIEvaluation>('AIEvaluation', AIEvaluationSchema);
