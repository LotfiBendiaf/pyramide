// lib/rbac.ts

import { Role } from "@/constants/values";

const permissions: Record<string, Role[]> = {
  CHECK_CREATE: ["ADMIN", "DEVELOPER", "EMPLOYEE"],
  CHECK_UPDATE: ["ADMIN", "DEVELOPER", "EMPLOYEE"],
  CHECK_DELETE: ["ADMIN", "DEVELOPER"],
  CHECK_VIEW: ["ADMIN", "DEVELOPER", "EMPLOYEE", "VIEWER"],
  PROVIDER_MANAGE: ["ADMIN", "DEVELOPER", "EMPLOYEE"],
  PROVIDER_VIEW: ["ADMIN", "DEVELOPER", "EMPLOYEE", "VIEWER"],
  REPORT_VIEW: ["ADMIN", "DEVELOPER", "EMPLOYEE"],
  USER_MANAGE: ["ADMIN", "DEVELOPER"],
};

export function can(role: Role, action: keyof typeof permissions) {
  return permissions[action].includes(role);
}
