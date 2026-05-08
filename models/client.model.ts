import { Schema, model, models } from "mongoose";

export type ClientType = "BUYER" | "SELLER" | "RENTER" | "INVESTOR";
export type QualificationStatus =
  | "NEW"
  | "QUALIFIED"
  | "HOT"
  | "COLD"
  | "NOT_RELEVANT"
  | "ARCHIVED";

export type ClientTemperature = "HOT" | "WARM" | "COLD";

export type PipelineStage =
  | "LEAD"
  | "PHASE_1_REVIEW"
  | "PHASE_2_REVIEW"
  | "ACTIVE_SEARCH"
  | "FOLLOW_UP"
  | "IN_NEGOTIATION"
  | "CLOSED"
  | "ARCHIVED";

export interface IClient {
  referenceCode: string;
  type: ClientType;

  firstName?: string;
  lastName?: string;
  phone: string;
  phone2?: string;
  email?: string;

  budgetMin?: number;
  budgetMax?: number;
  priceCurrency?: "DZD" | "EUR" | "USD";
  wantedArea?: number;
  city?: string;
  wantedPropertyType?: string;
  rooms?: number;
  floorMin?: number;
  floorMax?: number;
  preferredLocation?: string;
  extraNotes?: string;

  qualificationStatus: QualificationStatus;
  qualificationNotes?: string;

  // Pipeline fields
  pipelineStage: PipelineStage;
  clientTemperature?: ClientTemperature;

  // Phase 1 — manager qualification
  phase1ApprovedBy?: Schema.Types.ObjectId;
  phase1ApprovedAt?: Date;
  phase1Notes?: string;

  // Phase 2 — agent qualification (agent assigned at Phase 1 approval)
  phase2Agent?: Schema.Types.ObjectId;
  phase2ApprovedBy?: Schema.Types.ObjectId;
  phase2ApprovedAt?: Date;
  phase2Notes?: string;

  // Inactivity tracking for HOT client alerts
  lastContactedAt?: Date;

  createdBy: Schema.Types.ObjectId;
  assignedAgent?: Schema.Types.ObjectId;

  archived: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    referenceCode: { type: String, unique: true },
    type: {
      type: String,
      enum: ["BUYER", "SELLER", "RENTER", "INVESTOR"],
      required: true,
    },

    firstName: { type: String },
    lastName: { type: String },
    phone: { type: String, required: true },
    phone2: String,
    email: String,

    budgetMin: Number,
    budgetMax: Number,
    priceCurrency: { type: String, enum: ["DZD", "EUR", "USD"], default: "DZD" },
    wantedArea: Number,
    city: String,
    wantedPropertyType: String,
    rooms: Number,
    floorMin: Number,
    floorMax: Number,
    preferredLocation: String,
    extraNotes: String,

    qualificationStatus: {
      type: String,
      enum: ["NEW", "QUALIFIED", "HOT", "COLD", "NOT_RELEVANT", "ARCHIVED"],
      default: "NEW",
    },
    qualificationNotes: String,

    // Pipeline
    pipelineStage: {
      type: String,
      enum: [
        "LEAD",
        "PHASE_1_REVIEW",
        "PHASE_2_REVIEW",
        "ACTIVE_SEARCH",
        "FOLLOW_UP",
        "IN_NEGOTIATION",
        "CLOSED",
        "ARCHIVED",
      ],
      default: "LEAD",
    },
    clientTemperature: {
      type: String,
      enum: ["HOT", "WARM", "COLD"],
    },

    // Phase 1
    phase1ApprovedBy: { type: Schema.Types.ObjectId, ref: "User" },
    phase1ApprovedAt: Date,
    phase1Notes: String,

    // Phase 2
    phase2Agent: { type: Schema.Types.ObjectId, ref: "User" },
    phase2ApprovedBy: { type: Schema.Types.ObjectId, ref: "User" },
    phase2ApprovedAt: Date,
    phase2Notes: String,

    lastContactedAt: Date,

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAgent: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Client = models.Client || model<IClient>("Client", clientSchema);

export default Client;
