"use client";

import { useAssistant } from "./AssistantContext";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BellPlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VisitProposal } from "@/lib/assistant-proposals";

export function AssistantVisitProposal({ proposal }: { proposal: VisitProposal }) {
  const assistant = useAssistant();
  const [message, setMessage] = useState(proposal.message);
  const [pending, setPending] = useState(false);
  const [reminder, setReminder] = useState("");
  const [error, setError] = useState("");

  async function addFollowUp() {
    setPending(true);
    setError("");
    try {
      const { proposalId, clientId, listingId } = proposal;
      const response = await fetch("/api/assistant/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, clientId, listingId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setReminder(new Intl.DateTimeFormat("fr-DZ", {
        dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Algiers",
      }).format(new Date(result.reminderAt)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de créer le suivi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="min-w-0 space-y-3 rounded-lg border bg-card p-3" aria-label="Proposition de visite">
      <div>
        <h3 className="font-medium">{proposal.title}</h3>
        <p className="text-xs text-muted-foreground">{proposal.detail}</p>
        <p className="mt-1 text-xs text-muted-foreground">Pour {proposal.clientName}</p>
      </div>
      {!!proposal.photos.length && (
        <>
          <div className="flex gap-2 overflow-x-auto">
            {proposal.photos.map((url, index) => (
              <a key={index} href={url} target="_blank" rel="noreferrer" className="relative block h-16 w-20 shrink-0 overflow-hidden rounded border"
                aria-label={`Ouvrir la photo ${index + 1}`}>
                <Image src={url} alt={`Photo ${index + 1} du bien`} fill unoptimized sizes="80px" className="object-cover" />
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Tu peux joindre ces photos dans WhatsApp.</p>
        </>
      )}
      <label className="block space-y-1">
        <span className="text-xs font-medium">Message au client</span>
        <textarea className="min-h-28 w-full rounded-md border bg-background p-2 text-sm"
          value={message} maxLength={1800} onChange={(event) => setMessage(event.target.value)} />
      </label>
      {proposal.phone && message.trim() ? (
        <Button asChild size="sm" className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-center">
          <a href={`https://wa.me/${proposal.phone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer"
            >
            <ExternalLink className="size-4" aria-hidden /> Ouvrir WhatsApp
          </a>
        </Button>
      ) : !proposal.phone && <p className="text-sm text-muted-foreground">Aucun numéro utilisable dans la fiche du client.</p>}
      {proposal.phone && message.trim() && <Button asChild size="sm" className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-center" variant="outline">
        <a href={`sms:+${proposal.phone}?body=${encodeURIComponent(message)}`}>Ouvrir le SMS</a>
      </Button>}
      <Button type="button" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-center" variant="outline" disabled={assistant.pending || assistant.loading}
        onClick={() => void assistant.send(`Organise une visite pour le client ${proposal.clientReference || proposal.clientName} du bien ${proposal.listingReference || proposal.title}.`)}>
        Organiser une visite
      </Button>
      {!reminder ? (
        <Button type="button" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal py-2 text-center" variant="outline" disabled={pending} onClick={() => void addFollowUp()}>
          <BellPlus className="size-4" aria-hidden /> {pending ? "Création du suivi…" : "Ajouter un rappel dans 24 h"}
        </Button>
      ) : (
        <p role="status" className="text-sm">
          Suivi enregistré pour le {reminder}.{" "}
          <Link href="/dashboard/schedule" className="underline underline-offset-4">Voir le planning</Link>
        </p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
