import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { access_type: "offline", prompt: "consent" },
      },
    }),
    Credentials({
      id: "email",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const email = String(credentials.email);
        const password = String(credentials.password);
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.banned) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email || email,
          name: user.name || "",
          image: user.avatarUrl || null,
        };
      },
    }),
    Credentials({
      id: "phone",
      name: "Phone",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;
        
        const phone = String(credentials.phone);
        const otp = String(credentials.otp);
        if (!phone || !otp) return null;

        // Verify OTP with Twilio
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

        if (twilioAccountSid && twilioAuthToken && twilioServiceSid) {
          const verifyUrl = `https://verify.twilio.com/v2/Services/${twilioServiceSid}/VerificationChecks`;
          const response = await fetch(verifyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64")}`,
            },
            body: new URLSearchParams({ To: phone, Code: otp }).toString(),
          });

          const data = await response.json() as { status: string };
          if (data.status !== "approved") return null;
        }

        // Find or create user by phone
        let user = await db.user.findUnique({ where: { phone } });
        if (!user) {
          user = await db.user.create({
            data: { phone, phoneVerified: new Date() },
          });
        } else if (user.banned) {
          return null;
        }

        return {
          id: user.id,
          email: user.email || "",
          name: user.name || "",
          image: user.avatarUrl || null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/explore",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.userId = user.id;
        // Fetch additional user data
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, plan: true, credits: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.plan = dbUser.plan;
          token.credits = dbUser.credits;
        }
      }
      if (account?.provider === "google" && user?.email) {
        await db.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            avatarUrl: user.image,
            emailVerified: new Date(),
          },
          create: {
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
            emailVerified: new Date(),
          },
        });
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { plan?: string }).plan = token.plan as string;
        (session.user as { credits?: number }).credits = token.credits as number;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith("/explore") ||
        nextUrl.pathname.startsWith("/create") ||
        nextUrl.pathname.startsWith("/gallery") ||
        nextUrl.pathname.startsWith("/collections") ||
        nextUrl.pathname.startsWith("/settings");
      const isAdmin = nextUrl.pathname.startsWith("/admin");

      if (isAdmin) {
        return isLoggedIn && (auth?.user as { role?: string })?.role === "ADMIN";
      }
      if (isDashboard) return isLoggedIn;
      return true;
    },
  },
};
