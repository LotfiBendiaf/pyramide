"use server";

import dbConnect from "@/lib/mongoose";
import Message, { IMessage } from "@/models/message.model";
import { ContactFormValues } from "@/lib/validators/contact";
import handleError from "@/lib/handlers/error";

/**
 * Submit a contact form message
 */
export async function submitContactMessage(
  data: ContactFormValues
): Promise<ActionResponse<{ messageId: string }>> {
  try {
    await dbConnect();

    const message = await Message.create({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      message: data.message,
      status: "NEW",
    });

    return {
      success: true,
      data: { messageId: message._id.toString() },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Get all messages (admin only)
 */
export async function getMessages(filters?: {
  status?: string;
  limit?: number;
}): Promise<
  ActionResponse<
    Array<{
      _id: string;
      name: string;
      email: string;
      phone?: string;
      message: string;
      status: string;
      adminNotes?: string;
      repliedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    }>
  >
> {
  try {
    await dbConnect();

    const query: Record<string, unknown> = {};
    if (filters?.status) {
      query.status = filters.status;
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 50)
      .lean();

    return {
      success: true,
      data: messages.map((msg) => ({
        _id: msg._id?.toString() || "",
        name: msg.name,
        email: msg.email,
        phone: msg.phone,
        message: msg.message,
        status: msg.status,
        adminNotes: msg.adminNotes,
        repliedAt: msg.repliedAt,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      })),
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  messageId: string,
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED",
  adminNotes?: string
): Promise<
  ActionResponse<{
    _id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    status: string;
    adminNotes?: string;
    repliedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  try {
    await dbConnect();

    const updateData: Partial<IMessage> = { status };
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    if (status === "REPLIED") {
      updateData.repliedAt = new Date();
    }

    const message = (await Message.findByIdAndUpdate(messageId, updateData, {
      new: true,
    }).lean()) as IMessage | null;

    if (!message) {
      return {
        success: false,
        error: { message: "Message non trouvé" },
      };
    }

    return {
      success: true,
      data: {
        _id: message._id || "",
        name: message.name,
        email: message.email || "",
        phone: message.phone || "",
        message: message.message,
        status: message.status,
        adminNotes: message.adminNotes,
        repliedAt: message.repliedAt,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Delete a message
 */
export async function deleteMessage(
  messageId: string
): Promise<ActionResponse<void>> {
  try {
    await dbConnect();

    const result = await Message.findByIdAndDelete(messageId);

    if (!result) {
      return {
        success: false,
        error: { message: "Message non trouvé" },
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
