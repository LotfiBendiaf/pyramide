import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserBySessionEmail } from "@/lib/getUserBySessionEmail";
import { answerAgencyQuestion, AssistantUnavailable } from "@/lib/assistant-agency";

import { assistantHistoryOwner, canUseAssistant } from "@/lib/assistant-access";
import { dailyAssistantPlan, readAssistantBriefing } from "@/lib/assistant-briefing";
import { continuousConversationId, createConversation, selectConversation, renameConversation, pinConversation, deleteConversation, readConversations, recentConversation, saveAssistantMessage } from "@/lib/assistant-history";

const questionText = z.string().trim().min(1).max(2000);
const questionSchema = z.object({
  question: questionText,
  conversationId: z.string().uuid().optional(),
  previousQuestion: questionText.optional(),
  history: z.array(questionText).max(4).optional(),
});

const inputSchema = z.union([
  questionSchema,
  z.object({ action: z.literal("create") }),
  z.object({ action: z.literal("select"), conversationId: z.string().uuid() }),
  z.object({ action: z.literal("rename"), conversationId: z.string().uuid(), title: z.string().trim().min(1).max(60) }),
  z.object({ action: z.literal("pin"), conversationId: z.string().uuid(), pinned: z.boolean() }),
  z.object({ action: z.literal("delete"), conversationId: z.string().uuid() }),
]);

export async function GET() {
  const { data: user } = await getUserBySessionEmail();
  if (!user?._id || !canUseAssistant(user.role)) {
    return NextResponse.json({ error: "Ton profil ne peut pas accéder à l’assistant." }, { status: user?._id ? 403 : 401 });
  }
  const scope = { userId: user._id, role: user.role };
  try {
    const [conversations, briefing] = await Promise.all([
      readConversations(assistantHistoryOwner(scope)),
      Promise.all([readAssistantBriefing(scope), dailyAssistantPlan(scope)]).then(([counts, agenda]) => ({ ...counts, agenda })).catch(() => null),
    ]);
    const activeId = await continuousConversationId(assistantHistoryOwner(scope));
    return NextResponse.json({ conversations, briefing, activeId }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Impossible de charger l’historique." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const { data: user } = await getUserBySessionEmail();
  if (!user?._id) return NextResponse.json({ error: "Connecte-toi pour utiliser l’assistant." }, { status: 401 });
  if (!canUseAssistant(user.role)) return NextResponse.json({ error: "Ton profil ne peut pas accéder à l’assistant." }, { status: 403 });

  const input = inputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Saisis une question de 1 à 2000 caractères." }, { status: 400 });

  try {
    const scope = { userId: user._id, role: user.role };
    const owner = assistantHistoryOwner(scope);
    if ("action" in input.data) {
      const action = input.data;
      let id: string | null | false;
      if (action.action === "create") id = await createConversation(owner);
      else if (action.action === "select") id = await selectConversation(owner, action.conversationId);
      else if (action.action === "delete") id = await deleteConversation(owner, action.conversationId);
      else {
        const changed = action.action === "rename"
          ? await renameConversation(owner, action.conversationId, action.title)
          : await pinConversation(owner, action.conversationId, action.pinned);
        id = changed ? await continuousConversationId(owner) : null;
      }
      if (!id) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
      return NextResponse.json({ conversationId: id, conversations: await readConversations(owner) });
    }
    const { question } = input.data;
    const conversationId = input.data.conversationId
      ? await selectConversation(owner, input.data.conversationId)
      : await continuousConversationId(owner);
    if (!conversationId) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
    const context = await recentConversation(owner, conversationId);
    const result = await answerAgencyQuestion(question, context.questions, scope, context.clientId, context.visit, context.creation, context.pipeline, context.lastAssistantAnswer);
    let historySaved = false;
    if (conversationId) {
      try {
        await saveAssistantMessage(owner, conversationId, {
          question,
          title: result.conversationTitle,
          answer: result.answer,
          interpretation: result.interpretation,
          ...("clientContextId" in result && typeof result.clientContextId === "string" ? { clientContextId: result.clientContextId } : {}),
          ...("visitContext" in result && result.visitContext ? { visitContext: result.visitContext } : {}),
          ...("visitMessage" in result && result.visitMessage ? { visitMessage: result.visitMessage } : {}),
          ...("pipelineContext" in result ? { pipelineContext: result.pipelineContext } : {}),
          ...("proposals" in result && result.proposals ? { proposals: result.proposals } : {}),
          ...("groups" in result && result.groups ? { groups: result.groups } : {}),
          ...("creationContext" in result ? { creationContext: result.creationContext } : {}),
          ...("records" in result && result.records ? { records: result.records } : {}),
          verifiedReport: "verifiedReport" in result && result.verifiedReport === true,
        });
        historySaved = true;
      } catch {
        // A storage failure must not discard a verified answer.
      }
    }
    return NextResponse.json({ ...result, historySaved, conversationId });
  } catch (error) {
    if (error instanceof AssistantUnavailable) {
      const messages = {
        quota: "Le service IA a atteint sa limite de requêtes. Réessaie dans un instant.",
        configuration: "Le service IA n’est pas connecté. Vérifie la configuration de l’assistant.",
        transient: "Le service IA n’a pas répondu. Réessaie dans un instant.",
        invalid: "L’IA n’a pas pu interpréter cette demande correctement. Essaie de préciser ce que tu veux comparer.",
      };
      const retryAfter = error.reason === "quota" ? error.retryAfterSeconds : undefined;
      const message = retryAfter ? "Le service IA est temporairement limité. Réessaie dans " + retryAfter + (retryAfter === 1 ? " seconde. Votre saisie est conservée." : " secondes. Votre saisie est conservée.") : messages[error.reason];
      return NextResponse.json({ error: message, retryAfterSeconds: retryAfter }, {
        status: 503,
        ...(retryAfter ? { headers: { "Retry-After": String(retryAfter) } } : {}),
      });
    }
    console.error("Assistant CRM request failed", error instanceof Error ? { name: error.name, message: error.message } : "Unknown error");
    return NextResponse.json({ error: "Impossible de consulter les données du CRM pour le moment." }, { status: 503 });
  }
}
