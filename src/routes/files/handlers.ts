import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { File } from "@/db/schema";
import env from "@/env";
import { cos } from "@/lib/cos";

import type { CreateRoute, PreSignedUrl, RemoveRoute } from "./routes";

export const pre_signed_url: AppRouteHandler<PreSignedUrl> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const object_key = `${auth.user.id}/${init.name}`;
  const url = cos.getObjectUrl(
    {
      Region: env.COS_REGION!,
      Bucket: env.COS_BUCKET!,
      Method: init.method,
      Key: object_key,
      Expires: 3600, // 1 hour
      Sign: true,
    },
    (err, data) => {
      console.log(err, data);
    },
  );
  return c.json({ object_key, url }, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const userId = auth.user.id;
  const [service] = await db.insert(File).values({
    ...init,
    userId,
  }).returning();
  return c.json(service, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const result = await db.delete(File)
    .where(eq(File.id, id));
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
