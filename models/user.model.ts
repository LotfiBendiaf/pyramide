import { Role, ROLES } from "@/constants/values";
import { Document, model, models, Schema } from "mongoose";

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
}

export interface IUserDoc extends IUser, Document {}

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
  },
  { timestamps: true }
);

const User = models?.User || model<IUser>("User", UserSchema);
export default User;
