export const ROLES = [
  "MANAGER",
  "ADMIN",
  "ASSISTANT",
  "AGENT",
  "DEVELOPER",
  "EMPLOYEE",
  "VIEWER",
] as const;

export type Role = (typeof ROLES)[number];

export const ELEVATED_ROLES = ["MANAGER", "ADMIN", "DEVELOPER"] as const;
export const isElevatedRole = (role: string): boolean =>
  (ELEVATED_ROLES as readonly string[]).includes(role);

export const MANAGER_NOTIFICATION_ROLES = ["MANAGER", "ADMIN"] as const;

export const ROLE_LABELS = {
  MANAGER: "Gérant",
  ADMIN: "Administrateur",
  ASSISTANT: "Assistant",
  AGENT: "Agent",
  EMPLOYEE: "Employé",
  DEVELOPER: "Développeur",
  VIEWER: "Lecteur",
} as const;

export type PropertyStatus =
  | "En Vente"
  | "En Location"
  | "Vendu"
  | "Loué"
  | "Retiré";

export const STATUS_COLORS: Record<PropertyStatus, string> = {
  "En Vente": "text-green-600",
  "En Location": "text-blue-600",
  Vendu: "text-gray-500",
  Loué: "text-purple-600",
  Retiré: "text-red-600",
};

export const CLIENT_QUALIFICATIONS = [
  { value: "NEUTRAL", label: "Neutre", color: "secondary" },
  { value: "NEW", label: "Nouveau", color: "secondary" },
  { value: "QUALIFIED", label: "Qualifié", color: "success" },
  { value: "HOT", label: "Chaud", color: "destructive" },
  { value: "COLD", label: "Froid", color: "secondary" },
  { value: "NO_RESPONSE", label: "N'a pas répondu", color: "warning" },
  { value: "NOT_RELEVANT", label: "Non pertinent", color: "warning" },
  { value: "ARCHIVED", label: "Archivé", color: "outline" },
] as const;

export type ClientQualification =
  (typeof CLIENT_QUALIFICATIONS)[number]["value"];

export const routeTitles: Record<string, string> = {
  // === Auth ===
  "/sign-in": "Connexion",
  "/sign-up": "Créer un compte",

  // === Public Pages ===
  "/": "Accueil",
  "/listings": "Annonces Immobilières",
  "/listings/[id]": "Détails du Bien",

  "/agencies": "Agences Immobilières",
  "/agencies/[id]": "Profil de l’Agence",

  "/about": "Qui sommes-nous",
  "/contact": "Contact",

  // === Property Categories ===
  "/listings/apartment": "Appartements",
  "/listings/house": "Maisons",
  "/listings/villa": "Villas",
  "/listings/studio": "Studios",
  "/listings/land": "Terrains",
  "/listings/commercial": "Locaux Commerciaux",

  // === Search / User ===
  "/wishlist": "Liste de Souhaits",
  "/favorites": "Favoris",
  "/compare": "Comparer les Biens",

  // === Client Space ===
  "/account": "Mon Compte",
  "/account/appointments": "Mes Rendez-vous",
  "/account/messages": "Messages",

  // === Admin / Dashboard ===
  "/dashboard": "Tableau de Bord",

  // === Dashboard Main Sections ===
  "/dashboard/schedule": "Planning",

  // Listings Management
  "/dashboard/listings": "Gestion des Annonces",
  "/dashboard/listings/add": "Nouvelle Annonce",
  "/dashboard/listings/[id]": "Détails de l’Annonce",
  "/dashboard/listings/[id]/edit": "Modifier l’Annonce",

  //Suivies Clients
  "/dashboard/follow-ups": "Suivis Clients",
  "/dashboard/follow-ups/new": "Nouveau Suivi",
  "/dashboard/follow-ups/[listingId]": "Suivis de l’Annonce",

  // Agencies
  "/dashboard/agencies": "Agences",
  "/dashboard/agencies/add": "Ajouter une Agence",
  "/dashboard/agencies/[id]": "Profil de l’Agence",

  // Clients
  "/dashboard/clients": "Clients",
  "/dashboard/clients/[id]": "Détails Client",
  "/dashboard/clients/add": "Ajouter un Client",
  // Appointments
  "/dashboard/appointments": "Rendez-vous",
  "/dashboard/appointments/calendar": "Calendrier",

  // Payments / Billing
  "/dashboard/payments": "Paiements & Facturation",

  // Users & Roles
  "/dashboard/users": "Utilisateurs",
  "/dashboard/users/add": "Créer un Utilisateur",

  // Moderation
  "/dashboard/reports": "Signalements",
  "/dashboard/validation": "Validation des Annonces",

  // Mes biens
  "/dashboard/mes-biens": "Mes Biens",

  // Visits
  "/dashboard/visits": "Visites",
  "/dashboard/visits/[id]": "Détail de la visite",

  // Negotiations
  "/dashboard/negotiations": "Négociations",
  "/dashboard/negotiations/[id]": "Négociation",
  "/dashboard/demandes": "Demandes",

  // Settings
  "/dashboard/settings": "Paramètres",
};

