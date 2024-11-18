import { eq } from "drizzle-orm";
import { Jwt } from "hono/utils/jwt";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler, User } from "@/lib/types";

import db from "@/db";
import { K2t, Key } from "@/db/schema";
import env from "@/env";
import { digest, hexify } from "@/lib/encoding";
import { DAY } from "@/lib/time";

import type { CreateRoute, ListRoute, RemoveRoute } from "./routes";

export const list: AppRouteHandler<ListRoute> = async (c) => {
  const auth = c.get("auth");
  const id = auth.user.id;
  const keys = await db.query.Key.findMany({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  },
  );
  return c.json(keys);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const prefix = "sk";
  const seed = crypto.randomUUID();
  const secret = hexify(await digest("sha-1", seed));
  const secret_truncated = secret.slice(-4);
  const userId = auth.user.id;
  console.log(init);

  const [key] = await db.insert(Key).values({
    ...init,
    prefix,
    secret,
    secret_truncated,
    userId,
  }).returning();
  const keyId = key.id;
  await persistant_token(auth.user, keyId);
  const key_onetime = `${key.prefix}-${key.id.slice("key:".length)}-${key.secret}`;
  return c.json(key_onetime, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const result = await db.delete(Key)
    .where(eq(Key.id, id));
  if (result.rowsAffected === 0) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }
  return c.body(null, HttpStatusCodes.NO_CONTENT);
};

async function persistant_token(user: User, key: string) {
  const expiry = Date.now() + 356 * 100 * DAY; // 100 years is enough :)
  const token = await Jwt.sign(
    {
      iss: "halo.dev",
      exp: Math.floor(expiry / 1000),
      user,
      tk: "user",
    },
    env.TOKEN_SECRET!,
  );
  await db.insert(K2t).values({
    key,
    token,
  });
}
