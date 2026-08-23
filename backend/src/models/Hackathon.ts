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
  shortDescription?: string;
  expectedTeamsCount: number;
  registrationOpens: Date;
  registrationCloses: Date;
  hackingStartsAt?: Date;
  hackingEndsAt?: Date;
  resultAnnouncementDate: Date;
  timeZone: string;        

  teamMinSize: number;
  teamMaxSize: number;
  eligibility: 'UNIVERSITY_STUDENTS' | 'ACROSS_UNIVERSITIES' | 'WORKING_PROFESSIONALS' | 'OPEN_TO_ALL';
  allowedColleges: string[];

  plagiarismPolicyEnabled: boolean;
  cocDocumentUrl: string;          
  techStackRestrictions: string[];
  problemStatementPdfUrl?: string; 

  tracks: { title: string; description?: string }[];

  roundIds: Types.ObjectId[];

  prizes: {
    title: string;
    amount: number;
    type: 'CASH' | 'VOUCHER' | 'TROPHY' | 'OTHER';
    description?: string;
  }[];

  sponsors: {
    name: string;
    logoUrl?: string; 
    websiteUrl?: string;
  }[];

  paid: boolean;
  feeCollectedInRound: number; 
  feeAmount?: number;
  refundPolicy?: string;

  aiWeight: number;      
  judgeWeight: number;   
  minThreshold: number;  

  leaderboardPublic: boolean; 

  organizerId: Types.ObjectId;

  status: 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

  createdAt: Date;
  updatedAt: Date;
}

const HackathonSchema: Schema<IHackathon> = new Schema(
  {
    eventName:         { type: String, required: true },
    theme:             { type: String, required: true },
    mode:              { type: String, enum: ['ONLINE', 'OFFLINE', 'HYBRID'], default: 'ONLINE' },
    banner:            { type: String, required: true },
    logo:              { type: String },
    address: {
      type: String,
      required: function (this: IHackathon) {
        return this.mode === 'OFFLINE' || this.mode === 'HYBRID';
      },
    },
    mapLink: {
      type: String,
      required: function (this: IHackathon) {
        return this.mode === 'OFFLINE' || this.mode === 'HYBRID';
      },
    },
    organizingBody:          { type: String, required: true },
    description:             { type: String, required: true },
    shortDescription:        { type: String },
    expectedTeamsCount:      { type: Number, required: true },
    registrationOpens:       { type: Date, required: true },
    registrationCloses:      { type: Date, required: true },
    hackingStartsAt:         { type: Date },
    hackingEndsAt:           { type: Date },
    resultAnnouncementDate:  { type: Date, required: true },
    timeZone:                { type: String, required: true, default: 'Asia/Kolkata' },

    teamMinSize:   { type: Number, required: true, min: 1 },
    teamMaxSize:   { type: Number, required: true, min: 1 },
    eligibility: {
      type: String,
      enum: ['UNIVERSITY_STUDENTS', 'ACROSS_UNIVERSITIES', 'WORKING_PROFESSIONALS', 'OPEN_TO_ALL'],
      required: true,
    },
    allowedColleges:         { type: [String], default: [] },

    plagiarismPolicyEnabled: { type: Boolean, default: false },
    cocDocumentUrl:          { type: String, required: true },
    techStackRestrictions:   { type: [String], default: [] },
    problemStatementPdfUrl:  { type: String },

    tracks: [
      {
        title:       { type: String, required: true },
        description: { type: String },
      },
    ],

    roundIds: [{ type: Schema.Types.ObjectId, ref: 'Round' }],

    prizes: [
      {
        title:       { type: String, required: true },
        amount:      { type: Number, required: true },
        type:        { type: String, enum: ['CASH', 'VOUCHER', 'TROPHY', 'OTHER'], required: true },
        description: { type: String },
      },
    ],

    sponsors: [
      {
        name:       { type: String, required: true },
        logoUrl:    { type: String },
        websiteUrl: { type: String },
      },
    ],

    paid:                 { type: Boolean, default: false },
    feeCollectedInRound:  { type: Number, default: 1 },
    feeAmount:            { type: Number },
    refundPolicy:         { type: String },

    aiWeight:    { type: Number, default: 0.4, min: 0, max: 1 },
    judgeWeight: { type: Number, default: 0.6, min: 0, max: 1 },

    minThreshold: { type: Number, default: 0, min: 0, max: 100 },

    leaderboardPublic: { type: Boolean, default: false },

    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
    },
  },
  { timestamps: true }
);

HackathonSchema.index({ status: 1, registrationCloses: 1 });
HackathonSchema.index({ organizerId: 1 });

export const Hackathon: Model<IHackathon> =
  mongoose.models.Hackathon || mongoose.model<IHackathon>('Hackathon', HackathonSchema);
