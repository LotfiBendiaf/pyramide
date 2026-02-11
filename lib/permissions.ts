// /lib/permissions.ts
export const RolePermissions = {
  ADMIN: [
    "view_dashboard",
    "manage_users",
    "manage_clients",
    "manage_listings",
    "manage_followups",
    "view_all_messages",
  ],
  MANAGER: [
    "view_dashboard",
    "manage_clients",
    "manage_listings",
    "manage_followups",
    "view_all_messages",
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
