import { Schema, model, models } from "mongoose";

export type VisitStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type VisitOutcome = "INTERESTED" | "NOT_INTERESTED" | "UNDECIDED";

export interface IVisit {
  listing?: Schema.Types.ObjectId;
  client: Schema.Types.ObjectId;
  agent: Schema.Types.ObjectId;

  // Free-text ref when visiting an external ("Autre") listing
  isExternalListing: boolean;
  externalListingRef?: string;

  scheduledAt: Date;
  status: VisitStatus;

  outcome?: VisitOutcome;
  notes?: string;
  completedAt?: Date;
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const visitSchema = new Schema<IVisit>(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing" },
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true },

    isExternalListing: { type: Boolean, default: false },
    externalListingRef: { type: String, trim: true },

    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"],
      default: "SCHEDULED",
    },

    outcome: { type: String, enum: ["INTERESTED", "NOT_INTERESTED", "UNDECIDED"] },
    notes: { type: String },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

visitSchema.index({ client: 1, scheduledAt: -1 });
visitSchema.index({ listing: 1, scheduledAt: -1 });
visitSchema.index({ agent: 1, scheduledAt: -1 });
visitSchema.index({ status: 1 });

const Visit = models.Visit || model<IVisit>("Visit", visitSchema);
export default Visit;
