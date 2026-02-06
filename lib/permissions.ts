// /lib/permissions.ts
export const RolePermissions = {
  ADMIN: [
    "view_dashboard",
    "manage_users",
    "manage_clients",
    "manage_listings",
    "manage_followups",
  ],
  MANAGER: [
    "view_dashboard",
    "manage_clients",
    "manage_listings",
    "manage_followups",
  ],
  AGENT: [
    "view_dashboard",
    "manage_clients",
    "manage_listings",
    "manage_followups",
  ],
  ASSISTANT: ["view_dashboard", "manage_clients", "manage_followups"],
};

export type Permission =
  (typeof RolePermissions)[keyof typeof RolePermissions][number];
