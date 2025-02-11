import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";
import env from "@/env";
import configureOpenAPI from "@/lib/configure-open-api";
import { auth } from "@/middlewares/auth";
import { pinoLogger } from "@/middlewares/pino-logger";

import type { AppBindings, AppOpenAPI } from "./types";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter();
  configureOpenAPI(app);
  app.use(serveEmojiFavicon("📝"));
  app.openAPIRegistry.registerComponent("securitySchemes", "api_token", {
    type: "http",
    scheme: "bearer",
  });
  app.openAPIRegistry.registerComponent("securitySchemes", "api_key", {
    type: "apiKey",
    name: "X-API-Key",
    in: "header",
  });
  app.use(pinoLogger());
  app.use(cors());
  app.use(
    "/*",
    auth({
      apikey: "x-api-key",
      secret: async () => env.TOKEN_SECRET!,
    }),
  );
  app.notFound(notFound);
  app.onError(onError);
  return app;
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
  return createApp().route("/", router);
}
