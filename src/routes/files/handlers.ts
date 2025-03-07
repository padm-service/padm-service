import { and, eq } from "drizzle-orm";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "@/lib/types";

import db from "@/db";
import { File } from "@/db/schema";
import env from "@/env";
import { cos } from "@/lib/cos";
import { DAY, SECOND } from "@/lib/time";
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
      // console.log(err, data);
    },
  );
  return c.json({ object_key, url }, HttpStatusCodes.OK);
};

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const auth = c.get("auth");
  const init = c.req.valid("json");
  const pre_signed_url = cos.getObjectUrl(
    {
      Region: env.COS_REGION!,
      Bucket: env.COS_BUCKET!,
      Method: "GET",
      Key: init.object_key,
      Expires: ~~((DAY * 356 * 50) / SECOND), // almost 50 years
      Sign: true
    },
    (err, data) => { }
  );
  const userId = auth.user.id;
  const [file] = await db.insert(File).values({
    ...init,
    userId,
    pre_signed_url
  }).returning();
  return c.json(file, HttpStatusCodes.OK);
};

export const remove: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid("param");
  const file = await db.query.File.findFirst({
    where(fields, operators) {
      return operators.eq(fields.id, id);
    },
  });
  cos.deleteObject({
    Region: env.COS_REGION!,
    Bucket: env.COS_BUCKET!,
    Key: file?.object_key as string,
  }, function (err, data) {
    // console.log(err || data);
  });
  const result = await db.delete(File)
    .where(eq(File.id, id));
  console.log(result);

  if (result.rowsAffected === 0) {
    return c.json(
      {
        message: HttpStatusPhrases.NOT_FOUND,
      },
      HttpStatusCodes.NOT_FOUND,
    );
  }
  return c.body("已删除", HttpStatusCodes.OK);
};
