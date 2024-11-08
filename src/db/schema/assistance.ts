import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { Base } from "./schema";

type userId = Array<string>;
type services = Array<string>;
export const Assistance = sqliteTable("assistance", {
  ...Base,
  description: text("description").notNull(),
  knowledge: text("knowledge"),
  level: text("level"),
  userId: text("userId").$type<userId>(),
  services: text("services", { mode: "json" }).$type<services>(),
});

export const sAssistance = createSelectSchema(Assistance);

export const iAssistance = createInsertSchema(Assistance,
).omit({
  created_at: true,
  updated_at: true,
});

export const patchAssistanceSchema = iAssistance.partial();
