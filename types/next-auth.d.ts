import { Role } from "@/constants/values";
import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      firstname: string;
      lastname: string;
      name: string;
      image?: string | null; // ✅ ADD
      role: Role; // Array of roles
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    name: string;
    image?: string | null; // ✅ ADD
    role: Role; // Array of roles
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    name: string;
    image?: string | null; // ✅ ADD
    role: Role;
  }
}
