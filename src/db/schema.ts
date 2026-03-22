import { z } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
// import type { MessageContentComplex } from "@langchain/core/messages";
import { Omit } from "@/lib/omit-object";
import { LLM } from "@/lib/types";
export const Base = {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  created_at: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
};
export const MsgBase = Omit(Base, ["updated_at"]);
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
  permission: text("permission", { mode: "json" }).notNull().default([]),
  scope: text("scope").notNull().default("user"),
  secret: text("secret").notNull(),
});
export type Users = typeof User.$inferSelect;// 查询结果的类型
//zod验证
export const sUser = createSelectSchema(User).extend({
  permission: z.array(z.string()),// 手动指定（覆盖自动生成的z.string()）
});

export const iUser = createInsertSchema(User).extend({
  permission: z.array(z.string()).default([]),
});

export const uUser = sUser.partial();

// Key Table

export const Key = sqliteTable("key", {
  ...Base,
  purpose: text("purpose").notNull(),
  prefix: text("prefix").notNull(),
  secret: text("secret").notNull(),
  secret_truncated: text("secret_truncated").notNull(),
  services: text("services", { mode: "json" }).notNull().default([]),
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
}).extend({
  services: z.array(z.string()).default([]),
});
;

export const uKey = iKey.partial();

// Chat Table
export const Chat = sqliteTable("chat", {
  ...Base,
  summary: text("summary").notNull(),
  userId: text("userId").notNull(),
  assistantId: text("assistantId").notNull(),
});

export const sChat = createSelectSchema(Chat);

export const iChat = createInsertSchema(Chat).omit({
  userId: true,
  assistantId: true,
});

export const uChat = iChat.partial();
// Msg Table
export const Msg = sqliteTable("msg", {
  ...MsgBase,
  content: text("content", { mode: "json" }).notNull().default([]),
  role: text("role").notNull(),
  assistantId: text("assistantId").notNull(),
  chatId: text("chatId").notNull(),
  userId: text("userId").notNull(),
  // model: text("model").notNull(),
  // temperature: text("temperature").notNull(),
  // top_p: text("top_p").notNull(),
  // knowledge: text("knowledge", { mode: "json" }).notNull().default([]),
  // retrieval: integer("retrieval", { mode: "boolean" }).notNull(),
  // systemPrompt: text("systemPrompt").notNull().default(""),
});
export const sMsg = createSelectSchema(Msg).extend({
  content: z.array(z.any()),
  // knowledge: z.array(z.string()),
});

export const iMsg = createInsertSchema(Msg).omit({
  userId: true,
}).extend({
  // service: z.array(z.string()),
  content: z.array(z.any()),
  // knowledge: z.array(z.string()),
});

export const uMsg = iMsg.partial();
// Assistance Table
export const Assistant = sqliteTable("assistant", {
  ...Base,
  name: text("name").notNull(),
  icon: text("icon").notNull().default('🤖'),
  description: text("description").notNull(),
  knowledge: text("knowledge", { mode: "json" }).default([]),
  level: integer("level").notNull().default(0),
  userId: text("userId"),
  services: text("services", { mode: "json" }).default([]),
  llm: text("llm", { mode: "json" }).notNull().default({}),
  // model: text("model").notNull().default("glm-3-turbo"),
  // system_prompt: text('system_prompt').notNull().default(""),
  // temperature: integer("temperature").notNull().default(0.95),
  // top_p: integer("top_p").notNull().default(0.7)
});

export const sAssistant = createSelectSchema(Assistant).extend({
  services: z.array(z.string()).default([]),
  knowledge: z.array(z.string()).default([]),
  llm: LLM,
});

export const iAssistant = createInsertSchema(Assistant,
).extend({
  services: z.array(z.string()).default([]),
  knowledge: z.array(z.string()).default([]),
  llm: LLM.default({ model: "glm-4-air", systemPrompt: "", temperature: 0.95, top_p: 0.7 }),
});

export const uAssistant = iAssistant.partial();

