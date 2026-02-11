import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

import { api } from "./lib/api";
import { SignInSchema } from "./lib/validators/auth";

import bcrypt from "bcryptjs";
import { IAccountDoc } from "./models/account.model";
import { Role } from "./constants/values";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub,
    Google({
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = SignInSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          const { data: existingAccount } = (await api.accounts.getByProvider(
            email.toLowerCase()
          )) as ActionResponse<IAccountDoc>;

          if (!existingAccount) return null;

          const { data: existingUser } = (await api.users.getById(
            existingAccount.userId.toString()
          )) as ActionResponse<User>;

          if (!existingUser) return null;

          const isValidPassword = await bcrypt.compare(
            password,
            existingAccount.password!
          );

          if (isValidPassword) {
            return {
              id: existingUser._id,
              username: existingUser.username,
              firstname: existingUser.firstname,
              lastname: existingUser.lastname,
              name: `${existingUser.firstname} ${existingUser.lastname}`,
              email: existingUser.email,
              image: existingUser.profileImage,
              role: existingUser.role, // ✅ Include role
            };
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.firstname = user.firstname;
        token.lastname = user.lastname;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.firstname = token.firstname as string;
        session.user.lastname = token.lastname as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image ?? null;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async signIn({ user, profile, account }) {
      if (account?.type === "credentials") return true;
      if (!account || !user) return false;

      const userInfo = {
        id: user.id,
        name: user.name!,
        email: user.email!,
        image: user.image!,
        username:
          account.provider === "github"
            ? (profile?.login as string)
            : (user.name?.toLowerCase() as string),
        role: "VIEWER" as Role,
      };

      // Capture OAuth tokens for Google Calendar integration
      const tokenData =
        account.provider === "google"
          ? {
              accessToken: account.access_token,
              refreshToken: account.refresh_token,
              tokenExpiresAt: account.expires_at
                ? new Date(account.expires_at * 1000)
                : undefined,
              calendarScope: account.scope,
            }
          : undefined;

      const response = await api.auth.oAuthSignIn({
        user: userInfo,
        provider: account.provider as "github" | "google",
        providerAccountId: account.providerAccountId,
        tokenData,
      });

      return response.success;
    },
  },
});
