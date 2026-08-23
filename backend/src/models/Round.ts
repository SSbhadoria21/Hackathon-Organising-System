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
  roundType: 'SUBMISSION' | 'QUIZ' | 'PROTOTYPE' | 'PITCH';

  teamIds: Types.ObjectId[];

  roundOpens: Date;
  roundCloses: Date;

  maxTeamsAdvancing: number;

  aiWeightage: number;      
  scoreThreshold?: number;  

  criterias: ICriterion[];

  quizQuestions?: {
    question: string;
    options: string[];
    correctIndex: number;
    marks: number;
    timeLimitSeconds?: number;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const RoundSchema: Schema<IRound> = new Schema(
  {
    hackathonId:  { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    roundName:    { type: String, required: true },
    roundNumber:  { type: Number, required: true, min: 1 },
    roundType:    { type: String, enum: ['SUBMISSION', 'QUIZ', 'PROTOTYPE', 'PITCH'], required: true },
    teamIds:      [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    roundOpens:   { type: Date, required: true },
    roundCloses:  { type: Date, required: true },
    maxTeamsAdvancing: { type: Number, required: true, min: 1 },
    aiWeightage:  { type: Number, required: true, min: 0, max: 1 },
    scoreThreshold: { type: Number, min: 0, max: 100 },
    criterias: [
      {
        name:        { type: String, required: true },
        weight:      { type: Number, required: true, min: 0, max: 100 },
        description: { type: String, required: true },
      },
    ],
    quizQuestions: [
      {
        question:        { type: String, required: true },
        options:         [{ type: String }],
        correctIndex:    { type: Number, required: true },
        marks:           { type: Number, required: true },
        timeLimitSeconds:{ type: Number },
      },
    ],
  },
  { timestamps: true }
);

RoundSchema.index({ hackathonId: 1, roundNumber: 1 });

export const Round: Model<IRound> =
  mongoose.models.Round || mongoose.model<IRound>('Round', RoundSchema);
