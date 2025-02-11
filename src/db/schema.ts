import { z } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { MessageContentComplex } from "@langchain/core/messages";
import { omit } from "@/lib/omit-object";
import { number } from "zod";
export const Base = {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  created_at: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
};
export const MsgBase = omit(Base, ["updated_at"]);
// tasks Table
// export const tasks = sqliteTable("tasks", {
//   id: integer("id", { mode: "number" })
//     .primaryKey({ autoIncrement: true }),
//   name: text("name")
//     .notNull(),
//   done: integer("done", { mode: "boolean" })
//     .notNull()
//     .default(false),
//   createdAt: integer("created_at", { mode: "timestamp" })
//     .$defaultFn(() => new Date()),
//   updatedAt: integer("updated_at", { mode: "timestamp" })
//     .$defaultFn(() => new Date())
//     .$onUpdate(() => new Date()),
// });

// export const selectTasksSchema = createSelectSchema(tasks);

// export const insertTasksSchema = createInsertSchema(
//   tasks,
//   {
//     name: schema => schema.name.min(1).max(500),
//   },
// ).required({
//   done: true,
// }).omit({
//   id: true,
//   createdAt: true,
//   updatedAt: true,
// });

// export const patchTasksSchema = insertTasksSchema.partial();
// User Table
export const User = sqliteTable("user", {
  ...Base,
  name: text("name").notNull(),
  icon: text("icon").notNull().default("😊"),
  balance: integer("balance").notNull().default(0),
  email: text("email").notNull(),
  level: integer("level").notNull().default(0),
  state: text("state").notNull().default("normal"),
  permission: text("permission").notNull().default("[]"),
  scope: text("scope").notNull().default("user"),
  secret: text("secret").notNull(),
});
export type Users = typeof User.$inferSelect;
export const sUser = createSelectSchema(User);

export const iUser = createInsertSchema(User)

export const uUser = sUser.partial();

// Key Table

export const Key = sqliteTable("key", {
  ...Base,
  purpose: text("purpose").notNull(),
  prefix: text("prefix").notNull(),
  secret: text("secret").notNull(),
  secret_truncated: text("secret_truncated").notNull(),
  services: text("services", { mode: "json" }).notNull(),
  userId: text("userId").notNull(),
});
export type Keys = typeof Key.$inferSelect;
export const sKey = createSelectSchema(Key).extend({
  services: z.array(z.string()),
});
export const iKey = createInsertSchema(Key,
).omit({
  userId: true,
  secret: true,
  prefix: true,
  secret_truncated: true,
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  services: z.array(z.string()),
});
;

export const uKey = iKey.partial();

// Chat Table
export const Chat = sqliteTable("chat", {
  ...Base,
  summary: text("summary").notNull(),
  userId: text("userId").notNull(),
  assistantId: text("assistantId", { mode: "json" }).notNull(),
});

export const sChat = createSelectSchema(Chat).extend({
  assistantId: z.array(z.string())
});

export const iChat = createInsertSchema(Chat).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  assistantId: z.array(z.string())
});

export const uChat = iChat.partial();
// Msg Table
export const Msg = sqliteTable("msg", {
  ...MsgBase,
  content: text("content").$type<MessageContentComplex[]>().notNull(),
  role: text("role").notNull(),
  assistantId: text("assistantId").notNull(),
  chatId: text("chatId").notNull(),
  userId: text("userId").notNull(),
  model: text("model").notNull(),
  temperature: text("temperature").notNull(),
  top_p: text("top_p").notNull(),
  knowledge: text("knowledge").notNull(),
  retrieval: integer("retrieval", { mode: "boolean" }).notNull(),
  systemPrompt: text("systemPrompt").notNull().default(""),
});
export const sMsg = createSelectSchema(Msg).extend({
  content: z.array(z.any()),
});

export const iMsg = createInsertSchema(Msg).omit({
  id: true,
  created_at: true,
}).extend({
  service: z.array(z.string()),
  content: z.array(z.any()),
});

export const uMsg = iMsg.partial();
// Assistance Table
export const Assistant = sqliteTable("assistance", {
  ...Base,
  name: text("name").notNull(),
  icon: text("icon").notNull().default("🌐"),
  description: text("description").notNull(),
  knowledge: text("knowledge"),
  level: integer("level").notNull().default(1),
  userId: text("userId"),
  services: text("services", { mode: "json" }),
});

export const sAssistant = createSelectSchema(Assistant).extend({
  services: z.array(z.string()),
});

export const iAssistant = createInsertSchema(Assistant,
).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  services: z.array(z.string()),
});

export const uAssistant = iAssistant.partial();

// K2t Table
export const K2t = sqliteTable("k2t", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  keyId: text("keyId").notNull(),
  token: text("token").notNull(),
});
export const sK2t = createSelectSchema(K2t);
export const iK2t = createInsertSchema(K2t).omit({
  id: true,
});

// Seivice Table
export const Service = sqliteTable("service", {
  ...Base,
  readme: text("readme").notNull(),
  level: integer("level").notNull(),
  schema: text("schema", { mode: "json" }),
  tools: text("tools", { mode: "json" }).default("[]"),
  // tools: text("tools").$type<ToolDefinition[]>().notNull(),
  unit_price: integer("unit_price").notNull(),
  userId: text("userId").notNull(),
});
export const sService = createSelectSchema(Service).extend({
  schema: z.string(),
  tools: z.array(z.string()),
});

export const iService = createInsertSchema(Service).omit({
  id: true,
  created_at: true,
  updated_at: true,
  tools: true,
}).extend({
  schema: z.any(),
  tools: z.array(z.string()),
});
export const uService = iService.partial();

// Node Table
export const Node = sqliteTable("node", {
  ...Base,
  serviceId: text("serviceId").notNull(),
  userId: text("userId").notNull(),
  state: text("state").notNull(),
  url: text("url").notNull(),
  name: text("name").notNull(),
});
export const sNode = createSelectSchema(Node);

export const iNode = createInsertSchema(Node).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export const uNode = iNode.partial();

// File Table
export const File = sqliteTable("file", {
  ...Base,
  userId: text("userId"),
  type: text("type"),
  object_key: text("object_key"),
  state: text("state"),
  pre_signed_url: text("pre_signed_url"),
  size: integer("size"),
  method: text("method", { enum: ["GET", "PUT"] }).notNull(),
  name: text("name"),
});
export const sFile = createSelectSchema(File);

export const iFile = createInsertSchema(File).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export const uFile = iFile.partial();

//Document Table
export const Partition = sqliteTable('partition', {
  ...Base,
  name: text("name").notNull(),
  userId: text("userId").notNull(),
  collectionId: text("collectionId").notNull(),
  url: text('url').notNull(),
  file_size: text('fileSize').notNull(),
  state: text('state').notNull(),
  segment: integer('segment').notNull(),
  file_name: text('fileName').notNull(),
})
export type Partitions = typeof Partition.$inferSelect;
export const sPartition = createSelectSchema(Partition);
export const iPartition = createInsertSchema(Partition);
export const uPartition = iPartition.partial();

//Document Table
export const Collection = sqliteTable('collection', {
  ...Base,
  name: text("name"),
  userId: text("userId").notNull(),
  partitionId: text("partitionID", { mode: "json" }).notNull(),
})
export const sCollection = createSelectSchema(Collection).extend({
  partitionId: z.array(z.string())
});;
export const iCollection = createInsertSchema(Collection).extend({
  partitionId: z.array(z.string())
});
export const uCollection = iCollection.partial();

