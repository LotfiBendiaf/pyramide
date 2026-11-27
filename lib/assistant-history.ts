import { compactConversationTitle } from "@/lib/assistant-conversation-title";
import { createHash, randomUUID } from "node:crypto";
import type { PipelineContext } from "@/lib/assistant-pipeline";
import type { VisitProposal } from "@/lib/assistant-proposals";
import type { CreationDraft } from "@/lib/assistant-creation";
import type { VisitMessageDraft } from "@/lib/assistant-visit-message";
import type { VisitContext } from "@/lib/assistant-visit-confirmation";
import dbConnect from "@/lib/mongoose";

export type AssistantMessage = {
  question: string;
  title?: string;
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
  pinned?: boolean;
  customTitle?: boolean;
  deletedAt?: Date;
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

async function readStored(owner: string, includeDeleted = false) {
  const collection = await conversations();
  const current = await collection.findOne({ _id: latestKey(owner), owner });
  const legacy = await collection.find({ owner }).sort({ updatedAt: -1 }).toArray();
  const seen = new Set<string>();
  const stored: Conversation[] = [...(current?.threads ?? []), ...legacy.flatMap(item => item.id && item.messages ? [{ id: item.id, title: item.title || item.messages[0]?.question.slice(0, 100) || "", updatedAt: item.updatedAt || new Date(0), messages: item.messages }] : [])];
  return stored.filter(thread => !seen.has(thread.id) && Boolean(seen.add(thread.id)))
    .filter(thread => includeDeleted || !thread.deletedAt)
    .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// Merge legacy documents without replacing threads created by a concurrent request.
async function initialize(owner: string) {
  const collection = await conversations();
  const legacy = await readStored(owner, true);
  const update = [{ $set: { owner: { $literal: owner }, threads: { $concatArrays: [
    { $ifNull: ["$threads", []] },
    { $filter: { input: { $literal: legacy }, as: "legacy", cond: { $not: [{ $in: ["$$legacy.id", { $map: { input: { $ifNull: ["$threads", []] }, as: "thread", in: "$$thread.id" } }] }] } } },
  ] } } }];
  try { await collection.updateOne({ _id: latestKey(owner), owner }, update, { upsert: true }); }
  catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
    await collection.updateOne({ _id: latestKey(owner), owner }, update);
  }
  return collection;
}

async function activate(owner: string, id: string, onlyIfMissing = false) {
  const mongoose = await dbConnect();
  const sessions = mongoose.connection.db!.collection<{ _id: string; conversationId: string }>("assistant_sessions");
  try {
    await sessions.updateOne({ _id: owner }, onlyIfMissing ? { $setOnInsert: { conversationId: id } } : { $set: { conversationId: id } }, { upsert: true });
  } catch (error) {
    if (!(typeof error === "object" && error && "code" in error && error.code === 11000)) throw error;
    if (!onlyIfMissing) await sessions.updateOne({ _id: owner }, { $set: { conversationId: id } });
  }
  return (await sessions.findOne({ _id: owner }))!.conversationId;
}

export async function selectConversation(owner: string, id: string) {
  if (!(await readStored(owner)).some(thread => thread.id === id)) return null;
  return activate(owner, id);
}

export async function renameConversation(owner: string, id: string, title: string) {
  if (typeof title !== "string" || !title.trim() || title.trim().length > 60) return false;
  const collection = await initialize(owner);
  const result = await collection.updateOne({ _id: latestKey(owner), owner, threads: { $elemMatch: { id, deletedAt: { $exists: false } } } },
    { $set: { "threads.$.title": title.trim(), "threads.$.customTitle": true } });
  return result.matchedCount === 1;
}

export async function pinConversation(owner: string, id: string, pinned: boolean) {
  if (typeof pinned !== "boolean") return false;
  const collection = await initialize(owner);
  const result = await collection.updateOne({ _id: latestKey(owner), owner, threads: { $elemMatch: { id, deletedAt: { $exists: false } } } },
    { $set: { "threads.$.pinned": pinned } });
  return result.matchedCount === 1;
}

export async function deleteConversation(owner: string, id: string) {
  const collection = await initialize(owner);
  const result = await collection.updateOne({ _id: latestKey(owner), owner, threads: { $elemMatch: { id, deletedAt: { $exists: false } } } },
    { $set: { "threads.$.deletedAt": new Date() } });
  if (!result.matchedCount) return false;
  return continuousConversationId(owner);
}

export async function createConversation(owner: string) {
  const collection = await initialize(owner);
  const id = randomUUID();
  await collection.updateOne({ _id: latestKey(owner), owner }, { $push: { threads: { id, title: "Nouvelle conversation", updatedAt: new Date(), messages: [] } } });
  await activate(owner, id);
  return id;
}

export async function continuousConversationId(owner: string) {
  const mongoose = await dbConnect();
  const existing = await mongoose.connection.db!.collection<{ _id: string; conversationId: string }>("assistant_sessions").findOne({ _id: owner });
  const threads = await readStored(owner);
  if (existing && threads.some(thread => thread.id === existing.conversationId)) return existing.conversationId;
  const collection = await initialize(owner);
  const hash = createHash("sha256").update("assistant-conversation:" + owner).digest("hex");
  const generated = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
  // Never reuse a soft-deleted ID, even when every conversation was deleted.
  const allThreads = await readStored(owner, true);
  const id = threads[0]?.id ?? (allThreads.some(thread => thread.id === generated && thread.deletedAt) ? randomUUID() : generated);
  if (!threads.length) await collection.updateOne({ _id: latestKey(owner), owner, "threads.id": { $ne: id } }, { $push: { threads: { id, title: "Nouvelle conversation", updatedAt: new Date(), messages: [] } } });
  return activate(owner, id, !existing);
}

export async function readConversations(owner: string) {
  await continuousConversationId(owner);
  return (await readStored(owner)).map(thread => ({
    ...thread,
    title: thread.customTitle ? thread.title : compactConversationTitle(thread.title),
    pinned: Boolean(thread.pinned),
    messages: thread.messages.map(({ question, answer, interpretation, verifiedReport, visitMessage, records, proposals, groups }) =>
      ({ question, answer, interpretation, verifiedReport, visitMessage, records, proposals, groups })),
  }));
}

export async function recentConversation(owner: string, id: string) {
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
    lastAssistantAnswer: messages.at(-1)?.answer,
    clientId,
    visit: visit?.clientId && clientId && visit.clientId !== clientId ? undefined : visit,
  };
}

