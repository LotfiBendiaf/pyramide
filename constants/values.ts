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
  "/sign-up/artist": "Inscription Artiste",

  // === Public Root Pages ===
  "/": "Accueil",
  "/artists": "Artistes",
  "/artists/[id]": "Profil Artiste",

  "/exhibitions": "Expositions",

  "/artworks": "Œuvres",
  "/artworks/[id]": "Détail de l’œuvre",

  "/subscriptions": "Abonnements",
  "/dashboard/subscriptions": "Abonnements",

  // Artwork Categories
  "/artworks/ceramic": "Céramique",
  "/artworks/digital": "Art Digital",
  "/artworks/mosaic": "Mosaïque",
  "/artworks/paint": "Peinture",
  "/artworks/photography": "Photographie",
  "/artworks/sculpture": "Sculpture",
  "/artworks/calligraphy": "Calligraphie",

  "/cart": "Panier",
  "/checkout": "Paiement",

  // Magazine
  "/lsitar-mag": "L’Sitar Mag",
  "/lsitar-mag/[id]": "Article du Mag",

  "/wishlist": "Liste de souhaits",

  // === Dashboard ===
  "/dashboard": "Tableau de bord",
  "/dashboard/sales": "Ventes & Commandes",
  "/dashboard/payouts": "Paiements & transaction",

  // === Clients ===
  "/dashboard/clients/orders": "Mes Commandes",
  "/dashboard/clients/payments": "Paiements & transaction",
  "/dashboard/clients/wishlist": "Ma wishlist",

  // === Dashboard: Oeuvres ===
  "/dashboard/artworks": "Mes Oeuvres",
  "/dashboard/artworks/add": "Nouvel Oeuvre d'art",
  "/dashboard/artworks/[id]": "Détails de Oeuvre",
  "/dashboard/artworks/[id]/edit": "Modifier Oeuvre",

  // === Dashboard: Articles ===
  "/dashboard/articles": "Articles du Mag",
  "/dashboard/articles/new": "Nouvel Article",
  "/dashboard/articles/[id]": "Détails de l’Article",
  "/dashboard/articles/[id]/edit": "Modifier l’Article",

  // === Dashboard: Artists ===
  "/dashboard/artists": "Artistes",
  "/dashboard/artists/add": "Ajouter un Artiste",
  "/dashboard/artists/[id]": "Profil Artiste",
  "/dashboard/artists/subscriptions": "Mes Abonnements",
  "/dashboard/artists/exhibition": "Exposition",
  "/dashboard/artists/sales": "Mes Ventes & Commandes",

  // === Dashboard: Users ===
  "/dashboard/users": "Utilisateurs",
  "/dashboard/users/add": "Créer un Utilisateur",

  // === Dashboard: Committee ===
  "/dashboard/committee": "Validation Comité",

  // === Dashboard: Reports ===
  "/dashboard/reports": "Rapports",

  // === Dashboard: Artist Space ===
  "/dashboard/artist/create-artwork": "Soumettre une Œuvre",
  "/dashboard/artist/submission-terms": "Conditions de Soumission",
  "/dashboard/artist/": "Conditions de Soumission",
};
