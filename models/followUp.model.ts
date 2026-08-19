// models/FollowUp.ts
import { Schema, model, models } from "mongoose";

export interface IFollowUp {
  _id?: string;
  listing?: Schema.Types.ObjectId;
  client: Schema.Types.ObjectId;
  agent: Schema.Types.ObjectId;
  type: "COLD" | "WARM" | "HOT" | "CUSTOM";
  context: "CLIENT" | "LISTING";
  title?: string;
  note?: string;
  reminderAt?: Date;
  channel?: "CALL" | "WHATSAPP" | "EMAIL" | "VISIT";
  status?: "PENDING" | "DONE" | "OVERDUE" | "CANCELLED";
  completedAt?: Date;
  cancelledAt?: Date;
  // Calendar sync fields
  calendarEventId?: Schema.Types.ObjectId;
  duration?: number; // Duration in minutes
  startTime?: Date; // Specific start time (if different from reminderAt)
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
    },

    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },

    agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["COLD", "WARM", "HOT", "CUSTOM"],
      required: true,
    },

    // Distinguishes client relationship follow-ups from listing lifecycle tasks
    context: {
      type: String,
      enum: ["CLIENT", "LISTING"],
      default: "CLIENT",
    },

    title: String, // ex: "Relance après visite"
    note: String,

    reminderAt: Date,

    channel: {
      type: String,
      enum: ["CALL", "WHATSAPP", "EMAIL", "VISIT"],
    },

    status: {
      type: String,
      enum: ["PENDING", "DONE", "OVERDUE", "CANCELLED"],
      default: "PENDING",
    },
    completedAt: Date,
    cancelledAt: Date,
    // Calendar sync fields
    calendarEventId: {
      type: Schema.Types.ObjectId,
      ref: "CalendarEvent",
    },
    duration: { type: Number, default: 60 }, // Default 60 minutes
    startTime: Date,
  },
  { timestamps: true }
);

FollowUpSchema.index({ context: 1, createdAt: -1 });

export const FollowUp = models.FollowUp || model("FollowUp", FollowUpSchema);
