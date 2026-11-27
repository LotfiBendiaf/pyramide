"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Maximize2, MoreHorizontal, Pin, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssistant } from "./AssistantContext";
import { PyramideAssistant } from "./PyramideAssistant";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog as EditDialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function ConversationRow({ thread }: { thread: { id: string; title: string; updatedAt: string; messages: unknown[]; pinned?: boolean } }) {
  const { activeId, select, renameConversation, pinConversation, deleteConversation, pending, loading } = useAssistant();
  const [menu, setMenu] = useState(false);
  const [rename, setRename] = useState(false);
  const [remove, setRemove] = useState(false);
  const [title, setTitle] = useState(thread.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const held = useRef(false);
  const disabled = pending || loading || busy;
  function cancelHold() { if (timer.current) clearTimeout(timer.current); timer.current = null; }
  useEffect(() => () => cancelHold(), []);
  async function mutate(action: () => Promise<unknown>, done?: () => void) {
    setBusy(true); setError("");
    try { if (await action() === false) throw new Error("Impossible de modifier cette conversation. Réessayez."); done?.(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de modifier cette conversation."); }
    finally { setBusy(false); }
  }
  return <div className={`min-w-0 rounded-lg border text-sm ${thread.id === activeId ? "bg-muted" : "hover:bg-muted/50"}`}>
    <div className="flex min-w-0 items-center">
      <button type="button" disabled={disabled} aria-current={thread.id === activeId ? "true" : undefined} title={thread.title}
        className="min-h-11 min-w-0 flex-1 touch-pan-y select-none p-3 text-left disabled:opacity-50"
        onPointerDown={(event) => { if (disabled || event.button !== 0) return; cancelHold(); held.current = false; origin.current = { x: event.clientX, y: event.clientY }; timer.current = setTimeout(() => { held.current = true; setMenu(true); }, 500); }}
        onPointerMove={(event) => { if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 8) cancelHold(); }}
        onPointerUp={cancelHold} onPointerCancel={cancelHold} onPointerLeave={cancelHold}
        onContextMenu={(event) => { event.preventDefault(); cancelHold(); if (!disabled) { held.current = true; setMenu(true); } }}
        onClick={(event) => { if (held.current) { event.preventDefault(); held.current = false; return; } void select(thread.id); }}>
        <span className="flex min-w-0 items-center gap-1">{thread.pinned && <Pin className="size-3 shrink-0" aria-label="Épinglée" />}<span className="truncate font-medium">{thread.title || "Nouvelle conversation"}</span></span>
        <span className="mt-1 block text-xs text-muted-foreground">{new Intl.DateTimeFormat("fr-DZ", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Algiers" }).format(new Date(thread.updatedAt))}</span>
      </button>
      <DropdownMenu open={menu} onOpenChange={setMenu}>
        <DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="mr-1 size-11 shrink-0" disabled={disabled} aria-label={`Options de ${thread.title || "la conversation"}`} onClick={(event) => event.stopPropagation()}><MoreHorizontal className="size-4" aria-hidden /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="min-h-11" onSelect={() => { setTitle(thread.title); setError(""); setRename(true); }}>Renommer</DropdownMenuItem>
          <DropdownMenuItem className="min-h-11" onSelect={() => void mutate(() => pinConversation(thread.id, !thread.pinned))}>{thread.pinned ? "Désépingler" : "Épingler"}</DropdownMenuItem>
          <DropdownMenuItem className="min-h-11 text-destructive" onSelect={() => { setError(""); setRemove(true); }}>Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    {error && !rename && !remove && <p role="alert" className="px-3 pb-2 text-xs text-destructive">{error}</p>}
    <EditDialog open={rename} onOpenChange={(open) => { if (!busy) setRename(open); }}>
      <DialogContent><DialogHeader><DialogTitle>Renommer la conversation</DialogTitle><DialogDescription>Choisissez un titre court pour la retrouver.</DialogDescription></DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); if (title.trim() && !busy) void mutate(() => renameConversation(thread.id, title.trim()), () => setRename(false)); }} className="space-y-4">
          <label className="block space-y-2"><span>Titre</span><input autoFocus maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} disabled={busy} className="min-h-11 w-full rounded-md border bg-background px-3" /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter><Button type="button" variant="outline" className="min-h-11" disabled={busy} onClick={() => setRename(false)}>Annuler</Button><Button type="submit" className="min-h-11" disabled={busy || !title.trim()}>Enregistrer</Button></DialogFooter>
        </form>
      </DialogContent>
    </EditDialog>
    <AlertDialog open={remove} onOpenChange={(open) => { if (!busy) setRemove(open); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer cette conversation ?</AlertDialogTitle><AlertDialogDescription>Elle disparaîtra de votre historique.</AlertDialogDescription></AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter><AlertDialogCancel disabled={busy} className="min-h-11">Annuler</AlertDialogCancel><Button variant="destructive" className="min-h-11" disabled={busy} onClick={() => void mutate(() => deleteConversation(thread.id), () => setRemove(false))}>Supprimer</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState("");
  const { newConversation, pending, loading, activeId } = useAssistant();
  async function openNewConversation() {
    if (opening || pending || loading) return;
    setOpening(true);
    setOpenError("");
    try {
      if (await newConversation()) setOpen(true);
      else setOpenError("Impossible d’ouvrir une nouvelle conversation. Réessayez.");
    } finally { setOpening(false); }
  }
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (next) void openNewConversation(); else setOpen(false); }} modal={false}>
      {openError && <p role="alert" className="fixed right-4 bottom-20 z-50 max-w-xs rounded-lg border bg-card p-3 text-sm text-destructive">{openError}</p>}
      <Dialog.Trigger asChild>
        <Button type="button" aria-label="Ouvrir le chat Assistant IA" size="icon" disabled={opening || pending || loading}
          className="fixed right-4 bottom-4 z-40 size-12 rounded-full shadow-lg sm:right-6 sm:bottom-6">
          <Sparkles className="size-5" aria-hidden />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        {open && (
          <button type="button" tabIndex={-1} aria-label="Fermer le chat en arrière-plan"
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)} />
        )}
        <Dialog.Content aria-describedby={undefined} className="fixed right-3 bottom-20 z-50 flex h-[min(65dvh,36rem)] w-[calc(100vw-1.5rem)] max-w-md flex-col rounded-xl border bg-card shadow-xl sm:right-6">
          <Dialog.Title className="sr-only">Chat Assistant IA</Dialog.Title>
          <div className="min-h-0 flex-1">
            {open && (
              <PyramideAssistant key={activeId} embedded actions={
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild size="icon" variant="ghost">
                    <Link href="/dashboard/assistant" aria-label="Agrandir le chat" title="Agrandir le chat" onClick={() => setOpen(false)}>
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

export function AssistantHistoryPage() {
  const { historyError, threads, activeId, newConversation, pending, loading } = useAssistant();
  const history = threads.filter(thread => thread.messages.length || thread.id === activeId);
  const controls = <>
    <Button type="button" className="h-auto min-h-11 whitespace-normal" variant="outline" disabled={pending || loading} onClick={() => void newConversation()}>
      <Plus className="size-4" aria-hidden /> Nouvelle conversation
    </Button>
    <nav aria-label="Historique des conversations" className="min-h-0 space-y-2 overflow-y-auto">
      {history.map(thread => <ConversationRow key={thread.id} thread={thread} />)}
    </nav>
  </>;
  return (
    <div className="assistant-dashboard mx-auto flex h-full max-w-[1400px] min-w-0 flex-col gap-3">
      {historyError && <p role="alert" className="text-sm text-destructive">{historyError}</p>}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside aria-label="Conversations" className="hidden min-h-0 flex-col gap-3 rounded-xl border bg-card p-3 lg:flex">
          <h2 className="font-semibold">Conversations</h2>
          {controls}
        </aside>
        <div className="flex min-h-0 min-w-0 flex-col gap-3">
          <details className="rounded-xl border bg-card p-3 lg:hidden">
            <summary className="min-h-8 cursor-pointer text-sm font-medium">Conversations · {history.length}</summary>
            <div className="mt-3 flex max-h-64 flex-col gap-3">{controls}</div>
          </details>
          <div className="min-h-0 flex-1"><PyramideAssistant key={activeId ?? "loading"} /></div>
        </div>
      </div>
    </div>
  );
}
