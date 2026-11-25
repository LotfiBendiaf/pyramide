"use client";

import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles } from "lucide-react";
import { isElevatedRole, ROLE_LABELS } from "@/constants/values";
import { Button } from "@/components/ui/button";
import { useAssistant, type ResultRow } from "./AssistantContext";
import { AssistantClientResult } from "./AssistantClientResult";
import { AssistantVisitMessage } from "./AssistantVisitMessage";
import { AssistantVisitProposal } from "./AssistantVisitProposal";
import { formatLegacyPlurals } from "@/lib/pluralize";
import { Input } from "@/components/ui/input";

const agencySuggestions = [
  ["Ma journée", "Prépare le briefing de la journée avec les visites, relances et priorités."],
  ["Clients par agent", "Donne-moi les clients de chaque agent"],
  ["Clients chauds", "Quels sont les clients chauds de l’agence ?"],
  ["Clients sans suivi", "Quels clients n’ont pas été suivis ?"],
  ["Commissions par agent", "Quel est le chiffre d’affaires cette semaine par agent ?"],
];

export function PyramideAssistant({ embedded = false, conversationId, actions }: { embedded?: boolean; conversationId?: string; actions?: ReactNode }) {
  const plural = (count: number | null | undefined) => (count ?? 0) > 1 ? "s" : "";
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { role, briefing, activeId, threads, pending, loading, error, send } = useAssistant();
  const suggestions = isElevatedRole(role) ? agencySuggestions : role === "VIEWER"
    ? [["Biens de l’agence", "Montre-moi les biens de l’agence."]]
    : role === "ASSISTANT" ? [
      ["Ajouter un client", "Je veux ajouter un client."],
      ["Ajouter un bien", "Je veux ajouter un bien."],
      ["Ajouter une résidence", "Je veux ajouter une résidence."],
      ["Organiser une visite", "Aide-moi à organiser une visite avec un agent."],
    ] : [
      ["Ma journée", "Prépare ma journée avec mes visites, relances et priorités."],
      ["Mes clients", "Montre-moi mes clients."],
      ["Mes biens", "Montre-moi mes biens."],
      ...(role === "AGENT" ? [["Proposer une visite", "Aide-moi à préparer une proposition de visite par WhatsApp."]] : []),
      ["Biens de l’agence", "Montre-moi les biens de l’agence."],
    ];
  const messages = threads.find((thread) => thread.id === (conversationId ?? activeId))?.messages;
  const conversation = useRef<HTMLDivElement>(null);

  const latestExchange = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const log = conversation.current;
    const exchange = latestExchange.current;
    if (log && exchange) {
      log.scrollTop += exchange.getBoundingClientRect().top - log.getBoundingClientRect().top;
    } else if (log) {
      log.scrollTop = 0;
    }
  }, [messages]);

  async function ask(value: string) {
    if (!value.trim() || pending || loading) return;
    setSubmitted(true);
    if (await send(value, conversationId)) setQuestion("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <aside aria-label="Assistant Pyramide" className={embedded
      ? "flex h-full min-h-0 flex-col gap-3 p-3 text-card-foreground"
      : "flex h-[min(70dvh,42rem)] min-h-[19rem] flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground lg:h-full lg:min-h-0"}>
      <header className="flex items-center gap-3 shrink-0 border-b pb-3">
        <Sparkles className="size-5 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Assistant Pyramide</h2>
          <p className="text-sm text-muted-foreground">{isElevatedRole(role) ? "Données de l’agence" : "Données accessibles"} · {ROLE_LABELS[role]}</p>
        </div>
        {actions}
      </header>
      <div ref={conversation} role="log" aria-label="Conversation" tabIndex={0} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
        {!messages?.length && !loading && (
          <div className="space-y-3 rounded-xl border p-3 text-sm">
            {briefing && isElevatedRole(role) ? (
              <>
                <p className="font-semibold">Récapitulatif de l’agence · Aujourd’hui</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>{briefing.clients ?? 0} client{plural(briefing.clients)} ajouté{plural(briefing.clients)}, dont {briefing.hotClients ?? 0} chaud{plural(briefing.hotClients)}.</li>
                  <li>{briefing.listings} bien{plural(briefing.listings)} ajouté{plural(briefing.listings)}.</li>
                  <li>{briefing.scheduledVisits ?? 0} visite{plural(briefing.scheduledVisits)} prévue{plural(briefing.scheduledVisits)}, {briefing.completedVisits ?? 0} réalisée{plural(briefing.completedVisits)} et {briefing.cancelledVisits ?? 0} annulée{plural(briefing.cancelledVisits)} pour aujourd’hui.</li>
                  {briefing.agenda?.personalFollowUps && <li>{briefing.agenda.personalFollowUps.count} relance{plural(briefing.agenda.personalFollowUps.count)} personnelle{plural(briefing.agenda.personalFollowUps.count)}, dont {briefing.agenda.personalFollowUps.overdue} en retard.</li>}
                </ul>
                {!!briefing.agenda?.personalFollowUps?.records.length && <section>
                  <h3 className="font-medium">Mes relances</h3>
                  <ResultList records={briefing.agenda.personalFollowUps.records.slice(0, 5)} />
                </section>}
              </>
            ) : briefing?.agenda ? (
              <>
                <p className="whitespace-pre-line">{briefing.agenda.answer}</p>
                {briefing.agenda.groups?.filter((group) => !isElevatedRole(role) || group.kind !== "followups").map((group) => (
                  <section key={group.label}>
                    <h3 className="font-medium">{group.label}</h3>
                    <ResultList records={group.records.slice(0, 5)} />
                  </section>
                ))}
              </>
            ) : briefing ? (
              <>
                <p className="font-semibold">Aujourd’hui :</p>
                <ul className="list-disc space-y-1 pl-5">
                  {briefing.clients !== null && <li>Nouveaux clients créés : {briefing.clients}</li>}
                  <li>Nouvelles annonces (listings) créées : {briefing.listings}</li>
                  {briefing.visits !== null && <li>Visites enregistrées : {briefing.visits}</li>}
                  {briefing.negotiations !== null && <li>Négociations ouvertes : {briefing.negotiations}</li>}
                </ul>
                <p>Ce sont les seules nouveautés enregistrées pour la journée.</p>
              </>
            ) : <p>Le bilan du jour est indisponible.</p>}
            <p>Comment puis-je vous aider ?</p>
          </div>
        )}
        {messages?.map((message, index) => (
          <div key={index} ref={index === messages.length - 1 ? latestExchange : undefined} className="space-y-2 text-sm last:min-h-full">
            <p dir="auto" className="ml-auto w-fit max-w-full break-words rounded-xl bg-muted px-4 py-2">{message.question}</p>
            <div className="rounded-xl border p-3">
              <p dir="auto" className="whitespace-pre-line break-words">{formatLegacyPlurals(message.answer)}</p>
              {message.verifiedReport && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Résultats vérifiés du CRM
                </p>
              )}
              {message.visitMessage && <AssistantVisitMessage draft={message.visitMessage} />}
              {!!message.proposals?.length && <div className="mt-3 space-y-3">{message.proposals.map((proposal) => <AssistantVisitProposal key={proposal.proposalId} proposal={proposal} />)}</div>}
              {!!message.records?.length && <ResultList records={message.records} />}
              {!!message.groups?.length && (
                <div className="mt-2 space-y-3">
                  {message.groups.map((group, index) => (
                    <section key={index}>
                      <h3 className="border-b py-2 font-semibold">{group.label} · {group.count}</h3>
                      {!!group.records.length && <ResultList records={group.records} />}
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {pending && <p className="text-sm text-muted-foreground">Traitement en cours…</p>}
      </div>
      {error && <p role="alert" className="shrink-0 text-sm text-destructive">{error}</p>}
      {!submitted && !messages?.length && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {suggestions.map(([label, prompt]) => (
            <Button key={label} type="button" size="sm" variant="outline" disabled={pending || loading} onClick={() => void ask(prompt)}>{label}</Button>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex shrink-0 gap-2">
        <Input className="min-w-0" dir="auto" aria-label="Votre question" placeholder="Posez une question sur l’agence…" value={question} maxLength={2000} disabled={pending || loading} onChange={(event) => setQuestion(event.target.value)} />
        <Button type="submit" size="icon" aria-label="Envoyer" disabled={pending || loading || !question.trim()}>
          <ArrowUp className="size-4" aria-hidden />
        </Button>
      </form>
    </aside>
  );
}


function ResultList({ records }: { records: ResultRow[] }) {
  return (
    <ul aria-label="Résultats du CRM" className="mt-2 divide-y">
      {records.map((record, index) => record.clientId ? <AssistantClientResult key={record.clientId} record={record} /> : (
        <li key={index} className="flex flex-wrap justify-between gap-x-3 py-2">
          {record.href ? (
            <Link className="font-medium underline-offset-4 hover:underline" href={record.href}>{record.label}</Link>
          ) : <span className="font-medium">{record.label}</span>}
          <span className="text-muted-foreground">{record.detail}</span>
        </li>
      ))}
    </ul>
  );
}
