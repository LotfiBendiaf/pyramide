"use client";

import { useLayoutEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Maximize2, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssistant } from "./AssistantContext";
import { PyramideAssistant } from "./PyramideAssistant";

export function FloatingAssistant() {
  const [conversationId, setConversationId] = useState<string>();
  const { select } = useAssistant();
  return (
    <Dialog.Root open={Boolean(conversationId)} onOpenChange={(open) => setConversationId(open ? crypto.randomUUID() : undefined)} modal={false}>
      <Dialog.Trigger asChild>
        <Button type="button" aria-label="Ouvrir le chat Assistant IA" size="icon"
          className="fixed right-4 bottom-4 z-40 size-12 rounded-full shadow-lg sm:right-6 sm:bottom-6">
          <Sparkles className="size-5" aria-hidden />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content aria-describedby={undefined} className="fixed right-3 bottom-20 z-50 flex h-[min(65dvh,36rem)] w-[calc(100vw-1.5rem)] max-w-md flex-col rounded-xl border bg-card shadow-xl sm:right-6">
          <Dialog.Title className="sr-only">Chat Assistant IA</Dialog.Title>
          <div className="min-h-0 flex-1">
            {conversationId && (
              <PyramideAssistant key={conversationId} embedded conversationId={conversationId} actions={
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild size="icon" variant="ghost">
                    <Link href={`/dashboard/assistant?conversation=${conversationId}`} aria-label="Agrandir le chat" title="Agrandir le chat" onClick={() => {
                      select(conversationId);
                      setConversationId(undefined);
                    }}>
                      <Maximize2 className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Dialog.Close asChild>
                    <Button size="icon" variant="ghost" aria-label="Fermer le chat">
                      <X className="size-4" aria-hidden />
                    </Button>
                  </Dialog.Close>
                </div>
              } />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function AssistantHistoryPage({ initialConversationId }: { initialConversationId?: string }) {
  const { threads, activeId, pending, loading, historyError, select } = useAssistant();
  const openedEntry = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    const entry = initialConversationId ?? "new";
    if (pending || openedEntry.current === entry) return;
    select(initialConversationId);
    openedEntry.current = entry;
  }, [initialConversationId, pending, select]);
  return (
    <div className="assistant-dashboard mx-auto grid max-w-[1400px] min-w-0 gap-4 lg:h-full lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside aria-label="Historique des conversations" className="flex min-h-0 flex-col rounded-xl border bg-card p-3">
        <div className="flex items-center justify-between gap-2 border-b pb-3">
          <h2 className="font-semibold">Conversations récentes</h2>
          <Button size="sm" variant="outline" disabled={pending || loading} onClick={() => select()}>
            <Plus className="size-4" aria-hidden /> Nouveau
          </Button>
        </div>
        {historyError && <p role="alert" className="px-2 py-3 text-sm text-destructive">{historyError}</p>}
        {loading && <p className="px-2 py-3 text-sm text-muted-foreground">Chargement…</p>}
        {!loading && !historyError && !threads.length && <p className="px-2 py-3 text-sm text-muted-foreground">Aucune conversation enregistrée.</p>}
        <ul className="max-h-44 min-h-0 space-y-1 overflow-y-auto pt-2 lg:max-h-none">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button type="button" aria-current={thread.id === activeId} disabled={pending} onClick={() => select(thread.id)}
                className="block w-full rounded-md px-2 py-2 text-left hover:bg-muted aria-[current=true]:bg-muted disabled:opacity-60">
                <span className="block truncate text-sm">{thread.title}</span>
                <time dateTime={thread.updatedAt} className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("fr-DZ", { dateStyle: "medium", timeZone: "Africa/Algiers" }).format(new Date(thread.updatedAt))}
                </time>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="min-h-0 min-w-0"><PyramideAssistant key={activeId ?? "new"} /></div>
    </div>
  );
}
