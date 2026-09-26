import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  appName: "DigitalOffice",
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      isSuperAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
      mustChangePassword: {
        type: "boolean",
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [twoFactor({ issuer: "DigitalOffice" }), nextCookies()],
});

export type Session = typeof auth.$Infer.Session;