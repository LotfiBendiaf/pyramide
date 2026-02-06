// models/task.model.ts
import { Schema, model, models } from "mongoose";

export interface ITask {
  _id?: string;
  title: string;
  description?: string;
  agent: Schema.Types.ObjectId;
  client?: Schema.Types.ObjectId;
  listing?: Schema.Types.ObjectId;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  // Calendar sync fields
  calendarEventId?: Schema.Types.ObjectId;
  scheduledTime?: Date; // Specific time for the task
  estimatedDuration?: number; // Duration in minutes
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
    },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    dueDate: Date,
    completedAt: Date,
    // Calendar sync fields
    calendarEventId: {
      type: Schema.Types.ObjectId,
      ref: "CalendarEvent",
    },
    scheduledTime: Date,
    estimatedDuration: { type: Number, default: 30 }, // Default 30 minutes
  },
  { timestamps: true }
);

// Index for efficient queries
TaskSchema.index({ agent: 1, status: 1, dueDate: 1 });
TaskSchema.index({ agent: 1, createdAt: -1 });

export const Task = models.Task || model("Task", TaskSchema);
