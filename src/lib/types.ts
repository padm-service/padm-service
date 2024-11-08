import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { PinoLogger } from "hono-pino";

import { z } from "@hono/zod-openapi";

export interface AppBindings {
  Variables: {
    logger: PinoLogger;
  };
};
export type User = {
  icon: string;
  balance: number;
  email: string;
  level: number;
  state: string;
  permission?: string;
  scope: string;
  secret?: string;
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
