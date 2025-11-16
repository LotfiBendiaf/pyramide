import { ROLES } from "@/constants/values";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: ROLES;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    role: ROLES;
  }
}
