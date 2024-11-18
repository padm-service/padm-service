import { z } from "@hono/zod-openapi";
import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const Base = {
  id: text("id").$defaultFn(() => createId()).primaryKey(),
  created_at: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updated_at: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
};
// tasks Table
export const tasks = sqliteTable("tasks", {
  id: integer("id", { mode: "number" })
    .primaryKey({ autoIncrement: true }),
  name: text("name")
    .notNull(),
  done: integer("done", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const selectTasksSchema = createSelectSchema(tasks);

export const insertTasksSchema = createInsertSchema(
  tasks,
  {
    name: schema => schema.name.min(1).max(500),
  },
).required({
  done: true,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const patchTasksSchema = insertTasksSchema.partial();
// User Table
export const User = sqliteTable("user", {
  ...Base,
  name: text("name"),
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
  summary: text("summary"),
  userId: text("userId"),
  assistantId: text("assistantId", { mode: "json" }),
});

export const sChat = createSelectSchema(Chat);

export const iChat = createInsertSchema(Chat).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const uChat = iChat.partial();

// Assistance Table
export const Assistant = sqliteTable("assistance", {
  ...Base,
  name: text("name"),
  icon: text("icon").notNull().default("🌐"),
  description: text("description"),
  knowledge: text("knowledge"),
  level: text("level"),
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
  key: text("key").notNull(),
  token: text("token").notNull(),
});
export const sK2t = createSelectSchema(K2t);

export const iK2t = createInsertSchema(K2t).omit({
  id: true,
});

// Seivice Table
export const Service = sqliteTable("service", {
  ...Base,
  level: text("level").notNull(),
  schema: text("schema", { mode: "json" }),
  tools: text("tools", { mode: "json" }).default("[]"),
  unit_price: integer("unit_price"),
  userId: text("userId"),
});
export const sService = createSelectSchema(Service).extend({
  schema: z.any(),
  tools: z.array(z.string()),
});

export const iService = createInsertSchema(Service).omit({
  id: true,
  created_at: true,
  updated_at: true,
  tools: true,
}).extend({
  schema: z.any(),
});
export const uService = iService.partial();

export const Node = sqliteTable("node", {
  ...Base,
  serviceId: text("serviceId"),
  userId: text("userId"),
  state: text("state"),
  url: text("url"),
  name: text("name"),
});
export const sNode = createSelectSchema(Node);

export const iNode = createInsertSchema(Node).omit({
  id: true,
  created_at: true,
  updated_at: true,
});
export const uNode = iNode.partial();
