import Notification, { NotificationType, NotificationEntityType } from "@/models/notification.model";
import User from "@/models/user.model";
import { Resend } from "resend";
import { render } from "@react-email/render";
import NotificationEmail from "@/emails/NotificationEmail";
import { ELEVATED_ROLES } from "@/constants/values";

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "http://localhost:3000";

export type NotifyInput = {
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  relatedEntity?: { type: NotificationEntityType; id: string };
};

export async function notify(input: NotifyInput | NotifyInput[]): Promise<void> {
  const payloads = Array.isArray(input) ? input : [input];
  if (payloads.length === 0) return;

  try {
    await Notification.insertMany(
      payloads.map((p) => ({
        recipient: p.recipientId,
        type: p.type,
        title: p.title,
        body: p.body,
        link: p.link,
        read: false,
        ...(p.relatedEntity
          ? { relatedEntity: { type: p.relatedEntity.type, id: p.relatedEntity.id } }
          : {}),
      }))
    );
  } catch (err) {
    console.error("[notify] DB insert failed:", err);
    return;
  }

  // Email: best-effort — never block the calling action
  sendEmails(payloads).catch((err) =>
    console.error("[notify] Email send failed:", err)
  );
}

export async function notifyManagers(
  input: Omit<NotifyInput, "recipientId">
): Promise<void> {
  const managers = await User.find({
    role: { $in: ELEVATED_ROLES },
  })
    .select("_id")
    .lean<{ _id: { toString(): string } }[]>();

  if (managers.length === 0) return;

  const payloads: NotifyInput[] = managers.map((m) => ({
    recipientId: m._id.toString(),
    ...input,
  }));

  await notify(payloads);
}

async function sendEmails(payloads: NotifyInput[]): Promise<void> {
  const recipientIds = [...new Set(payloads.map((p) => p.recipientId))];

  const users = await User.find({ _id: { $in: recipientIds } })
    .select("_id email firstname lastname")
    .lean<{ _id: { toString(): string }; email: string; firstname: string; lastname: string }[]>();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const sends = payloads.map(async (p) => {
    const user = userMap.get(p.recipientId);
    if (!user?.email) return;

    const html = await render(
      NotificationEmail({
        recipientName: `${user.firstname} ${user.lastname}`,
        title: p.title,
        body: p.body,
        link: p.link,
        baseUrl: BASE_URL,
      })
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Pyramide Immobilier <contact@pyramideimmobilier.com>",
      to: user.email,
      subject: p.title,
      html,
    });
  });

  await Promise.allSettled(sends);
}