export const WILAYAS = ["Oran"];

export const PROPERTY_TYPES = [
  "Appartement",
  "Maison",
  "Villa",
  "Studio",
  "Terrain",
  "Commercial",
  "Duplex",
  "Hangar",
  "Penthouse",
  "Local Commercial",
  "Autre",
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number];

// ─── Visits ────────────────────────────────────────────────────────────────

export const VISIT_STATUSES = [
  { value: "SCHEDULED", label: "Planifiée", color: "warning" },
  { value: "COMPLETED", label: "Effectuée", color: "success" },
  { value: "CANCELLED", label: "Annulée", color: "secondary" },
  { value: "NO_SHOW", label: "Absent", color: "destructive" },
] as const;

export const VISIT_OUTCOMES = [
  { value: "INTERESTED", label: "Intéressé", color: "success" },
  { value: "NOT_INTERESTED", label: "Pas intéressé", color: "secondary" },
  { value: "UNDECIDED", label: "Indécis", color: "warning" },
] as const;

// ─── Listing Pipeline ──────────────────────────────────────────────────────

export const LISTING_PIPELINE_STAGES = [
  { value: "DRAFT", label: "Brouillon", color: "secondary" },
  {
    value: "PENDING_VALIDATION",
    label: "En attente de validation",
    color: "warning",
  },
  {
    value: "PHOTO_VISIT_PENDING",
    label: "Visite photo à planifier",
    color: "warning",
  },
  { value: "ACTIVE", label: "Actif", color: "success" },
  { value: "UNDER_NEGOTIATION", label: "En négociation", color: "destructive" },
  { value: "CLOSING", label: "Closing", color: "info" },
  { value: "SOLD", label: "Vendu", color: "outline" },
  { value: "ARCHIVED", label: "Archivé", color: "outline" },
] as const;

export type ListingPipelineStageValue =
  (typeof LISTING_PIPELINE_STAGES)[number]["value"];

export const SELLER_MOTIVATIONS = [
  { value: "LOW", label: "Faible", color: "secondary" },
  { value: "MEDIUM", label: "Moyenne", color: "warning" },
  { value: "HIGH", label: "Élevée", color: "success" },
] as const;

// ─── Client Pipeline ───────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  { value: "LEAD", label: "Nouveau lead", color: "secondary" },
  { value: "PHASE_1_REVIEW", label: "En attente Phase 1", color: "warning" },
  { value: "PHASE_2_REVIEW", label: "En attente Phase 2", color: "warning" },
  { value: "ACTIVE_SEARCH", label: "Recherche active", color: "success" },
  { value: "FOLLOW_UP", label: "Suivi", color: "info" },
  { value: "IN_NEGOTIATION", label: "En négociation", color: "destructive" },
  { value: "CLOSED", label: "Clôturé", color: "outline" },
  { value: "ARCHIVED", label: "Archivé", color: "outline" },
] as const;

export type PipelineStageValue = (typeof PIPELINE_STAGES)[number]["value"];

export const CLIENT_TEMPERATURES = [
  { value: "HOT", label: "Chaud", color: "destructive", followUpDays: 2 },
  { value: "WARM", label: "Normal", color: "warning", followUpDays: 7 },
  { value: "COLD", label: "Froid", color: "secondary", followUpDays: 180 },
] as const;

export type ClientTemperatureValue =
  (typeof CLIENT_TEMPERATURES)[number]["value"];

// ─── Negotiations ──────────────────────────────────────────────────────────

export const NEGOTIATION_STATUSES = [
  {
    value: "PENDING_VERIFICATION",
    label: "En attente de vérification",
    color: "warning",
  },
  { value: "ACTIVE", label: "En cours", color: "destructive" },
  { value: "CLOSING", label: "Closing — Finalisation", color: "info" },
  {
    value: "CLOSING_DEPOSIT",
    label: "Closing — Dépôt & confirmation",
    color: "warning",
  },
  {
    value: "CLOSING_FINALISATION",
    label: "Closing — Finalisation",
    color: "info",
  },
  { value: "DEAL_DONE", label: "Conclu", color: "success" },
  { value: "CANCELLED", label: "Annulée", color: "secondary" },
  { value: "REJECTED", label: "Refusée", color: "secondary" },
] as const;

export type NegotiationStatusValue =
  (typeof NEGOTIATION_STATUSES)[number]["value"];

export const BLOCK_DURATIONS = [
  { days: 3, label: "3 jours" },
  { days: 7, label: "1 semaine" },
  { days: 14, label: "2 semaines" },
  { days: 30, label: "1 mois" },
] as const;
