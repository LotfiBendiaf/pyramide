"use client";

import type { VisitMessageDraft } from "@/lib/assistant-visit-message";
import type { VisitProposal } from "@/lib/assistant-proposals";
import type { Role } from "@/constants/values";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type ResultRow = { label: string; detail?: string; href?: string; clientId?: string };

export type Reply = {
  answer: string;
  interpretation?: "ai";
  verifiedReport?: boolean;
  records?: ResultRow[];
  proposals?: VisitProposal[];
  visitMessage?: VisitMessageDraft;
  groups?: { label: string; count: number; records: ResultRow[] }[];
};

type Message = Reply & { question: string };
type Briefing = { hotClients?: number | null; scheduledVisits?: number | null; completedVisits?: number | null; cancelledVisits?: number | null; day?: string; clients: number | null; listings: number; visits: number | null; negotiations: number | null; agenda?: { personalFollowUps?: { count: number; overdue: number; records: ResultRow[] }; answer: string; groups?: { kind?: string; label: string; count: number; records: ResultRow[] }[] } };

type Conversation = { id: string; title: string; updatedAt: string; messages: Message[] };

function useAssistantState(role: Role) {
  const pathname = usePathname();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [loading, setLoading] = useState(true);
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
        const data = await response.json() as { conversations: Conversation[]; briefing: Briefing | null };
        if (abort.signal.aborted) return;
        setThreads(data.conversations);
        setBriefing(data.briefing);
      } catch {
        if (!abort.signal.aborted) setHistoryError("Impossible de charger l’historique.");
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => abort.abort();
  }, [pathname, role]);

  function select(id?: string) {
    if (sending.current) return;
    setActiveId(id);
    setError("");
  }

  async function send(text: string, conversationId?: string): Promise<boolean> {
    const question = text.trim();
    if (!question || loading || sending.current) return false;
    const id = conversationId ?? activeId ?? crypto.randomUUID();
    sending.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationId: id }),
      });
      const result = await response.json() as Reply & { error?: string; historySaved?: boolean };
      if (!response.ok) throw new Error(result.error || "Impossible d’obtenir une réponse.");
      setThreads((previous) => {
        const thread = previous.find((item) => item.id === id);
        return [{
          id,
          title: thread?.title ?? question.slice(0, 100),
          updatedAt: new Date().toISOString(),
          messages: [...(thread?.messages ?? []), { ...result, question }],
        }, ...previous.filter((item) => item.id !== id)].slice(0, 5);
      });
      setActiveId(id);
      if (!result.historySaved) setError("Réponse reçue, mais l’historique n’a pas pu être enregistré.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’obtenir une réponse.");
      return false;
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  return { role, briefing, threads, activeId, loading, historyError, pending, error, select, send };
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
