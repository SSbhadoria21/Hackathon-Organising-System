import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationType =
  | 'TEAM_INVITE'        
  | 'JUDGE_INVITE'
  | 'ROUND_OPEN'         
  | 'ROUND_RESULT'       
  | 'RESULT_PUBLISHED'   
  | 'ANNOUNCEMENT'       
  | 'JUDGE_ASSIGNED'     
  | 'PAYMENT_CONFIRMED'; 

export interface INotification extends Document {
  userId: Types.ObjectId;      
  type: NotificationType;
  title: string;
  message: string;

  metadata?: Record<string, string>;
  read: boolean;

  actionStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'TEAM_INVITE',
        'JUDGE_INVITE',
        'ROUND_OPEN',
        'ROUND_RESULT',
        'RESULT_PUBLISHED',
        'ANNOUNCEMENT',
        'JUDGE_ASSIGNED',
        'PAYMENT_CONFIRMED',
      ],
      required: true,
    },
    title:{ type: String, required: true },
    message:{ type: String, required: true },
    metadata:{ type: Map, of: String },
    read:{ type: Boolean, default: false },
    actionStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: null,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
