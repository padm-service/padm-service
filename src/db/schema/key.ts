import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
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

export const szKey = createSelectSchema(Key);

export const izKey = createInsertSchema(Key);

export const patchsSchema = izKey.partial();
