import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { PinoLogger } from "hono-pino";

import { z } from "@hono/zod-openapi";

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
  };
};
export type User = {
  id: string;
  icon: string;
  name: string;
  balance: number;
  email: string;
  level: number;
  state: string;
  permission?: string;
  scope: string;
  secret?: string;
};
export type Imag = {
  image_text: string;
  image_url: string;
};
export const zToken = z
  .object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    expiry: z.number(),
  });
export type Token = z.infer<typeof zToken>;
export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
// export const zContent = generateZodSchemaVariableStatement(MessageFieldWithRole)
export const QueryMessage = z.object({
  role: z.enum(["system", "user", "assistant", "function"]),
  content: z.string(),
});

export const LLM = z
  .object({
    model: z.string({ description: "语言模型" }).default("glm-4-air"),
    system_prompt: z.string({ description: "系统提示词" }).default(""),
    temperature: z.number({ description: "温度系数" }).gt(0).default(0.95),
    top_p: z.number({ description: "核采样率" }).gt(0).default(0.7),
  });

export const QueryInit = z
  .object({
    messages: z.array(QueryMessage, { description: "消息" }),
    service: z.array(z.string({ description: "服务 ID" })).optional(),
    knowledge: z.string({ description: "知识库 ID" }).optional(),
    llm: LLM,
    retrieval: z.boolean({ description: "是否使用外部知识库" }).optional(),
  });
