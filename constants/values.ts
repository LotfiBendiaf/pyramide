export const ROLES = ["MANAGER", "ADMIN", "EMPLOYEE", "VIEWER"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  MANAGER: "Gestionnaire",
  EMPLOYEE: "Employé",
  VIEWER: "Lecteur",
} as const;
