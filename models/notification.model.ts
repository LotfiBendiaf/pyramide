import { Schema, model, models } from "mongoose";

export type NotificationType =
  | "CLIENT_PHASE1_SUBMITTED"
  | "CLIENT_PHASE1_APPROVED"
  | "CLIENT_PHASE1_REJECTED"
  | "CLIENT_PHASE2_APPROVED"
  | "CLIENT_PHASE2_REJECTED"
  | "VISIT_SCHEDULED"
  | "VISIT_CANCELLED"
  | "NEGOTIATION_OPENED"
  | "BLOCK_REQUESTED"
  | "BLOCK_APPROVED"
  | "BLOCK_REJECTED"
  | "DEPOSIT_CONFIRMED"
  | "DEAL_DONE"
  | "NEGOTIATION_CANCELLED"
  | "ARCHIVE_REQUESTED"
  | "ARCHIVE_APPROVED"
  | "ARCHIVE_REJECTED"
  | "HOT_CLIENT_INACTIVE";

export type NotificationEntityType =
  | "CLIENT"
  | "LISTING"
  | "VISIT"
  | "NEGOTIATION"
  | "ARCHIVE_REQUEST";

export interface INotification {
  _id?: Schema.Types.ObjectId;
  recipient: Schema.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  relatedEntity?: {
    type: NotificationEntityType;
    id: Schema.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "CLIENT_PHASE1_SUBMITTED",
        "CLIENT_PHASE1_APPROVED",
        "CLIENT_PHASE1_REJECTED",
        "CLIENT_PHASE2_APPROVED",
        "CLIENT_PHASE2_REJECTED",
        "VISIT_SCHEDULED",
        "VISIT_CANCELLED",
        "NEGOTIATION_OPENED",
        "BLOCK_REQUESTED",
        "BLOCK_APPROVED",
        "BLOCK_REJECTED",
        "DEPOSIT_CONFIRMED",
        "DEAL_DONE",
        "NEGOTIATION_CANCELLED",
        "ARCHIVE_REQUESTED",
        "ARCHIVE_APPROVED",
        "ARCHIVE_REJECTED",
        "HOT_CLIENT_INACTIVE",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    relatedEntity: {
      type: { type: String },
      id: { type: Schema.Types.ObjectId },
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification =
  models.Notification ||
  model<INotification>("Notification", notificationSchema);

export default Notification;
