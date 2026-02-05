// models/FollowUp.ts
import { Schema, model, models } from "mongoose";

export interface IFollowUp {
  _id?: string;
  listing: Schema.Types.ObjectId;
  client: Schema.Types.ObjectId;
  agent: Schema.Types.ObjectId;
  type: "COLD" | "WARM" | "HOT" | "CUSTOM";
  title?: string;
  note?: string;
  reminderAt?: Date;
  channel?: "CALL" | "WHATSAPP" | "EMAIL" | "VISIT";
  status?: "PENDING" | "DONE" | "OVERDUE";
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
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

    title: String, // ex: "Relance après visite"
    note: String,

    reminderAt: Date,

    channel: {
      type: String,
      enum: ["CALL", "WHATSAPP", "EMAIL", "VISIT"],
    },

    status: {
      type: String,
      enum: ["PENDING", "DONE", "OVERDUE"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const FollowUp = models.FollowUp || model("FollowUp", FollowUpSchema);
