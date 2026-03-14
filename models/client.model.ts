import { Schema, model, models } from "mongoose";

export type ClientType = "BUYER" | "SELLER" | "RENTER" | "INVESTOR";
export type QualificationStatus =
  | "NEW"
  | "QUALIFIED"
  | "NOT_RELEVANT"
  | "ARCHIVED";

export interface IClient {
  referenceCode: string; // BUY-032
  type: ClientType;

  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;

  budgetMin?: number;
  budgetMax?: number;
  city?: string;
  wantedPropertyType?: string;
  rooms?: number;
  floorMin?: number;
  floorMax?: number;
  preferredLocation?: string;
  extraNotes?: string;

  qualificationStatus: QualificationStatus;
  qualificationNotes?: string;

  createdBy: Schema.Types.ObjectId; // Agent / Assistant
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
    email: String,

    budgetMin: Number,
    budgetMax: Number,
    city: String,
    wantedPropertyType: String,
    rooms: Number,
    floorMin: Number,
    floorMax: Number,
    preferredLocation: String,
    extraNotes: String,

    qualificationStatus: {
      type: String,
      enum: ["NEW", "QUALIFIED", "NOT_RELEVANT", "ARCHIVED"],
      default: "NEW",
    },
    qualificationNotes: String,

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
