import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { eq } from "drizzle-orm";
import type { AppRouteHandler } from "@/lib/types";
import argon2 from "argon2";
import db from "@/db";
import type { GetRoute, PatchRoute } from "./routes";
import { User } from "@/db/schema";
import { Omit } from "@/lib/omit-object";
export const get: AppRouteHandler<GetRoute> = async (c) => {
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
  if (user)
    return c.json(user);
  else
    return c.json("The user no longer exists", HttpStatusCodes.UNPROCESSABLE_ENTITY);
};



export const patch: AppRouteHandler<PatchRoute> = async (c) => {
  const auth = c.get("auth");
  const id = auth.user.id;
  const { updates, oldPass } = c.req.valid('json');
  console.log(updates,oldPass);
  
  if (oldPass) {
    const user = await db.query.User.findFirst(
      {
        columns: {
          secret: true,
        },
        where(fields, operators) {
          return operators.eq(fields.id, id);
        },
      },
    );
    if (!user || !await argon2.verify(user.secret, oldPass)) {
      return c.json(
        { message: HttpStatusPhrases.UNPROCESSABLE_ENTITY },
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
      );
    }
    updates.secret = await argon2.hash(updates.secret as string);
  }
  const [user] = await db.update(User)
    .set(updates)
    .where(eq(User.id, id))
    .returning();
  return c.json(Omit(user, ["secret"]), HttpStatusCodes.OK);
};
 