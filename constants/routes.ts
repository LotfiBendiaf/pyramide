const ROUTES = {
  HOME: "/",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  SIMULATION: "/simulation-credit-bancaire",
  PERFORM_SIMULATION: "/dashboard/simulations/performSimulation",
  PROMOTIONS_IMMO: "/promotion-immobilieres",
  APPARTEMENTS: "/appartements-f2-f3-f4",

  // Dashboard Items Routes
  DASHBOARD: "/dashboard",
  CHECKS: "/dashboard/checks",
  SIMULATION_DETAIL: (id: string) => `/dashboard/simulations/${id}`,
  USER_DETAIL: (id: string) => `/dashboard/users/${id}`,
  USERS: "/dashboard/users",
  ADD_USER: "/dashboard/users/add",
  REGISTRATION_FILE: "/dashboard/registration",
  PROFILE: (email: string) => `/profile/${email}`,
  SIGN_IN_WITH_OAUTH: "/signin-with-oauth",
};

export default ROUTES;
