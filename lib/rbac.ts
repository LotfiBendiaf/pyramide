// lib/rbac.ts

import { Role } from "@/constants/values";

const permissions: Record<string, Role[]> = {
  CHECK_CREATE: ["ADMIN", "ACCOUNTANT"],
  CHECK_UPDATE: ["ADMIN", "ACCOUNTANT"],
  CHECK_DELETE: ["ADMIN"], // hard delete via admin only
  CHECK_VIEW: ["ADMIN", "ACCOUNTANT", "VIEWER"],
  PROVIDER_MANAGE: ["ADMIN", "ACCOUNTANT"],
  PROVIDER_VIEW: ["ADMIN", "ACCOUNTANT", "VIEWER"],
  REPORT_VIEW: ["ADMIN", "ACCOUNTANT"],
  USER_MANAGE: ["ADMIN"],
};

export function can(role: Role, action: keyof typeof permissions) {
  return permissions[action].includes(role);
}
