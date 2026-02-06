export const ROLES = [
  "MANAGER",
  "ADMIN",
  "ASSISTANT",
  "AGENT",
  "EMPLOYEE",
  "VIEWER",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS = {
  MANAGER: "Gestionnaire",
  ADMIN: "Administrateur",
  ASSISTANT: "Assistant",
  AGENT: "Agent",
  EMPLOYEE: "Employé",
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
  { value: "NEW", label: "Nouveau", color: "secondary" },
  { value: "QUALIFIED", label: "Qualifié", color: "success" },
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

  // Settings
  "/dashboard/settings": "Paramètres",
};

export const WILAYAS = [
  "Adrar",
  "Chlef",
  "Laghouat",
  "Oum El Bouaghi",
  "Batna",
  "Béjaïa",
  "Biskra",
  "Béchar",
  "Blida",
  "Bouira",
  "Tamanrasset",
  "Tébessa",
  "Tlemcen",
  "Tiaret",
  "Tizi Ouzou",
  "Alger",
  "Djelfa",
  "Jijel",
  "Sétif",
  "Saïda",
  "Skikda",
  "Sidi Bel Abbès",
  "Annaba",
  "Guelma",
  "Constantine",
  "Médéa",
  "Mostaganem",
  "M'Sila",
  "Mascara",
  "Ouargla",
  "Oran",
  "El Bayadh",
  "Illizi",
  "Bordj Bou Arreridj",
  "Boumerdès",
  "El Tarf",
  "Tindouf",
  "Tissemsilt",
  "El Oued",
  "Khenchela",
  "Souk Ahras",
  "Tipaza",
  "Mila",
  "Aïn Defla",
  "Naâma",
  "Aïn Témouchent",
  "Ghardaïa",
  "Relizane",
  "Timimoun",
  "Bordj Badji Mokhtar",
  "Ouled Djellal",
  "Béni Abbès",
  "In Salah",
  "In Guezzam",
  "Touggourt",
  "Djanet",
  "El M'Ghair",
  "El Meniaa",
];
