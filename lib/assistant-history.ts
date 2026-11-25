import { createHash } from "node:crypto";
import type { PipelineContext } from "@/lib/assistant-pipeline";
import type { VisitProposal } from "@/lib/assistant-proposals";
import type { CreationDraft } from "@/lib/assistant-creation";
import type { VisitMessageDraft } from "@/lib/assistant-visit-message";
import type { VisitContext } from "@/lib/assistant-visit-confirmation";
import dbConnect from "@/lib/mongoose";

export type AssistantMessage = {
  question: string;
  answer: string;
  interpretation?: string;
  verifiedReport?: boolean;
  clientContextId?: string;
  visitContext?: VisitContext;
  visitMessage?: VisitMessageDraft;
  creationContext?: CreationDraft | null;
  pipelineContext?: PipelineContext | null;
  proposals?: VisitProposal[];
  groups?: { label: string; count: number; records: { label: string; detail?: string; href?: string }[] }[];
  records?: { label: string; detail?: string; href?: string; clientId?: string }[];
};

type Conversation = {
  id: string;
  title: string;
  updatedAt: Date;
  messages: AssistantMessage[];
};

type History = {
  _id: string;
  owner: string;
  threads?: Conversation[];
  id?: string;
  title?: string;
  updatedAt?: Date;
  messages?: AssistantMessage[];
};

async function conversations() {
  const mongoose = await dbConnect();
  return mongoose.connection.db!.collection<History>("assistant_conversations");
}

const latestKey = (owner: string) => owner + ":latest";

async function readStored(owner: string) {
  const collection = await conversations();
  const current = await collection.findOne({ _id: latestKey(owner), owner });
  if (current?.threads) return current.threads.slice(0, 5);
  const legacy = await collection.find({ owner }).sort({ updatedAt: -1 }).limit(5).toArray();
  const seen = new Set<string>();
  return legacy.flatMap((item) => {
    if (!item.id || !item.messages || seen.has(item.id)) return [];
    seen.add(item.id);
    return [{ id: item.id, title: item.title || item.messages[0]?.question.slice(0, 100) || "", updatedAt: item.updatedAt || new Date(0), messages: item.messages }];
  }).slice(0, 5);
}

export async function continuousConversationId(owner: string) {
  const mongoose = await dbConnect();
  const sessions = mongoose.connection.db!.collection<{ _id: string; conversationId: string }>("assistant_sessions");
  const existing = await sessions.findOne({ _id: owner });
  if (existing) return existing.conversationId;
  const threads = await readStored(owner);
  const hash = createHash("sha256").update("assistant-conversation:" + owner).digest("hex");
  const generated = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
  const id = threads[0]?.id ?? generated;
  try {
    await sessions.updateOne({ _id: owner }, { $setOnInsert: { conversationId: id } }, { upsert: true });
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
  }
  return (await sessions.findOne({ _id: owner }))!.conversationId;
}

export async function readConversations(owner: string) {
  const id = await continuousConversationId(owner);
  const stored = await readStored(owner);
  const threads = stored.filter(thread => thread.id === id);
  if (!threads.length) threads.push({ id, title: "Votre conversation", updatedAt: new Date(), messages: [] });
  return threads.map((thread) => ({
    ...thread,
    messages: thread.messages.map(({ question, answer, interpretation, verifiedReport, visitMessage, records, proposals, groups }) =>
      ({ question, answer, interpretation, verifiedReport, visitMessage, records, proposals, groups })),
  }));
}

export async function recentConversation(owner: string, id: string) {
  id = await continuousConversationId(owner);
  const threads = await readStored(owner);
  const messages = threads.find((thread) => thread.id === id)?.messages ?? [];
  const recent = messages.slice(-4);
  const newestFirst = [...messages].reverse();
  const clientId = newestFirst.find((message) => message.clientContextId)?.clientContextId;
  const visit = newestFirst.find((message) => message.visitContext)?.visitContext;
  const pipeline = newestFirst.find((message) => message.pipelineContext !== undefined)?.pipelineContext ?? undefined;
  return {
    pipeline: pipeline?.clientId && clientId && pipeline.clientId !== clientId ? undefined : pipeline,
    creation: newestFirst.find((message) => message.creationContext !== undefined)?.creationContext ?? undefined,
    questions: recent.map((message) => message.question),
    clientId,
    visit: visit?.clientId && clientId && visit.clientId !== clientId ? undefined : visit,
  };
}

export async function saveAssistantMessage(owner: string, id: string, message: AssistantMessage) {
  id = await continuousConversationId(owner);
  const collection = await conversations();
  const legacy = await readStored(owner);
  const mongoose = await dbConnect();
  await mongoose.connection.db!.collection("assistant_message_archive").insertOne({ owner, conversationId: id, createdAt: new Date(), message });
  const update = [
    { $set: { owner: { $literal: owner }, threads: { $ifNull: ["$threads", { $literal: legacy }] } } },
    { $set: {
      threads: { $let: {
        vars: { existing: { $arrayElemAt: [{ $filter: { input: "$threads", as: "thread", cond: { $eq: ["$$thread.id", { $literal: id }] } } }, 0] } },
        in: { $slice: [{ $concatArrays: [
          [{
            id: { $literal: id },
            title: { $ifNull: ["$$existing.title", { $literal: message.question.slice(0, 100) }] },
            updatedAt: "$$NOW",
            messages: { $slice: [{ $concatArrays: [
              { $ifNull: ["$$existing.messages", []] }, { $literal: [message] },
            ] }, -100] },
          }],
          { $filter: { input: "$threads", as: "thread", cond: { $ne: ["$$thread.id", { $literal: id }] } } },
        ] }, 5] },
      } },
      updatedAt: "$$NOW",
    } },
    { $unset: ["id", "title", "messages"] },
  ];
  try {
    await collection.updateOne({ _id: latestKey(owner), owner }, update, { upsert: true });
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
    const retry = await collection.updateOne({ _id: latestKey(owner), owner }, update);
    if (!retry.matchedCount) throw error;
  }
}
