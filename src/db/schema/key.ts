import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { Base } from "./schema";

type services = Array<string>;
export const Key = sqliteTable("key", {
  ...Base,
  purpose: text("purpose").notNull(),
  prefix: text("prefix").notNull(),
  secret: text("secret").notNull(),
  secret_truncated: text("secret_truncated").notNull(),
  services: text("services", { mode: "json" }).$type<services>(),
  userId: text("userId").notNull(),
});

export const sKey = createSelectSchema(Key);

export const iKey = createInsertSchema(Key);

export const updateKey = iKey.partial();
