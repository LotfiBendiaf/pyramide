import { ROLES, isElevatedRole, type Role } from "@/constants/values";

export function canUseAssistant(role?: string): role is Role {
  return ROLES.some((known) => known === role);
}

export type AssistantScope = { userId: string; role: Role };

export function isAgencyScope(scope: AssistantScope) {
  return isElevatedRole(scope.role);
}

export function assistantHistoryOwner(scope: AssistantScope) {
  return scope.role === "ADMIN" ? scope.userId : `${scope.userId}:${scope.role}`;
}

export function canReadAssistantSource(scope: AssistantScope, source: string) {
  if (isAgencyScope(scope)) return true;
  if (source === "listings") return true;
  if (scope.role === "VIEWER") return false;
  if (["clients", "hot", "unfollowed"].includes(source)) return true;
  return scope.role === "AGENT" || scope.role === "ASSISTANT"
    ? ["visits", "followups", "negotiations", "tasks", "activity", "revenue"].includes(source)
    : false;
}

export const agencyListingsVisibility = { isValidated: true, validationStatus: "VALIDATED" };

export const availableAgencyListings = {
  archived: { $ne: true },
  status: { $in: ["En Vente", "En Location"] },
};
