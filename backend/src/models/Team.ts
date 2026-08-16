import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  eventId: Types.ObjectId;
  inviteCode: string;
  members: Types.ObjectId[]; // Array of User IDs
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    inviteCode: { type: String, required: true, unique: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
