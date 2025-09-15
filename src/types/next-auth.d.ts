import { Role } from "@prisma/client";
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extends the built-in session.user type
   */
  interface Session {
    user: {
      id: number;
      role: Role;
      fullName: string;
      avatarUrl: string | null;
      emailVerified: boolean;
    } & DefaultSession["user"]; // Merge with default user properties
  }

  /**
   * Extends the built-in user type
   */
  interface User extends DefaultUser {
    role: Role;
    fullName: string;
    avatarUrl: string | null;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the built-in JWT type
   */
  interface JWT {
    id: number;
    role: Role;
    fullName: string;
    avatarUrl: string | null;
    emailVerified: boolean;
  }
}
