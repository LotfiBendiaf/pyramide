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

export async function readConversations(owner: string) {
  const threads = await readStored(owner);
  return threads.map((thread) => ({
    ...thread,
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
  return {
    pipeline: newestFirst.find((message) => message.pipelineContext !== undefined)?.pipelineContext ?? undefined,
    creation: newestFirst.find((message) => message.creationContext !== undefined)?.creationContext ?? undefined,
    questions: recent.map((message) => message.question),
    clientId,
    visit: visit?.clientId && clientId && visit.clientId !== clientId ? undefined : visit,
  };
}

export async function saveAssistantMessage(owner: string, id: string, message: AssistantMessage) {
  const collection = await conversations();
  const legacy = await readStored(owner);
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
