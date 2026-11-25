"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Maximize2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssistant } from "./AssistantContext";
import { PyramideAssistant } from "./PyramideAssistant";

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen} modal={false}>
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
            {open && (
              <PyramideAssistant embedded actions={
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
  const { historyError } = useAssistant();
  return (
    <div className="assistant-dashboard mx-auto flex h-full max-w-[1400px] min-w-0 flex-col gap-3">
      {historyError && <p role="alert" className="text-sm text-destructive">{historyError}</p>}
      <div className="min-h-0 flex-1"><PyramideAssistant /></div>
    </div>
  );
}
