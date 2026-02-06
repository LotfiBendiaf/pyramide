import { Role, ROLES } from "@/constants/values";
import { Document, model, models, Schema } from "mongoose";

export interface ICalendarSettings {
  googleCalendarEnabled: boolean;
  syncFollowUps: boolean;
  syncTasks: boolean;
  defaultReminderMinutes: number;
  dailyEmailEnabled: boolean;
}

export interface IUser {
  firstname: string;
  lastname: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  profileImage?: string;
  phone?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  // Calendar settings
  timezone?: string;
  calendarSettings?: ICalendarSettings;
}

export interface IUserDoc extends IUser, Document {}

const CalendarSettingsSchema = new Schema<ICalendarSettings>(
  {
    googleCalendarEnabled: { type: Boolean, default: false },
    syncFollowUps: { type: Boolean, default: true },
    syncTasks: { type: Boolean, default: true },
    defaultReminderMinutes: { type: Number, default: 30 },
    dailyEmailEnabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    username: { type: String, required: true },
    name: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    profileImage: { type: String },
    role: {
      type: String,
      enum: ROLES,
      default: "VIEWER",
    },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    // Calendar settings
    timezone: { type: String, default: "Africa/Algiers" },
    calendarSettings: { type: CalendarSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const User = models?.User || model<IUser>("User", UserSchema);
export default User;
