import { hashPassword } from "better-auth/crypto";
import type { accounts, users } from "@/db/schema";

export type CredentialUserInput = {
  name: string;
  email: string;
  password: string;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
};

export type CredentialUserRows = {
  userId: string;
  user: typeof users.$inferInsert;
  account: typeof accounts.$inferInsert;
};

export async function buildCredentialUserRows(
  input: CredentialUserInput,
): Promise<CredentialUserRows> {
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);

  return {
    userId,
    user: {
      id: userId,
      name: input.name,
      email: input.email,
      emailVerified: true,
      isSuperAdmin: input.isSuperAdmin ?? false,
      mustChangePassword: input.mustChangePassword ?? true,
    },
    account: {
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    },
  };
}