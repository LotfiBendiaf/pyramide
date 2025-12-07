// lib/rbac.ts

import { Role } from "@/constants/values";

const permissions: Record<string, Role[]> = {
  CHECK_CREATE: ["ADMIN", "EMPLOYEE"],
  CHECK_UPDATE: ["ADMIN", "EMPLOYEE"],
  CHECK_DELETE: ["ADMIN"], // hard delete via admin only
  CHECK_VIEW: ["ADMIN", "EMPLOYEE", "VIEWER"],
  PROVIDER_MANAGE: ["ADMIN", "EMPLOYEE"],
  PROVIDER_VIEW: ["ADMIN", "EMPLOYEE", "VIEWER"],
  REPORT_VIEW: ["ADMIN", "EMPLOYEE"],
  USER_MANAGE: ["ADMIN"],
};

export function can(role: Role, action: keyof typeof permissions) {
  return permissions[action].includes(role);
}