// K2t Table
export const K2t = sqliteTable("k2t", {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  keyId: text("keyId").notNull(),
  token: text("token").notNull(),
});
export const sK2t = createSelectSchema(K2t);
export const iK2t = createInsertSchema(K2t);
// Seivice Table
export const Service = sqliteTable("service", {
  ...Base,
  icon: text("icon").notNull().default('🌲'),
  readme: text("readme").notNull().default(""),
  level: integer("level").notNull().default(0),
  schema: text("schema", { mode: "json" }).default({}),
  tools: text("tools", { mode: "json" }).default([]),
  unit_price: integer("unit_price").notNull().default(0),
  userId: text("userId").notNull(),
});
export const sService = createSelectSchema(Service).extend({
  schema: z.any(),
  tools: z.array(z.any()),
});

export const iService = createInsertSchema(Service).omit({
  userId: true,
}).extend({
  schema: z.any(),
  tools: z.array(z.any()).default([]),
});
export const uService = iService.partial();
export type Services = typeof Service.$inferSelect;
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
  userId: true,
});
export const uNode = iNode.partial();

// File Table
export const File = sqliteTable("file", {
  ...Base,
  userId: text("userId"),
  type: text("type").notNull().notNull(),
  object_key: text("object_key").notNull(),
  state: text("state").default("uploaded"),
  pre_signed_url: text("pre_signed_url").notNull(),
  size: integer("size").notNull(),
  method: text("method", { enum: ["GET", "PUT"] }).notNull(),
  name: text("name").notNull(),
});
export const sFile = createSelectSchema(File);

export const iFile = createInsertSchema(File).omit({
  userId: true,
});
export const uFile = iFile.partial();

//Document Table
export const Partition = sqliteTable('partition', {
  ...Base,
  name: text("name").notNull(),
  userId: text("userId").notNull(),
  collectionId: text("collectionId").notNull(),
  url: text('url').notNull(),
  size: integer('size').notNull(),
  state: text('state').notNull(),
  segment: integer('segment').notNull().default(0),
  fileId: text("fileId").notNull(),
  expire: text("expire").notNull().default("normal"),
})
export type Partitions = typeof Partition.$inferSelect;
export type Partitionse = typeof Partition.$inferInsert;
export const sPartition = createSelectSchema(Partition);
export const iPartition = createInsertSchema(Partition).omit({
  userId: true,
  collectionId: true,
});
export const uPartition = iPartition.partial();

//Document Table
export const Collection = sqliteTable('collection', {
  ...Base,
  name: text("name").notNull(),
  userId: text("userId").notNull(),
  partitionId: text("partitionID", { mode: "json" }).notNull().default([]),
  description: text("description").notNull(),
  used: integer("used").notNull().default(0),
})
export const sCollection = createSelectSchema(Collection).extend({
  partitionId: z.array(z.string())
});;
export const iCollection = createInsertSchema(Collection).omit
  ({
    userId: true,
  }).extend({
    partitionId: z.array(z.string()).default([])
  });
export const uCollection = iCollection.partial();

//bill Table
export const Bill=sqliteTable('bill',{
  ...Base,
  userId: text("userId").notNull(),
  keyId:text("keyId").notNull(),
  modelName: text("modelName").notNull(),
  consumptionAmount:integer("consumption_amount").notNull(),
  balance:integer("balance").notNull(),
});
export type Bills = typeof Bill.$inferSelect;
export const sBill = createSelectSchema(Bill);
export const iBill = createInsertSchema(Bill);

export const uBill = iBill.partial();
//日志表
export const Servicelog=sqliteTable('servicelog',{
  ...Base,
  userId:text("userId").notNull(),
  //header: text("header"),
  header:text("header",{ mode: "json" }).$type<Record<string,string>>(),
  method:text("method").notNull(), 
  url:text("url").notNull(),
  //purpose:text("purpose").notNull(),
  service_name:text("service_name").notNull(),
  user_name:text("user_name").notNull().default(''),
});
export type Servicelogs = typeof Servicelog.$inferSelect;
export const sServicelog = createSelectSchema(Servicelog);
export const iServicelog = createInsertSchema(Servicelog);
//日志月表
export const Monthtotal=sqliteTable('monthtotal',{
    ...Base,
    times:integer("times"),
    time:text("time").notNull(),
    service_name:text("service_name").notNull(),
    service:text("service").notNull(), 
});
export type Monthtotals = typeof Monthtotal.$inferSelect;
export const sMonthtotal = createSelectSchema(Monthtotal);
export const iMonthtotal = createInsertSchema(Monthtotal);