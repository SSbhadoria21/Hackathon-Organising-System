import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICriterion {
  _id: Types.ObjectId; 
  name: string;
  weight: number; 
  description: string;
}

export interface IRound extends Document {
  hackathonId: Types.ObjectId; 
  roundName: string;
  roundNumber: number;
  teams: Types.ObjectId[];
  roundType: 'SUBMISSION' | 'QUIZ' | 'PROTOTYPE' | 'PITCH';
  roundOpens: Date;
  roundCloses: Date;
  roundLimit: number;
  aiWeightage: number;
  scoreThreshold?: number;
  criterias: ICriterion[];
  createdAt: Date;
  updatedAt: Date;
}

const RoundSchema: Schema = new Schema(
  {
    hackathonId: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    roundName: { type: String, required: true },
    roundNumber: { type: Number, required: true },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    roundType: { type: String, enum: ['SUBMISSION', 'QUIZ', 'PROTOTYPE', 'PITCH'], required: true },
    roundOpens: { type: Date, required: true },
    roundCloses: { type: Date, required: true },
    roundLimit: { type: Number, required: true },
    aiWeightage: { type: Number, required: true },
    scoreThreshold: { type: Number }, 
    criterias: [
      {
        name: { type: String, required: true },
        weight: { type: Number, required: true },
        description: {type:String,required:true},
      },
    ],
  },
  { timestamps: true }
);

export const Round: Model<IRound> = mongoose.models.Round || mongoose.model<IRound>('Round', RoundSchema);
