import { Schema, model, models } from "mongoose";

export type MessageStatus = "NEW" | "READ" | "REPLIED" | "ARCHIVED";

export interface IMessage {
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  status: MessageStatus;
  adminNotes?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["NEW", "READ", "REPLIED", "ARCHIVED"],
      default: "NEW",
    },
    adminNotes: String,
    repliedAt: Date,
  },
  { timestamps: true }
);

const Message = models.Message || model<IMessage>("Message", messageSchema);

export default Message;
