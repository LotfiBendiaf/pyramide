import { Schema, model, models } from "mongoose";

export type NegotiationStatus =
  | "ACTIVE"
  | "CLOSING"
  | "DEAL_DONE"
  | "CANCELLED";
export type BlockRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IBlockingRequest {
  _id: Schema.Types.ObjectId;
  requestedBy: Schema.Types.ObjectId;
  requestedAt: Date;
  durationDays: number;
  reason?: string;
  status: BlockRequestStatus;
  reviewedBy?: Schema.Types.ObjectId;
  reviewedAt?: Date;
  managerNote?: string;
  blockedUntil?: Date;
}

export interface INegotiationDocument {
  _id?: Schema.Types.ObjectId;
  publicId: string;
  url: string;
  secureUrl?: string;
  originalFilename?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  uploadedBy: Schema.Types.ObjectId;
  uploadedAt: Date;
}

export interface INegotiation {
  _id?: Schema.Types.ObjectId;
  listing:
    | Schema.Types.ObjectId
    | { _id: Schema.Types.ObjectId; referenceCode?: string; title?: string };
  client: Schema.Types.ObjectId;
  agent: Schema.Types.ObjectId;
  visit?: Schema.Types.ObjectId;
  status: NegotiationStatus;

  blockingRequests: IBlockingRequest[];
  documents?: INegotiationDocument[];

  closingDetails?: {
    depositAmount?: number;
    depositAt?: Date;
    finalPrice?: number;
    notes?: string;
  };

  cancelReason?: string;
  cancelledAt?: Date;
  closedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const blockingRequestSchema = new Schema<IBlockingRequest>(
  {
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedAt: { type: Date, required: true },
    durationDays: { type: Number, required: true, min: 1, max: 90 },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    managerNote: { type: String, trim: true },
    blockedUntil: Date,
  },
  { _id: true }
);

const negotiationDocumentSchema = new Schema<INegotiationDocument>(
  {
    publicId: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    secureUrl: { type: String, trim: true },
    originalFilename: { type: String, trim: true },
    format: { type: String, trim: true },
    resourceType: { type: String, trim: true },
    bytes: Number,
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: true }
);

const negotiationSchema = new Schema<INegotiation>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true },
    visit: { type: Schema.Types.ObjectId, ref: "Visit" },

    status: {
      type: String,
      enum: ["ACTIVE", "CLOSING", "DEAL_DONE", "CANCELLED"],
      default: "ACTIVE",
    },

    blockingRequests: [blockingRequestSchema],
    documents: { type: [negotiationDocumentSchema], default: [] },

    closingDetails: {
      depositAmount: Number,
      depositAt: Date,
      finalPrice: Number,
      notes: { type: String, trim: true },
    },

    cancelReason: { type: String, trim: true },
    cancelledAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

negotiationSchema.index({ listing: 1, status: 1 });
negotiationSchema.index({ client: 1, status: 1 });
negotiationSchema.index({ agent: 1, status: 1 });
negotiationSchema.index({ "blockingRequests.status": 1 });

const Negotiation =
  models.Negotiation || model<INegotiation>("Negotiation", negotiationSchema);

export default Negotiation;
