import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  hackathonId: Types.ObjectId;
  inviteCode: string;         
  members: Types.ObjectId[];  
  leaderId: Types.ObjectId;   

  paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema<ITeam> = new Schema(
  {
    name:       { type: String, required: true, trim: true },

    hackathonId:{ type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },

    inviteCode: { type: String, required: true, unique: true },
    members:    [{ type: Schema.Types.ObjectId, ref: 'User' }],

    leaderId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'PAID', 'REFUNDED'],
      default: 'NOT_REQUIRED',
    },
  },
  { timestamps: true }
);

TeamSchema.index({ hackathonId: 1 });
TeamSchema.index({ hackathonId: 1, members: 1 });

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
