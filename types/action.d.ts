interface SignInWithOAuthParams {
  provider: "github" | "google";
  providerAccountId: string;
  user: {
    email: string;
    name: string;
    image: string;
    username: string;
  };
}
interface AuthCredentials {
  username?: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  role: "ADMIN" | "ACCOUNTANT" | "VIEWER";
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
  role: "ADMIN" | "ACCOUNTANT" | "VIEWER";
  image?: string;
  password: string;
  createdAt: Date;
}
