import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IHackathon extends Document {
  eventName: string;
  theme: string;
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  banner: string;
  logo?: string;
  address?: string;
  mapLink?: string;
  organizingBody: string;
  description: string;
  shortdescription?: string;
  expectedTeamsCount: number;
  registerationOpens: Date;
  registerationCloses: Date;
  resultAnnouncementDate: Date;
  timeZone: string;
  teamMinSize: number;
  teamMaxSize: number;
  eligibility: 'UNIVERSITY_STUDENTS' | 'ACROSS_UNIVERSITIES' | 'WORKING_PROFESSIONALS' | 'OPEN_TO_ALL';
  allowedColleges: string[];
  plaglearismpolicytoggle: boolean;
  cocDocument: string;
  techStackRestriction: string[];
  problemStatementPdf?: string;
  themes: { title: string; description?: string }[];
  roundIds: Types.ObjectId[];
  prizes: {
    title: string;
    amount: number;
    type: string;
    description?: string;
  }[];
  sponsor: {
    name?: string;
    logo?: string;
  }[];
  paid: boolean;
  feeinRound: number;
  feeamount?: number;
  refundPoilcy?: string;
  judges: {
    userId: Types.ObjectId;
    whichRound: string; 
  }[];
  organizerId: Types.ObjectId;
  aiWeight: number;
  judgeWeight: number;
  minThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const HackathonSchema: Schema = new Schema(
  {
    eventName: { type: String, required: true },
    theme: { type: String, required: true },
    mode: { type: String, enum: ['ONLINE', 'OFFLINE', 'HYBRID'], default: 'ONLINE' },
    banner: { type: String, required: true },
    logo: { type: String },
    address: { 
      type: String, 
      required: function(this: any) { return this.mode === 'OFFLINE' || this.mode === 'HYBRID'; } 
    },
    mapLink: { 
      type: String, 
      required: function(this: any) { return this.mode === 'OFFLINE' || this.mode === 'HYBRID'; } 
    },
    organizingBody: { type: String, required: true },
    description: { type: String, required: true },
    shortdescription: { type: String },
    expectedTeamsCount: { type: Number, required: true },
    registerationOpens: { type: Date, required: true },
    registerationCloses: { type: Date, required: true },
    resultAnnouncementDate: { type: Date, required: true },
    timeZone: { type: String, required: true }, //'Asia/Kolkata' ese krlete hai
    teamMinSize: { type: Number, required: true },
    teamMaxSize: { type: Number, required: true },
    eligibility: {
      type: String,
      enum: ['UNIVERSITY_STUDENTS', 'ACROSS_UNIVERSITIES', 'WORKING_PROFESSIONALS', 'OPEN_TO_ALL'],
      required: true,
    },
    allowedColleges: { type: [String], default: [] },
    plaglearismpolicytoggle: { type: Boolean, required: true },
    cocDocument: { type: String, required: true }, //  Cloudinary URL
    techStackRestriction: { type: [String], default: [] },
    problemStatementPdf: { type: String }, //  Cloudinary URL ho toh thoda sahi lgta hai
    themes: [
      {
        title: { type: String },
        description: { type: String },
      },
    ],
    roundIds: [{ type: Schema.Types.ObjectId, ref: 'Round', required: true }],
    prizes: [
      {
        title: { type: String, required: true },
        amount: { type: Number, required: true },
        type: { type: String, required: true },
        description: { type: String },
      },
    ],
    sponsor: [
      {
        name: { type: String },
        logo: { type: String }, // Cloudinary URL
      },
    ],
    paid: { type: Boolean, default: false },
    feeinRound: { type: Number, default: 0 },
    feeamount: { type: Number },
    refundPoilcy: { type: String },
    judges: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        whichRound: { type: String, required: true }, 
      },
    ],
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    aiWeight: { type: Number, default: 0.4 },
    judgeWeight: { type: Number, default: 0.6 },
  },
  { timestamps: true }
);

export const Hackathon: Model<IHackathon> =
  mongoose.models.Hackathon || mongoose.model<IHackathon>('Hackathon', HackathonSchema);
