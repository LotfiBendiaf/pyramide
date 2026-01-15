export const ROLES = ["MANAGER", "ADMIN", "EMPLOYEE", "VIEWER"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  MANAGER: "Gestionnaire",
  EMPLOYEE: "Employé",
  VIEWER: "Lecteur",
} as const;

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

  // Listings Management
  "/dashboard/listings": "Gestion des Annonces",
  "/dashboard/listings/add": "Nouvelle Annonce",
  "/dashboard/listings/[id]": "Détails de l’Annonce",
  "/dashboard/listings/[id]/edit": "Modifier l’Annonce",

  // Agencies
  "/dashboard/agencies": "Agences",
  "/dashboard/agencies/add": "Ajouter une Agence",
  "/dashboard/agencies/[id]": "Profil de l’Agence",

  // Clients
  "/dashboard/clients": "Clients",
  "/dashboard/clients/[id]": "Détails Client",

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

  // Settings
  "/dashboard/settings": "Paramètres",
};
