import "./load-env";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accounts, tenantMembers, tenants, users, type TenantRole } from "@/db/schema";
import { buildCredentialUserRows, type CredentialUserInput } from "@/modules/users/credential";

const seedEnv = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SEED_SUPERADMIN_NAME: z.string().min(1),
    SEED_SUPERADMIN_EMAIL: z.email(),
    SEED_SUPERADMIN_PASSWORD: z.string().min(12),
    SEED_DEMO_PASSWORD: z.string().min(8).optional(),
  })
  .parse(process.env);

async function ensureCredentialUser(input: CredentialUserInput): Promise<string> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing) {
    console.log(`• User ${input.email} sudah ada, dilewati`);
    return existing.id;
  }

  const rows = await buildCredentialUserRows(input);

  await db.transaction(async (tx) => {
    await tx.insert(users).values(rows.user);
    await tx.insert(accounts).values(rows.account);
  });

  console.log(`✓ User ${input.email} dibuat`);
  return rows.userId;
}

async function ensureTenant(name: string, slug: string): Promise<string> {
  const [existing] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);

  if (existing) {
    console.log(`• Toko ${slug} sudah ada, dilewati`);
    return existing.id;
  }

  const tenantId = crypto.randomUUID();
  await db.insert(tenants).values({ id: tenantId, name, slug });
  console.log(`✓ Toko ${slug} dibuat`);
  return tenantId;
}

async function ensureMember(tenantId: string, userId: string, role: TenantRole): Promise<void> {
  await db
    .insert(tenantMembers)
    .values({ tenantId, userId, role })
    .onDuplicateKeyUpdate({ set: { role } });
}

async function main(): Promise<void> {
  await ensureCredentialUser({
    name: seedEnv.SEED_SUPERADMIN_NAME,
    email: seedEnv.SEED_SUPERADMIN_EMAIL,
    password: seedEnv.SEED_SUPERADMIN_PASSWORD,
    isSuperAdmin: true,
    mustChangePassword: false,
  });

  if (seedEnv.NODE_ENV === "production") {
    console.log("• Production: data demo dilewati");
    return;
  }

  const demoPassword = seedEnv.SEED_DEMO_PASSWORD;
  if (!demoPassword) {
    throw new Error("SEED_DEMO_PASSWORD wajib diisi untuk membuat data demo");
  }

  const tokoA = await ensureTenant("Toko A", "toko-a");
  const tokoB = await ensureTenant("Toko B", "toko-b");

  const ownerA = await ensureCredentialUser({
    name: "Owner Toko A",
    email: "owner.a@demo.local",
    password: demoPassword,
  });
  const ownerB = await ensureCredentialUser({
    name: "Owner Toko B",
    email: "owner.b@demo.local",
    password: demoPassword,
  });

  await ensureMember(tokoA, ownerA, "OWNER");
  await ensureMember(tokoB, ownerB, "OWNER");
  console.log("✓ Relasi owner ↔ toko dibuat");
}

main()
  .then(() => db.$client.end())
  .catch(async (error: unknown) => {
    console.error("✗ Seed gagal:", error);
    await db.$client.end();
    process.exitCode = 1;
  });