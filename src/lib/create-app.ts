import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import { defaultHook } from "stoker/openapi";
import env from "@/env";
import configureOpenAPI from "@/lib/configure-open-api";
import { auth, unauthorized } from "@/middlewares/auth";
import { pinoLogger } from "@/middlewares/pino-logger";
import type { AppBindings, AppOpenAPI } from "./types";
import db from "@/db";
import { HTTPException } from "hono/http-exception";
import { next } from "node_modules/cheerio/dist/esm/api/traversing";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter();
  app.use(cors());
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
  app.use(
    "/*",
    auth({
      apikey: "x-api-key",
      secret: async () => env.TOKEN_SECRET!,
    }),
  );
  app.use('/users', async (c, next) => {
    const auth = c.get("auth");
    const id = auth.user.id;
    const user = await db.query.User.findFirst(
      {
        columns: {
          secret: false,
        },
        where(fields, operators) {
          return operators.eq(fields.id, id);
        },
      },
    );
    if (user?.scope !== 'admin') {
      throw new HTTPException(401, {
        res: unauthorized(c, "No permission to access this interface!"),
      });
    }
    await next();
  });
  app.notFound(notFound);
  app.onError(onError);
  return app;
}

// export function createTestApp<R extends AppOpenAPI>(router: R) {
//   return createApp().route("/", router);
// }
