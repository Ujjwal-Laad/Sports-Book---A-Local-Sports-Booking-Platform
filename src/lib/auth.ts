// NextAuth configuration for authentication with credentials and JWT
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";
import { Role } from "@/generated/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("No user found with this email.");
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid password.");
        }

        return {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  secret: process.env.NEXTAUTH_SECRET,

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      // If user object exists (initial sign-in), add its properties to the token.
      if (user) {
        token.id = Number(user.id);
        token.role = user.role;
        token.fullName = user.fullName;
        token.avatarUrl = user.avatarUrl;
        token.emailVerified = user.emailVerified as boolean;
        return token;
      }

      // On subsequent calls, the token already exists. We need to refresh it
      // in case user data has changed.
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as number },
      });

      if (dbUser) {
        token.role = dbUser.role;
        token.fullName = dbUser.fullName;
        token.avatarUrl = dbUser.avatarUrl;
        token.emailVerified = dbUser.emailVerified;
      }

      return token;
    },
    async session({ session, token }) {
      // The token contains all our custom data. We pass it to the session.
      if (session.user) {
        session.user.id = token.id as number;
        session.user.role = token.role as Role;
        session.user.fullName = token.fullName as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
};