import { Schema, model, models } from "mongoose";

export type ArchiveRequestEntityType = "CLIENT" | "LISTING";
export type ArchiveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface IArchiveRequest {
  entityType: ArchiveRequestEntityType;
  entityId: Schema.Types.ObjectId;
  requestedBy: Schema.Types.ObjectId;
  reason: string;
  status: ArchiveRequestStatus;
  reviewedBy?: Schema.Types.ObjectId;
  reviewedAt?: Date;
  managerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const archiveRequestSchema = new Schema<IArchiveRequest>(
  {
    entityType: {
      type: String,
      enum: ["CLIENT", "LISTING"],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    managerNote: String,
  },
  { timestamps: true }
);

// Index for fast lookup of pending requests per entity
archiveRequestSchema.index({ entityId: 1, status: 1 });
archiveRequestSchema.index({ requestedBy: 1, status: 1 });

const ArchiveRequest =
  models.ArchiveRequest ||
  model<IArchiveRequest>("ArchiveRequest", archiveRequestSchema);

export default ArchiveRequest;
