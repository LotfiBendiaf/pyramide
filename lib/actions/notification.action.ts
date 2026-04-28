"use server";

import Notification from "@/models/notification.model";
import { INotification } from "@/models/notification.model";
import { getUserBySessionEmail } from "../getUserBySessionEmail";
import handleError from "../handlers/error";
import { Types } from "mongoose";
import dbConnect from "../mongoose";

/* ─────────────────────── Fetch My Notifications ─────────────────────── */

export async function fetchMyNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<ActionResponse<{ notifications: INotification[]; total: number; unreadCount: number }>> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  try {
    await dbConnect();

    const filter: Record<string, unknown> = { recipient: user.data._id };
    if (unreadOnly) filter.read = false;

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<INotification[]>(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: user.data._id, read: false }),
    ]);

    return {
      success: true,
      data: {
        notifications: JSON.parse(JSON.stringify(notifications)),
        total,
        unreadCount,
      },
      status: 200,
    };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Unread Count ─────────────────────── */

export async function fetchUnreadCount(): Promise<ActionResponse<{ count: number }>> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  try {
    await dbConnect();

    const count = await Notification.countDocuments({
      recipient: user.data._id,
      read: false,
    });

    return { success: true, data: { count }, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Mark Single Read ─────────────────────── */

export async function markNotificationRead(
  notificationId: string
): Promise<ActionResponse> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  if (!Types.ObjectId.isValid(notificationId)) {
    return { success: false, error: { message: "ID invalide" }, status: 400 };
  }

  try {
    await dbConnect();

    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: user.data._id },
      { read: true }
    );

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/* ─────────────────────── Mark All Read ─────────────────────── */

export async function markAllNotificationsRead(): Promise<ActionResponse> {
  const user = await getUserBySessionEmail();
  if (!user?.data) {
    return { success: false, error: { message: "Non autorisé" }, status: 401 };
  }

  try {
    await dbConnect();

    await Notification.updateMany(
      { recipient: user.data._id, read: false },
      { read: true }
    );

    return { success: true, status: 200 };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
