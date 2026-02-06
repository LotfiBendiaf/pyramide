interface SignInWithOAuthParams {
  provider: "github" | "google";
  providerAccountId: string;
  user: {
    email: string;
    name: string;
    image: string;
    username: string;
  };
  tokenData?: {
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    calendarScope?: string;
  };
}
interface AuthCredentials {
  username?: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  role: "MANAGER" | "ADMIN" | "ASSISTANT" | "AGENT" | "EMPLOYEE" | "VIEWER";
  password: string;
  confirmPassword?: string;
}
interface UserParams {
  _id: string;
  username?: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  role: "MANAGER" | "ADMIN" | "ASSISTANT" | "AGENT" | "EMPLOYEE" | "VIEWER";
  image?: string;
  password: string;
  createdAt: Date;
}
