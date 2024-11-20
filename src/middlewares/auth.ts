import type { Context, MiddlewareHandler } from "hono";

import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { Jwt } from "hono/utils/jwt";
import * as HttpStatusCodes from "stoker/http-status-codes";

import type { User } from "@/lib/types";

type Auth = {
  user: User;
  token: string;
};
declare module "hono" {
  interface ContextVariableMap {
    auth: Auth;
  }
}

type Options = {
  secret: string | ((ctx: Context) => Promise<string>);
  cookie?: string;
  apikey?: string;
  alg?: "HS256";
};

export function auth(opts: Options): MiddlewareHandler {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error(
      "auth: `crypto.subtle.importKey` is undefined in the environment.",
    );
  }

  return async function (ctx, next) {
    if (ctx.req.path.includes("iam"))
      await next();
    const creds = ctx.req.header("Authorization");
    let token;
    if (creds) {
      const parts = creds.split(/\s+/);
      if (parts.length !== 2) {
        return ctx.json(
          {
            message: "Bad credentials structure.",
          },
          HttpStatusCodes.UNAUTHORIZED,
        );
      }
      else {
        token = parts[1];
      }
    }
    if (!token && opts.cookie) {
      token = getCookie(ctx, opts.cookie);
    }

    if (!token && opts.apikey) {
      // exchange token with apikey
      token = await exchange(ctx, ctx.req.header(opts.apikey));
    }
    if (!token) {
      return ctx.json(
        {
          message: "No credentials found in request.",
        },
        HttpStatusCodes.UNAUTHORIZED,
      );
    }
    const secret
      = typeof opts.secret === "string" ? opts.secret : await opts.secret(ctx);
    let claims;
    try {
      claims = await Jwt.verify(token, secret, opts.alg);
    }
    catch {
      return ctx.json(
        {
          message: "Token verification failed.",
        },
        HttpStatusCodes.UNAUTHORIZED,
      );
    }
    ctx.set("auth", {
      user: claims.user as User,
      token,
    });
    await next();
  };
}

async function exchange(ctx: Context, key?: string) {
  if (!key)
    return "";
  const slices = key.split("-");
  if (slices.length !== 3) {
    throw new HTTPException(401, {
      res: unauthorized(ctx, "Bad API Key!"),
    });
  };
  return "token";
}
export function unauthorized(ctx: Context, message: string) {
  return Response.json(
    {
      message,
    },
    {
      status: 401,
      headers: {
        "content-type": "application/json",
        "www-authenticate": `Bearer realm="${ctx.req.url},error=${message}"`,
      },
    },
  );
}
