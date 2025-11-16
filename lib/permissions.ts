// /lib/permissions.ts
export const RolePermissions = {
  admin: ["manage_users", "view_all_artworks"],
  artist: ["upload_artwork", "edit_own_artwork"],
  committee: ["review_artwork", "vote_artwork", "approve_artworks"],
  customer: ["view_artwork", "buy_artwork"],
};

export type Permission =
  (typeof RolePermissions)[keyof typeof RolePermissions][number];
