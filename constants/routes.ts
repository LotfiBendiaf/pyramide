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
  LISTINGS_DASHBOARD: "/dashboard/listings",
  LISTING_DETAIL_DASHBOARD: (id: string) => `/dashboard/listings/${id}`,
};

export default ROUTES;
