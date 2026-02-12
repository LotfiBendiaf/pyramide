// /lib/roleCheck.ts
import { RolePermissions } from "./permissions";

export function hasPermission(role: string, action: string): boolean {
  const permissions =
    RolePermissions[role as keyof typeof RolePermissions] || [];
  return (permissions as readonly string[]).includes(action);
}
