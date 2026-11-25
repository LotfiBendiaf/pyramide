"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { VisitMessageDraft } from "@/lib/assistant-visit-message";

export function AssistantVisitMessage({ draft }: { draft: VisitMessageDraft }) {
  const [text, setText] = useState(draft.message);
  const body = encodeURIComponent(text);
  return (
    <div className="mt-3 space-y-2 rounded-lg border bg-card p-3">
      <label className="block space-y-1">
        <span className="font-medium">Message au client</span>
        <textarea className="min-h-28 w-full rounded-md border bg-background p-2"
          value={text} maxLength={1800} onChange={(event) => setText(event.target.value)} />
      </label>
      {draft.phone ? (
        <>
          <div className="flex flex-wrap gap-2">
            {text.trim() ? (
              <>
                <Button asChild size="sm">
                  <a href={`https://wa.me/${draft.phone}?text=${body}`} target="_blank" rel="noreferrer">Ouvrir WhatsApp</a>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={`sms:+${draft.phone}?body=${body}`}>Ouvrir le SMS</a>
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" disabled>Ouvrir WhatsApp</Button>
                <Button size="sm" variant="outline" disabled>Ouvrir le SMS</Button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Si WhatsApp ne trouve pas ce numéro, ouvre le SMS. Vérifie le texte avant d’envoyer.</p>
        </>
      ) : <p className="text-xs text-muted-foreground">Aucun numéro utilisable dans la fiche client.</p>}
    </div>
  );
}
