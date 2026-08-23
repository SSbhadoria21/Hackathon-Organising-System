import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ChecklistStep =
  | { type: 'navigate'; url: string; description: string }
  | { type: 'login'; email: string; password: string }
  | { type: 'click'; targetHint: string }
  | { type: 'type'; targetHint: string; value: string }
  | { type: 'verify'; description: string }
  | { type: 'screenshot'; label: string };

export interface ISubmission extends Document {
  hackathonId: Types.ObjectId;
  roundId: Types.ObjectId;
  teamId: Types.ObjectId;

  deckFileUrl?: string;   

  repoUrl?: string;
  liveUrl?: string;
  demoCredentials?: string;       
  verificationChecklist?: ChecklistStep[];

  pitchVideoUrl?: string;         

  description?: string;           

  status: 'SUBMITTED' | 'EVALUATING' | 'STAGED' | 'ADVANCED' | 'REJECTED';

  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema: Schema<ISubmission> = new Schema(
  {
    hackathonId: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    roundId:     { type: Schema.Types.ObjectId, ref: 'Round', required: true },
    teamId:      { type: Schema.Types.ObjectId, ref: 'Team', required: true },

    deckFileUrl:          { type: String },
    repoUrl:              { type: String },
    liveUrl:              { type: String },
    demoCredentials:      { type: String },

    verificationChecklist:{ type: Schema.Types.Mixed },
    pitchVideoUrl:        { type: String },
    description:          { type: String },

    status: {
      type: String,
      enum: ['SUBMITTED', 'EVALUATING', 'STAGED', 'ADVANCED', 'REJECTED'],
      default: 'SUBMITTED',
      required: true,
    },
  },
  { timestamps: true }
);

SubmissionSchema.index({ roundId: 1, teamId: 1 }, { unique: true });
SubmissionSchema.index({ hackathonId: 1, status: 1 });

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
