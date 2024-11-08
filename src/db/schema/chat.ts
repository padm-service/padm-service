import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { Base } from "./schema";

type userId = Array<string>;
type assistantId = Array<string>;
export const Chat = sqliteTable("chat", {
  ...Base,
  summary: text("summary"),
  userId: text("userId").$type<userId>(),
  assistantId: text("assistantId", { mode: "json" }).$type<assistantId>(),
});

export const szChat = createSelectSchema(Chat);

export const izChat = createInsertSchema(Chat);

export const patchChatSchema = izChat.partial();
