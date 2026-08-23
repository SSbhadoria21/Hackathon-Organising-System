import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IEmailVerification extends Document {
  userId: Types.ObjectId;
  email: string;         
  token: string;         
  type: 'EMAIL_VERIFY' | 'PASSWORD_RESET';
  expiresAt: Date;      
  createdAt: Date;
}

const EmailVerificationSchema: Schema<IEmailVerification> = new Schema(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email:     { type: String, required: true, lowercase: true },
    token:     { type: String, required: true },
    type:      { type: String, enum: ['EMAIL_VERIFY', 'PASSWORD_RESET'], required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
EmailVerificationSchema.index({ userId: 1, type: 1 });

export const EmailVerification: Model<IEmailVerification> =
  mongoose.models.EmailVerification ||
  mongoose.model<IEmailVerification>('EmailVerification', EmailVerificationSchema);
