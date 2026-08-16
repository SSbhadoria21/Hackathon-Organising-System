import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISubmission extends Document {
  hackathonId: Types.ObjectId;
  roundId: Types.ObjectId;
  teamId: Types.ObjectId;
  submittedAt: Date;
  repoUrl?: string;
  liveUrl?: string;
  demoCredentials?: string;
  deckFileUrl?: string;
  description?: string;
  verificationChecklist?: any[]; 
  status: 'submitted' | 'evaluating' | 'staged' | 'advanced' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema: Schema = new Schema(
  {
    hackathonId: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    roundId: { type: Schema.Types.ObjectId, ref: 'Round', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    submittedAt: { type: Date, default: Date.now, required: true },
    repoUrl: { type: String },
    liveUrl: { type: String },
    demoCredentials: { type: String },
    deckFileUrl: { type: String },
    description: { type: String },
    verificationChecklist: { type: Schema.Types.Mixed }, 
    status: {
      type: String,
      enum: ['submitted', 'evaluating', 'staged', 'advanced', 'rejected'],
      default: 'submitted',
      required: true,
    },
  },
  { timestamps: true }
);

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
