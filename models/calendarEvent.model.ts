import { model, models, Schema, Types } from "mongoose";

export const EVENT_SOURCE_TYPES = [
  "FOLLOWUP",
  "TASK",
  "VISIT",
  "MANUAL",
] as const;
export type EventSourceType = (typeof EVENT_SOURCE_TYPES)[number];

export const SYNC_STATUSES = [
  "PENDING",
  "SYNCED",
  "FAILED",
  "DELETED",
] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];

export interface ICalendarEvent {
  _id?: string;
  agent: Types.ObjectId;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  // Source tracking
  sourceType: EventSourceType;
  sourceId?: Types.ObjectId;
  // Google Calendar sync
  googleEventId?: string;
  googleCalendarId?: string;
  lastSyncedAt?: Date;
  syncStatus: SyncStatus;
  syncError?: string;
  // Event metadata
  color?: string;
  isAllDay: boolean;
  reminderMinutes?: number;
  reminderSent?: boolean;
  // Related entities
  client?: Types.ObjectId;
  listing?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    agent: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: { type: String },
    // Source tracking
    sourceType: {
      type: String,
      enum: EVENT_SOURCE_TYPES,
      default: "MANUAL",
    },
    sourceId: { type: Schema.Types.ObjectId },
    // Google Calendar sync
    googleEventId: { type: String },
    googleCalendarId: { type: String },
    lastSyncedAt: { type: Date },
    syncStatus: {
      type: String,
      enum: SYNC_STATUSES,
      default: "PENDING",
    },
    syncError: { type: String },
    // Event metadata
    color: { type: String },
    isAllDay: { type: Boolean, default: false },
    reminderMinutes: { type: Number, default: 30 },
    reminderSent: { type: Boolean, default: false },
    // Related entities
    client: { type: Schema.Types.ObjectId, ref: "Client" },
    listing: { type: Schema.Types.ObjectId, ref: "Listing" },
  },
  { timestamps: true }
);

// Indexes for efficient queries
CalendarEventSchema.index({ agent: 1, startTime: 1 });
CalendarEventSchema.index({ agent: 1, syncStatus: 1 });
CalendarEventSchema.index({ googleEventId: 1 });
CalendarEventSchema.index({ sourceType: 1, sourceId: 1 });

const CalendarEvent =
  models?.CalendarEvent ||
  model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);

export default CalendarEvent;
