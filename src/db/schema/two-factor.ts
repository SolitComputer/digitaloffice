import { boolean, index, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { users } from "./auth";

export const twoFactors = mysqlTable(
  "two_factors",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: boolean("verified").notNull().default(true),
    failedVerificationCount: int("failed_verification_count").notNull().default(0),
    lockedUntil: timestamp("locked_until"),
  },
  (t) => [index("two_factors_user_id_idx").on(t.userId)],
);