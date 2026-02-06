const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_IN_WITH_OAUTH: "/signin-with-oauth",
  SIGN_UP: "/sign-up",

  LISTING_DETAIL: (id: string) => `/listings/${id}`,
  LISTINGS: "/listings",

  // Dashboard Items Routes
  DASHBOARD: "/dashboard",
  WISHLIST: "/wishlist",
  CLIENTS_DASHBOARD: "/dashboard/clients",
  CLIENT_ADD: "/dashboard/clients/add",
  CLIENT_DETAIL: (id: string) => `/dashboard/clients/${id}`,
  LISTINGS_DASHBOARD: "/dashboard/listings",
  LISTING_ADD: "/dashboard/listings/add",
  FOLLOWUPS: "/dashboard/follow-ups",
  NEW_FOLLOWUP: "/dashboard/follow-ups/new",
  FOLLOWUPS_LISTING: (listingId: string) =>
    `/dashboard/follow-ups/${listingId}`,
  LISTING_DETAIL_DASHBOARD: (id: string) => `/dashboard/listings/${id}`,
  DAILY_REPORT: "/dashboard/daily-report",
  TEAM_REPORT: "/dashboard/team-report",
  // User management
  USERS: "/dashboard/users",
  USER_ADD: "/dashboard/users/add",
  USER_DETAIL: (id: string) => `/dashboard/users/${id}`,
  // Schedule & Planning
  SCHEDULE: "/dashboard/schedule",
  SCHEDULE_TODAY: "/dashboard/schedule?view=today",
  CALENDAR_SETTINGS: "/dashboard/settings/calendar",
};

export default ROUTES;
