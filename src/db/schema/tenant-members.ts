import {
  index,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { users } from "./auth";
import { tenants } from "./tenants";

export const TENANT_ROLES = ["OWNER", "MANAGER", "KASIR", "STAFF"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export const tenantMembers = mysqlTable(
  "tenant_members",
  {
    tenantId: varchar("tenant_id", { length: 36 })
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", TENANT_ROLES).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.tenantId, t.userId] }),
    index("tenant_members_user_id_idx").on(t.userId),
  ],
);