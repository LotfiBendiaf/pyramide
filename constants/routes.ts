const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_IN_WITH_OAUTH: "/signin-with-oauth",
  SIGN_UP: "/sign-up",

  // Dashboard Items Routes
  DASHBOARD: "/dashboard",
  LISTING: "/dashboard/listings",
  LISTING_DETAIL: (id: string) => `/dashboard/listings/${id}`,
};

export default ROUTES;
