"use client";

import type { VisitMessageDraft } from "@/lib/assistant-visit-message";
import type { VisitProposal } from "@/lib/assistant-proposals";
import type { Role } from "@/constants/values";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type ResultRow = { label: string; detail?: string; href?: string; clientId?: string };

export type Reply = {
  answer: string;
  conversationTitle?: string;
  interpretation?: "ai";
  verifiedReport?: boolean;
  records?: ResultRow[];
  proposals?: VisitProposal[];
  visitMessage?: VisitMessageDraft;
  groups?: { label: string; count: number; records: ResultRow[] }[];
};

type Message = Reply & { question: string };
type Briefing = { hotClients?: number | null; scheduledVisits?: number | null; completedVisits?: number | null; cancelledVisits?: number | null; day?: string; clients: number | null; listings: number; visits: number | null; negotiations: number | null; agenda?: { personalFollowUps?: { count: number; overdue: number; records: ResultRow[] }; answer: string; groups?: { kind?: string; label: string; count: number; records: ResultRow[] }[] } };

type Conversation = { pinned?: boolean; customTitle?: boolean; id: string; title: string; updatedAt: string; messages: Message[] };

function useAssistantState(role: Role) {
  const pathname = usePathname();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const changing = useRef(false);
  const [historyError, setHistoryError] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);

  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/assistant", { signal: abort.signal });
        if (!response.ok) throw new Error();
        const data = await response.json() as { conversations: Conversation[]; briefing: Briefing | null; activeId?: string };
        if (abort.signal.aborted) return;
        setThreads(data.conversations);
        setActiveId(data.activeId ?? data.conversations[0]?.id);
        setBriefing(data.briefing);
      } catch {
        if (!abort.signal.aborted) setHistoryError("Impossible de charger la conversation.");
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => abort.abort();
  }, [pathname, role]);

  async function changeConversation(action: "create" | "select" | "rename" | "pin" | "delete", id?: string, fields?: { title?: string; pinned?: boolean }): Promise<string | undefined> {
    if (sending.current || changing.current || loading) return;
    changing.current = true;
    setSwitching(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(id ? { conversationId: id } : {}), ...fields }),
      });
      const result = await response.json() as { conversationId?: string; conversations?: Conversation[]; error?: string };
      if (!response.ok || !result.conversationId || !result.conversations) throw new Error(result.error || "Impossible d’ouvrir la conversation.");
      setThreads(result.conversations);
      setActiveId(result.conversationId);
      return result.conversationId;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’ouvrir la conversation.");
    } finally {
      changing.current = false;
      setSwitching(false);
    }
  }
  const select = (id: string) => changeConversation("select", id);
  const newConversation = () => changeConversation("create");
  const renameConversation = async (id: string, title: string) => Boolean(await changeConversation("rename", id, { title }));
  const pinConversation = async (id: string, pinned: boolean) => Boolean(await changeConversation("pin", id, { pinned }));
  const deleteConversation = async (id: string) => Boolean(await changeConversation("delete", id));

  async function send(text: string, conversationId?: string): Promise<boolean> {
    const question = text.trim();
    if (!question || loading || changing.current || sending.current) return false;
    const id = activeId ?? threads[0]?.id ?? conversationId ?? crypto.randomUUID();
    sending.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationId: id }),
      });
      const result = await response.json() as Reply & { error?: string; historySaved?: boolean; conversationId?: string };
      if (!response.ok) throw new Error(result.error || "Impossible d’obtenir une réponse.");
      const savedId = result.conversationId ?? id;
      setThreads((previous) => {
        const thread = previous.find((item) => item.id === savedId);
        return [{
          ...thread,
          id: savedId,
          title: thread?.messages.length ? thread.title : result.conversationTitle || question.slice(0, 38),
          updatedAt: new Date().toISOString(),
          messages: [...(thread?.messages ?? []), { ...result, question }],
        }, ...previous.filter((item) => item.id !== savedId)].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
      setActiveId(savedId);
      if (!result.historySaved) setError("Réponse reçue, mais la conversation n’a pas pu être enregistrée.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’obtenir une réponse.");
      return false;
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return { role, briefing, threads, activeId, loading, historyError, pending: pending || switching, error, select, newConversation, renameConversation, pinConversation, deleteConversation, send };
}

const AssistantContext = createContext<ReturnType<typeof useAssistantState> | null>(null);

export function useAssistant() {
  const assistant = useContext(AssistantContext);
  if (!assistant) throw new Error("AssistantWorkspace manquant");
  return assistant;
}

export function AssistantWorkspace({ children, role }: { children: ReactNode; role: Role }) {
  const state = useAssistantState(role);
  return <AssistantContext.Provider value={state}>{children}</AssistantContext.Provider>;
}
