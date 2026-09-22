import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IResult extends Document {
  hackathonId: Types.ObjectId;
  roundId: Types.ObjectId;
  teamId: Types.ObjectId;
  submissionId: Types.ObjectId;

  aiScoreTotal: number;     
  humanScoreTotal: number;  

  finalScore: number;

  aiWeightUsed: number;
  judgeWeightUsed: number;

  rank?: number;   
  advanced: boolean;

  flaggedForReview: boolean;

  reviewOutcome?: 'OVERRIDE_ADVANCE' | 'OVERRIDE_REJECT' | 'CONFIRMED';

  published: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema: Schema<IResult> = new Schema(
  {
    hackathonId:{ type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    roundId:{ type: Schema.Types.ObjectId, ref: 'Round', required: true },
    teamId:{ type: Schema.Types.ObjectId, ref: 'Team', required: true },
    submissionId:{ type: Schema.Types.ObjectId, ref: 'Submission', required: true },

    aiScoreTotal:{ type: Number, required: true, min: 0, max: 100 },
    humanScoreTotal: { type: Number, required: true, min: 0, max: 100 },
    finalScore:{ type: Number, required: true, min: 0, max: 100 },

    aiWeightUsed:{ type: Number, required: true },
    judgeWeightUsed:{ type: Number, required: true },

    rank:{ type: Number },
    advanced:{ type: Boolean, required: true, default: false },

    flaggedForReview: { type: Boolean, default: false },
    reviewOutcome: {
      type: String,
      enum: ['OVERRIDE_ADVANCE', 'OVERRIDE_REJECT', 'CONFIRMED'],
    },

    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ResultSchema.index({ roundId: 1, finalScore: -1 });
ResultSchema.index({ hackathonId: 1, published: 1 });
ResultSchema.index({ roundId: 1, teamId: 1 }, { unique: true });

export const Result: Model<IResult> =
  mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
