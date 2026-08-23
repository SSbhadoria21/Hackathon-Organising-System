import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPayment extends Document {
  hackathonId: Types.ObjectId;
  teamId: Types.ObjectId;
  paidBy: Types.ObjectId;     

  amount: number;             
  currency: string;           

  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

  razorpayOrderId: string;
  razorpayPaymentId?: string; 
  razorpaySignature?: string; 

  invoiceUrl?: string;        

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    hackathonId: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    teamId:      { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    paidBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },

    amount:   { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },

    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      required: true,
    },

    razorpayOrderId:   { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    invoiceUrl: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.index({ hackathonId: 1, teamId: 1 });
PaymentSchema.index({ razorpayOrderId: 1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
