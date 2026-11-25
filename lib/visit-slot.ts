import { randomUUID } from "node:crypto";
import dbConnect from "@/lib/mongoose";
import { Visit } from "@/models";
import type { VisitStatus } from "@/models/visit.model";

export const VISIT_SLOT_MS = 30 * 60 * 1000;

export class VisitSlotConflict extends Error {}

type VisitData = {
  agent: string;
  client: string;
  listing?: string;
  scheduledAt: Date;
  status: VisitStatus;
  isExternalListing: boolean;
  externalListingRef?: string;
  notes?: string;
  completedAt?: Date;
};

export async function withVisitSlotLock<T>(agent: string, write: () => Promise<T>): Promise<T> {
  // Serialize the overlap check and write for each agent, including across server instances.
  const mongo = await dbConnect();
  const locks = mongo.connection.db!.collection<{ _id: string; token: string; expiresAt: Date }>("visit_slot_locks");
  const token = randomUUID();
  const now = new Date();
  try {
    await locks.updateOne({ _id: agent, expiresAt: { $lte: now } }, {
      $set: { token, expiresAt: new Date(now.getTime() + 30_000) },
    }, { upsert: true });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      throw new VisitSlotConflict("Une visite est en cours d’enregistrement. Réessayez dans un instant.");
    }
    throw error;
  }

  try {
    return await write();
  } finally {
    await locks.deleteOne({ _id: agent, token });
  }
}

export async function assertVisitSlotFree(agent: string, scheduledAt: Date, excludeId?: string) {
  const time = scheduledAt.getTime();
  const conflicts = await Visit.exists({
    agent,
    status: "SCHEDULED",
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    scheduledAt: { $gt: new Date(time - VISIT_SLOT_MS), $lt: new Date(time + VISIT_SLOT_MS) },
  });
  if (conflicts) throw new VisitSlotConflict("Vous avez déjà une visite sur ce créneau de 30 minutes. Proposez une autre heure.");
}

export async function createVisitInSlot(data: VisitData, deduplicate = false) {
  if (data.status !== "SCHEDULED") return Visit.create(data);
  return withVisitSlotLock(data.agent, async () => {
    if (deduplicate) {
      const previous = await Visit.findOne({
        agent: data.agent, client: data.client, listing: data.listing, scheduledAt: data.scheduledAt, status: "SCHEDULED",
      });
      if (previous) return previous;
    }
    await assertVisitSlotFree(data.agent, data.scheduledAt);
    return Visit.create(data);
  });
}
