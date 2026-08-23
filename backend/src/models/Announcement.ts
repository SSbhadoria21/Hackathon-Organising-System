import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  hackathonId: Types.ObjectId;
  postedBy: Types.ObjectId;   
  title: string;
  message: string;

  targetRoundId?: Types.ObjectId; 
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema: Schema<IAnnouncement> = new Schema(
  {
    hackathonId:   { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    postedBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title:         { type: String, required: true, trim: true },
    message:       { type: String, required: true },
    targetRoundId: { type: Schema.Types.ObjectId, ref: 'Round' },
    sentAt:        { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ hackathonId: 1, sentAt: -1 });

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
