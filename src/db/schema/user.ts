import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { Base } from "./schema";

export const User = sqliteTable("user", {
  ...Base,
  icon: text("icon").notNull().default("😊"),
  balance: integer("balance").notNull().default(0),
  email: text("email").notNull(),
  level: integer("level").notNull().default(0),
  state: text("state").notNull().default("normal"),
  permission: text("permission"),
  scope: text("scope").notNull().default("user"),
  secret: text("secret").notNull(),
});

export const selectUser = createSelectSchema(User);

export const insertUser = createInsertSchema(User,
).required({
  name: true,
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  icon: true,
  permission: true,
  state: true,
});

export const partialUser = selectUser.partial();
