// models/dailyReport.model.ts
import { Schema, model, models } from "mongoose";

export interface IDailyReport {
  _id?: string;
  agent: Schema.Types.ObjectId;
  date: Date;
  newClientsCount: number;
  propertiesVisitedCount: number;
  followUpsCompletedCount: number;
  tasksCompletedCount: number;
  visitsScheduledCount: number;
  visitsCompletedCount: number;
  negotiationsOpenedCount: number;
  dealsClosedCount: number;
  notes?: string;

  // Reference arrays for detailed tracking
  newClients: Schema.Types.ObjectId[];
  propertiesVisited: Schema.Types.ObjectId[]; // Legacy: FollowUp IDs with VISIT channel
  followUpsCompleted: Schema.Types.ObjectId[];
  tasksCompleted: Schema.Types.ObjectId[];
  visits: Schema.Types.ObjectId[];        // Visit model IDs
  negotiations: Schema.Types.ObjectId[];  // Negotiation model IDs

  createdAt?: Date;
  updatedAt?: Date;
}

const DailyReportSchema = new Schema<IDailyReport>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    newClientsCount: {
      type: Number,
      default: 0,
    },
    propertiesVisitedCount: {
      type: Number,
      default: 0,
    },
    followUpsCompletedCount: {
      type: Number,
      default: 0,
    },
    tasksCompletedCount: {
      type: Number,
      default: 0,
    },
    visitsScheduledCount: {
      type: Number,
      default: 0,
    },
    visitsCompletedCount: {
      type: Number,
      default: 0,
    },
    negotiationsOpenedCount: {
      type: Number,
      default: 0,
    },
    dealsClosedCount: {
      type: Number,
      default: 0,
    },
    notes: String,

    // Reference arrays
    newClients: [{ type: Schema.Types.ObjectId, ref: "Client" }],
    propertiesVisited: [{ type: Schema.Types.ObjectId, ref: "FollowUp" }],
    followUpsCompleted: [{ type: Schema.Types.ObjectId, ref: "FollowUp" }],
    tasksCompleted: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    visits: [{ type: Schema.Types.ObjectId, ref: "Visit" }],
    negotiations: [{ type: Schema.Types.ObjectId, ref: "Negotiation" }],
  },
  { timestamps: true }
);

// Unique constraint: one report per agent per day
DailyReportSchema.index({ agent: 1, date: 1 }, { unique: true });
DailyReportSchema.index({ date: -1 });

export const DailyReport =
  models.DailyReport || model("DailyReport", DailyReportSchema);