export async function saveAssistantMessage(owner: string, id: string, message: AssistantMessage) {
  const legacy = await readStored(owner);
  if (!legacy.some(thread => thread.id === id)) throw new Error("Conversation not owned by this user");
  const collection = await initialize(owner);
  const mongoose = await dbConnect();
  await mongoose.connection.db!.collection("assistant_message_archive").insertOne({ owner, conversationId: id, createdAt: new Date(), message });
  const update = [
    { $set: { owner: { $literal: owner }, threads: { $ifNull: ["$threads", { $literal: legacy }] } } },
    { $set: {
      threads: { $let: {
        vars: { existing: { $arrayElemAt: [{ $filter: { input: "$threads", as: "thread", cond: { $eq: ["$$thread.id", { $literal: id }] } } }, 0] } },
        in: { $concatArrays: [
          [{ $mergeObjects: ["$$existing", {
            id: { $literal: id },
            title: { $cond: [{ $or: ["$$existing.customTitle", { $gt: [{ $size: { $ifNull: ["$$existing.messages", []] } }, 0] }] }, "$$existing.title", { $literal: compactConversationTitle(message.title || message.question) }] },
            updatedAt: "$$NOW",
            messages: { $slice: [{ $concatArrays: [
              { $ifNull: ["$$existing.messages", []] }, { $literal: [message] },
            ] }, -100] },
          }] }],
          { $filter: { input: "$threads", as: "thread", cond: { $ne: ["$$thread.id", { $literal: id }] } } },
        ] },
      } },
      updatedAt: "$$NOW",
    } },
    { $unset: ["id", "title", "messages"] },
  ];
  const saved = await collection.updateOne({ _id: latestKey(owner), owner, threads: { $elemMatch: { id, deletedAt: { $exists: false } } } }, update);
  if (!saved.matchedCount) throw new Error("Conversation not owned by this user");
}
