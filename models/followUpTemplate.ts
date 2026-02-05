import { model, models, Schema } from "mongoose";

interface IFollowUpTemplate {
  _id?: string;
  title: string;
  content: string;

  type: "COLD" | "WARM" | "HOT";

  createdBy: Schema.Types.ObjectId; // manager

  isGlobal: boolean; // true = visible to all agents
}

// models/FollowUpTemplate.ts
const FollowUpTemplateSchema = new Schema<IFollowUpTemplate>(
  {
    title: String,
    content: String,

    type: {
      type: String,
      enum: ["COLD", "WARM", "HOT"],
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User", // manager
    },

    isGlobal: {
      type: Boolean,
      default: false, // true = visible to all agents
    },
  },
  { timestamps: true }
);
export const FollowUpTemplate =
  models.FollowUpTemplate || model("FollowUpTemplate", FollowUpTemplateSchema);
