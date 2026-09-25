import { mysqlTable, varchar, mysqlEnum, timestamp } from "drizzle-orm/mysql-core";

export const tenants = mysqlTable("tenants", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  status: mysqlEnum("status", ["ACTIVE", "SUSPENDED"]).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});