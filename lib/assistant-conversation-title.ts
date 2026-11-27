const titles: Record<string, string> = {
  sales_history: "Ventes et commissions", revenue: "Commissions de l’agence", dashboard: "Bilan de l’agence",
  daily_briefing: "Ma journée", analytics: "Analyse de l’agence", client_message: "Message client",
  clients: "Clients", hot: "Clients chauds", unfollowed: "Clients sans suivi", create_client: "Nouveau client",
  create_listing: "Nouveau bien", create_residence: "Nouvelle résidence", listings: "Biens de l’agence",
  property_match: "Recherche de biens", visit_proposal: "Proposition de biens", visits: "Planning des visites",
  confirm_visit: "Organiser une visite", cancel_visit: "Annuler une visite", reschedule_visit: "Déplacer une visite",
  reassign_visit: "Réattribuer une visite", visit_feedback: "Retour de visite", followups: "Relances clients",
  tasks: "Tâches", employees: "Équipe", activity: "Activité de l’agence", negotiations: "Négociations",
  open_negotiation: "Nouvelle négociation", approve_negotiation: "Validation de négociation",
  begin_closing: "Clôture d’affaire", record_deposit: "Dépôt client", close_deal: "Clôture d’affaire",
  archive_requests: "Demandes d’archivage", approve_archive: "Validation d’archivage", reject_archive: "Refus d’archivage",
  pending_listings: "Biens à valider", validate_listing: "Validation d’un bien", reject_listing: "Refus d’un bien",
  archive_client: "Archivage client", archive_listing: "Archivage d’un bien",
};

export function titleForAssistantIntent(intent: string) {
  return titles[intent] || "Question immobilière";
}

export function compactConversationTitle(value: string) {
  const clean = value.replace(/\s+/gu, " ").trim();
  const words = clean.split(" ");
  const short = words.slice(0, 6).join(" ");
  const clipped = [...short].slice(0, 38).join("").trimEnd();
  return (clipped || "Nouvelle conversation") + (words.length > 6 || [...short].length > 38 ? "…" : "");
}
