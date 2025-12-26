import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { detectRole, getRedirectPath } from "./utils";
import type { Role } from "@/types";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      identifier: string;
      name: string;
      role: Role;
      prodi: string | null;
      angkatan: string | null;
      mustChangePassword: boolean;
    };
  }
  interface User {
    id: string;
    identifier: string;
    name: string;
    role: Role;
    prodi: string | null;
    angkatan: string | null;
    mustChangePassword: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    identifier: string;
    role: Role;
    prodi: string | null;
    angkatan: string | null;
    mustChangePassword: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Identifier", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Identifier dan password harus diisi");
        }

        const { identifier, password } = credentials;

        // Detect role from identifier
        const detectedRole = detectRole(identifier);
        if (!detectedRole) {
          throw new Error("Format identifier tidak valid");
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { identifier },
        });

        if (!user) {
          throw new Error("Akun tidak ditemukan");
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error("Akun Anda telah dinonaktifkan. Hubungi admin.");
        }

        // Verify role matches
        if (user.role !== detectedRole) {
          throw new Error("Role tidak sesuai dengan format identifier");
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          throw new Error("Password salah");
        }

        return {
          id: user.id,
          identifier: user.identifier,
          name: user.name,
          role: user.role as Role,
          prodi: user.prodi,
          angkatan: user.angkatan,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.identifier = user.identifier;
        token.role = user.role;
        token.prodi = user.prodi;
        token.angkatan = user.angkatan;
        token.mustChangePassword = user.mustChangePassword;
      }

      // Refresh mustChangePassword on update trigger
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { mustChangePassword: true },
        });
        if (dbUser) {
          token.mustChangePassword = dbUser.mustChangePassword;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        identifier: token.identifier,
        name: token.name || "",
        role: token.role,
        prodi: token.prodi,
        angkatan: token.angkatan,
        mustChangePassword: token.mustChangePassword,
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after login
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};

// Helper to get session on server
export { getRedirectPath };
