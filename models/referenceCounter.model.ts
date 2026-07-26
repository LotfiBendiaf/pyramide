import { Schema, model, models } from "mongoose";

export interface IReferenceCounter {
  _id: string;
  prefix: "V" | "L";
  sequence: number;
}

const referenceCounterSchema = new Schema<IReferenceCounter>(
  {
    _id: { type: String, required: true },
    prefix: { type: String, enum: ["V", "L"], required: true },
    sequence: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const ReferenceCounter =
  models.ReferenceCounter ||
  model<IReferenceCounter>("ReferenceCounter", referenceCounterSchema);

export default ReferenceCounter;
