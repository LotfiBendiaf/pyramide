import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { Client, User } from "@/models";
import Notification from "@/models/notification.model";
import { IClient } from "@/models/client.model";
import { ELEVATED_ROLES } from "@/constants/values";
import ROUTES from "@/constants/routes";
import { Resend } from "resend";
import { render } from "@react-email/render";
import NotificationEmail from "@/emails/NotificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "http://localhost:3000";

const INACTIVITY_THRESHOLD_DAYS = 2;
const RESEND_COOLDOWN_HOURS = 24;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const now = new Date();
    const inactivityCutoff = new Date(now);
    inactivityCutoff.setDate(inactivityCutoff.getDate() - INACTIVITY_THRESHOLD_DAYS);

    const cooldownCutoff = new Date(now);
    cooldownCutoff.setHours(cooldownCutoff.getHours() - RESEND_COOLDOWN_HOURS);

    // Find HOT clients in active pipeline stages who haven't been contacted recently
    const hotClients = await Client.find({
      clientTemperature: "HOT",
      pipelineStage: { $in: ["ACTIVE_SEARCH", "FOLLOW_UP", "IN_NEGOTIATION"] },
      archived: { $ne: true },
      $or: [
        { lastContactedAt: { $lt: inactivityCutoff } },
        { lastContactedAt: { $exists: false }, createdAt: { $lt: inactivityCutoff } },
      ],
    })
      .select("_id firstName lastName referenceCode assignedAgent createdBy lastContactedAt createdAt")
      .lean<
        (Pick<
          IClient,
          | "firstName"
          | "lastName"
          | "referenceCode"
          | "assignedAgent"
          | "createdBy"
          | "lastContactedAt"
          | "createdAt"
        > & { _id: { toString(): string } })[]
      >();

    if (hotClients.length === 0) {
      return NextResponse.json({ success: true, alerted: 0, skipped: 0 });
    }

    const clientIds = hotClients.map((c) => c._id);

    // Batch check: skip clients already alerted in the last 24h
    const recentAlerts = await Notification.find({
      type: "HOT_CLIENT_INACTIVE",
      "relatedEntity.id": { $in: clientIds },
      createdAt: { $gte: cooldownCutoff },
    })
      .select("relatedEntity.id")
      .lean<{ relatedEntity: { id: { toString(): string } } }[]>();

    const alreadyAlertedIds = new Set(
      recentAlerts.map((n) => n.relatedEntity.id.toString())
    );

    const toAlert = hotClients.filter(
      (c) => !alreadyAlertedIds.has(c._id!.toString())
    );

    if (toAlert.length === 0) {
      return NextResponse.json({
        success: true,
        alerted: 0,
        skipped: hotClients.length,
      });
    }

    // Fetch all managers for the digest notification
    const managers = await User.find({ role: { $in: ELEVATED_ROLES } })
      .select("_id email firstname lastname")
      .lean<{ _id: { toString(): string }; email: string; firstname: string; lastname: string }[]>();

    // Build per-agent groups
    const agentClientMap = new Map<
      string,
      { client: (typeof toAlert)[number]; agentId: string }[]
    >();

    for (const client of toAlert) {
      const agentId = (client.assignedAgent ?? client.createdBy)?.toString();
      if (!agentId) continue;
      const group = agentClientMap.get(agentId) ?? [];
      group.push({ client, agentId });
      agentClientMap.set(agentId, group);
    }

    // Collect all unique agent IDs
    const agentIds = [...agentClientMap.keys()];
    const agents = await User.find({ _id: { $in: agentIds } })
      .select("_id email firstname lastname")
      .lean<{ _id: { toString(): string }; email: string; firstname: string; lastname: string }[]>();

    const agentMap = new Map(agents.map((a) => [a._id.toString(), a]));

    // Build DB notification docs (bulk insert)
    const notificationDocs: {
      recipient: string;
      type: "HOT_CLIENT_INACTIVE";
      title: string;
      body: string;
      link: string;
      read: boolean;
      relatedEntity: { type: string; id: unknown };
    }[] = [];

    for (const [agentId, group] of agentClientMap) {
      for (const { client } of group) {
        const clientName =
          [client.firstName, client.lastName].filter(Boolean).join(" ") ||
          client.referenceCode;
        const daysSince = Math.floor(
          (now.getTime() -
            (client.lastContactedAt ?? client.createdAt!).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        notificationDocs.push({
          recipient: agentId,
          type: "HOT_CLIENT_INACTIVE",
          title: "Client HOT sans contact",
          body: `${clientName} n'a pas été contacté depuis ${daysSince} jour(s). Un suivi urgent est recommandé.`,
          link: ROUTES.CLIENT_DETAIL(client._id!.toString()),
          read: false,
          relatedEntity: { type: "CLIENT", id: client._id },
        });
      }
    }

    // Manager digest notification (one per manager, summarising count)
    for (const manager of managers) {
      notificationDocs.push({
        recipient: manager._id.toString(),
        type: "HOT_CLIENT_INACTIVE",
        title: "Clients HOT inactifs",
        body: `${toAlert.length} client(s) HOT n'ont pas été contactés depuis plus de ${INACTIVITY_THRESHOLD_DAYS} jours.`,
        link: ROUTES.CLIENTS_DASHBOARD,
        read: false,
        relatedEntity: { type: "CLIENT", id: toAlert[0]._id },
      });
    }

    await Notification.insertMany(notificationDocs);

    // Send emails: agents get per-client emails, managers get a digest
    const emailSends: Promise<void>[] = [];

    for (const [agentId, group] of agentClientMap) {
      const agent = agentMap.get(agentId);
      if (!agent?.email) continue;

      for (const { client } of group) {
        const clientName =
          [client.firstName, client.lastName].filter(Boolean).join(" ") ||
          client.referenceCode;
        const daysSince = Math.floor(
          (now.getTime() -
            (client.lastContactedAt ?? client.createdAt!).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        emailSends.push(
          render(
            NotificationEmail({
              recipientName: `${agent.firstname} ${agent.lastname}`,
              title: "Client HOT sans contact",
              body: `${clientName} n'a pas été contacté depuis ${daysSince} jour(s). Un suivi urgent est recommandé.`,
              link: ROUTES.CLIENT_DETAIL(client._id!.toString()),
              baseUrl: BASE_URL,
            })
          ).then((html) =>
            resend.emails
              .send({
                from:
                  process.env.RESEND_FROM ??
                  "Pyramide Immobilier <contact@pyramideimmobilier.com>",
                to: agent.email,
                subject: "⚠️ Client HOT sans contact",
                html,
              })
              .then(() => undefined)
          )
        );
      }
    }

    for (const manager of managers) {
      if (!manager.email) continue;

      emailSends.push(
        render(
          NotificationEmail({
            recipientName: `${manager.firstname} ${manager.lastname}`,
            title: "Clients HOT inactifs",
            body: `${toAlert.length} client(s) HOT n'ont pas été contactés depuis plus de ${INACTIVITY_THRESHOLD_DAYS} jours. Veuillez vérifier le tableau de bord.`,
            link: ROUTES.CLIENTS_DASHBOARD,
            baseUrl: BASE_URL,
          })
        ).then((html) =>
          resend.emails
            .send({
              from:
                process.env.RESEND_FROM ??
                "Pyramide Immobilier <contact@pyramideimmobilier.com>",
              to: manager.email,
              subject: "⚠️ Clients HOT inactifs",
              html,
            })
            .then(() => undefined)
        )
      );
    }

    const results = await Promise.allSettled(emailSends);
    const emailsFailed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      alerted: toAlert.length,
      skipped: alreadyAlertedIds.size,
      emailsSent: emailSends.length - emailsFailed,
      emailsFailed,
    });
  } catch (error) {
    console.error("[hot-client-alerts] Cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
