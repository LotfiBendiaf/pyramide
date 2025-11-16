// lib/constants.ts
export const ROLES = ["ADMIN", "ACCOUNTANT", "VIEWER"] as const;

export type Role = (typeof ROLES)[number];
